import express from 'express';
import { Solar, Lunar } from 'lunar-typescript';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname=dirname(fileURLToPath(import.meta.url)),app=express(),PORT=process.env.PORT||3000;
app.use(express.json());app.use(express.static(join(__dirname,'public')));

const GW={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'},ZW={寅:'木',卯:'木',巳:'火',午:'火',申:'金',酉:'金',亥:'水',子:'水',辰:'土',戌:'土',丑:'土',未:'土'},WO=['木','火','土','金','水'],WC={'木':'green','火':'red','土':'orange','金':'gray','水':'blue'};
function getShiShen(r,g){const m={'甲':{甲:'比肩',乙:'劫财',丙:'食神',丁:'伤官',戊:'偏财',己:'正财',庚:'七杀',辛:'正官',壬:'偏印',癸:'正印'},'乙':{甲:'劫财',乙:'比肩',丙:'伤官',丁:'食神',戊:'正财',己:'偏财',庚:'正官',辛:'七杀',壬:'正印',癸:'偏印'},'丙':{甲:'偏印',乙:'正印',丙:'比肩',丁:'劫财',戊:'食神',己:'伤官',庚:'偏财',辛:'正财',壬:'七杀',癸:'正官'},'丁':{甲:'正印',乙:'偏印',丙:'劫财',丁:'比肩',戊:'伤官',己:'食神',庚:'正财',辛:'偏财',壬:'正官',癸:'七杀'},'戊':{甲:'七杀',乙:'正官',丙:'偏印',丁:'正印',戊:'比肩',己:'劫财',庚:'食神',辛:'伤官',壬:'偏财',癸:'正财'},'己':{甲:'正官',乙:'七杀',丙:'正印',丁:'偏印',戊:'劫财',己:'比肩',庚:'伤官',辛:'食神',壬:'正财',癸:'偏财'},'庚':{甲:'偏财',乙:'正财',丙:'七杀',丁:'正官',戊:'偏印',己:'正印',庚:'比肩',辛:'劫财',壬:'食神',癸:'伤官'},'辛':{甲:'正财',乙:'偏财',丙:'正官',丁:'七杀',戊:'正印',己:'偏印',庚:'劫财',辛:'比肩',壬:'伤官',癸:'食神'},'壬':{甲:'食神',乙:'伤官',丙:'偏财',丁:'正财',戊:'七杀',己:'正官',庚:'偏印',辛:'正印',壬:'比肩',癸:'劫财'},'癸':{甲:'伤官',乙:'食神',丙:'正财',丁:'偏财',戊:'正官',己:'七杀',庚:'正印',辛:'偏印',壬:'劫财',癸:'比肩'}};return m[r]?.[g]||'';}
function eot(m,d){const D=[0,31,59,90,120,151,181,212,243,273,304,334][m-1]+d,B=(360/365)*(D-81)*Math.PI/180;return 9.87*Math.sin(2*B)-7.53*Math.cos(B)-1.5*Math.sin(B);}
function calcTS(y,m,d,h,mi,lng){let t=h*60+mi-480+eot(m,d)+(lng-120)*4+480,ay=y,am=m,ad=d;while(t<0){t+=1440;ad--;if(ad<1){am--;if(am<1){am=12;ay--}ad=new Date(ay,am,0).getDate()}}while(t>=1440){t-=1440;ad++;if(ad>new Date(ay,am,0).getDate()){ad=1;am++;if(am>12){am=1;ay++}}}return{year:ay,month:am,day:ad,hour:Math.floor(t/60),minute:Math.floor(t%60),off:Math.round((lng-120)*4+eot(m,d))};}
function gCls(g){return's-'+WC[GW[g]||''];}function zCls(z){return's-'+WC[ZW[z]||''];}function ssCls(g){return'ss-'+WC[GW[g]||''];}function dtCls(g){return WC[GW[g]||'']||'wood';}function st(s){return'<strong style="color:var(--gold-lt)">'+s+'</strong>';}function hi(s){return'<span class="highlight">'+s+'</span>';}
function isCh(z1,z2){var o={子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};return o[z1]===z2;}
function isLH(z1,z2){var o={子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午'};return o[z1]===z2;}
function tgI(g){return'甲乙丙丁戊己庚辛壬癸'.indexOf(g);}function dzI(z){return'子丑寅卯辰巳午未申酉戌亥'.indexOf(z);}

function gjBase(pills,r){var yz=pills[1].zhi,ylSS=getShiShen(r,yz),ags=pills.map(function(p){return p.gan}),tgs=ags.map(function(g){return getShiShen(r,g)}).filter(Boolean);var g='',gd='',ys='',xs='',js='';if(ylSS==='正官'||ylSS==='七杀'){g=ylSS+'格';if(tgs.includes('正印')||tgs.includes('偏印')){gd='杀印相生格';ys='印星化杀';xs='比劫帮身';js='财星坏印';}else if(tgs.includes('食神')||tgs.includes('伤官')){gd='食伤制杀格';ys='食伤制杀';}else{gd=g+'无制化';ys='印星或食伤';}}else if(ylSS==='正印'||ylSS==='偏印'){g=ylSS+'格';if(tgs.includes('正官')||tgs.includes('七杀')){gd='官印相生格';ys='官杀';}else{gd=g+'印旺';ys='财星破印';js='官杀生印';}}else if(ylSS==='正财'||ylSS==='偏财'){g=ylSS+'格';gd=g;ys='食伤生财';}else if(['食神','伤官'].includes(ylSS)){g=ylSS+'格';gd=g;}else{g='建禄格';gd=yz+'月建禄格';ys='官杀或食伤';}return{geju:g,gejuDetail:gd,yueLingSS:ylSS,yongShen:ys,xiShen:xs,jiShen:js};}
function sqBase(pills,r){var rw=GW[r],ws={木:{寅:1.5,卯:1.5,辰:0.8,巳:0.5,午:0.5,未:0.5,申:0.2,酉:0.1,戌:0.3,亥:1.2,子:1.2,丑:0.4},火:{寅:0.8,卯:0.5,辰:0.6,巳:1.5,午:1.5,未:1.0,申:0.2,酉:0.1,戌:0.3,亥:0.2,子:0.1,丑:0.3},土:{寅:0.4,卯:0.3,辰:1.5,巳:0.8,午:0.6,未:1.5,申:0.5,酉:0.4,戌:1.5,亥:0.3,子:0.2,丑:1.5},金:{寅:0.1,卯:0.1,辰:0.5,巳:0.6,午:0.4,未:0.5,申:1.5,酉:1.5,戌:1.2,亥:0.3,子:0.4,丑:0.8},水:{寅:0.3,卯:0.3,辰:0.5,巳:0.1,午:0.1,未:0.2,申:0.8,酉:0.5,戌:0.2,亥:1.5,子:1.5,丑:0.6}};var s=ws[rw]?.[pills[1].zhi]||0.5;for(var i=0;i<pills.length;i++){if(GW[pills[i].gan]===rw)s+=0.8;if(ZW[pills[i].zhi]===rw)s+=0.6;}for(var i=0;i<pills.length;i++){var ri=WO.indexOf(rw),pi=WO.indexOf(GW[pills[i].gan]);if((pi+1)%5===ri)s+=0.5;}var l='',d='';if(s>=4){l='身强';d='日主得令得地得生，力量充足。';}else if(s>=2.5){l='中和偏强';d='日主有一定根基，稍偏强。';}else if(s>=1.5){l='中和偏弱';d='日主根基不够扎实，稍偏弱。';}else{l='身弱';d='日主失令失地，力量不足。';}return{level:l,score:s.toFixed(1),desc:d};}
function xgBase(pills,r){var rw=GW[r],wxT={木:['正直向上','有担当有傲骨','目标感强','有领导潜质'],火:['热情主动','行动力强','急躁','感染力强'],土:['稳重可靠','诚实守信','偏固执','包容心强'],金:['果断刚毅','讲义气重原则','是非分明','执行力强'],水:['聪明灵活','善变通','直觉敏锐','情绪波动大']};var tr=wxT[rw]||[],sm=rw==='木'?'内敛型聪明人，脑子快嘴不快。讲义气有底线。需外界推一把才动，但一旦决定就坚定。':rw==='火'?'外向开朗，热情直接。行动力强但有时急躁。人缘好受欢迎。':rw==='土'?'稳重务实，可靠可信。做事踏实但偶尔固执。包容心强，适合做人脉桥梁。':rw==='金'?'刚正果断，原则性强。做事干净利落，不拖泥带水。内心有强烈的正义感。':'聪明灵活，适应力强。善变通、善交际。情绪敏感，需要稳定的内心支撑。';return{traits:tr,summary:sm};}
function zyBase(pills,r){var gs=pills.map(function(p){return p.gan}).map(function(g){return getShiShen(r,g)}),hY=gs.some(function(s){return s.includes('印')}),hS=gs.some(function(s){return s.includes('杀')||s.includes('官')}),hSS=gs.some(function(s){return s.includes('食')||s.includes('伤')}),hC=gs.some(function(s){return s.includes('财')});if(hS&&hY)return{d:'技术型稳定岗位',t:'杀印相生，适合在大机构做专业技术人才（工程师/数据分析/技术管理/IT运维/工程设计/审计）。不宜一线拼杀岗，适合后台支持类。'};if(hSS&&hC)return{d:'商业创业型',t:'食伤生财，适合做生意、销售、市场、创意类。商业头脑灵活，自由度高。'};if(hY)return{d:'文教研究型',t:'印旺为用，适合文化教育、研究分析、文书工作。体制内文职或教育行业合适。'};return{d:'技能型自由职业',t:'走专业技术路线，有一技之长。自由职业或小团队模式。'};}
function jkBase(wc){var is=[],t=Math.max(1,Object.values(wc).reduce(function(a,b){return a+b},0));var ws={木:{w:'肝胆功能偏弱、筋骨易酸软',s:'肝火偏旺、易怒'},火:{w:'心火不足、气血偏慢、手脚易凉',s:'心火过旺、易上火失眠'},土:{w:'脾胃运化差、易腹胀',s:'脾胃湿热、消化不良'},金:{w:'肺气偏弱、皮肤敏感',s:'肺火偏旺、易咳嗽'},水:{w:'肾气偏弱、精力不足',s:'肾气偏旺易失衡、泌尿系统'}};var wk=Object.keys(wc);for(var i=0;i<wk.length;i++){var w=wk[i],c=wc[w];if(c===0)is.push(ws[w].w);if(c/t>0.35)is.push(ws[w].s);}return is;}
function hlBase(pills,r,gender){var isM=gender===1,sp=isM?'正财':'正官',bk=isM?'偏财':'七杀',fnd=[],fbk=[];for(var i=0;i<pills.length;i++){var p=pills[i];if(getShiShen(r,p.gan)===sp)fnd.push(p.name+p.gan);if(getShiShen(r,p.gan)===bk)fbk.push(p.name+p.gan);}var an='';if(fnd.length)an+='配偶星（'+sp+'）在'+fnd.join('、')+'，'+(fnd.some(function(p){return p.includes('年')})?'早婚倾向。':fnd.some(function(p){return p.includes('时')})?'晚婚倾向。':'适龄结婚。');else if(fbk.length)an+='以'+bk+'为配偶星，在'+fbk.join('、')+'，适龄结婚。';else an+='配偶星不显，婚缘偏晚，需大运流年引动。';an+=' 配偶宫'+pills[2].zhi+'。';var by2=new Date().getFullYear()+3;an+=' 最佳婚期约在'+by2+'年前后。';return{analysis:an};}
function znBase(pills,r,gender){var isM=gender===1,gs=pills.map(function(p){return p.gan}),cp=isM?gs.some(function(g){return getShiShen(r,g).includes('杀')||getShiShen(r,g).includes('官')}):gs.some(function(g){return getShiShen(r,g).includes('食')||getShiShen(r,g).includes('伤')});return{touTai:'头胎儿子可能性偏大。',count:cp?'未来有1~2个孩子。':'未来有1个孩子。'};}
function dyBase(du){var items=[];for(var i=0;i<du.length;i++){var dy=du[i],ages=dy.ages.split('-'),a0=parseInt(ages[0]),desc='';if(a0<15)desc='少年运——学业成长阶段。';else if(a0<25)desc='青年运——求学或初入社会。';else if(a0<35)desc='青壮年运——事业关键期，成家立业。';else if(a0<45)desc='中年运——财富积累阶段。';else desc='中晚年运——事业稳固或转型。';items.push({ganZhi:dy.ganZhi,ages:dy.ages,cur:dy.cur,desc:desc});}return items;}
function dsjBase(pills,r,du,by){var items=[],curYear=new Date().getFullYear(),age=curYear-by;if(age>=18)items.push({year:by+18,age:18,event:'高考/升学',reason:'学业关键节点。'});if(age>=22)items.push({year:by+22,age:22,event:'进入社会/初入职场',reason:'人生重要转折。'});var curDY=du.find(function(d){return d.cur});if(curDY){var sa=parseInt(curDY.ages.split('-')[0]);items.push({year:by+sa,age:sa,event:'换大运',reason:'进入'+curDY.ganZhi+'大运——运势转变节点。'});}if(curYear>by+18)items.push({year:curYear,age:curYear-by,event:'当前年份',reason:'当前流年重点把握。'});items.sort(function(a,b){return a.year-b.year});return items.slice(0,7);}
function lnBase(du){var curDY=du.find(function(d){return d.cur}),rs='今年是转型与调整之年——';if(curDY)rs='当前正在'+curDY.ganZhi+'大运中——'+rs;rs+='需关注事业、感情、健康三方面平衡发展。';return{age:new Date().getFullYear()-1995,desc:rs};}
function gjDeep(pills,r,bgj){
  var yz=pills[1],rz=pills[2],gs=pills.map(function(p){return p.gan}).map(function(g){return getShiShen(r,g)});
  var hY=gs.some(function(s){return s.includes('印')}),hS=gs.some(function(s){return s.includes('杀')||s.includes('官')}),hC=gs.some(function(s){return s.includes('财')});
  var riWX=GW[r],yueWX=ZW[yz.zhi],ft=[],detail='';
  if(hS&&hY){ft.push('月令'+yz.zhi+'为七杀当令，'+yz.gan+GW[yz.gan]+'透出化杀——标准杀印相生，有贵气基础');var yStr=gs.filter(function(s){return s.includes('印')}).length>=2;if(yStr)ft.push('关键在于：偏印坐申得长生，印星极旺而泄杀过重。杀力被印截胡，印星反成命局主导');}
  if(yz.zhi==='申'&&riWX==='木')detail='日主在月令处绝地，从小受约束。'+(hY?'印旺庇护之下，聪明但行动力偏弱。':'');
  if(gs.filter(function(s){return s.includes('财')}).length>=2)ft.push('财星双透——既想赚稳钱又想赚快钱');
  if(pills.some(function(p){return p.zhi===rz.zhi&&p.name!==rz.name}))ft.push(rz.zhi+rz.zhi+'自刑——内心纠结，决策反复');
  if(yz.zhi==='申'&&rz.zhi==='辰')ft.push('申辰暗拱子水——月日相邻暗拱正印，印更旺');
  if(pills[0].zhi==='卯'&&yz.zhi==='申')ft.push('卯申暗合——劫财合杀，朋友帮忙化解压力');
  var ch=[];for(var i=0;i<pills.length;i++)for(var j=i+1;j<pills.length;j++){var z1=pills[i].zhi,z2=pills[j].zhi;if(isCh(z1,z2))ch.push(pills[i].name+z1+'与'+pills[j].name+z2+'相冲');}if(ch.length)ft.push(ch.join('；'));
  return{g:bgj.geju,gd:bgj.gejuDetail,yl:bgj.yueLingSS,ys:bgj.yongShen,xs:bgj.xiShen,js:bgj.jiShen,ft:ft,detail:detail,riWX:riWX,yueWX:yueWX,hY:hY,hS:hS,hC:hC};
}
function byDeep(pills,r,wc,bgj,sq){
  var WX_TXT={土:'思维偏固执、缺乏灵活度——土重埋金则决断力受限，做事容易墨守成规。',水:'思虑过重、行动力偏弱——水多木漂则目标易迷失，想得多做得少。',木:'个性倔强、不易妥协——木多火塞则创造力受阻，容易钻牛角尖。',火:'急躁冲动、容易上火——火多土焦则耐心不足，做事虎头蛇尾。',金:'过于刚硬、不懂变通——金多水浊则智慧受损。'};
  var ms={火:'食伤不现——输出渠道受限，缺乏表达力和驱动力。原局缺火是最大短板，需大运流年补火。',金:'官杀不足——决断力和制约力偏弱，遇事容易犹豫。',木:'比劫不现——根基不稳，独立性弱。',水:'印星不足——贵人运和学习力受限。',土:'财星不现——理财意识不足。'};
  var bs=[],ys=[],t=Math.max(1,Object.values(wc).reduce(function(a,b){return a+b},0));
  for(var i=0;i<WO.length;i++){var w=WO[i];if(!wc[w])bs.push({d:'原局缺'+w,t:ms[w]||('四柱无明'+w+'——相关能力偏弱。')});}
  var wk=Object.keys(wc);for(var i=0;i<wk.length;i++){var w=wk[i],c=wc[w];if(c/t>0.35)bs.push({d:w+'过旺('+Math.round(c/t*100)+'%)',t:WX_TXT[w]});}
  var gs=pills.map(function(p){return p.gan}).map(function(g){return getShiShen(r,g)});
  if(gs.filter(function(s){return s.includes('印')}).length>=2)bs.push({d:'印星过旺',t:'印多母溺——依赖心重，想得多做得少。精神内耗，容易畏缩不前。'});
  if(gs.filter(function(s){return s.includes('杀')}).length>=2)bs.push({d:'官杀混杂',t:'压力叠加，焦虑多疑。做事瞻前顾后，犹豫不决。'});
  if(gs.filter(function(s){return s.includes('财')}).length>=3)bs.push({d:'财星过多',t:'贪财忘义，为钱奔波——财多身弱则担不住。'});
  for(var i=0;i<pills.length;i++)for(var j=i+1;j<pills.length;j++){if(isCh(pills[i].zhi,pills[j].zhi))bs.push({d:pills[i].name+pills[j].name+'相冲',t:'冲则动、不稳定——对应宫位的人事物容易有变故或冲突。'});}
  var df=WO.find(function(w){return !wc[w]});if(df){var yd=df==='火'?'大运流年走火运可泄旺印、暖局、生财':df==='木'?'大运流年走木运可增强日主根基':df==='金'?'大运流年走金运可增强决断力':'大运流年补'+df+'平衡五行';ys.push({d:'补'+df,t:yd});}
  if(bgj.ys)ys.push({d:bgj.ys,t:'以'+bgj.ys+'为用神调候命局——大运流年逢用神当旺之时为好运。'});
  if(sq.level.includes('弱'))ys.push({d:'增强日主',t:'身弱需帮扶——比劫帮身、印星生扶可增强命主担财官之力。'});
  return{bs:bs,ys:ys};
}
function jtDeep(pills,r){
  var nz=pills[0],yz=pills[1];var gs=pills.map(function(p){return p.gan});
  var ns=getShiShen(r,nz.gan),nzWX=ZW[nz.zhi],zs='';
  if(ns.includes('财'))zs='年柱'+nz.ganZhi+'——祖上家境普通，非大富大贵之家。';else if(ns.includes('印'))zs='年柱'+nz.ganZhi+'——祖上有些文化底蕴或受人尊敬。';else if(ns.includes('杀'))zs='年柱'+nz.ganZhi+'——祖辈较严厉或家庭规矩多。';else zs='年柱'+nz.ganZhi+'——祖上普通家庭。';
  var cp='',yp='',cpP=null,ypP=null;for(var i=0;i<pills.length;i++){var p=pills[i],ss=getShiShen(r,p.gan);if(ss.includes('财')&&!cp){cp=p.name+p.gan;cpP=p;}if(ss.includes('印')&&!yp){yp=p.name+p.gan;ypP=p;}}
  var fq=cp?(cp+'——父亲有实际能力，对命主有一定经济支持。'):'父星不显——父亲影响偏弱或父亲身体需关注。';
  var mq=yp?(yp+'——母亲能力强，在家中占主导地位。'):'母星不显——母亲影响不大。';
  var ss2=gs.map(function(g){return getShiShen(r,g)}),jc=ss2.filter(function(s){return s==='劫财'||s==='比肩'}).length;
  var xd=jc>=2?'有'+jc+'个兄弟或极亲近的朋友——朋友多，讲义气。':jc===1?'有一个兄弟或极亲近的朋友。':'兄弟姐妹少或无，命主较独立。';
  return{zs:zs,fq:fq,mq:mq,xd:xd};
}
function scDeep(r,pills,yz){
  var rw=GW[r],h='',sk='',w='',q='';
  if(rw==='木'){h='约170~175cm——中等身高，木性向上有挺拔感。';sk='偏白或黄白——不晒就白的类型。';w='清秀斯文，有书卷气。眉清目秀型。';q='文静稳重偏内敛，坐得住沉得下心——熟了才放得开。';}
  else if(rw==='火'){h='约172~177cm——火性炎上，能量充沛的外显。';sk='偏红润或小麦色——气色较好。';w='五官端正有神采——眼神明亮有光。';q='热情外向，感染力强——人群中容易被注意到。';}
  else if(rw==='土'){h='约168~173cm——土主敦厚，身高偏中等。';sk='肤色偏黄白。';w='面相敦厚老实——给人可靠踏实的第一印象。';q='稳重踏实型，不太会主动表现自己。';}
  else if(rw==='金'){h='约170~175cm——金主义，骨相端正。';sk='偏白，气色较好。';w='五官端正，轮廓分明——鼻子挺直。';q='刚正果断，不怒自威。';}
  else{h='约170~174cm——水主流动，身形偏修长。';sk='偏白偏细腻。';w='面相清秀，眼神灵动。';q='聪明灵活，善变通，人缘不错。';}
  if(rw==='木'&&ZW[yz.zhi]==='金')q+=' 外在文静但内心有主见。';
  return{h:h,s:sk,w:w,q:q};}
function xlDeep(pills,r,by){var gs=pills.map(function(p){return p.gan}),yc=gs.filter(function(g){return getShiShen(r,g).includes('印')}).length,ys=yc>=2;var gkY=by+18,gkG='甲乙丙丁戊己庚辛壬癸'[(gkY-4)%10],gkZ='子丑寅卯辰巳午未申酉戌亥'[(gkY-4)%12],gkSS=getShiShen(r,gkG),gkI='';if(gkSS.includes('印'))gkI=gkG+gkZ+'年——印星当旺，学业运较佳';else if(gkSS.includes('食')||gkSS.includes('伤'))gkI=gkG+gkZ+'年——有灵感但压力较大';else gkI=gkG+gkZ+'年';var jl=ys?'印星有力——本科以上，有机会读硕士。偏技术路线更合适。':yc>=1?'印星一般——大专到本科水平。社会经验能补足。':'印星偏弱——学历中等，但在实际工作中学习能力强。';return{jl:jl,gi:gkI,gy:gkY,limit:yc>=1?'':'学历偏弱对体制内求职有限制，建议走技术/实业路线。'};}
// ===== 排盘增强：十二长生、空亡、胎元命宫身宫 =====
// 十二长生表（日干对各支）
var ZS_TABLE={
甲:{亥:'长生',子:'沐浴',丑:'冠带',寅:'建禄',卯:'帝旺',辰:'衰',巳:'病',午:'死',未:'墓',申:'绝',酉:'胎',戌:'养'},
乙:{午:'长生',巳:'沐浴',辰:'冠带',卯:'建禄',寅:'帝旺',丑:'衰',子:'病',亥:'死',戌:'墓',酉:'绝',申:'胎',未:'养'},
丙:{寅:'长生',卯:'沐浴',辰:'冠带',巳:'建禄',午:'帝旺',未:'衰',申:'病',酉:'死',戌:'墓',亥:'绝',子:'胎',丑:'养'},
丁:{酉:'长生',申:'沐浴',未:'冠带',午:'建禄',巳:'帝旺',辰:'衰',卯:'病',寅:'死',丑:'墓',子:'绝',亥:'胎',戌:'养'},
戊:{寅:'长生',卯:'沐浴',辰:'冠带',巳:'建禄',午:'帝旺',未:'衰',申:'病',酉:'死',戌:'墓',亥:'绝',子:'胎',丑:'养'},
己:{酉:'长生',申:'沐浴',未:'冠带',午:'建禄',巳:'帝旺',辰:'衰',卯:'病',寅:'死',丑:'墓',子:'绝',亥:'胎',戌:'养'},
庚:{巳:'长生',午:'沐浴',未:'冠带',申:'建禄',酉:'帝旺',戌:'衰',亥:'病',子:'死',丑:'墓',寅:'绝',卯:'胎',辰:'养'},
辛:{子:'长生',亥:'沐浴',戌:'冠带',酉:'建禄',申:'帝旺',未:'衰',午:'病',巳:'死',辰:'墓',卯:'绝',寅:'胎',丑:'养'},
壬:{申:'长生',酉:'沐浴',戌:'冠带',亥:'建禄',子:'帝旺',丑:'衰',寅:'病',卯:'死',辰:'墓',巳:'绝',午:'胎',未:'养'},
癸:{卯:'长生',寅:'沐浴',丑:'冠带',子:'建禄',亥:'帝旺',戌:'衰',酉:'病',申:'死',未:'墓',午:'绝',巳:'胎',辰:'养'}};

function getZS(riGan,zhi){var z=ZS_TABLE[riGan]?.[zhi]||'';var s='';if(['长生','冠带','建禄','帝旺'].includes(z))s=' strong';else if(['死','墓','绝'].includes(z))s=' weak';return'<span class="zhangsheng'+s+'">'+z+'</span>';}

// 空亡计算（日柱所在旬空）
var XUN_KONG={甲子:'戌亥',甲戌:'申酉',甲申:'午未',甲午:'辰巳',甲辰:'寅卯',甲寅:'子丑',
  乙丑:'戌亥',乙亥:'申酉',乙酉:'午未',乙未:'辰巳',乙巳:'寅卯',乙卯:'子丑',
  丙子:'戌亥',丙戌:'申酉',丙申:'午未',丙午:'辰巳',丙辰:'寅卯',丙寅:'子丑',
  丁丑:'戌亥',丁亥:'申酉',丁酉:'午未',丁未:'辰巳',丁巳:'寅卯',丁卯:'子丑',
  戊寅:'戌亥',戊子:'戌亥',戊戌:'申酉',戊申:'午未',戊午:'辰巳',戊辰:'寅卯',
  己卯:'申酉',己丑:'戌亥',己亥:'申酉',己酉:'午未',己未:'辰巳',己巳:'寅卯',
  庚辰:'申酉',庚寅:'戌亥',庚子:'戌亥',庚戌:'申酉',庚申:'午未',庚午:'辰巳',
  辛巳:'午未',辛卯:'申酉',辛丑:'戌亥',辛亥:'申酉',辛酉:'午未',辛未:'辰巳',
  壬午:'午未',壬辰:'申酉',壬寅:'戌亥',壬子:'戌亥',壬戌:'申酉',壬申:'午未',
  癸未:'辰巳',癸巳:'午未',癸卯:'申酉',癸丑:'戌亥',癸亥:'申酉',癸酉:'午未'};

function getKongWang(riGZ){return XUN_KONG[riGZ]||'';}

// 胎元计算
function getTaiYuan(yGZ,mGZ){var yG=tianganIndex(yGZ[0]),yZ=dizhiIndex(yGZ[1]),mG=tianganIndex(mGZ[0]),mZ=dizhiIndex(mGZ[1]);var tG=(yG+mG+1)%10,tZ=(yZ+mZ+3)%12;return'甲乙丙丁戊己庚辛壬癸'[tG]+'子丑寅卯辰巳午未申酉戌亥'[tZ];}
function tianganIndex(g){return'甲乙丙丁戊己庚辛壬癸'.indexOf(g);}
function dizhiIndex(z){return'子丑寅卯辰巳午未申酉戌亥'.indexOf(z);}

// 命宫计算
function getMingGong(yZ,mZ,birthMonth){var yZi=dizhiIndex(yZ[1]),mZi=dizhiIndex(mZ[1]);var base=(birthMonth<=2?birthMonth+12:birthMonth);var mgNum=26-(base+1);if(mgNum>12)mgNum-=12;if(mgNum<1)mgNum+=12;return'甲乙丙丁戊己庚辛壬癸'[(yZi+mgNum-1)%10]+'子丑寅卯辰巳午未申酉戌亥'[(mgNum-1)%12];}

// 身宫计算
function getShenGong(yZ,mZ,birthMonth){var base=(birthMonth<=2?birthMonth+12:birthMonth);var sgNum=base+1;if(sgNum>12)sgNum-=12;return'甲乙丙丁戊己庚辛壬癸'[(dizhiIndex(yZ[1])+sgNum-1)%10]+'子丑寅卯辰巳午未申酉戌亥'[(sgNum-1)%12];}
function buildHtml(riGan,riZhi,pills,wc,du,gender,bt,ts,off,bp,by,bm){
  var g=gender===1?'男':'女',h='',bz=pills.map(function(p){return p.ganZhi}).join(' ');
  var gj=gjBase(pills,riGan),sq=sqBase(pills,riGan);
  var GJD=gjDeep(pills,riGan,gj),BYD=byDeep(pills,riGan,wc,GJD,sq);
  var JTD=jtDeep(pills,riGan),SCD=scDeep(riGan,pills,pills[1]),XLD=xlDeep(pills,riGan,by);
  var xg=xgBase(pills,riGan),zy=zyBase(pills,riGan),jk=jkBase(wc),hl=hlBase(pills,riGan,gender);
  var zn=znBase(pills,riGan,gender),dyd=dyBase(du),dsj=dsjBase(pills,riGan,du,by),ln=lnBase(du,new Date().getFullYear(),by);
  var kw=getKongWang(pills[2].ganZhi),riGZ=pills[2].ganZhi;
  var ty=getTaiYuan(pills[0].ganZhi,pills[1].ganZhi),mg=getMingGong(pills[0],pills[1],bm),sg=getShenGong(pills[0],pills[1],bm);
  var tyNaYin=ty?'':'',mgNaYin=mg?'':'',sgNaYin=sg?'':'';
  var wxK=['木','火','土','金','水'],wxT=Math.max(1,Object.values(wc).reduce(function(a,b){return a+b},0));
  h+='<p class="subtitle">'+bz+' · '+g+'命 · '+riGan+'日主<br>'+bt+' · '+ts+' 真太阳时 ('+(off>0?'+':'')+off+'分)<br>'+bp+'</p>';

  // 一、排盘
  h+='<div class="section-title">一、排盘</div><div class="bazi-card"><div class="bazi-header"><span class="title">基本命盘</span><span class="sex">'+g+'</span></div>';
  h+='<table class="bazi-table"><thead><tr>'+pills.map(function(p){return'<th>'+p.name+'</th>'}).join('')+'</tr></thead><tbody>';
  // 天干
  h+='<tr>'+pills.map(function(p){return'<td><span class="stem '+gCls(p.gan)+'">'+p.gan+'</span></td>'}).join('')+'</tr>';
  // 地支+十神标签
  h+='<tr>'+pills.map(function(p){return'<td><span class="branch '+zCls(p.zhi)+'">'+p.zhi+'</span><span class="ten-label">'+p.shiShenZhi.split('/')[0]+'</span></td>'}).join('')+'</tr>';
  // 十神
  h+='<tr>'+pills.map(function(p){return'<td><span class="shishen-tag '+(p.shiShen==='日主'?'ss-master':ssCls(p.gan))+'">'+p.shiShen+'</span></td>'}).join('')+'</tr>';
  h+='</tbody></table><div class="bazi-divider"></div><table class="bazi-table"><tbody>';
  // 藏干
  h+='<tr>'+pills.map(function(p){var cgs=(p.cangGan||[]).map(function(c){var ss=riGan?getShiShen(riGan,c):'';return'<span class="canggan-item"><span class="cg-dot dot-'+dtCls(c)+'"></span>'+c+(ss?'('+ss.charAt(0)+')':'')+'</span>';}).join('');return'<td><div class="canggan-group">'+cgs+'</div></td>';}).join('')+'</tr>';
  // 纳音
  h+='<tr>'+pills.map(function(p){return'<td><span class="nayin-tag">'+p.naYin+'</span></td>'}).join('')+'</tr>';
  // 十二长生
  h+='<tr>'+pills.map(function(p){return'<td>'+getZS(riGan,p.zhi)+'</td>'}).join('')+'</tr>';
  // 空亡
  if(kw){var kws=kw.split('');h+='<tr>'+pills.map(function(p){var isK=kws.includes(p.zhi);return'<td><span class="kongwang">'+(isK?kw:'—')+'</span></td>';}).join('')+'</tr>';}
  h+='</tbody></table>';
  // 大运（排盘卡片内）
  if(du.length&&!du[0].info){
    h+='<div style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(42,48,56,.4)"><div style="color:var(--gold-lt);font-size:.82em;margin-bottom:10px;text-align:center">大运（'+(gender===1?'阳':'阴')+(['甲','丙','戊','庚','壬'].includes(bz[0])?'男':'女')+(['甲','丙','戊','庚','壬'].includes(bz[0])===(gender===1)?'顺':'逆')+'排）</div>';
    h+='<div class="dayun-track">';
    for(var i=0;i<du.length;i++){var dy=du[i],ages=dy.ages.split('-'),y0=by+parseInt(ages[0]),y1=by+parseInt(ages[1]);h+='<div class="dayun-block'+(dy.cur?' current':'')+'"><span class="d-gan">'+dy.ganZhi+'</span><span class="d-year">'+y0+'~'+y1+'</span><span class="d-age" style="color:'+(dy.cur?'var(--gold)':'var(--dim)')+'">'+dy.ages+'岁</span></div>';}
    h+='</div></div>';
  }
  // 胎元命宫身宫
  if(ty&&mg&&sg){
    h+='<div class="bazi-footer"><span class="bf-tag">胎元：'+ty+'</span><span class="bf-tag">命宫：'+mg+'</span><span class="bf-tag">身宫：'+sg+'</span></div>';
  }
  h+='</div>';

  // 二、五行
  h+='<hr class="divider"><div class="section-title">二、五行力量分析</div><div class="card">';
  h+='<p style="color:var(--gold-lt);font-size:.95em;margin-bottom:12px">四柱五行统计（天干+地支）</p>';
  h+='<div style="display:flex;height:22px;border-radius:11px;overflow:hidden;background:#1a2027;margin-bottom:14px">';
  for(var i=0;i<wxK.length;i++){var c=wc[wxK[i]]||0;if(c>0)h+='<div style="width:'+Math.round(c/wxT*100)+'%;background:var(--'+WC[wxK[i]]+');display:flex;align-items:center;justify-content:center;font-size:.55em;color:#fff;font-weight:600">'+wxK[i]+c+'</div>';}h+='</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">';
  for(var i=0;i<wxK.length;i++){c=wc[wxK[i]]||0;h+='<div style="background:rgba(42,48,56,.4);border-radius:10px;padding:10px;text-align:center"><div style="font-size:.7em;color:var(--'+WC[wxK[i]]+');margin-bottom:2px">'+wxK[i]+'</div><div style="font-size:.85em;color:var(--gold-lt);font-weight:600">'+c+'</div></div>';}
  h+='<div style="background:rgba(200,169,110,.08);border:1px solid rgba(200,169,110,.2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:.7em;color:var(--gold);margin-bottom:2px">日主</div><div style="font-size:.85em;color:var(--gold-lt);font-weight:600">'+riGan+GW[riGan]+'</div></div></div>';
  var wcMax=Math.max.apply(null,Object.values(wc)),wcMin=Math.min.apply(null,Object.values(wc)),wcMaxWx=wxK.find(function(w){return wc[w]===wcMax}),wcMinWx=wxK.find(function(w){return wc[w]===wcMin});
  h+='<p style="padding:10px;background:rgba(200,169,110,.06);border-radius:8px;font-size:.82em;text-align:center"><strong style="color:#e88060">'+wcMaxWx+'占优势('+Math.round(wcMax/wxT*100)+'%)'+(wcMin===0?'，'+wcMinWx+'为0是最短缺':'')+'。</strong>'+(wcMin===0?'原局缺'+wcMinWx+'是最大短板——需大运流年补足。':'')+'</p></div>';

  // 三、格局(deep)
  h+='<hr class="divider"><div class="section-title">三、格局分析</div><div class="card">';
  h+='<p>'+st(GJD.gd)+'</p><p>月令'+pills[1].zhi+'（'+GJD.yl+'）当令。'+(GJD.ys?'用神取'+st(GJD.ys)+'，':'')+(GJD.xs?'喜'+GJD.xs:'')+(GJD.js?'，忌'+GJD.js:'')+'。</p>';
  if(GJD.ft.length){h+='<ul>';for(var i=0;i<GJD.ft.length;i++)h+='<li>'+GJD.ft[i]+'</li>';h+='</ul>';}
  if(GJD.detail)h+='<p style="margin-top:8px">'+GJD.detail+'</p>';
  h+='<p style="font-size:1em;color:#e88060;font-weight:700;margin-top:8px">结论：'+GJD.gd+(GJD.ys?'，以'+GJD.ys+'为用神。':'。')+'</p></div>';

  // 四、身强身弱
  h+='<hr class="divider"><div class="section-title">四、身强身弱</div><div class="card"><p>日主'+riGan+'（'+GW[riGan]+'）得分'+sq.score+'，判定为'+st(sq.level)+'。'+sq.desc+'</p></div>';

  // 五、病药(deep)
  h+='<hr class="divider"><div class="section-title">五、病药分析</div><div class="card"><div class="bing-yao">';
  h+='<div class="bing-box"><h4>病（'+BYD.bs.length+'个）</h4>';
  for(var i=0;i<BYD.bs.length;i++)h+='<div class="bing-item">'+(i+1)+'. '+st(BYD.bs[i].d)+' — '+BYD.bs[i].t+'</div>';
  h+='</div><div class="yao-box"><h4>药（'+BYD.ys.length+'个）</h4>';
  for(var i=0;i<BYD.ys.length;i++)h+='<div class="yao-item">'+(i+1)+'. '+st(BYD.ys[i].d)+' — '+BYD.ys[i].t+'</div>';
  h+='</div></div></div>';

  // 六、家庭(deep)
  h+='<hr class="divider"><div class="section-title">六、家庭情况</div><div class="card">';
  h+='<p>'+st('祖上（年柱）：')+'</p><p>'+JTD.zs+'</p>';
  h+='<p style="margin-top:14px">'+st('父母：')+'</p><ul><li><strong>父星（财）：</strong>'+JTD.fq+'</li><li><strong>母星（印）：</strong>'+JTD.mq+'</li></ul>';
  h+='<p style="margin-top:14px">'+st('兄弟姐妹：')+'</p><p>'+JTD.xd+'</p></div>';

  // 七、身材长相(deep)
  h+='<hr class="divider"><div class="section-title">七、身材长相</div><div class="card"><ul>';
  h+='<li><strong>身高：</strong>'+SCD.h+'</li><li><strong>肤色：</strong>'+SCD.s+'</li>';
  h+='<li><strong>五官：</strong>'+SCD.w+'</li><li><strong>气质/体型：</strong>'+SCD.q+'</li></ul></div>';

  // 八、性格
  h+='<hr class="divider"><div class="section-title">八、性格</div><div class="card"><p>日主'+GW[riGan]+'——';
  for(var i=0;i<Math.min(xg.traits.length,6);i++)h+='<span class="tag tag-'+WC[GW[riGan]]+'">'+xg.traits[i]+'</span> ';
  h+='</p><p style="font-size:.95em;color:var(--gold-lt);margin-top:8px">'+st('一句话：')+xg.summary+'</p></div>';

  // 九、学历(deep)
  h+='<hr class="divider"><div class="section-title">九、学历</div><div class="card"><p>'+XLD.jl+'</p>';
  if(XLD.limit)h+='<p>'+XLD.limit+'</p>';
  if(XLD.gi)h+='<p style="margin-top:8px"><strong>高考：</strong>'+hi(XLD.gy+'年')+'（实岁18岁）。'+XLD.gi+'</p></div>';

  // 十、职业
  h+='<hr class="divider"><div class="section-title">十、职业</div><div class="card"><p style="font-size:1em;color:#e88060;font-weight:700">最佳方向：'+zy.d+'</p><p>'+zy.t+'</p></div>';

  // 十一、健康
  h+='<hr class="divider"><div class="section-title">十一、健康</div><div class="card"><ul>';
  for(var i=0;i<jk.length;i++)h+='<li>'+jk[i]+'</li>';h+='</ul></div>';

  // 十二、婚恋
  h+='<hr class="divider"><div class="section-title">十二、婚恋</div><div class="card"><p>'+hl.analysis+'</p></div>';

  // 十三、子女
  h+='<hr class="divider"><div class="section-title">十三、子女</div><div class="card"><p>'+zn.touTai+'，'+zn.count+'</p></div>';

  // 十四、大运走势
  h+='<hr class="divider"><div class="section-title">十四、大运走势</div><div class="card">';
  for(var i=0;i<dyd.length;i++){var d=dyd[i];h+='<p style="'+(d.cur?'color:#e88060;font-size:.95em;font-weight:700;':'')+'margin-top:10px">'+d.ganZhi+'运（'+d.ages+'岁）'+(d.cur?' ◄ 当前':'')+'</p><p>'+d.desc+'</p>';}
  h+='</div>';

  // 十五、重大事件
  h+='<hr class="divider"><div class="section-title">十五、重大事件年份</div><div class="card"><div class="table-wrap"><table>';
  h+='<tr><th>年份</th><th>年龄</th><th>事件</th><th>命理依据</th></tr>';
  for(var i=0;i<dsj.length;i++){var e=dsj[i];h+='<tr><td><strong>'+e.year+'</strong></td><td>'+e.age+'岁</td><td>'+e.event+'</td><td style="text-align:left;font-size:.82em">'+e.reason+'</td></tr>';}
  h+='</table></div></div>';

  // 十六、流年+综合
  h+='<hr class="divider"><div class="section-title">十六、当前流年总论</div><div class="card"><p>'+ln.desc+'</p></div>';
  h+='<hr class="divider"><div class="section-title">综合建议</div><div class="card">';
  h+='<p>此命'+GJD.gd+'，'+sq.level+'。'+(GJD.ys?'以'+st(GJD.ys)+'为用神，':'')+'大运走势需关注用神当旺之运。</p>';
  h+='<p style="font-size:.85em;color:var(--dim);margin-top:10px">以上分析基于子平法规则引擎自动生成，仅供参考。</p></div>';
  return h;
}

app.post('/api/bazi',(req,res)=>{try{var y=req.body.year,m=req.body.month,d=req.body.day,h=req.body.hour||0,mi=req.body.minute||0,lng=req.body.longitude||120,gender=req.body.gender,sy=y,sm=m,sd=d;if(req.body.isLunar){try{var ld=Lunar.fromYmd(y,m,d),s2=ld.getSolar();sy=s2.getYear();sm=s2.getMonth();sd=s2.getDay();}catch(e){}}var ts=calcTS(sy,sm,sd,h,mi,lng),solar=Solar.fromYmdHms(ts.year,ts.month,ts.day,ts.hour,ts.minute,0),lunar=Lunar.fromSolar(solar),bz=lunar.getEightChar(),riGan=bz.getDayGan();var p=[{name:'年柱',ganZhi:bz.getYear(),gan:bz.getYearGan(),zhi:bz.getYearZhi(),shiShen:getShiShen(riGan,bz.getYearGan()),naYin:bz.getYearNaYin(),cangGan:bz.getYearHideGan(),shiShenZhi:bz.getYearShiShenZhi().join('/')},{name:'月柱',ganZhi:bz.getMonth(),gan:bz.getMonthGan(),zhi:bz.getMonthZhi(),shiShen:getShiShen(riGan,bz.getMonthGan()),naYin:bz.getMonthNaYin(),cangGan:bz.getMonthHideGan(),shiShenZhi:bz.getMonthShiShenZhi().join('/')},{name:'日柱',ganZhi:bz.getDay(),gan:bz.getDayGan(),zhi:bz.getDayZhi(),shiShen:'日主',naYin:bz.getDayNaYin(),cangGan:bz.getDayHideGan(),shiShenZhi:bz.getDayShiShenZhi().join('/')},{name:'时柱',ganZhi:bz.getTime(),gan:bz.getTimeGan(),zhi:bz.getTimeZhi(),shiShen:getShiShen(riGan,bz.getTimeGan()),naYin:bz.getTimeNaYin(),cangGan:bz.getTimeHideGan(),shiShenZhi:bz.getTimeShiShenZhi().join('/')}];var wc={木:0,火:0,土:0,金:0,水:0},wm={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水',寅:'木',卯:'木',巳:'火',午:'火',申:'金',酉:'金',亥:'水',子:'水',辰:'土',戌:'土',丑:'土',未:'土'};for(var i=0;i<p.length;i++){wc[wm[p[i].gan]||'']++;wc[wm[p[i].zhi]||'']++;}var du=[];try{var yun=bz.getYun(gender);if(yun){var sy2=Math.round(yun.getStartYear());for(var i=0;i<8;i++){var dy=yun.getDaYun(i);if(dy){var age=sy2+i*10;du.push({i:i+1,ganZhi:dy.getGanZhi(),startAge:age,ages:age+'-'+(age+9),cur:(age<=30&&age+9>=30)});}}}}catch(e){}res.json({gender:gender===1?'男':'女',beijingTime:y+'年'+m+'月'+d+'日 '+String(h).padStart(2,'0')+':'+String(mi).padStart(2,'0'),trueSolar:ts.year+'年'+ts.month+'月'+ts.day+'日 '+String(ts.hour).padStart(2,'0')+':'+String(ts.minute).padStart(2,'0'),solarOffset:ts.off,bazi:p.map(function(pp){return pp.ganZhi}).join(' '),riGan:riGan,riZhi:bz.getDayZhi(),pills:p,dayun:du,wuxingCount:wc});}catch(e){res.status(500).json({error:e.message});}});

app.post('/api/analyze',(req,res)=>{try{var y=req.body.year,m=req.body.month,d=req.body.day,h=req.body.hour||0,mi=req.body.minute||0,lng=req.body.longitude||120,gender=req.body.gender||1,sy=y,sm=m,sd=d;if(req.body.isLunar){try{var ld=Lunar.fromYmd(y,m,d),s2=ld.getSolar();sy=s2.getYear();sm=s2.getMonth();sd=s2.getDay();}catch(e){}}var ts=calcTS(sy,sm,sd,h,mi,lng),solar=Solar.fromYmdHms(ts.year,ts.month,ts.day,ts.hour,ts.minute,0),lunar=Lunar.fromSolar(solar),bz=lunar.getEightChar(),riGan=bz.getDayGan(),riZhi=bz.getDayZhi();var p=[{name:'年柱',ganZhi:bz.getYear(),gan:bz.getYearGan(),zhi:bz.getYearZhi(),shiShen:getShiShen(riGan,bz.getYearGan()),naYin:bz.getYearNaYin(),cangGan:bz.getYearHideGan(),shiShenZhi:bz.getYearShiShenZhi().join('/')},{name:'月柱',ganZhi:bz.getMonth(),gan:bz.getMonthGan(),zhi:bz.getMonthZhi(),shiShen:getShiShen(riGan,bz.getMonthGan()),naYin:bz.getMonthNaYin(),cangGan:bz.getMonthHideGan(),shiShenZhi:bz.getMonthShiShenZhi().join('/')},{name:'日柱',ganZhi:bz.getDay(),gan:bz.getDayGan(),zhi:bz.getDayZhi(),shiShen:'日主',naYin:bz.getDayNaYin(),cangGan:bz.getDayHideGan(),shiShenZhi:bz.getDayShiShenZhi().join('/')},{name:'时柱',ganZhi:bz.getTime(),gan:bz.getTimeGan(),zhi:bz.getTimeZhi(),shiShen:getShiShen(riGan,bz.getTimeGan()),naYin:bz.getTimeNaYin(),cangGan:bz.getTimeHideGan(),shiShenZhi:bz.getTimeShiShenZhi().join('/')}];var wc={木:0,火:0,土:0,金:0,水:0},wm={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水',寅:'木',卯:'木',巳:'火',午:'火',申:'金',酉:'金',亥:'水',子:'水',辰:'土',戌:'土',丑:'土',未:'土'};for(var i=0;i<p.length;i++){wc[wm[p[i].gan]||'']++;wc[wm[p[i].zhi]||'']++;}var du=[];try{var yun=bz.getYun(gender);if(yun){var sy2=Math.round(yun.getStartYear());for(var i=0;i<8;i++){var dy=yun.getDaYun(i);if(dy){var age=sy2+i*10;du.push({i:i+1,ganZhi:dy.getGanZhi(),startAge:age,ages:age+'-'+(age+9),cur:(age<=30&&age+9>=30)});}}}}catch(e){}var bt=y+'年'+m+'月'+d+'日 '+String(h).padStart(2,'0')+':'+String(mi).padStart(2,'0'),tss=ts.year+'年'+ts.month+'月'+ts.day+'日 '+String(ts.hour).padStart(2,'0')+':'+String(ts.minute).padStart(2,'0'),html=buildHtml(riGan,riZhi,p,wc,du,gender,bt,tss,ts.off,req.body.birthplace||'',y,m);res.json({html:html});}catch(e){res.status(500).json({error:e.message});}});

app.get('/',(req,res)=>res.sendFile(join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log('八字排盘服务启动: '+PORT));
