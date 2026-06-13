import express from 'express';
import { Solar, Lunar } from 'lunar-typescript';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || '';

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// 获取十神
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

// API: 排八字
app.post('/api/bazi', (req, res) => {
  try {
    const { year, month, day, hour, minute } = req.body;
    const solar = Solar.fromYmdHms(year, month, day, hour || 0, minute || 0, 0);
    const lunar = Lunar.fromSolar(solar);
    const bz = lunar.getEightChar();

    const riGan = bz.getDayGan();
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
    const gender = req.body.gender || 1; // 1=男 0=女
    const yunArr = lunar.getYun ? [] : [];
    try {
      const yun = bz.getYun(gender);
      if (yun && yun.getDaYun) {
        const days = yun.getStartYear();
        for (let i = 0; i < 8; i++) {
          const dy = yun.getDaYun(i);
          if (dy) {
            const startAge = Math.round(days) + i * 10;
            const startY = year + startAge;
            yunArr.push({
              index: i + 1,
              ganZhi: dy.getGanZhi(),
              startYear: startAge,
              ages: `${startAge}-${startAge + 9}`,
              years: `${startY}-${startY + 9}`
            });
          }
        }
      }
    } catch(e) {
      yunArr.push({ info: '大运计算异常' });
    }

    const result = {
      solar: `${year}年${month}月${day}日 ${String(hour||0).padStart(2,'0')}:${String(minute||0).padStart(2,'0')}`,
      gender: gender === 1 ? '男' : '女',
      bazi: pillars.map(p => p.ganZhi).join(' '),
      riGan: riGan,
      riZhi: bz.getDayZhi(),
      pillars: pillars,
      dayun: yunArr,
      // 日柱信息
      riNaYin: bz.getDayNaYin(),
      riShiShen: '日主',
      // 五行统计
      wuxingCount: countWuxing(pillars)
    };
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function countWuxing(pillars) {
  const wxMap = { 甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水',
                  寅:'木',卯:'木',巳:'火',午:'火',申:'金',酉:'金',亥:'水',子:'水',辰:'土',戌:'土',丑:'土',未:'土' };
  const cnt = { 木:0, 火:0, 土:0, 金:0, 水:0 };
  for (const p of pillars) {
    cnt[wxMap[p.gan]||''] = (cnt[wxMap[p.gan]||'']||0) + 1;
    cnt[wxMap[p.zhi]||''] = (cnt[wxMap[p.zhi]||'']||0) + 1;
  }
  return cnt;
}

// API: AI 八字分析
app.post('/api/analyze', async (req, res) => {
  try {
    const { year, month, day, hour, minute, gender, question } = req.body;
    const solar = Solar.fromYmdHms(year, month, day, hour || 0, minute || 0, 0);
    const lunar = Lunar.fromSolar(solar);
    const bz = lunar.getEightChar();
    const riGan = bz.getDayGan();

    const pillars = [
      { name:'年柱', ganZhi: bz.getYear(), shiShen: getShiShen(riGan, bz.getYearGan()), naYin: bz.getYearNaYin(), cangGan: bz.getYearHideGan(), shiShenZhi: bz.getYearShiShenZhi() },
      { name:'月柱', ganZhi: bz.getMonth(), shiShen: getShiShen(riGan, bz.getMonthGan()), naYin: bz.getMonthNaYin(), cangGan: bz.getMonthHideGan(), shiShenZhi: bz.getMonthShiShenZhi() },
      { name:'日柱', ganZhi: bz.getDay(), shiShen: '日主', naYin: bz.getDayNaYin(), cangGan: bz.getDayHideGan(), shiShenZhi: bz.getDayShiShenZhi() },
      { name:'时柱', ganZhi: bz.getTime(), shiShen: getShiShen(riGan, bz.getTimeGan()), naYin: bz.getTimeNaYin(), cangGan: bz.getTimeHideGan(), shiShenZhi: bz.getTimeShiShenZhi() }
    ];

    const promptData = {
      出生时间: `${year}年${month}月${day}日 ${String(hour||0).padStart(2,'0')}:${String(minute||0).padStart(2,'0')}`,
      性别: gender === 1 ? '男' : '女',
      八字: pillars.map(p => p.ganZhi).join(' '),
      四柱详情: pillars,
      日主: riGan
    };

    const prompt = `你是八字命理专家，精通子平法、穷通宝鉴、三命通会。

以下是命主的八字排盘数据：
${JSON.stringify(promptData, null, 2)}

${question ? `求测问题：${question}` : '请进行综合命局分析'}

请直接进行专业命理分析，不要自我介绍。要求：
1. 格局判定与核心特征
2. 身强身弱判定及用神
3. 性格特点
4. 事业财运方向
5. 婚恋感情
6. 健康注意
7. 大运走势（重点当前大运）
8. 综合建议
控制在600字以内，简洁有力。`;

    if (!DEEPSEEK_KEY) {
      return res.json({ content: null, fallback: true, reason: '未配置API Key' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const aiResp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1200,
        stream: false
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!aiResp.ok) {
      return res.json({ content: null, fallback: true, reason: `API ${aiResp.status}` });
    }

    const aiJson = await aiResp.json();
    res.json({ content: aiJson.choices?.[0]?.message?.content || '', fallback: false });
  } catch (e) {
    res.json({ content: null, fallback: true, reason: e.message });
  }
});

app.get('/', (req, res) => res.sendFile(join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`八字排盘服务启动: ${PORT}`));
