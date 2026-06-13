// 八字分析规则引擎 — 基于本地调试验证的子平法逻辑
//
// 十神
const SHI_SHEN = {
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
const WX = { 甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水',
             寅:'木',卯:'木',巳:'火',午:'火',申:'金',酉:'金',亥:'水',子:'水',辰:'土',戌:'土',丑:'土',未:'土' };
const WX_ORDER = ['木','火','土','金','水'];
const WX_COLORS = {木:'green',火:'red',土:'orange',金:'gray',水:'blue'};
const WX_CLASS = {木:'ss-wood',火:'ss-fire',土:'ss-earth',金:'ss-metal',水:'ss-water'};
const ZHI_NAMES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

// 十神反查
function findShiShenInPillars(pillars, riGan, target) {
  const found = [];
  for (const p of pillars) {
    if (SHI_SHEN[riGan]?.[p.gan] === target) found.push(p.name + '干' + p.gan);
    if (p.shiShenZhi) {
      const zhiSS = p.shiShenZhi.split('/');
      if (zhiSS.includes(target)) found.push(p.name + '支');
    }
  }
  return found;
}

// 格局判定
function analyzeGeJu(pillars, riGan) {
  const yueZhi = pillars[1].zhi;
  const yueGan = pillars[1].gan;
  const yueGanSS = SHI_SHEN[riGan]?.[yueGan] || '';
  const riWX = WX[riGan];
  const yueWX = WX[yueZhi];

  // 月令当令五行
  const yueLingWX = yueWX;
  const yueLingSS = SHI_SHEN[riGan]?.[yueZhi] || '';

  let geju = '', gejuDetail = '', yongShen = '', xiShen = '', jiShen = '';

  // 查找透干
  const allGans = pillars.map(p => p.gan);
  const touGanSS = allGans.map(g => SHI_SHEN[riGan]?.[g] || '').filter(Boolean);

  // 格局分类
  if (yueLingSS === '正官' || yueLingSS === '七杀') {
    geju = yueLingSS + '格';
    // 官杀格：防克，用印化或用食伤制
    if (touGanSS.includes('正印') || touGanSS.includes('偏印')) {
      gejuDetail = '杀印相生格';
      yongShen = '印星化杀';
      xiShen = '比劫帮身';
      jiShen = '财星坏印';
    } else if (touGanSS.includes('食神') || touGanSS.includes('伤官')) {
      gejuDetail = '食伤制杀格';
      yongShen = '食伤制杀';
      xiShen = '比劫';
      jiShen = '印星夺食';
    } else {
      gejuDetail = geju + '（无制化）';
      yongShen = '印星或食伤';
      jiShen = '财星生杀';
    }
  } else if (yueLingSS === '正印' || yueLingSS === '偏印') {
    geju = yueLingSS + '格';
    if (touGanSS.includes('正官') || touGanSS.includes('七杀')) {
      gejuDetail = '官印相生格';
      yongShen = '官杀';
    } else {
      gejuDetail = geju + '（印旺）';
      yongShen = '财星破印';
      jiShen = '官杀生印';
    }
  } else if (yueLingSS === '正财' || yueLingSS === '偏财') {
    geju = yueLingSS + '格';
    gejuDetail = geju;
    yongShen = '食伤生财或比劫帮身';
    if (touGanSS.includes('食神') || touGanSS.includes('伤官')) {
      gejuDetail = '食神生财格';
    }
  } else if (['食神','伤官'].includes(yueLingSS)) {
    geju = yueLingSS + '格';
    gejuDetail = geju;
    yongShen = '比劫或财星';
  } else {
    geju = '建禄/阳刃格';
    gejuDetail = yueZhi + '月建禄格';
    yongShen = '官杀或食伤';
  }

  return { geju, gejuDetail, yueLingWX, yueLingSS, yongShen, xiShen, jiShen };
}

// 身强身弱
function analyzeShenQiang(pillars, riGan, gejuResult) {
  const riWX = WX[riGan];
  const yueZhi = pillars[1].zhi;
  const yueWX = WX[yueZhi];
  let score = 0;

  // 月令旺衰
  const wsTable = {
    '木': { 寅:1.5, 卯:1.5, 辰:0.8, 巳:0.3, 午:0.3, 未:0.5, 申:0.2, 酉:0.1, 戌:0.3, 亥:1.2, 子:1.2, 丑:0.4 },
    '火': { 寅:0.8, 卯:0.5, 辰:0.6, 巳:1.5, 午:1.5, 未:1.0, 申:0.2, 酉:0.1, 戌:0.3, 亥:0.2, 子:0.1, 丑:0.3 },
    '土': { 寅:0.4, 卯:0.3, 辰:1.5, 巳:0.8, 午:0.6, 未:1.5, 申:0.5, 酉:0.4, 戌:1.5, 亥:0.3, 子:0.2, 丑:1.5 },
    '金': { 寅:0.1, 卯:0.1, 辰:0.5, 巳:0.6, 午:0.4, 未:0.5, 申:1.5, 酉:1.5, 戌:1.2, 亥:0.3, 子:0.4, 丑:0.8 },
    '水': { 寅:0.3, 卯:0.3, 辰:0.5, 巳:0.1, 午:0.1, 未:0.2, 申:0.8, 酉:0.5, 戌:0.2, 亥:1.5, 子:1.5, 丑:0.6 }
  };
  score += (wsTable[riWX]?.[yueZhi] || 0.5);

  // 同五行干支加分
  for (const p of pillars) {
    if (WX[p.gan] === riWX) score += 0.8;
    if (WX[p.zhi] === riWX) score += 0.6;
  }

  // 生日主的五行加分
  for (const p of pillars) {
    const pWX = WX[p.gan];
    const riIdx = WX_ORDER.indexOf(riWX);
    const pIdx = WX_ORDER.indexOf(pWX);
    if ((pIdx + 1) % 5 === riIdx) score += 0.5; // p生ri
  }

  let level = '', desc = '';
  if (score >= 4) { level = '身强'; desc = '日主得令得地得生，力量充足。'; }
  else if (score >= 2.5) { level = '中和偏强'; desc = '日主有一定根基，稍偏强。'; }
  else if (score >= 1.5) { level = '中和偏弱'; desc = '日主根基不够扎实，稍偏弱。'; }
  else { level = '身弱'; desc = '日主失令失地，力量不足。'; }

  return { level, score: score.toFixed(1), desc };
}

// 病药分析
function analyzeBingYao(pillars, riGan, wxCount, gejuResult, shenResult) {
  const riWX = WX[riGan];
  const bings = [], yaos = [];

  // 病1: 缺五行
  for (const w of WX_ORDER) {
    if (!wxCount[w]) {
      bings.push({ desc: `原局缺${w}`, detail: `四柱无明${w}——${w==='火'?'输出渠道受限、表达力偏弱、缺少驱动力':w==='金'?'决断力不够、制约力偏弱':w==='木'?'根基不稳、发展受限':w==='水'?'灵活度不足、变通力弱':'稳定性不够、承压力偏弱'}` });
    }
  }

  // 病2: 五行过旺
  const total = Object.values(wxCount).reduce((a, b) => a + b, 0) || 1;
  for (const [w, c] of Object.entries(wxCount)) {
    if (c / total > 0.4) {
      bings.push({ desc: `${w}过旺`, detail: `${w}占${Math.round(c/total*100)}%——${w==='土'?'思维偏固执、缺乏灵活度':w==='水'?'思虑过重、行动力偏弱':w==='木'?'个性倔强、不易妥协':w==='火'?'急躁冲动、容易上火':w==='金'?'过于刚硬、不懂变通'}` });
    }
  }

  // 病3: 十神弊端
  const riSS = SHI_SHEN[riGan];
  const allGans = pillars.map(p => p.gan);
  const ganSS = allGans.map(g => riSS[g] || '');
  if (ganSS.filter(s => s.includes('印')).length >= 2) bings.push({ desc: '印星过旺', detail: '印多母溺，依赖心重，行动力偏弱，想得多做得少' });
  if (ganSS.filter(s => s.includes('杀')).length >= 2) bings.push({ desc: '官杀混杂', detail: '压力过大，焦虑多疑，缺乏安全感' });
  if (ganSS.filter(s => s.includes('财')).length >= 3) bings.push({ desc: '财星过多', detail: '贪财忘义，为钱奔波，心神不定' });

  // 药
  const defWx = WX_ORDER.find(w => !wxCount[w]);
  if (defWx) yaos.push({ desc: `补${defWx}`, detail: defWx === '火' ? '大运流年走火运可泄旺印、暖局' : defWx === '木' ? '大运流年走木运可增强根基' : `大运流年补${defWx}平衡五行` });

  if (gejuResult.yongShen) yaos.push({ desc: gejuResult.yongShen, detail: `以${gejuResult.yongShen}为用神调候命局` });

  return { bings, yaos };
}

// 五行详细分解
function analyzeWuxingDetail(pillars, riGan) {
  const wxDetail = { 木: { count: 0, detail: [] }, 火: { count: 0, detail: [] }, 土: { count: 0, detail: [] }, 金: { count: 0, detail: [] }, 水: { count: 0, detail: [] } };
  const riWX = WX[riGan];

  for (const p of pillars) {
    const gw = WX[p.gan], zw = WX[p.zhi];
    wxDetail[gw].count++;
    if (p.shiShen !== '日主') wxDetail[gw].detail.push(p.name + p.gan + '(' + p.shiShen + ')');
    else wxDetail[gw].detail.push(p.name + p.gan + '(日主)');
    wxDetail[zw].count++;
    wxDetail[zw].detail.push(p.name + '支' + p.zhi);
    if (p.cangGan) {
      for (const cg of p.cangGan) {
        const cgw = WX[cg];
        if (cgw) { wxDetail[cgw].count++; wxDetail[cgw].detail.push(p.name + '中' + cg); }
      }
    }
  }
  return wxDetail;
}

// 性格分析
function analyzeXingGe(pillars, riGan, gejuResult, shenResult) {
  const riWX = WX[riGan];
  const riSS = SHI_SHEN[riGan];
  const traits = [];

  // 日主性格
  const wxTraits = {
    '木': ['正直向上','有担当有傲骨','目标感强','有领导潜质'],
    '火': ['热情主动','行动力强','急躁','感染力强'],
    '土': ['稳重可靠','诚实守信','偏固执','包容心强'],
    '金': ['果断刚毅','讲义气重原则','是非分明','执行力强'],
    '水': ['聪明灵活','善变通','直觉敏锐','情绪波动大']
  };
  traits.push(...(wxTraits[riWX] || []));

  // 月令影响
  const yueZhi = pillars[1].zhi;
  const yueWX = WX[yueZhi];
  if (yueWX === '金' && riWX === '木') traits.push('从小受约束、被"打磨"');
  if (yueWX === '水' && riWX === '木') traits.push('智慧型、思考深但行动慢');

  // 十神影响
  const allGans = pillars.map(p => p.gan);
  const ganSS = allGans.map(g => riSS[g] || '');
  if (ganSS.some(s => s.includes('印'))) traits.push('聪明善思考');
  if (ganSS.filter(s => s.includes('财')).length >= 2) traits.push('追求财富、有商业头脑');
  if (ganSS.filter(s => s.includes('劫')).length >= 1) traits.push('讲义气、朋友多');
  if (shenResult.level.includes('弱')) traits.push('需要外界推动力');

  const summary = riWX === '木' ? '内敛型聪明人，脑子快嘴不快。讲义气有底线。需外界推一把才动，但一旦决定就坚定。'
    : riWX === '火' ? '外向开朗，热情直接。行动力强但有时急躁。人缘好受欢迎。'
    : riWX === '土' ? '稳重务实，可靠可信。做事踏实但偶尔固执。包容心强，适合做人脉桥梁。'
    : riWX === '金' ? '刚正果断，原则性强。做事干净利落，不拖泥带水。内心有强烈的正义感。'
    : '聪明灵活，适应力强。善变通、善交际。情绪敏感，需要稳定的内心支撑。';

  return { traits, summary };
}

// 职业分析
function analyzeZhiYe(pillars, riGan, gejuResult) {
  const riWX = WX[riGan];
  const riSS = SHI_SHEN[riGan];
  const allGans = pillars.map(p => p.gan);
  const ganSS = allGans.map(g => riSS[g] || '');

  // 类象分析
  const hasYin = ganSS.some(s => s.includes('印'));
  const hasSha = ganSS.some(s => s.includes('杀') || s.includes('官'));
  const hasShiShang = ganSS.some(s => s.includes('食') || s.includes('伤'));
  const hasCai = ganSS.some(s => s.includes('财'));

  let direction = '', detail = '';
  if (hasSha && hasYin) {
    direction = '技术型稳定岗位';
    detail = '杀印相生，适合在大机构做专业技术人才（工程师/数据分析/技术管理/IT运维/工程设计/审计）。不宜一线拼杀岗，适合后台支持类。';
  } else if (hasShiShang && hasCai) {
    direction = '商业创业型';
    detail = '食伤生财，适合做生意、销售、市场、创意类。商业头脑灵活，自由度高。';
  } else if (hasYin && !hasSha) {
    direction = '文教研究型';
    detail = '印旺为用，适合文化教育、研究分析、文书工作。体制内文职或教育行业合适。';
  } else if (hasSha && !hasYin) {
    direction = '管理执行型';
    detail = '官杀有力，适合管理岗、项目经理、行政主管。需执行力强的岗位。';
  } else {
    direction = '技能型自由职业';
    detail = '建议走专业技术路线，有一技之长。自由职业或小团队模式。';
  }

  return { direction, detail };
}

// 健康分析
function analyzeJianKang(pillars, riGan, wxCount) {
  const riWX = WX[riGan];
  const issues = [];
  const wxIssues = {
    '木': { weak: '肝胆功能偏弱、筋骨易酸软', strong: '肝火偏旺、易怒' },
    '火': { weak: '心火不足、气血偏慢、手脚易凉', strong: '心火过旺、易上火失眠' },
    '土': { weak: '脾胃运化差、易腹胀', strong: '脾胃湿热、消化不良' },
    '金': { weak: '肺气偏弱、皮肤敏感', strong: '肺火偏旺、易咳嗽' },
    '水': { weak: '肾气偏弱、精力不足', strong: '肾气偏旺易失衡、泌尿系统' }
  };

  const total = Object.values(wxCount).reduce((a, b) => a + b, 0) || 1;
  for (const [w, c] of Object.entries(wxCount)) {
    if (c === 0) issues.push(wxIssues[w].weak);
    if (c / total > 0.35) issues.push(wxIssues[w].strong);
  }

  return issues;
}

// 婚恋分析
function analyzeHunLian(pillars, riGan, gender) {
  const riSS = SHI_SHEN[riGan];
  const riZhi = pillars[2].zhi;
  const allGans = pillars.map(p => p.gan);
  const ganSS = allGans.map(g => riSS[g] || '');

  const isMale = gender === 1;
  const spouseSS = isMale ? '正财' : '正官';
  const spousePillars = findShiShenInPillars(pillars, riGan, spouseSS);
  const spouseBackupSS = isMale ? '偏财' : '七杀';
  const spousePillars2 = findShiShenInPillars(pillars, riGan, spouseBackupSS);

  const palaceWX = WX[riZhi] || '';
  const palaceSS = riSS[riZhi] || '';

  let analysis = '';
  if (spousePillars.length) {
    analysis += `配偶星（${spouseSS}）在${spousePillars.join('、')}，` + (spousePillars.some(p => p.includes('年')) ? '早婚' : spousePillars.some(p => p.includes('时')) ? '晚婚' : '适龄结婚') + '。';
  } else if (spousePillars2.length) {
    analysis += `以${spouseBackupSS}为配偶星，在${spousePillars2.join('、')}。`;
  } else {
    analysis += `配偶星不显，婚缘偏晚，需大运流年引动。`;
  }

  analysis += ` 配偶宫${riZhi}（${palaceWX}·${palaceSS}）`;
  if (palaceSS.includes('财') && isMale) analysis += '，配偶有一定经济能力或务实';
  else if (palaceSS.includes('官') && !isMale) analysis += '，配偶有责任心或管理能力';
  else if (palaceSS.includes('印')) analysis += '，配偶文化程度不低或性格温厚';

  return { analysis, spouseSS, spousePresent: spousePillars.length > 0 || spousePillars2.length > 0 };
}

// 大运分析
function analyzeDaYun(dayun, currentYear, birthYear) {
  const cur = dayun.find(d => d.cur);
  const next = dayun.find(d => d.startAge > (cur?.startAge || 0) && d.startAge <= (cur?.startAge || 0) + 10);
  let analysis = '';
  if (cur) {
    analysis += `当前正行${cur.ganZhi}大运（${cur.ages}岁），`;
    // 简单大运吉凶判断
    const curGan = cur.ganZhi[0], curZhi = cur.ganZhi[1];
    analysis += `此运为${curGan}${curZhi}组合。`;
  }
  if (next) {
    analysis += `下一运${next.ganZhi}（${next.ages}岁），`;
  }
  return { current: cur, next, analysis };
}

// 导出
export {
  SHI_SHEN, WX, WX_ORDER, WX_COLORS, WX_CLASS, ZHI_NAMES,
  analyzeGeJu, analyzeShenQiang, analyzeBingYao, analyzeWuxingDetail,
  analyzeXingGe, analyzeZhiYe, analyzeJianKang, analyzeHunLian, analyzeDaYun,
  findShiShenInPillars
};
