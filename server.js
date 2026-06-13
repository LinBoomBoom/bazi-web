import express from 'express';
import { Solar, Lunar } from 'lunar-typescript';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

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

function eqnOfTime(month, day) {
  const doy = [0,31,59,90,120,151,181,212,243,273,304,334][month-1] + day;
  const B = (360/365) * (doy - 81) * Math.PI / 180;
  return 9.87 * Math.sin(2*B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

function calcTrueSolar(year, month, day, hour, minute, longitude) {
  const utcMin = hour * 60 + minute - 8 * 60;
  const eot = eqnOfTime(month, day);
  const offset = (longitude - 120) * 4 + eot;
  let totalMin = utcMin + offset + 8 * 60;
  let adjYear = year, adjMonth = month, adjDay = day;
  while (totalMin < 0) { totalMin += 1440; adjDay--; if (adjDay < 1) { adjMonth--; if (adjMonth < 1) { adjMonth = 12; adjYear--; } adjDay = new Date(adjYear, adjMonth, 0).getDate(); } }
  while (totalMin >= 1440) { totalMin -= 1440; adjDay++; if (adjDay > new Date(adjYear, adjMonth, 0).getDate()) { adjDay = 1; adjMonth++; if (adjMonth > 12) { adjMonth = 1; adjYear++; } } }
  const adjHour = Math.floor(totalMin / 60);
  const adjMin = Math.floor(totalMin % 60);
  return { year: adjYear, month: adjMonth, day: adjDay, hour: adjHour, minute: adjMin, offsetMin: Math.round(offset) };
}

function analyzeJiaTing(pillars,riGan){
  var nz=pillars[0],nFGanSS=getShiShen(riGan,nz.gan);
  var zuShang=nFGanSS.includes('财')?'祖上家境普通，非大富大贵。':'祖上普通家庭。';
  var allGans=pillars.map(function(p){return p.gan});
  var hasCai=allGans.some(function(g){return getShiShen(riGan,g).includes('财')}),hasYin=allGans.some(function(g){return getShiShen(riGan,g).includes('印')});
  var fuQin=hasCai?'父亲有实际能力，经济条件尚可。':'父星不显，父亲对命主影响偏弱。';
  var muQin=hasYin?'母亲能力强、有文化、在家中占据主导。':'母星平常。';
  var ganSS=allGans.map(function(g){return getShiShen(riGan,g)}),jieCount=ganSS.filter(function(s){return s==='劫财'||s==='比肩'}).length;
  var xiongDi=jieCount>0?'有'+(jieCount>1?'1~2':'1')+'个兄弟或极亲近的朋友。':'兄弟姐妹少或无。';
  return{zuShang:zuShang,fuQin:fuQin,muQin:muQin,xiongDi:xiongDi};
}
function analyzeXueLi(pillars,riGan){
  var allGans=pillars.map(function(p){return p.gan}),yinCount=allGans.filter(function(g){return getShiShen(riGan,g).includes('印')}).length,yinStrong=yinCount>=2,jieLun='';
  if(yinStrong)jieLun='印星有力，本科以上，有机会读硕士。';else if(yinCount>=1)jieLun='印星一般，大专到本科水平。';else jieLun='印星偏弱，学历中等，但社会经验丰富。';
  return{level:yinStrong?'高':'中',conclusion:jieLun};
}
function analyzeZiNv(pillars,riGan,gender){
  var isMale=gender===1,allGans=pillars.map(function(p){return p.gan}),childPresent=isMale?allGans.some(function(g){return getShiShen(riGan,g).includes('杀')||getShiShen(riGan,g).includes('官')}):allGans.some(function(g){return getShiShen(riGan,g).includes('食')||getShiShen(riGan,g).includes('伤')});
  return{touTai:'头胎儿子可能性偏大。',count:childPresent?'未来有1~2个孩子。':'未来有1个孩子。'};
}
function analyzeDaYunDetail(dayun){
  var items=[];
  for(var i=0;i<dayun.length;i++){var dy=dayun[i],ages=dy.ages.split('-'),a0=parseInt(ages[0]),desc='';
    if(a0<15)desc='少年运，学业成长阶段。';else if(a0<25)desc='青年运，求学或初入社会。';else if(a0<35)desc='青壮年运，事业关键期。';else if(a0<45)desc='中年运，财富积累阶段。';else desc='中晚年运，事业稳固或转型。';
    items.push({ganZhi:dy.ganZhi,ages:dy.ages,cur:dy.cur,desc:desc});}
  return items;
}
function analyzeDaShiJian(pillars,riGan,dayun,birthYear){
  var items=[],curYear=new Date().getFullYear(),age=curYear-birthYear;
  if(age>=18)items.push({year:birthYear+18,age:18,event:'高考/大学',reason:'学业关键节点'});
  if(age>=22)items.push({year:birthYear+22,age:22,event:'进入社会/初入职场',reason:'人生转折点'});
  var curDY=dayun.find(function(d){return d.cur});if(curDY){var sa=parseInt(curDY.ages.split('-')[0]);items.push({year:birthYear+sa,age:sa,event:'换大运',reason:'进入'+curDY.ganZhi+'大运'});}
  if(curYear>birthYear+18)items.push({year:curYear,age:curYear-birthYear,event:'当前年份',reason:'当前流年重点把握'});
  items.sort(function(a,b){return a.year-b.year});return items.slice(0,7);
}
function analyzeLiuNian(pillars,riGan,dayun,curYear,birthYear){
  var curDY=dayun.find(function(d){return d.cur}),r='今年是转型与调整之年。';
  if(curDY)r='当前在'+curDY.ganZhi+'大运中，'+r;r+='需关注事业、感情、健康的平衡发展。';
  return{age:curYear-birthYear,desc:r};
}


// API: 排八字
app.post('/api/bazi', (req, res) => {
  try {
    const { year, month, day, hour, minute, longitude, gender, isLunar } = req.body;
    const lng = longitude || 120;
    let sy = year, sm = month, sd = day;
    if (isLunar) { try { const ld = Lunar.fromYmd(year, month, day); const sd2 = ld.getSolar(); sy = sd2.getYear(); sm = sd2.getMonth(); sd = sd2.getDay(); } catch(e) {} }
    const ts = calcTrueSolar(sy, sm, sd, hour || 0, minute || 0, lng);
    const solar = Solar.fromYmdHms(ts.year, ts.month, ts.day, ts.hour, ts.minute, 0);
    const lunar = Lunar.fromSolar(solar);
    const bz = lunar.getEightChar();
    const riGan = bz.getDayGan();
    const pillars = [
      { name:'年柱', ganZhi: bz.getYear(), gan: bz.getYearGan(), zhi: bz.getYearZhi(), shiShen: getShiShen(riGan, bz.getYearGan()), naYin: bz.getYearNaYin(), cangGan: bz.getYearHideGan(), shiShenZhi: bz.getYearShiShenZhi().join('/') },
      { name:'月柱', ganZhi: bz.getMonth(), gan: bz.getMonthGan(), zhi: bz.getMonthZhi(), shiShen: getShiShen(riGan, bz.getMonthGan()), naYin: bz.getMonthNaYin(), cangGan: bz.getMonthHideGan(), shiShenZhi: bz.getMonthShiShenZhi().join('/') },
      { name:'日柱', ganZhi: bz.getDay(), gan: bz.getDayGan(), zhi: bz.getDayZhi(), shiShen: '日主', naYin: bz.getDayNaYin(), cangGan: bz.getDayHideGan(), shiShenZhi: bz.getDayShiShenZhi().join('/') },
      { name:'时柱', ganZhi: bz.getTime(), gan: bz.getTimeGan(), zhi: bz.getTimeZhi(), shiShen: getShiShen(riGan, bz.getTimeGan()), naYin: bz.getTimeNaYin(), cangGan: bz.getTimeHideGan(), shiShenZhi: bz.getTimeShiShenZhi().join('/') }
    ];
    const wxCnt = {木:0,火:0,土:0,金:0,水:0};
    const wxM = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水',寅:'木',卯:'木',巳:'火',午:'火',申:'金',酉:'金',亥:'水',子:'水',辰:'土',戌:'土',丑:'土',未:'土'};
    for (const p of pillars) { wxCnt[wxM[p.gan]||''] = (wxCnt[wxM[p.gan]||'']||0)+1; wxCnt[wxM[p.zhi]||''] = (wxCnt[wxM[p.zhi]||'']||0)+1; }
    let dayunArr = [];
    try {
      const yun = bz.getYun(gender);
      if (yun) { const sy2 = Math.round(yun.getStartYear()); for (let i=0;i<8;i++) { const dy=yun.getDaYun(i); if(dy) { const age=sy2+i*10; dayunArr.push({i:i+1,ganZhi:dy.getGanZhi(),startAge:age,ages:age+'-'+(age+9),cur:(age<=30&&age+9>=30)}); } } }
    } catch(e) {}
    res.json({ gender:gender===1?'男':'女', beijingTime:`${year}年${month}月${day}日 ${String(hour||0).padStart(2,'0')}:${String(minute||0).padStart(2,'0')}`, trueSolar:`${ts.year}年${ts.month}月${ts.day}日 ${String(ts.hour).padStart(2,'0')}:${String(ts.minute).padStart(2,'0')}`, solarOffset:ts.offsetMin, bazi:pillars.map(p=>p.ganZhi).join(' '), riGan, riZhi:bz.getDayZhi(), pillars, dayun:dayunArr, wuxingCount:wxCnt });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ====== 规则引擎分析 ======
const GAN_WX = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
const ZHI_WX = {寅:'木',卯:'木',巳:'火',午:'火',申:'金',酉:'金',亥:'水',子:'水',辰:'土',戌:'土',丑:'土',未:'土'};
const WX_ORDER = ['木','火','土','金','水'];
const WX_CLR = {木:'green',火:'red',土:'orange',金:'gray',水:'blue'};

function analyzeGeJu(pillars,riGan){
  var yz=pillars[1].zhi,ylSS=getShiShen(riGan,yz),ags=pillars.map(p=>p.gan);
  var tgs=ags.map(g=>getShiShen(riGan,g)).filter(Boolean);
  var g='',gd='',ys='',xs='',js='';
  if(ylSS==='正官'||ylSS==='七杀'){g=ylSS+'格';
    if(tgs.includes('正印')||tgs.includes('偏印')){gd='杀印相生格';ys='印星化杀';xs='比劫帮身';js='财星坏印';}
    else if(tgs.includes('食神')||tgs.includes('伤官')){gd='食伤制杀格';ys='食伤制杀';}
    else{gd=g+'无制化';ys='印星或食伤';}
  }else if(ylSS==='正印'||ylSS==='偏印'){g=ylSS+'格';
    if(tgs.includes('正官')||tgs.includes('七杀')){gd='官印相生格';ys='官杀';}
    else{gd=g+'印旺';ys='财星破印';}
  }else if(ylSS==='正财'||ylSS==='偏财'){g=ylSS+'格';gd=g;ys='食伤生财';}
  else if(['食神','伤官'].includes(ylSS)){g=ylSS+'格';gd=g;}
  else{g='建禄格';gd=yz+'月建禄格';ys='官杀或食伤';}
  return{geju:g,gejuDetail:gd,yueLingSS:ylSS,yongShen:ys,xiShen:xs,jiShen:js};
}

function analyzeShenQiang(pillars,riGan){
  var rw=GAN_WX[riGan],ws={木:{寅:1.5,卯:1.5,辰:0.8,巳:0.3,午:0.3,未:0.5,申:0.2,酉:0.1,戌:0.3,亥:1.2,子:1.2,丑:0.4},火:{寅:0.8,卯:0.5,辰:0.6,巳:1.5,午:1.5,未:1.0,申:0.2,酉:0.1,戌:0.3,亥:0.2,子:0.1,丑:0.3},土:{寅:0.4,卯:0.3,辰:1.5,巳:0.8,午:0.6,未:1.5,申:0.5,酉:0.4,戌:1.5,亥:0.3,子:0.2,丑:1.5},金:{寅:0.1,卯:0.1,辰:0.5,巳:0.6,午:0.4,未:0.5,申:1.5,酉:1.5,戌:1.2,亥:0.3,子:0.4,丑:0.8},水:{寅:0.3,卯:0.3,辰:0.5,巳:0.1,午:0.1,未:0.2,申:0.8,酉:0.5,戌:0.2,亥:1.5,子:1.5,丑:0.6}};
  var s=ws[rw]?.[pillars[1].zhi]||0.5;
  for(var i=0;i<pillars.length;i++){if(GAN_WX[pillars[i].gan]===rw)s+=0.8;if(ZHI_WX[pillars[i].zhi]===rw)s+=0.6;}
  for(var i=0;i<pillars.length;i++){var ri=WX_ORDER.indexOf(rw),pi=WX_ORDER.indexOf(GAN_WX[pillars[i].gan]);if((pi+1)%5===ri)s+=0.5;}
  var l='',d='';if(s>=4){l='身强';d='日主得令得地得生，力量充足';}else if(s>=2.5){l='中和偏强';d='日主有一定根基，稍偏强';}else if(s>=1.5){l='中和偏弱';d='日主根基不够扎实，稍偏弱';}else{l='身弱';d='日主失令失地，力量不足';}
  return{level:l,score:s.toFixed(1),desc:d};
}

function analyzeBingYao(pillars,wxCount,geju){
  var bs=[],ys=[],t=Math.max(1,Object.values(wxCount).reduce((a,b)=>a+b,0));
  for(var i=0;i<WX_ORDER.length;i++){var w=WX_ORDER[i];if(!wxCount[w])bs.push({d:'原局缺'+w,t:w==='火'?'输出受限':w==='金'?'决断力弱':w==='木'?'根基不稳':w==='水'?'变通力弱':'承压力弱'});}
  var wxK=Object.keys(wxCount);
  for(var i=0;i<wxK.length;i++){var w=wxK[i],c=wxCount[w];if(c/t>0.4)bs.push({d:w+'过旺('+Math.round(c/t*100)+'%)',t:w==='土'?'思维偏固执':w==='水'?'思虑过重':w==='木'?'个性倔强':w==='火'?'急躁冲动':'过于刚硬'});}
  var ganSS=pillars.map(p=>getShiShen(pillars[2].gan,p.gan));
  if(ganSS.filter(s=>s.includes('印')).length>=2)bs.push({d:'印星过旺',t:'印多母溺，依赖心重，想得多做得少'});
  if(ganSS.filter(s=>s.includes('杀')).length>=2)bs.push({d:'官杀混杂',t:'压力过大，焦虑多疑，缺乏安全感'});
  if(ganSS.filter(s=>s.includes('财')).length>=3)bs.push({d:'财星过多',t:'贪财忘义，为钱奔波，心神不定'});
  var df=WX_ORDER.find(w=>!wxCount[w]);
  if(df)ys.push({d:'补'+df,t:df==='火'?'大运流年火运泄旺印暖局':df==='木'?'大运流年木运增强根基':'大运流年补'+df});
  if(geju.yongShen)ys.push({d:geju.yongShen,t:'以'+geju.yongShen+'为用神调候'});
  return{bings:bs,yaos:ys};
}

function analyzeXingGe(pillars,riGan,shenR){
  var rw=GAN_WX[riGan],wxT={木:['正直向上','有担当','目标感强','有领导潜质'],火:['热情主动','行动力强','急躁','感染力强'],土:['稳重可靠','诚实守信','偏固执','包容心强'],金:['果断刚毅','讲义气','是非分明','执行力强'],水:['聪明灵活','善变通','直觉敏锐','情绪波动大']};
  var tr=wxT[rw]||[],sm=rw==='木'?'内敛型聪明人，脑子快嘴不快。讲义气有底线。需外界推一把才动。':rw==='火'?'外向开朗，热情直接。行动力强但有时急躁。':rw==='土'?'稳重务实，可靠可信。做事踏实但偶尔固执。':rw==='金'?'刚正果断，原则性强。做事干净利落。':'聪明灵活，适应力强。善变通善交际。';
  return{traits:tr,summary:sm};
}

function analyzeZhiYe(pillars,riGan){
  var gs=pillars.map(p=>getShiShen(riGan,p.gan)),hasYin=gs.some(s=>s.includes('印')),hasSha=gs.some(s=>s.includes('杀')||s.includes('官')),hasSS=gs.some(s=>s.includes('食')||s.includes('伤')),hasCai=gs.some(s=>s.includes('财'));
  if(hasSha&&hasYin)return{d:'技术型稳定岗位',t:'杀印相生，适合大机构专业技术人才（工程师/数据分析/IT运维/审计）。不宜一线拼杀岗。'};
  if(hasSS&&hasCai)return{d:'商业创业型',t:'食伤生财，适合做生意、销售、市场、创意类。商业头脑灵活。'};
  if(hasYin)return{d:'文教研究型',t:'印旺为用，适合文化教育、研究分析、文书工作。体制内文职合适。'};
  return{d:'技能型自由职业',t:'走专业技术路线，有一技之长。自由职业或小团队模式。'};
}

function analyzeJianKang(wxCount){
  var is=[],t=Math.max(1,Object.values(wxCount).reduce((a,b)=>a+b,0));
  var ws={木:{w:'肝胆功能偏弱、筋骨易酸软',s:'肝火偏旺、易怒'},火:{w:'心火不足、气血偏慢、手脚易凉',s:'心火过旺、易上火失眠'},土:{w:'脾胃运化差、易腹胀',s:'脾胃湿热、消化不良'},金:{w:'肺气偏弱、皮肤敏感',s:'肺火偏旺、易咳嗽'},水:{w:'肾气偏弱、精力不足',s:'肾气偏旺易失衡、泌尿系统'}};
  var wk=Object.keys(wxCount);
  for(var i=0;i<wk.length;i++){var w=wk[i],c=wxCount[w];if(c===0)is.push(ws[w].w);if(c/t>0.35)is.push(ws[w].s);}
  return is;
}

function analyzeHunLian(pillars,riGan,gender){
  var isM=gender===1,sp=isM?'正财':'正官',bk=isM?'偏财':'七杀',fnd=[],fbk=[];
  for(var i=0;i<pillars.length;i++){var p=pillars[i];if(getShiShen(riGan,p.gan)===sp)fnd.push(p.name+p.gan);if(getShiShen(riGan,p.gan)===bk)fbk.push(p.name+p.gan);}
  var r='';if(fnd.length)r+='配偶星（'+sp+'）在'+fnd.join('、')+'，适龄结婚。';else if(fbk.length)r+='以'+bk+'为配偶星，在'+fbk.join('、')+'。';else r+='配偶星不显，婚缘偏晚，需大运流年引动。';
  r+=' 配偶宫'+pillars[2].zhi+'。';return{analysis:r};
}

function gCls(g){return 's-'+WX_CLR[GAN_WX[g]||''];}
function zCls(z){return 's-'+WX_CLR[ZHI_WX[z]||''];}
function ssCls(g){return 'ss-'+WX_CLR[GAN_WX[g]||''];}
function dotCls(g){return WX_CLR[GAN_WX[g]||'']?WX_CLR[GAN_WX[g]]:'wood';}

function buildAnalysisHtml(riGan,riZhi,pillars,wxCount,dayun,gender,beijingTime,trueSolar,solarOffset,birthplace,birthYear){
  var g=gender===1?'男':'女',h='',bz=pillars.map(p=>p.ganZhi).join(' ');
  h+='<p class="subtitle">'+bz+' · '+g+'命 · '+riGan+'日主<br>'+beijingTime+' · '+trueSolar+' 真太阳时 ('+(solarOffset>0?'+':'')+solarOffset+'分)<br>'+birthplace+'</p>';

  h+='<div class="section-title">一、排盘</div>';
  h+='<div class="bazi-card"><div class="bazi-header"><span class="title">四柱八字</span><span class="sex">'+g+'</span></div>';
  h+='<table class="bazi-table"><thead><tr>'+pillars.map(p=>'<th>'+p.name+'</th>').join('')+'</tr></thead><tbody>';
  h+='<tr>'+pillars.map(p=>'<td><span class="stem '+gCls(p.gan)+'">'+p.gan+'</span></td>').join('')+'</tr>';
  h+='<tr>'+pillars.map(p=>'<td><span class="branch '+zCls(p.zhi)+'">'+p.zhi+'</span><span class="ten-label">'+p.shiShenZhi.split('/')[0]+'</span></td>').join('')+'</tr>';
  h+='<tr>'+pillars.map(p=>'<td><span class="shishen-tag '+(p.shiShen==='日主'?'ss-master':ssCls(p.gan))+'">'+p.shiShen+'</span></td>').join('')+'</tr>';
  h+='</tbody></table><div class="bazi-divider"></div><table class="bazi-table"><tbody>';
  h+='<tr>'+pillars.map(p=>'<td><div class="canggan-group">'+(p.cangGan||[]).map(c=>'<span class="canggan-item"><span class="cg-dot dot-'+dotCls(c)+'"></span>'+c+'</span>').join('')+'</div></td>').join('')+'</tr>';
  h+='<tr>'+pillars.map(p=>'<td><span class="nayin-tag">'+p.naYin+'</span></td>').join('')+'</tr>';
  h+='<tr>'+pillars.map(p=>'<td><span class="kongwang">-</span></td>').join('')+'</tr>';
  h+='</tbody></table>';
  h+='<div class="bazi-footer"><span class="bf-tag">日主 '+riGan+'</span><span class="bf-tag">纳音 '+pillars[2].naYin+'</span><span class="bf-tag">'+g+'命</span></div></div>';

  var wxK=['木','火','土','金','水'],wxT=Math.max(1,Object.values(wxCount).reduce((a,b)=>a+b,0));
  h+='<div class="section-title">二、五行力量分析</div><div class="card">';
  h+='<div style="display:flex;height:22px;border-radius:11px;overflow:hidden;background:#1a2027;margin-bottom:14px">';
  for(var i=0;i<wxK.length;i++){var c=wxCount[wxK[i]]||0;if(c>0)h+='<div style="width:'+Math.round(c/wxT*100)+'%;background:var(--'+WX_CLR[wxK[i]]+');display:flex;align-items:center;justify-content:center;font-size:.55em;color:#fff;font-weight:600">'+wxK[i]+c+'</div>';}h+='</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">';
  for(var i=0;i<wxK.length;i++){var c=wxCount[wxK[i]]||0;h+='<div style="background:rgba(42,48,56,.4);border-radius:10px;padding:10px;text-align:center"><div style="font-size:.7em;color:var(--'+WX_CLR[wxK[i]]+');margin-bottom:2px">'+wxK[i]+'</div><div style="font-size:.85em;color:var(--gold-lt);font-weight:600">'+c+'</div></div>';}
  h+='<div style="background:rgba(200,169,110,.08);border:1px solid rgba(200,169,110,.2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:.7em;color:var(--gold);margin-bottom:2px">日主</div><div style="font-size:.85em;color:var(--gold-lt);font-weight:600">'+riGan+GAN_WX[riGan]+'</div></div>';
  h+='</div></div>';

  var gj=analyzeGeJu(pillars,riGan);
  h+='<div class="section-title">三、格局分析</div><div class="card">';
  h+='<p><strong style="color:var(--gold-lt);font-size:1em">'+gj.gejuDetail+'</strong></p>';
  h+='<p>月令'+pillars[1].zhi+'（'+gj.yueLingSS+'）当令'+ (gj.yongShen?'，用神取<strong style="color:var(--gold-lt)">'+gj.yongShen+'</strong>':'')+(gj.xiShen?'，喜'+gj.xiShen:'')+(gj.jiShen?'，忌'+gj.jiShen:'')+'。</p></div>';

  var sq=analyzeShenQiang(pillars,riGan);
  h+='<div class="section-title">四、身强身弱</div><div class="card">';
  h+='<p>日主'+riGan+'（'+GAN_WX[riGan]+'）得分'+sq.score+'，判定为<strong style="color:var(--gold-lt)">'+sq.level+'</strong>。'+sq.desc+'</p></div>';

  var by=analyzeBingYao(pillars,wxCount,gj);
  h+='<div class="section-title">五、病药分析</div><div class="card"><div class="bing-yao">';
  h+='<div class="bing-box"><h4>病（'+by.bings.length+'个）</h4>';
  for(var i=0;i<by.bings.length;i++)h+='<div class="bing-item">'+(i+1)+'. <strong>'+by.bings[i].d+'</strong> — '+by.bings[i].t+'</div>';
  h+='</div><div class="yao-box"><h4>药（'+by.yaos.length+'个）</h4>';
  for(var i=0;i<by.yaos.length;i++)h+='<div class="yao-item">'+(i+1)+'. <strong>'+by.yaos[i].d+'</strong> — '+by.yaos[i].t+'</div>';
  h+='</div></div></div>';

  var xg=analyzeXingGe(pillars,riGan,sq);
  h+='<div class="section-title">六、性格</div><div class="card"><p>日主'+GAN_WX[riGan]+'——';
  for(var i=0;i<Math.min(xg.traits.length,6);i++)h+='<span class="tag tag-'+WX_CLR[GAN_WX[riGan]]+'">'+xg.traits[i]+'</span> ';
  h+='</p><p style="font-size:.95em;color:var(--gold-lt);margin-top:8px"><strong>一句话：</strong>'+xg.summary+'</p></div>';

  var zy=analyzeZhiYe(pillars,riGan);
  h+='<div class="section-title">七、职业</div><div class="card">';
  h+='<p style="font-size:1em;color:#e88060;font-weight:700">最佳方向：'+zy.d+'</p><p>'+zy.t+'</p></div>';

  var jk=analyzeJianKang(wxCount);
  h+='<div class="section-title">八、健康</div><div class="card"><ul>';
  for(var i=0;i<jk.length;i++)h+='<li>'+jk[i]+'</li>';
  h+='</ul></div>';

  var hl=analyzeHunLian(pillars,riGan,gender);
  h+='<div class="section-title">九、婚恋</div><div class="card"><p>'+hl.analysis+'</p></div>';

  h+='<div class="section-title">十、大运流程</div><div class="card">';
  if(dayun.length&&!dayun[0].info){
    h+='<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px">';
    for(var i=0;i<dayun.length;i++){var dy=dayun[i];
      h+='<div style="position:relative;display:flex;flex-direction:column;align-items:center;min-width:52px;padding:8px 6px;border-radius:10px;background:#1a2027;border:1px solid '+(dy.cur?'var(--gold)':'#2a3038')+';'+(dy.cur?'background:linear-gradient(180deg,rgba(200,169,110,.08),transparent);':'')+'">';
      if(dy.cur)h+='<span style="position:absolute;top:-7px;right:-5px;font-size:.5em;color:var(--gold);background:#0b0e12;padding:0 4px;border-radius:4px;border:1px solid var(--gold)">当前</span>';
      h+='<span style="font-size:1.05em;font-weight:700;color:var(--gold-lt)">'+dy.ganZhi+'</span><span style="font-size:.58em;color:#6a7a88;margin-top:2px">'+dy.ages+'岁</span></div>';}
    h+='</div>';
  }
  h+='</div>';

  h+='<div class="section-title">十一、综合建议</div><div class="card">';
  h+='<p>此命'+gj.gejuDetail+'，'+sq.level+'.'+ (gj.yongShen?'以<strong style="color:var(--gold-lt)">'+gj.yongShen+'</strong>为用神，':'')+'大运走势需关注用神当旺之运。</p>';
  h+='<p style="font-size:.85em;color:var(--dim);margin-top:10px">以上分析基于子平法规则引擎自动生成，仅供参考。</p></div>';
  var jt=analyzeJiaTing(pillars,riGan),xl=analyzeXueLi(pillars,riGan);
  var zn=analyzeZiNv(pillars,riGan,gender),dyd=analyzeDaYunDetail(dayun);
  var dsj=analyzeDaShiJian(pillars,riGan,dayun,birthYear),ln=analyzeLiuNian(pillars,riGan,dayun,new Date().getFullYear(),birthYear);
  h+='<hr class="divider"><div class="section-title">六、家庭情况</div><div class="card">';
  h+='<p><strong style="color:var(--gold-lt)">祖上（年柱）</strong></p><p>年柱'+pillars[0].ganZhi+'。'+jt.zuShang+'</p>';
  h+='<p style="margin-top:14px"><strong style="color:var(--gold-lt)">父母</strong></p><ul><li><strong>父星：</strong>'+jt.fuQin+'</li><li><strong>母星：</strong>'+jt.muQin+'</li></ul>';
  h+='<p style="margin-top:14px"><strong style="color:var(--gold-lt)">兄弟姐妹</strong></p><p>'+jt.xiongDi+'</p></div>';
  h+='<hr class="divider"><div class="section-title">八、学历</div><div class="card"><p>'+xl.conclusion+'</p></div>';
  h+='<hr class="divider"><div class="section-title">十二、子女</div><div class="card"><p>'+zn.touTai+'，'+zn.count+'</p></div>';
  h+='<hr class="divider"><div class="section-title">十三、大运走势</div><div class="card">';
  for(var i=0;i<dyd.length;i++){var d=dyd[i];h+='<p style="'+(d.cur?'color:#e88060;font-size:.95em;font-weight:700;':'')+'margin-top:10px">'+d.ganZhi+'运（'+d.ages+'岁）'+(d.cur?' 当前':'')+'</p><p>'+d.desc+'</p>';}
  h+='</div>';
  h+='<hr class="divider"><div class="section-title">十四、重大事件年份</div><div class="card"><div class="table-wrap"><table>';
  h+='<tr><th>年份</th><th>年龄</th><th>事件</th><th>命理依据</th></tr>';
  for(var i=0;i<dsj.length;i++){var e=dsj[i];h+='<tr><td><strong>'+e.year+'</strong></td><td>'+e.age+'岁</td><td>'+e.event+'</td><td style="text-align:left;font-size:.82em">'+e.reason+'</td></tr>';}
  h+='</table></div></div>';
  h+='<hr class="divider"><div class="section-title">十五、当前流年总论</div><div class="card"><p>'+ln.desc+'</p></div>';


  return h;
}

// API: 规则引擎深度分析
app.post('/api/analyze', (req, res) => {
  try {
    const { year, month, day, hour, minute, longitude, gender, isLunar } = req.body;
    const lng = longitude || 120;
    let sy = year, sm = month, sd = day;
    if (isLunar) { try { const ld = Lunar.fromYmd(year, month, day); const s2 = ld.getSolar(); sy = s2.getYear(); sm = s2.getMonth(); sd = s2.getDay(); } catch(e) {} }
    const ts = calcTrueSolar(sy, sm, sd, hour || 0, minute || 0, lng);
    const solar = Solar.fromYmdHms(ts.year, ts.month, ts.day, ts.hour, ts.minute, 0);
    const lunar = Lunar.fromSolar(solar);
    const bz = lunar.getEightChar();
    const riGan = bz.getDayGan(), riZhi = bz.getDayZhi();
    const pillars = [
      { name:'年柱', ganZhi: bz.getYear(), gan: bz.getYearGan(), zhi: bz.getYearZhi(), shiShen: getShiShen(riGan, bz.getYearGan()), naYin: bz.getYearNaYin(), cangGan: bz.getYearHideGan(), shiShenZhi: bz.getYearShiShenZhi().join('/') },
      { name:'月柱', ganZhi: bz.getMonth(), gan: bz.getMonthGan(), zhi: bz.getMonthZhi(), shiShen: getShiShen(riGan, bz.getMonthGan()), naYin: bz.getMonthNaYin(), cangGan: bz.getMonthHideGan(), shiShenZhi: bz.getMonthShiShenZhi().join('/') },
      { name:'日柱', ganZhi: bz.getDay(), gan: bz.getDayGan(), zhi: bz.getDayZhi(), shiShen: '日主', naYin: bz.getDayNaYin(), cangGan: bz.getDayHideGan(), shiShenZhi: bz.getDayShiShenZhi().join('/') },
      { name:'时柱', ganZhi: bz.getTime(), gan: bz.getTimeGan(), zhi: bz.getTimeZhi(), shiShen: getShiShen(riGan, bz.getTimeGan()), naYin: bz.getTimeNaYin(), cangGan: bz.getTimeHideGan(), shiShenZhi: bz.getTimeShiShenZhi().join('/') }
    ];
    const wxCnt = {木:0,火:0,土:0,金:0,水:0};
    const wxM = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水',寅:'木',卯:'木',巳:'火',午:'火',申:'金',酉:'金',亥:'水',子:'水',辰:'土',戌:'土',丑:'土',未:'土'};
    for (const p of pillars) { wxCnt[wxM[p.gan]||''] = (wxCnt[wxM[p.gan]||'']||0)+1; wxCnt[wxM[p.zhi]||''] = (wxCnt[wxM[p.zhi]||'']||0)+1; }
    let dayunArr = [];
    try {
      const yun = bz.getYun(gender);
      if (yun) { const sy2 = Math.round(yun.getStartYear()); for (let i=0;i<8;i++) { const dy=yun.getDaYun(i); if(dy) { const age=sy2+i*10; dayunArr.push({i:i+1,ganZhi:dy.getGanZhi(),startAge:age,ages:age+'-'+(age+9),cur:(age<=30&&age+9>=30)}); } } }
    } catch(e) {}
    const beijingTime = year+'年'+month+'月'+day+'日 '+String(hour||0).padStart(2,'0')+':'+String(minute||0).padStart(2,'0');
    const trueSolar = ts.year+'年'+ts.month+'月'+ts.day+'日 '+String(ts.hour).padStart(2,'0')+':'+String(ts.minute).padStart(2,'0');
    const birthplace = req.body.birthplace || '';
    const html = buildAnalysisHtml(riGan, riZhi, pillars, wxCnt, dayunArr, gender||1, beijingTime, trueSolar, ts.offsetMin, birthplace);
    res.json({ html });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/', (req, res) => res.sendFile(join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log('八字排盘服务启动: '+PORT));
