import express from 'express';
import { Solar, Lunar } from 'lunar-typescript';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { analyzeGeJu, analyzeShenQiang, analyzeBingYao, analyzeWuxingDetail, analyzeXingGe, analyzeZhiYe, analyzeJianKang, analyzeHunLian, analyzeDaYun, WX_COLORS, WX, WX_ORDER, findShiShenInPillars } from './analysis-engine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || "";

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// ========== 真太阳时计算 ==========
// 均时差（equation of time），单位：分钟
function eqnOfTime(month, day) {
  const doy = [0,31,59,90,120,151,181,212,243,273,304,334][month-1] + day;
  const B = (360/365) * (doy - 81) * Math.PI / 180;
  return 9.87 * Math.sin(2*B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

function calcTrueSolar(year, month, day, hour, minute, longitude) {
  // 北京时间 = UTC+8，东经120°
  const utcMin = hour * 60 + minute - 8 * 60;
  const eot = eqnOfTime(month, day);
  const offset = (longitude - 120) * 4 + eot;
  let totalMin = utcMin + offset + 8 * 60;
  // 处理日期溢出
  let adjYear = year, adjMonth = month, adjDay = day;
  while (totalMin < 0) { totalMin += 1440; adjDay--; if (adjDay < 1) { adjMonth--; if (adjMonth < 1) { adjMonth = 12; adjYear--; } adjDay = new Date(adjYear, adjMonth, 0).getDate(); } }
  while (totalMin >= 1440) { totalMin -= 1440; adjDay++; if (adjDay > new Date(adjYear, adjMonth, 0).getDate()) { adjDay = 1; adjMonth++; if (adjMonth > 12) { adjMonth = 1; adjYear++; } } }
  const adjHour = Math.floor(totalMin / 60);
  const adjMin = Math.floor(totalMin % 60);
  return { year: adjYear, month: adjMonth, day: adjDay, hour: adjHour, minute: adjMin, offsetMin: Math.round(offset) };
}

// ========== 十神计算 ==========
function getShiShen(riGan, gan) {
  const map = {
    '甲':{甲:'比肩',乙:'劫财',丙:'食神',丁:'伤官',戊:'偏财',己:'正财',庚:'七杀',辛:'正官',壬:'偏印',癸:'正印'},
    '乙':{甲:'劫财',乙:'比肩',丙:'伤官',丁:'食神',戊:'正财',己:'偏财',庚:'正官',辛:'七杀',壬:'正印',癸:'偏印'},
    '丙':{甲:'偏印',乙:'正印',丙:'比肩',丁:'劫财',戊:'食神',己:'伤官',庚:'偏财',辛:'正财',壬:'七杀',癸:'正官'},
    '丁':{甲:'正印',乙:'偏印',丙:'劫财',丁:'比肩',戊:'伤官',己:'食神',庚:'正财',辛:'偏财',壬:'正官',癸:'七杀'},
    '戊':{甲:'七杀',乙:'正官',丙:'偏印',丁:'正印',戊:'比肩',己:'劫财',庚:'食神',辛:'伤官',壬:'偏财',癸:'正财'},
    '己':{甲:'正官',乙:'七杀',丙:'正印',丁:'偏印',戊:'劫财',己:'比肩',庚:'伤官',辛:'食神',壬:'正财',癸:'偏财'},
    '庚':{甲:'偏财',乙:'正财',丙:'七杀',丁:'正官',戊:'偏印',己:'正印',庚:'比肩',辛:'劫财',壬:'食神',癸:'伤官'},
    '辛':{甲:'正财',乙:'偏财',丙:'正官',丁:'七杀',戊:'正印',己:'偏印',庚:'劫财',辛:'比肩',壬:'伤官',癸:'食神'},
    '壬':{甲:'食神',乙:'伤官',丙:'偏财',丁:'正财',戊:'七杀',己:'正官',庚:'偏印',辛:'正印',壬:'比肩',癸:'劫财'},
    '癸':{甲:'伤官',乙:'食神',丙:'正财',丁:'偏财',戊:'正官',己:'七杀',庚:'正印',辛:'偏印',壬:'劫财',癸:'比肩'}
  };
  return map[riGan]?.[gan] || '';
}

function getWuxing(ganZhi) {
  const map = { 甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水',
                寅:'木',卯:'木',巳:'火',午:'火',申:'金',酉:'金',亥:'水',子:'水',辰:'土',戌:'土',丑:'土',未:'土' };
  return { gan: map[ganZhi[0]] || '', zhi: map[ganZhi[1]] || '' };
}

// ========== API: 排八字 ==========
app.post('/api/bazi', (req, res) => {
  try {
    const { year, month, day, hour, minute, longitude, gender, isLunar } = req.body;
    const lng = longitude || 120;

    // 农历→阳历转换
    let sy = year, sm = month, sd = day;
    if (isLunar) {
      try {
        const lunarDate = Lunar.fromYmd(year, month, day);
        const solarDate = lunarDate.getSolar();
        sy = solarDate.getYear(); sm = solarDate.getMonth(); sd = solarDate.getDay();
      } catch(e) { /* keep as solar */ }
    }

    // 真太阳时修正
    const ts = calcTrueSolar(sy, sm, sd, hour || 0, minute || 0, lng);

    // 用修正后时间排盘
    const solar = Solar.fromYmdHms(ts.year, ts.month, ts.day, ts.hour, ts.minute, 0);
    const lunar = Lunar.fromSolar(solar);
    const bz = lunar.getEightChar();
    const riGan = bz.getDayGan();

    // 晚子时处理(23-0点)：日柱取次日
    // lunar-typescript 通过 Solar.fromYmdHms 已自动处理

    const pillars = [
      { name:'年柱', ganZhi: bz.getYear(), gan: bz.getYearGan(), zhi: bz.getYearZhi(),
        shiShen: getShiShen(riGan, bz.getYearGan()), naYin: bz.getYearNaYin(),
        cangGan: bz.getYearHideGan(), shiShenZhi: bz.getYearShiShenZhi().join('/') },
      { name:'月柱', ganZhi: bz.getMonth(), gan: bz.getMonthGan(), zhi: bz.getMonthZhi(),
        shiShen: getShiShen(riGan, bz.getMonthGan()), naYin: bz.getMonthNaYin(),
        cangGan: bz.getMonthHideGan(), shiShenZhi: bz.getMonthShiShenZhi().join('/') },
      { name:'日柱', ganZhi: bz.getDay(), gan: bz.getDayGan(), zhi: bz.getDayZhi(),
        shiShen: '日主', naYin: bz.getDayNaYin(),
        cangGan: bz.getDayHideGan(), shiShenZhi: bz.getDayShiShenZhi().join('/') },
      { name:'时柱', ganZhi: bz.getTime(), gan: bz.getTimeGan(), zhi: bz.getTimeZhi(),
        shiShen: getShiShen(riGan, bz.getTimeGan()), naYin: bz.getTimeNaYin(),
        cangGan: bz.getTimeHideGan(), shiShenZhi: bz.getTimeShiShenZhi().join('/') }
    ];

    // 大运
    const g = gender || 1;
    let dayunArr = [];
    try {
      const yun = bz.getYun(gender);
      if (yun) {
        const startYear = yun.getStartYear();
        const startAge = Math.round(startYear);
        for (let i = 0; i < 8; i++) {
          const daYun = yun.getDaYun(i);
          if (daYun) {
            const age = startAge + i * 10;
            dayunArr.push({
              index: i + 1,
              ganZhi: daYun.getGanZhi(),
              startAge: age,
              ages: `${age}-${age + 9}`,
              cur: (age <= 30 && age + 9 >= 30)
            });
          }
        }
      }
    } catch(e) { /* 大运计算失败不影响主排盘 */ }

    // 五行统计
    const wxCnt = { 木:0, 火:0, 土:0, 金:0, 水:0 };
    const wxM = { 甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水',
                  寅:'木',卯:'木',巳:'火',午:'火',申:'金',酉:'金',亥:'水',子:'水',辰:'土',戌:'土',丑:'土',未:'土' };
    for (const p of pillars) {
      wxCnt[wxM[p.gan]||''] = (wxCnt[wxM[p.gan]||'']||0) + 1;
      wxCnt[wxM[p.zhi]||''] = (wxCnt[wxM[p.zhi]||'']||0) + 1;
    }

    res.json({
      gender: gender === 1 ? '男' : '女',
      birthplace: { longitude: lng },
      beijingTime: `${year}年${month}月${day}日 ${String(hour||0).padStart(2,'0')}:${String(minute||0).padStart(2,'0')}`,
      trueSolar: `${ts.year}年${ts.month}月${ts.day}日 ${String(ts.hour).padStart(2,'0')}:${String(ts.minute).padStart(2,'0')}`,
      solarOffset: ts.offsetMin,
      bazi: pillars.map(p => p.ganZhi).join(' '),
      riGan: riGan,
      riZhi: bz.getDayZhi(),
      pillars: pillars,
      dayun: dayunArr,
      wuxingCount: wxCnt
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== API: 规则引擎深度分析 ==========
const GAN_WX = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
const ZHI_WX = {寅:'木',卯:'木',巳:'火',午:'火',申:'金',酉:'金',亥:'水',子:'水',辰:'土',戌:'土',丑:'土',未:'水'}; // 丑未=土 but kept as-is
const ZHI_WX2 = {寅:'木',卯:'木',巳:'火',午:'火',申:'金',酉:'金',亥:'水',子:'水',辰:'土',戌:'土',丑:'土',未:'土'};
const WX_CLR = {木:'green',火:'red',土:'orange',金:'gray',水:'blue'};

function gCls(g){return 's-'+WX_CLR[GAN_WX[g]||''];}
function zCls(z){return 's-'+WX_CLR[ZHI_WX2[z]||''];}
function ssCls(g){return 'ss-'+WX_CLR[GAN_WX[g]||''];}
function dotCls(g){return WX_CLR[GAN_WX[g]||''];}

function buildBaziHtml(riGan, riZhi, pillars, wxCount, dayun, gender, beijingTime, trueSolar, solarOffset, birthplace) {
  const g = gender===1?'男':'女';
  let h='';
  const bzStr = pillars.map(p=>p.ganZhi).join(' ');
  h+=`<p class="subtitle">${bzStr} · ${g}命 · ${riGan}日主<br>${beijingTime} · ${trueSolar} 真太阳时 (${solarOffset>0?'+':''}${solarOffset}分)<br>${birthplace}</p>`;

  // 排盘
  h+='<div class="section-title">一、排盘</div>';
  h+='<div class="bazi-card"><div class="bazi-header"><span class="title">四柱八字</span><span class="sex">'+g+'</span></div>';
  h+='<table class="bazi-table"><thead><tr>'+pillars.map(p=>`<th>${p.name}</th>`).join('')+'</tr></thead><tbody>';
  h+='<tr>'+pillars.map(p=>`<td><span class="stem ${gCls(p.gan)}">${p.gan}</span></td>`).join('')+'</tr>';
  h+='<tr>'+pillars.map(p=>`<td><span class="branch ${zCls(p.zhi)}">${p.zhi}</span><span class="ten-label">${p.shiShenZhi.split('/')[0]}</span></td>`).join('')+'</tr>';
  h+='<tr>'+pillars.map(p=>`<td><span class="shishen-tag ${p.shiShen==='日主'?'ss-master':ssCls(p.gan)}">${p.shiShen}</span></td>`).join('')+'</tr>';
  h+='</tbody></table><div class="bazi-divider"></div><table class="bazi-table"><tbody>';
  h+='<tr>'+pillars.map(p=>`<td><div class="canggan-group">${(p.cangGan||[]).map(c=>`<span class="canggan-item"><span class="cg-dot dot-${dotCls(c)}"></span>${c}</span>`).join('')}</div></td>`).join('')+'</tr>';
  h+='<tr>'+pillars.map(p=>`<td><span class="nayin-tag">${p.naYin}</span></td>`).join('')+'</tr>';
  h+='<tr>'+pillars.map(_=>'<td><span class="kongwang">-</span></td>').join('')+'</tr>';
  h+='</tbody></table>';
  h+=`<div class="bazi-footer"><span class="bf-tag">日主 ${riGan}</span><span class="bf-tag">纳音 ${pillars[2].naYin}</span><span class="bf-tag">${g}命</span></div></div>`;

  // 五行
  const wxK=['木','火','土','金','水'],wxT=Math.max(1,Object.values(wxCount).reduce((a,b)=>a+b,0));
  const wxDetail=analyzeWuxingDetail(pillars,riGan);
  h+='<div class="section-title">二、五行力量分析</div><div class="card">';
  h+='<div style="display:flex;height:22px;border-radius:11px;overflow:hidden;background:#1a2027;margin-bottom:14px">';
  for(const w of wxK){const c=wxCount[w]||0;if(c>0)h+=`<div style="width:${Math.round(c/wxT*100)}%;background:var(--${WX_CLR[w]});display:flex;align-items:center;justify-content:center;font-size:.55em;color:#fff;font-weight:600">${w}${c}</div>`;}
  h+='</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">';
  for(const w of wxK){const c=wxCount[w]||0;h+=`<div style="background:rgba(42,48,56,.4);border-radius:10px;padding:10px;text-align:center"><div style="font-size:.7em;color:var(--${WX_CLR[w]});margin-bottom:2px">${w}</div><div style="font-size:.85em;color:var(--gold-lt);font-weight:600">${c}</div></div>`;}
  h+=`<div style="background:rgba(200,169,110,.08);border:1px solid rgba(200,169,110,.2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:.7em;color:var(--gold);margin-bottom:2px">日主</div><div style="font-size:.85em;color:var(--gold-lt);font-weight:600">${riGan}${GAN_WX[riGan]}</div></div>`;
  h+='</div></div>';

  // 格局
  const geju=analyzeGeJu(pillars,riGan);
  h+='<div class="section-title">三、格局分析</div><div class="card">';
  h+=`<p><strong style="color:var(--gold-lt);font-size:1em">${geju.gejuDetail||geju.geju}</strong></p>`;
  h+=`<p>月令${pillars[1].zhi}（${geju.yueLingWX}·${geju.yueLingSS}）当令，${geju.yongShen?'用神取<strong style="color:var(--gold-lt)">'+geju.yongShen+'</strong>':'格局需调候'}${geju.xiShen?'，喜'+geju.xiShen:''}${geju.jiShen?'，忌'+geju.jiShen:''}。</p>`;
  h+='</div>';

  // 身强身弱
  const sq=analyzeShenQiang(pillars,riGan,geju);
  h+='<div class="section-title">四、身强身弱</div><div class="card">';
  h+=`<p>日主${riGan}（${GAN_WX[riGan]}）得分${sq.score}，判定为<strong style="color:var(--gold-lt)">${sq.level}</strong>。${sq.desc}</p>`;
  h+='</div>';

  // 病药
  const by=analyzeBingYao(pillars,riGan,wxCount,geju,sq);
  h+='<div class="section-title">五、病药分析</div><div class="card">';
  h+='<div class="bing-yao">';
  h+='<div class="bing-box"><h4>病（'+by.bings.length+'个）</h4>';
  by.bings.forEach((b,i)=>h+=`<div class="bing-item">${i+1}. <strong>${b.desc}</strong> — ${b.detail}</div>`);
  h+='</div><div class="yao-box"><h4>药（'+by.yaos.length+'个）</h4>';
  by.yaos.forEach((y,i)=>h+=`<div class="yao-item">${i+1}. <strong>${y.desc}</strong> — ${y.detail}</div>`);
  h+='</div></div></div>';

  // 性格
  const xg=analyzeXingGe(pillars,riGan,geju,sq);
  h+='<div class="section-title">六、性格</div><div class="card"><p>日主'+GAN_WX[riGan]+'——'+xg.traits.slice(0,6).map(t=>`<span class="tag tag-${WX_CLR[GAN_WX[riGan]]||'earth'}">${t}</span>`).join(' ')+'</p>';
  h+=`<p style="font-size:.95em;color:var(--gold-lt);margin-top:8px"><strong>一句话：</strong>${xg.summary}</p></div>`;

  // 职业
  const zy=analyzeZhiYe(pillars,riGan,geju);
  h+='<div class="section-title">七、职业</div><div class="card">';
  h+=`<p style="font-size:1em;color:#e88060;font-weight:700">最佳方向：${zy.direction}</p>`;
  h+=`<p>${zy.detail}</p></div>`;

  // 健康
  const jk=analyzeJianKang(pillars,riGan,wxCount);
  h+='<div class="section-title">八、健康</div><div class="card"><ul>';
  jk.forEach(j=>h+=`<li>${j}</li>`);
  h+='</ul></div>';

  // 婚恋
  const hl=analyzeHunLian(pillars,riGan,gender);
  h+='<div class="section-title">九、婚恋</div><div class="card">';
  h+=`<p>${hl.analysis}</p></div>`;

  // 大运
  h+='<div class="section-title">十、大运流程</div><div class="card">';
  if(dayun.length&&!dayun[0].info){
    h+='<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px">';
    for(const dy of dayun)h+=`<div style="position:relative;display:flex;flex-direction:column;align-items:center;min-width:52px;padding:8px 6px;border-radius:10px;background:#1a2027;border:1px solid ${dy.cur?'var(--gold)':'#2a3038'};${dy.cur?'background:linear-gradient(180deg,rgba(200,169,110,.08),transparent);':''}">${dy.cur?'<span style="position:absolute;top:-7px;right:-5px;font-size:.5em;color:var(--gold);background:#0b0e12;padding:0 4px;border-radius:4px;border:1px solid var(--gold)">当前</span>':''}<span style="font-size:1.05em;font-weight:700;color:var(--gold-lt)">${dy.ganZhi}</span><span style="font-size:.58em;color:#6a7a88;margin-top:2px">${dy.ages||dy.startAge}岁</span></div>`;
    h+='</div>';
  }
  h+='</div>';

  // 总结
  h+='<div class="section-title">十一、综合建议</div><div class="card">';
  h+=`<p>此命${geju.gejuDetail||geju.geju}，${sq.level}。${geju.yongShen?'以<strong style="color:var(--gold-lt)">'+geju.yongShen+'</strong>为用神，':'需调候平衡，'}大运走势需关注用神当旺之运。</p>`;
  h+='<p style="font-size:.85em;color:var(--dim);margin-top:10px">以上分析基于子平法规则引擎自动生成，仅供参考。</p></div>';

  return h;
}

app.post('/api/full-analysis', (req, res) => {
  try {
    const { year, month, day, hour, minute, longitude, gender, isLunar } = req.body;
    const lng = longitude || 120;
    let sy = year, sm = month, sd = day;
    if (isLunar) {
      try { const ld = Lunar.fromYmd(year, month, day); const sd2 = ld.getSolar(); sy = sd2.getYear(); sm = sd2.getMonth(); sd = sd2.getDay(); } catch(e) {}
    }
    const ts = calcTrueSolar(sy, sm, sd, hour || 0, minute || 0, lng);
    const solar = Solar.fromYmdHms(ts.year, ts.month, ts.day, ts.hour, ts.minute, 0);
    const lunar = Lunar.fromSolar(solar);
    const bz = lunar.getEightChar();
    const riGan = bz.getDayGan();
    const riZhi = bz.getDayZhi();

    const pillars = [
      { name:'年柱', ganZhi: bz.getYear(), gan: bz.getYearGan(), zhi: bz.getYearZhi(), shiShen: getShiShen(riGan, bz.getYearGan()), naYin: bz.getYearNaYin(), cangGan: bz.getYearHideGan(), shiShenZhi: bz.getYearShiShenZhi().join('/') },
      { name:'月柱', ganZhi: bz.getMonth(), gan: bz.getMonthGan(), zhi: bz.getMonthZhi(), shiShen: getShiShen(riGan, bz.getMonthGan()), naYin: bz.getMonthNaYin(), cangGan: bz.getMonthHideGan(), shiShenZhi: bz.getMonthShiShenZhi().join('/') },
      { name:'日柱', ganZhi: bz.getDay(), gan: bz.getDayGan(), zhi: bz.getDayZhi(), shiShen: '日主', naYin: bz.getDayNaYin(), cangGan: bz.getDayHideGan(), shiShenZhi: bz.getDayShiShenZhi().join('/') },
      { name:'时柱', ganZhi: bz.getTime(), gan: bz.getTimeGan(), zhi: bz.getTimeZhi(), shiShen: getShiShen(riGan, bz.getTimeGan()), naYin: bz.getTimeNaYin(), cangGan: bz.getTimeHideGan(), shiShenZhi: bz.getTimeShiShenZhi().join('/') }
    ];

    const wxCnt = {木:0,火:0,土:0,金:0,水:0};
    for (const p of pillars) { wxCnt[GAN_WX[p.gan]||''] = (wxCnt[GAN_WX[p.gan]||'']||0)+1; wxCnt[ZHI_WX2[p.zhi]||''] = (wxCnt[ZHI_WX2[p.zhi]||'']||0)+1; }

    let dayunArr = [];
    try {
      const yun = bz.getYun(gender);
      if (yun) {
        const startYear = yun.getStartYear();
        const startAge = Math.round(startYear);
        for (let i = 0; i < 8; i++) {
          const daYun = yun.getDaYun(i);
          if (daYun) {
            const age = startAge + i * 10;
            dayunArr.push({ index: i+1, ganZhi: daYun.getGanZhi(), startAge: age, ages: `${age}-${age+9}`, cur: (age <= 30 && age + 9 >= 30) });
          }
        }
      }
    } catch(e) {}

    const beijingTime = `${year}年${month}月${day}日 ${String(hour||0).padStart(2,'0')}:${String(minute||0).padStart(2,'0')}`;
    const trueSolar = `${ts.year}年${ts.month}月${ts.day}日 ${String(ts.hour).padStart(2,'0')}:${String(ts.minute).padStart(2,'0')}`;
    const birthplace = req.body.birthplace || '';

    const html = buildBaziHtml(riGan, riZhi, pillars, wxCnt, dayunArr, gender||1, beijingTime, trueSolar, ts.offsetMin, birthplace);
    res.json({ html });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => res.sendFile(join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`八字排盘服务启动: ${PORT}`));
