import express from 'express';
import { Solar, Lunar } from 'lunar-typescript';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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
    const { year, month, day, hour, minute, longitude } = req.body;
    const lng = longitude || 120;

    // 真太阳时修正
    const ts = calcTrueSolar(year, month, day, hour || 0, minute || 0, lng);

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
    const gender = req.body.gender || 1;
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

// ========== API: AI 命理分析 ==========
app.post('/api/analyze', async (req, res) => {
  try {
    const { year, month, day, hour, minute, longitude, gender, question } = req.body;
    const lng = longitude || 120;
    const ts = calcTrueSolar(year, month, day, hour || 0, minute || 0, lng);
    const solar = Solar.fromYmdHms(ts.year, ts.month, ts.day, ts.hour, ts.minute, 0);
    const lunar = Lunar.fromSolar(solar);
    const bz = lunar.getEightChar();
    const riGan = bz.getDayGan();

    const pillars = [
      { 柱:'年', 干支: bz.getYear(), 天干: bz.getYearGan(), 地支: bz.getYearZhi(), 十神: getShiShen(riGan, bz.getYearGan()), 纳音: bz.getYearNaYin(), 藏干: bz.getYearHideGan(), 地支十神: bz.getYearShiShenZhi() },
      { 柱:'月', 干支: bz.getMonth(), 天干: bz.getMonthGan(), 地支: bz.getMonthZhi(), 十神: getShiShen(riGan, bz.getMonthGan()), 纳音: bz.getMonthNaYin(), 藏干: bz.getMonthHideGan(), 地支十神: bz.getMonthShiShenZhi() },
      { 柱:'日', 干支: bz.getDay(), 天干: bz.getDayGan(), 地支: bz.getDayZhi(), 十神: '日主', 纳音: bz.getDayNaYin(), 藏干: bz.getDayHideGan(), 地支十神: bz.getDayShiShenZhi() },
      { 柱:'时', 干支: bz.getTime(), 天干: bz.getTimeGan(), 地支: bz.getTimeZhi(), 十神: getShiShen(riGan, bz.getTimeGan()), 纳音: bz.getTimeNaYin(), 藏干: bz.getTimeHideGan(), 地支十神: bz.getTimeShiShenZhi() }
    ];

    const data = {
      出生时间: `${year}年${month}月${day}日 ${String(hour||0).padStart(2,'0')}:${String(minute||0).padStart(2,'0')} (北京时间)`,
      真太阳时: `${ts.year}年${ts.month}月${ts.day}日 ${String(ts.hour).padStart(2,'0')}:${String(ts.minute).padStart(2,'0')} (修正${ts.offsetMin>0?'+':''}${ts.offsetMin}分钟)`,
      性别: gender === 1 ? '男' : '女',
      日主: riGan,
      四柱: pillars,
      大运起运: bz.getYun?.(gender)?.getStartYear?.() || '未知'
    };

    const prompt = `你是八字命理专家，精通子平法、穷通宝鉴、三命通会、神峰通考。请根据以下命盘进行专业分析，不要自我介绍，直接输出分析内容。

${JSON.stringify(data, null, 2)}

${question ? `求测重点：${question}` : ''}

请按以下结构进行分析，控制在800字以内：
1. 格局判定：判定八字格局（正格/变格），说明理由
2. 身强身弱：日主旺衰判定+用神取用
3. 性格特点：结合日主+十神组合分析
4. 事业财运：职业方向+求财方式
5. 婚恋感情：配偶星/宫位分析
6. 健康注意：五行偏枯对应的身体部位
7. 大运走势：当前大运+未来十年趋势
8. 综合建议`;

    if (!DEEPSEEK_KEY) {
      return res.json({ content: null, fallback: true, reason: '未配置API Key' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const aiResp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1500, stream: false }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!aiResp.ok) return res.json({ content: null, fallback: true, reason: `API ${aiResp.status}` });
    const aiJson = await aiResp.json();
    res.json({ content: aiJson.choices?.[0]?.message?.content || '', fallback: false });
  } catch (e) {
    res.json({ content: null, fallback: true, reason: e.message });
  }
});

// ========== 城市列表 ==========
app.get('/api/cities', (req, res) => {
  res.json([
    { name:'北京', lng:116.4 }, { name:'上海', lng:121.5 }, { name:'广州', lng:113.3 },
    { name:'深圳', lng:114.1 }, { name:'成都', lng:104.1 }, { name:'重庆', lng:106.5 },
    { name:'杭州', lng:120.2 }, { name:'南京', lng:118.8 }, { name:'武汉', lng:114.3 },
    { name:'西安', lng:108.9 }, { name:'郑州', lng:113.7 }, { name:'济南', lng:117.0 },
    { name:'青岛', lng:120.3 }, { name:'大连', lng:121.6 }, { name:'沈阳', lng:123.4 },
    { name:'哈尔滨', lng:126.6 }, { name:'长春', lng:125.3 }, { name:'天津', lng:117.2 },
    { name:'长沙', lng:112.9 }, { name:'福州', lng:119.3 }, { name:'厦门', lng:118.1 },
    { name:'昆明', lng:102.7 }, { name:'贵阳', lng:106.7 }, { name:'南宁', lng:108.3 },
    { name:'海口', lng:110.3 }, { name:'兰州', lng:103.7 }, { name:'西宁', lng:101.8 },
    { name:'拉萨', lng:91.1 }, { name:'乌鲁', lng:87.6 }, { name:'呼和', lng:111.7 },
    { name:'太原', lng:112.5 }, { name:'合肥', lng:117.3 }, { name:'南昌', lng:115.9 },
    { name:'香港', lng:114.2 }, { name:'澳门', lng:113.5 }, { name:'台北', lng:121.5 }
  ]);
});

app.get('/', (req, res) => res.sendFile(join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`八字排盘服务启动: ${PORT}`));
