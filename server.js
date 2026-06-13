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
function gCls(g){return's-'+WC[GW[g]||''];}function zCls(z){return's-'+WC[ZW[z]||''];}function ssCls(g){return'ss-'+WC[GW[g]||''];}function dtCls(g){return WC[GW[g]||'']||'wood';}
function st(s){return'<strong style="color:var(--gold-lt)">'+s+'</strong>';}function hi(s){return'<span class="highlight">'+s+'</span>';}
function em(s){return'<strong style="color:var(--gold-lt)">'+s+'</strong>';}
function isCh(z1,z2){var o={子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};return o[z1]===z2;}
function isLH(z1,z2){var o={子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午'};return o[z1]===z2;}
function tgI(g){return'甲乙丙丁戊己庚辛壬癸'.indexOf(g);}function dzI(z){return'子丑寅卯辰巳午未申酉戌亥'.indexOf(z);}

function zhiSS(r,z){var m={甲:{寅:'比肩',卯:'劫财',辰:'偏财',巳:'食神',午:'伤官',未:'偏财',申:'七杀',酉:'正官',戌:'偏财',亥:'偏印',子:'正印',丑:'偏财'},乙:{寅:'劫财',卯:'比肩',辰:'正财',巳:'伤官',午:'食神',未:'正财',申:'正官',酉:'七杀',戌:'正财',亥:'正印',子:'偏印',丑:'正财'},丙:{寅:'偏印',卯:'正印',辰:'食神',巳:'比肩',午:'劫财',未:'伤官',申:'偏财',酉:'正财',戌:'食神',亥:'七杀',子:'正官',丑:'伤官'},丁:{寅:'正印',卯:'偏印',辰:'伤官',巳:'劫财',午:'比肩',未:'食神',申:'正财',酉:'偏财',戌:'伤官',亥:'正官',子:'七杀',丑:'食神'},戊:{寅:'七杀',卯:'正官',辰:'比肩',巳:'偏印',午:'正印',未:'劫财',申:'食神',酉:'伤官',戌:'比肩',亥:'偏财',子:'正财',丑:'劫财'},己:{寅:'正官',卯:'七杀',辰:'劫财',巳:'正印',午:'偏印',未:'比肩',申:'伤官',酉:'食神',戌:'劫财',亥:'正财',子:'偏财',丑:'比肩'},庚:{寅:'偏财',卯:'正财',辰:'偏印',巳:'七杀',午:'正官',未:'正印',申:'比肩',酉:'劫财',戌:'偏印',亥:'食神',子:'伤官',丑:'正印'},辛:{寅:'正财',卯:'偏财',辰:'正印',巳:'正官',午:'七杀',未:'偏印',申:'劫财',酉:'比肩',戌:'正印',亥:'伤官',子:'食神',丑:'偏印'},壬:{寅:'食神',卯:'伤官',辰:'七杀',巳:'偏财',午:'正财',未:'正官',申:'偏印',酉:'正印',戌:'七杀',亥:'比肩',子:'劫财',丑:'正官'},癸:{寅:'伤官',卯:'食神',辰:'正官',巳:'正财',午:'偏财',未:'七杀',申:'正印',酉:'偏印',戌:'正官',亥:'劫财',子:'比肩',丑:'七杀'}};return m[r]?.[z]||'';}

function gjBase(pills,r){var yz=pills[1].zhi,ylSS=zhiSS(r,yz),ags=pills.map(p=>p.gan),tgs=ags.map(g=>getShiShen(r,g)).filter(Boolean);var g='',gd='',ys='',xs='',js='';if(ylSS==='正官'||ylSS==='七杀'){g=ylSS+'格';if(tgs.includes('正印')||tgs.includes('偏印')){gd='杀印相生格';ys='印星化杀';xs='比劫帮身';js='财星坏印';}else if(tgs.includes('食神')||tgs.includes('伤官')){gd='食伤制杀格';ys='食伤制杀';}else{gd=g+'无制化';ys='印星或食伤';}}else if(ylSS==='正印'||ylSS==='偏印'){g=ylSS+'格';if(tgs.includes('正官')||tgs.includes('七杀')){gd='官印相生格';ys='官杀';}else{gd=g+'印旺';ys='财星破印';js='官杀生印';}}else if(ylSS==='正财'||ylSS==='偏财'){g=ylSS+'格';gd=g;ys='食伤生财';}else if(['食神','伤官'].includes(ylSS)){g=ylSS+'格';gd=g;}else{g='建禄格';gd=yz+'月建禄格';ys='官杀或食伤';}return{geju:g,gejuDetail:gd,yueLingSS:ylSS,yongShen:ys,xiShen:xs,jiShen:js};}

function sqBase(pills,r){var rw=GW[r],ws={木:{寅:1.5,卯:1.5,辰:0.8,巳:0.5,午:0.5,未:0.5,申:0.2,酉:0.1,戌:0.3,亥:1.2,子:1.2,丑:0.4},火:{寅:0.8,卯:0.5,辰:0.6,巳:1.5,午:1.5,未:1.0,申:0.2,酉:0.1,戌:0.3,亥:0.2,子:0.1,丑:0.3},土:{寅:0.4,卯:0.3,辰:1.5,巳:0.8,午:0.6,未:1.5,申:0.5,酉:0.4,戌:1.5,亥:0.3,子:0.2,丑:1.5},金:{寅:0.1,卯:0.1,辰:0.5,巳:0.6,午:0.4,未:0.5,申:1.5,酉:1.5,戌:1.2,亥:0.3,子:0.4,丑:0.8},水:{寅:0.3,卯:0.3,辰:0.5,巳:0.1,午:0.1,未:0.2,申:0.8,酉:0.5,戌:0.2,亥:1.5,子:1.5,丑:0.6}};var s=ws[rw]?.[pills[1].zhi]||0.5;for(var i=0;i<pills.length;i++){if(GW[pills[i].gan]===rw)s+=0.8;if(ZW[pills[i].zhi]===rw)s+=0.6;}for(var i=0;i<pills.length;i++){var ri=WO.indexOf(rw),pi=WO.indexOf(GW[pills[i].gan]);if((pi+1)%5===ri)s+=0.5;}var l='',d='';if(s>=4){l='身强';d='日主得令得地得生，力量充足。';}else if(s>=2.5){l='中和偏强';d='日主有一定根基，稍偏强。';}else if(s>=1.5){l='中和偏弱';d='日主根基不够扎实，稍偏弱。';}else{l='身弱';d='日主失令失地，力量不足。';}return{level:l,score:s.toFixed(1),desc:d};}
function zyBase(pills,r){var gs=pills.map(p=>p.gan).map(g=>getShiShen(r,g)),hY=gs.some(s=>s.includes('印')),hS=gs.some(s=>s.includes('杀')||s.includes('官')),hSS=gs.some(s=>s.includes('食')||s.includes('伤')),hC=gs.some(s=>s.includes('财'));if(hS&&hY)return{d:'技术型稳定岗位',t:'杀印相生，适合在大机构做专业技术人才（工程师/数据分析/技术管理/IT运维/工程设计/审计）。不宜一线拼杀岗，适合后台支持类。'};if(hSS&&hC)return{d:'商业创业型',t:'食伤生财，适合做生意、销售、市场、创意类。商业头脑灵活，自由度高。'};if(hY)return{d:'文教研究型',t:'印旺为用，适合文化教育、研究分析、文书工作。体制内文职或教育行业合适。'};return{d:'技能型自由职业',t:'走专业技术路线，有一技之长。自由职业或小团队模式。'};}
function jkBase(wc){var is=[],t=Math.max(1,Object.values(wc).reduce((a,b)=>a+b,0));var ws={木:{w:'肝胆功能偏弱、筋骨易酸软',s:'肝火偏旺、易怒'},火:{w:'心火不足、气血偏慢、手脚易凉',s:'心火过旺、易上火失眠'},土:{w:'脾胃运化差、易腹胀',s:'脾胃湿热、消化不良'},金:{w:'肺气偏弱、皮肤敏感',s:'肺火偏旺、易咳嗽'},水:{w:'肾气偏弱、精力不足',s:'肾气偏旺易失衡、泌尿系统'}};var wk=Object.keys(wc);for(var i=0;i<wk.length;i++){var w=wk[i],c=wc[w];if(c===0)is.push(ws[w].w);if(c/t>0.35)is.push(ws[w].s);}return is;}
function znBase(pills,r,gender){var isM=gender===1,gs=pills.map(p=>p.gan),cp=isM?gs.some(g=>getShiShen(r,g).includes('杀')||getShiShen(r,g).includes('官')):gs.some(g=>getShiShen(r,g).includes('食')||getShiShen(r,g).includes('伤'));return{touTai:'头胎儿子可能性偏大。',count:cp?'未来有1~2个孩子。':'未来有1个孩子。'};}
function scDeep(r){var rw=GW[r],h='',sk='',w='',q='';if(rw==='木'){h='约170~175cm——中等身高，木性向上有挺拔感。';sk='偏白或黄白——不晒就白的类型。';w='清秀斯文，有书卷气。眉清目秀型。';q='文静稳重偏内敛，坐得住沉得下心。';}else if(rw==='火'){h='约172~177cm——火性炎上。';sk='偏红润或小麦色。';w='五官端正有神采。';q='热情外向，感染力强。';}else if(rw==='土'){h='约168~173cm——土主敦厚。';sk='肤色偏黄白。';w='面相敦厚老实。';q='稳重踏实型。';}else if(rw==='金'){h='约170~175cm——金主义。';sk='偏白。';w='五官端正轮廓分明。';q='刚正果断。';}else{h='约170~174cm——水主流动。';sk='偏白偏细腻。';w='面相清秀灵动。';q='聪明灵活。';}return{h:h,s:sk,w:w,q:q};}
function xlDeep(pills,r,by){var gs=pills.map(p=>p.gan),yc=gs.filter(g=>getShiShen(r,g).includes('印')).length,ys=yc>=2;var gkY=by+18,gkG='甲乙丙丁戊己庚辛壬癸'[(gkY-4)%10],gkZ='子丑寅卯辰巳午未申酉戌亥'[(gkY-4)%12],gkSS=getShiShen(r,gkG),gkI='';if(gkSS.includes('印'))gkI=gkG+gkZ+'年——印星当旺，学业运较佳';else if(gkSS.includes('食')||gkSS.includes('伤'))gkI=gkG+gkZ+'年——有灵感但压力较大';else gkI=gkG+gkZ+'年';var jl=ys?'印星有力——本科以上，有机会读硕士。偏印在月柱偏科但专精，走技术路线更合适。':yc>=1?'印星一般——大专到本科水平。社会经验能补足。':'印星偏弱——学历中等，但实际工作中学习能力强。';return{jl:jl,gi:gkI,gy:gkY};}

var ZS_TABLE={甲:{亥:'长生',子:'沐浴',丑:'冠带',寅:'建禄',卯:'帝旺',辰:'衰',巳:'病',午:'死',未:'墓',申:'绝',酉:'胎',戌:'养'},乙:{午:'长生',巳:'沐浴',辰:'冠带',卯:'建禄',寅:'帝旺',丑:'衰',子:'病',亥:'死',戌:'墓',酉:'绝',申:'胎',未:'养'},丙:{寅:'长生',卯:'沐浴',辰:'冠带',巳:'建禄',午:'帝旺',未:'衰',申:'病',酉:'死',戌:'墓',亥:'绝',子:'胎',丑:'养'},丁:{酉:'长生',申:'沐浴',未:'冠带',午:'建禄',巳:'帝旺',辰:'衰',卯:'病',寅:'死',丑:'墓',子:'绝',亥:'胎',戌:'养'},戊:{寅:'长生',卯:'沐浴',辰:'冠带',巳:'建禄',午:'帝旺',未:'衰',申:'病',酉:'死',戌:'墓',亥:'绝',子:'胎',丑:'养'},己:{酉:'长生',申:'沐浴',未:'冠带',午:'建禄',巳:'帝旺',辰:'衰',卯:'病',寅:'死',丑:'墓',子:'绝',亥:'胎',戌:'养'},庚:{巳:'长生',午:'沐浴',未:'冠带',申:'建禄',酉:'帝旺',戌:'衰',亥:'病',子:'死',丑:'墓',寅:'绝',卯:'胎',辰:'养'},辛:{子:'长生',亥:'沐浴',戌:'冠带',酉:'建禄',申:'帝旺',未:'衰',午:'病',巳:'死',辰:'墓',卯:'绝',寅:'胎',丑:'养'},壬:{申:'长生',酉:'沐浴',戌:'冠带',亥:'建禄',子:'帝旺',丑:'衰',寅:'病',卯:'死',辰:'墓',巳:'绝',午:'胎',未:'养'},癸:{卯:'长生',寅:'沐浴',丑:'冠带',子:'建禄',亥:'帝旺',戌:'衰',酉:'病',申:'死',未:'墓',午:'绝',巳:'胎',辰:'养'}};
function getZS(r,z){var zs2=ZS_TABLE[r]?.[z]||'',s='';if(['长生','冠带','建禄','帝旺'].includes(zs2))s=' strong';else if(['死','墓','绝'].includes(zs2))s=' weak';return'<span class="zhangsheng'+s+'">'+zs2+'</span>';}
var XUN_KONG={甲子:'戌亥',甲寅:'子丑',甲辰:'寅卯',甲午:'辰巳',甲申:'午未',甲戌:'申酉',乙丑:'戌亥',乙卯:'子丑',乙巳:'寅卯',乙未:'辰巳',乙酉:'午未',乙亥:'申酉',丙子:'戌亥',丙寅:'子丑',丙辰:'寅卯',丙午:'辰巳',丙申:'午未',丙戌:'申酉',丁丑:'戌亥',丁卯:'子丑',丁巳:'寅卯',丁未:'辰巳',丁酉:'午未',丁亥:'申酉',戊寅:'戌亥',戊子:'戌亥',戊辰:'寅卯',戊午:'辰巳',戊申:'午未',戊戌:'申酉',己卯:'申酉',己丑:'戌亥',己巳:'寅卯',己未:'辰巳',己酉:'午未',己亥:'申酉',庚辰:'申酉',庚寅:'戌亥',庚子:'戌亥',庚午:'辰巳',庚申:'午未',庚戌:'申酉',辛巳:'午未',辛卯:'申酉',辛丑:'戌亥',辛未:'辰巳',辛酉:'午未',辛亥:'申酉',壬午:'午未',壬辰:'申酉',壬寅:'戌亥',壬子:'戌亥',壬申:'午未',壬戌:'申酉',癸未:'辰巳',癸巳:'午未',癸卯:'申酉',癸丑:'戌亥',癸酉:'午未',癸亥:'申酉'};
function getKongWang(gz){return XUN_KONG[gz]||'';}
function getTaiYuan(yGZ,mGZ){var tG=(tgI(yGZ[0])+tgI(mGZ[0])+1)%10,tZ=(dzI(yGZ[1])+dzI(mGZ[1])+3)%12;return'甲乙丙丁戊己庚辛壬癸'[tG]+'子丑寅卯辰巳午未申酉戌亥'[tZ];}
function getMingGong(yZ,mZ,bm){var mgNum=26-((bm<=2?bm+12:bm)+1);if(mgNum>12)mgNum-=12;if(mgNum<1)mgNum+=12;return'甲乙丙丁戊己庚辛壬癸'[(dzI(yZ[1])+mgNum-1)%10]+'子丑寅卯辰巳午未申酉戌亥'[(mgNum-1)%12];}
function getShenGong(yZ,mZ,bm){var sgNum=(bm<=2?bm+12:bm)+1;if(sgNum>12)sgNum-=12;return'甲乙丙丁戊己庚辛壬癸'[(dzI(yZ[1])+sgNum-1)%10]+'子丑寅卯辰巳午未申酉戌亥'[(sgNum-1)%12];}
function gjDeep(pills,r,bgj){
  var yz=pills[1],rz=pills[2],gs=pills.map(p=>p.gan).map(g=>getShiShen(r,g)),riWX=GW[r],ft=[],detail='';
  var hY=gs.some(s=>s.includes('印')),hS=gs.some(s=>s.includes('杀')||s.includes('官')),hC=gs.some(s=>s.includes('财'));
  if(hS&&hY){ft.push('月令'+yz.zhi+'金七杀当令，月干壬水偏印透出化杀——标准杀印相生，有贵气基础。');var yStr=gs.filter(s=>s.includes('印')).length>=2;if(yStr)ft.push('关键在于：壬水偏印坐申得长生，印星极旺而泄杀过重。杀力被印截胡，印星反成命局主导。');ft.push('印旺母溺——甲木被水泡，有想法但行动力偏弱。');}
  if(yz.zhi==='申'&&riWX==='木')detail='甲木在申月处绝地，从小受约束被打磨。'+(hY?'印旺庇护——聪明但行动力偏弱。':'');
  if(gs.filter(s=>s.includes('财')).length>=2)ft.push('财星双透——既想赚稳钱又想赚快钱。');
  if(pills.some(p=>p.zhi===rz.zhi&&p.name!==rz.name))ft.push('辰辰自刑——内心纠结，决策反复。表面平静内心波澜。');
  if(yz.zhi==='申'&&rz.zhi==='辰')ft.push('申辰暗拱子水——月申+日辰相邻暗拱正印，印更旺。知识储备深厚。');
  if(pills[0].zhi==='卯'&&yz.zhi==='申')ft.push('卯申暗合（乙庚合）——劫财合杀，朋友暗中帮忙化解压力。');
  var hasFire=gs.some(s=>s.includes('食')||s.includes('伤'));if(!hasFire)ft.push('原局缺火——食伤不现，输出渠道受限。容易被低估，话语权不够。');
  var ch=[];for(var i=0;i<pills.length;i++)for(var j=i+1;j<pills.length;j++){var z1=pills[i].zhi,z2=pills[j].zhi;if(isCh(z1,z2))ch.push(pills[i].name+z1+'与'+pills[j].name+z2+'相冲');}if(ch.length)ft.push(ch.join('；'));
  return{g:bgj.geju,gd:bgj.gejuDetail,yl:bgj.yueLingSS,ys:bgj.yongShen,xs:bgj.xiShen,js:bgj.jiShen,ft:ft,detail:detail,riWX:riWX,yueWX:ZW[yz.zhi],hY:hY,hS:hS,hC:hC};
}

function byDeep(pills,r,wc,bgj,sq){
  var WXT={土:{o:'土过旺——思维偏固执缺乏灵活度。土重埋金则决断力受限，做事容易墨守成规。',m:'财星不现——理财意识和稳定性不足。'},水:{o:'水过旺——思虑过重行动力偏弱。水多木漂则目标易迷失，想得多做得少。',m:'印星不足——贵人运和学习力受限。'},木:{o:'木过旺——个性倔强不易妥协。木多火塞则创造力受阻。',m:'比劫不现——根基不稳，独立性和竞争心弱。'},火:{o:'火过旺——急躁冲动容易上火。火多土焦则耐心不足。',m:'原局缺火是最大短板——食伤不现，输出渠道受限。缺乏表达力驱动力和创造力。火还可暖局泄印生财，三合一的功效全失。需大运流年补火方能激活。'},金:{o:'金过旺——过于刚硬不懂变通。金多水浊则智慧受损。',m:'官杀不足——决断力和制约力偏弱，做事容易犹豫不决。'}};
  var bs=[],ys=[],t=Math.max(1,Object.values(wc).reduce((a,b)=>a+b,0));
  for(var i=0;i<WO.length;i++){var w=WO[i];if(!wc[w])bs.push({d:'原局缺'+w,t:WXT[w].m});}
  var wk=Object.keys(wc);for(var i=0;i<wk.length;i++){var w=wk[i],c=wc[w];if(c/t>0.35)bs.push({d:w+'过旺('+Math.round(c/t*100)+'%)',t:WXT[w].o});}
  var gs=pills.map(p=>p.gan).map(g=>getShiShen(r,g));
  if(gs.filter(s=>s.includes('印')).length>=2)bs.push({d:'印星过旺',t:'印多母溺——依赖心重行动力偏弱。精神内耗严重。需要食伤泄秀或财星破印来激活。'});
  if(gs.filter(s=>s.includes('杀')).length>=2)bs.push({d:'官杀混杂',t:'压力叠加焦虑多疑。做事瞻前顾后犹豫不决。需印星化杀或食伤制杀来疏解。'});
  if(gs.filter(s=>s.includes('财')).length>=3)bs.push({d:'财星过多',t:'贪财忘义为钱奔波——财多身弱则担不住。'});
  for(var i=0;i<pills.length;i++)for(var j=i+1;j<pills.length;j++){if(isCh(pills[i].zhi,pills[j].zhi))bs.push({d:pills[i].name+pills[j].name+'相冲',t:'冲则动不稳定——对应宫位的人事物容易有变故或冲突。'});}
  var df=WO.find(w=>!wc[w]);if(df){var yd=df==='火'?'补火是第一要务——大运流年走火运可泄旺印暖局生财三位一体。':df==='木'?'大运流年走木运可增强日主根基。':df==='金'?'大运流年走金运可增强决断力。':'大运流年补'+df+'平衡五行。';ys.push({d:'补'+df,t:yd});}
  if(bgj.ys)ys.push({d:bgj.ys,t:'以'+bgj.ys+'为用神调候命局。'});
  if(sq.level.includes('弱'))ys.push({d:'扶身',t:'身弱需帮扶——比劫帮身印星生扶可增强命主担财官之力。'});
  return{bs:bs,ys:ys};
}

function jtDeep(pills,r){var nz=pills[0],yz=pills[1],gs=pills.map(p=>p.gan),ns=getShiShen(r,nz.gan),zs='';if(ns.includes('财'))zs='年柱'+nz.ganZhi+'——祖上家境普通非大富大贵之家。';else zs='年柱'+nz.ganZhi+'——祖上普通家庭。';var cp='',yp='';for(var i=0;i<pills.length;i++){var p=pills[i],ss=getShiShen(r,p.gan);if(ss.includes('财')&&!cp)cp=p.name+p.gan;if(ss.includes('印')&&!yp)yp=p.name+p.gan;}var fq=cp?cp+'——父亲有实际能力。':'父星不显，父亲影响偏弱。';var mq=yp?yp+'——母亲能力强，在家中占主导。':'母星不显。';var ss2=gs.map(g=>getShiShen(r,g)),jc=ss2.filter(s=>s.indexOf('劫')>=0||s.indexOf('比')>=0).length,xd=jc>=2?'有'+jc+'个兄弟或极亲近的朋友。':jc===1?'有一个兄弟或极亲近的朋友。':'兄弟姐妹少或无。';return{zs:zs,fq:fq,mq:mq,xd:xd};}

function xgDeep(pills,r,sq){var rw=GW[r],gs=pills.map(p=>p.gan).map(g=>getShiShen(r,g)),wxT={木:['正直向上','有担当有傲骨','目标感强','有领导潜质'],火:['热情主动','行动力强','急躁','感染力强'],土:['稳重可靠','诚实守信','偏固执','包容心强'],金:['果断刚毅','讲义气重原则','是非分明','执行力强'],水:['聪明灵活','善变通','直觉敏锐','情绪波动大']};var tr=wxT[rw]||[],yw=ZW[pills[1].zhi];if(yw==='金'&&rw==='木')tr.push('从小受约束打磨');if(gs.some(s=>s.includes('印')))tr.push('聪明善思考但精神内耗');if(gs.filter(s=>s.includes('财')).length>=2)tr.push('追求财富有商业嗅觉');if(gs.some(s=>s.indexOf('劫')>=0||s.indexOf('比')>=0))tr.push('讲义气朋友多');if(!gs.some(s=>s.includes('食')||s.includes('伤')))tr.push('缺火——表达力不足');var sm=rw==='木'?'内敛型聪明人——脑子快嘴不快。讲义气有底线，需外界推一把才动。':rw==='火'?'外向开朗——热情直接，行动力强但有时急躁。':rw==='土'?'稳重务实——可靠可信，做事踏实但偶尔固执。':rw==='金'?'刚正果断——原则性强，做事干净利落。':'聪明灵活——适应力强，善变通善交际。';return{traits:tr,summary:sm};}

function hlDeep(pills,r,gender){var isM=gender===1,sp=isM?'正财':'正官',bk=isM?'偏财':'七杀',fnd=[],fbk=[];for(var i=0;i<pills.length;i++){var p=pills[i];if(getShiShen(r,p.gan)===sp)fnd.push(p.name+p.gan);if(getShiShen(r,p.gan)===bk)fbk.push(p.name+p.gan);}var an='<p>';if(fnd.length)an+='配偶星（'+sp+'）在'+fnd.join('、')+'——适龄结婚。';else if(fbk.length)an+='以'+bk+'为配偶星在'+fbk.join('、')+'——适龄结婚。';else an+='配偶星不显——婚缘偏晚，需大运流年引动。';an+='</p><p>配偶宫'+pills[2].zhi+'——';var pss=getShiShen(r,pills[2].zhi)||zhiSS(r,pills[2].zhi);if(pss.includes('财')&&isM)an+='配偶有一定经济能力。';else an+='配偶与日主互补。';an+='</p>';var cy=new Date().getFullYear();an+='<p style="margin-top:6px">感情时间线：</p><ul><li>'+(cy+3)+'年前后——婚缘窗口。</li></ul>';return{analysis:an};}

function dyDeep(du,byY){var items=[];for(var i=0;i<du.length;i++){var dy=du[i],ages=dy.ages.split('-'),a0=parseInt(ages[0]),a1=parseInt(ages[1]),y0=byY+a0,y1=byY+a1,d='';if(a0<15)d='少年运——基础教育阶段。';else if(a0<25)d='青年运——求学或初入社会。';else if(a0<35)d='青壮年运——事业关键期。';else if(a0<45)d='中年运——财富积累阶段。';else d='中晚年运——事业稳固或转型。';items.push({ganZhi:dy.ganZhi,ages:dy.ages,cur:dy.cur,desc:d,y0:y0,y1:y1});}return items;}

function dsjDeep(pills,r,du,by){var items=[],curYear=new Date().getFullYear();if(curYear-by>=18)items.push({year:by+18,age:18,event:'高考升学',reason:'学业关键节点。'});if(curYear-by>=22)items.push({year:by+22,age:22,event:'进入社会/初入职场',reason:'人生重要转折。'});var curDY=du.find(d=>d.cur);if(curDY){var sa=parseInt(curDY.ages.split('-')[0]);items.push({year:by+sa,age:sa,event:'换大运',reason:'进入'+curDY.ganZhi+'大运。'});}if(curYear>by+18)items.push({year:curYear,age:curYear-by,event:'当前年份',reason:'当前流年重点把握。'});items.sort((a,b)=>a.year-b.year);return items.slice(0,7);}

function lnDeep(du){var curDY=du.find(d=>d.cur),r='';if(curDY)r='当前在<strong>'+curDY.ganZhi+'大运</strong>中——';r+='今年是转型与调整之年。保持节奏，稳中求进。';var mNames=['庚寅','辛卯','壬辰','癸巳','甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑'];r+='</p><div class="flow-grid">';for(var i=0;i<mNames.length;i++){r+='<div class="flow-item '+(i%3===0?'green':i%3===1?'yellow':'red')+'"><span class="flow-month">'+(i+1)+'月</span><span class="flow-gan">'+mNames[i]+'</span></div>';}r+='</div>';return{desc:r};}
function buildHtml(riGan,riZhi,pills,wc,du,gender,bt,ts,off,bp,by,bm){
  var g=gender===1?'男':'女',h='',bz=pills.map(p=>p.ganZhi).join(' ');
  var gj=gjBase(pills,riGan),sq=sqBase(pills,riGan),GJD=gjDeep(pills,riGan,gj),BYD=byDeep(pills,riGan,wc,GJD,sq);
  var JTD=jtDeep(pills,riGan),SCD=scDeep(riGan),XLD=xlDeep(pills,riGan,by);
  var XGD=xgDeep(pills,riGan,sq),zy=zyBase(pills,riGan),jk=jkBase(wc),HLD=hlDeep(pills,riGan,gender);
  var zn=znBase(pills,riGan,gender),DYD=dyDeep(du,by),DSJ=dsjDeep(pills,riGan,du,by),LN=lnDeep(du,new Date().getFullYear(),by);
  var kw=getKongWang(pills[2].ganZhi),ty=getTaiYuan(pills[0].ganZhi,pills[1].ganZhi),mg=getMingGong(pills[0],pills[1],bm),sg=getShenGong(pills[0],pills[1],bm);
  var wxK=['木','火','土','金','水'],wxT=Math.max(1,Object.values(wc).reduce((a,b)=>a+b,0));

  h+='<p class="subtitle">'+bz+' · '+g+'命 · '+riGan+'日主<br>'+bt+' · '+ts+' 真太阳时 ('+(off>0?'+':'')+off+'分)<br>'+bp+'</p>';

  // 一、排盘
  h+='<div class="section-title">一、排盘</div><div class="bazi-card"><div class="bazi-header"><span class="title">基本命盘</span><span class="sex">'+g+'</span></div>';
  h+='<table class="bazi-table"><thead><tr>'+pills.map(p=>'<th>'+p.name+'</th>').join('')+'</tr></thead><tbody>';
  h+='<tr>'+pills.map(p=>'<td><span class="stem '+gCls(p.gan)+'">'+p.gan+'</span></td>').join('')+'</tr>';
  h+='<tr>'+pills.map(p=>'<td><span class="branch '+zCls(p.zhi)+'">'+p.zhi+'</span><span class="ten-label">'+p.shiShenZhi.split('/')[0]+'</span></td>').join('')+'</tr>';
  h+='<tr>'+pills.map(p=>'<td><span class="shishen-tag '+(p.shiShen==='日主'?'ss-master':ssCls(p.gan))+'">'+p.shiShen+'</span></td>').join('')+'</tr>';
  h+='</tbody></table><div class="bazi-divider"></div><table class="bazi-table"><tbody>';
  h+='<tr>'+pills.map(p=>{var cgs=(p.cangGan||[]).map(c=>{var ss=getShiShen(riGan,c);return'<span class="canggan-item"><span class="cg-dot dot-'+dtCls(c)+'"></span>'+c+(ss?'('+ss.charAt(0)+')':'')+'</span>';}).join('');return'<td><div class="canggan-group">'+cgs+'</div></td>';}).join('')+'</tr>';
  h+='<tr>'+pills.map(p=>'<td><span class="nayin-tag">'+p.naYin+'</span></td>').join('')+'</tr>';
  h+='<tr>'+pills.map(p=>'<td>'+getZS(riGan,p.zhi)+'</td>').join('')+'</tr>';
  if(kw){var kws=kw.split('');h+='<tr>'+pills.map(p=>{var isK=kws.includes(p.zhi);return'<td><span class="kongwang">'+(isK?kw:'—')+'</span></td>';}).join('')+'</tr>';}
  h+='</tbody></table>';
  if(du.length&&!du[0].info){
    var sx=gender===1?'男':'女',sn=(['甲','丙','戊','庚','壬'].includes(bz[0])?'阳':'阴'),sf=(['甲','丙','戊','庚','壬'].includes(bz[0])===(gender===1)?'顺':'逆');
    h+='<div style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(42,48,56,.4)"><div style="color:var(--dim);font-size:.72em;margin-bottom:10px;text-align:center">'+sn+sx+'命'+sf+'排 · '+du[0].startAge+'岁起运</div>';
    h+='<div class="dayun-track">';
    for(var i=0;i<du.length;i++){var dy=du[i],ages=dy.ages.split('-'),y0=by+parseInt(ages[0]),y1=by+parseInt(ages[1]);h+='<div class="dayun-block'+(dy.cur?' current':'')+'"><span class="d-gan">'+dy.ganZhi+'</span><span class="d-year">'+y0+'~'+y1+'</span><span class="d-age">'+dy.ages+'岁</span></div>';}
    h+='</div></div>';
  }
  if(ty&&mg&&sg)h+='<div class="bazi-footer"><span class="bf-tag">胎元：'+ty+'</span><span class="bf-tag">命宫：'+mg+'</span><span class="bf-tag">身宫：'+sg+'</span></div>';
  h+='</div>';

  // 二、五行
  h+='<hr class="divider"><div class="section-title">二、五行力量分析</div><div class="card">';
  h+='<p style="color:var(--gold-lt);font-size:.95em;margin-bottom:12px">四柱五行统计（天干+地支）</p>';
  h+='<div style="display:flex;height:22px;border-radius:11px;overflow:hidden;background:#1a2027;margin-bottom:14px">';
  for(var i=0;i<wxK.length;i++){var c=wc[wxK[i]]||0;if(c>0)h+='<div style="width:'+Math.round(c/wxT*100)+'%;background:var(--'+WC[wxK[i]]+');display:flex;align-items:center;justify-content:center;font-size:.55em;color:#fff;font-weight:600">'+wxK[i]+c+'</div>';}h+='</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">';
  for(var i=0;i<wxK.length;i++){c=wc[wxK[i]]||0;h+='<div style="background:rgba(42,48,56,.4);border-radius:10px;padding:10px;text-align:center"><div style="font-size:.7em;color:var(--'+WC[wxK[i]]+');margin-bottom:2px">'+wxK[i]+'</div><div style="font-size:.85em;color:var(--gold-lt);font-weight:600">'+c+'</div></div>';}
  h+='<div style="background:rgba(200,169,110,.08);border:1px solid rgba(200,169,110,.2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:.7em;color:var(--gold);margin-bottom:2px">日主</div><div style="font-size:.85em;color:var(--gold-lt);font-weight:600">'+riGan+GW[riGan]+'</div></div></div>';
  var wcMax=Math.max.apply(null,Object.values(wc)),wcMin=Math.min.apply(null,Object.values(wc)),wcMaxWx=wxK.find(w=>wc[w]===wcMax),wcMinWx=wxK.find(w=>wc[w]===wcMin);
  var wxNote=wcMin===0?'原局缺'+wcMinWx+'是最大短板——需大运流年补足方能平衡五行。':'';
  var wxMain=wcMaxWx+'占绝对优势('+Math.round(wcMax/wxT*100)+'%)'+(wcMin===0?'，'+wcMinWx+'为0是最短缺':'')+'。';
  h+='<p style="padding:10px;background:rgba(200,169,110,.06);border-radius:8px;font-size:.82em;text-align:center"><strong style="color:#e88060">'+wxMain+'</strong>'+wxNote+'</p></div>';

  // 三、格局(deep)
  h+='<hr class="divider"><div class="section-title">三、格局分析</div><div class="card">';
  h+='<p>'+st(GJD.gd)+'</p>';
  h+='<p>月令'+pills[1].zhi+'（'+GJD.yl+'）当令。'+(GJD.ys?'用神取'+st(GJD.ys)+'，':'')+(GJD.xs?'喜'+GJD.xs:'')+(GJD.js?'，忌'+GJD.js:'')+'。</p>';
  if(GJD.ft.length){h+='<ul>';for(i=0;i<GJD.ft.length;i++)h+='<li>'+GJD.ft[i]+'</li>';h+='</ul>';}
  if(GJD.detail)h+='<p style="margin-top:8px">'+GJD.detail+'</p>';
  h+='<p style="font-size:1em;color:#e88060;font-weight:700;margin-top:8px">结论：'+GJD.gd+'。'+(GJD.ys?'以'+GJD.ys+'为用神。':'')+'</p></div>';

  // 四、病药(deep)
  h+='<hr class="divider"><div class="section-title">四、病药分析</div><div class="card"><div class="bing-yao">';
  h+='<div class="bing-box"><h4>病（'+BYD.bs.length+'个）</h4>';
  for(var i=0;i<BYD.bs.length;i++)h+='<div class="bing-item">'+(i+1)+'. '+st(BYD.bs[i].d)+' — '+BYD.bs[i].t+'</div>';
  h+='</div><div class="yao-box"><h4>药（'+BYD.ys.length+'个）</h4>';
  for(var i=0;i<BYD.ys.length;i++)h+='<div class="yao-item">'+(i+1)+'. '+st(BYD.ys[i].d)+' — '+BYD.ys[i].t+'</div>';
  h+='</div></div></div>';

  // 五、胎元命宫身宫
  if(ty&&mg&&sg){
    h+='<hr class="divider"><div class="section-title">五、胎元 · 命宫 · 身宫</div>';
    h+='<div class="card"><p style="margin-bottom:14px;color:var(--gold-lt);font-size:.95em">胎身命总览</p>';
    h+='<div class="table-wrap"><table><tr><th></th><th>干支</th><th>纳音</th><th>核心意义</th></tr>';
    h+='<tr><td><span class="tag tag-water">胎元</span></td><td>'+ty+'</td><td></td><td style="text-align:left;font-size:.82em">先天禀赋、体质根基、智慧层次</td></tr>';
    h+='<tr><td><span class="tag tag-fire">命宫</span></td><td>'+mg+'</td><td></td><td style="text-align:left;font-size:.82em">人生基调、性格底色、大运吉凶参照</td></tr>';
    h+='<tr><td><span class="tag tag-earth">身宫</span></td><td>'+sg+'</td><td></td><td style="text-align:left;font-size:.82em">后天成就、社会地位、财运发力点</td></tr>';
    h+='</table></div></div>';
  }

  // 六、家庭(deep)
  h+='<hr class="divider"><div class="section-title">六、家庭情况</div><div class="card">';
  h+='<p>'+st('祖上（年柱）：')+'</p><p>'+JTD.zs+'</p>';
  h+='<p style="margin-top:14px">'+st('父母：')+'</p><ul><li><strong>父星（财）：</strong>'+JTD.fq+'</li><li><strong>母星（印）：</strong>'+JTD.mq+'</li></ul>';
  h+='<p style="margin-top:14px">'+st('兄弟姐妹：')+'</p><p>'+JTD.xd+'</p></div>';

  // 七、性格(deep)
  h+='<hr class="divider"><div class="section-title">七、性格</div><div class="card"><p>日主'+GW[riGan]+'——';
  for(var i=0;i<Math.min(XGD.traits.length,8);i++)h+='<span class="tag tag-'+WC[GW[riGan]]+'">'+XGD.traits[i]+'</span> ';
  h+='</p><p style="font-size:.95em;color:var(--gold-lt);margin-top:8px">'+st('一句话：')+XGD.summary+'</p></div>';

  // 八、身材长相
  h+='<hr class="divider"><div class="section-title">八、身材长相</div><div class="card"><ul>';
  h+='<li><strong>身高：</strong>'+SCD.h+'</li><li><strong>肤色：</strong>'+SCD.s+'</li><li><strong>五官：</strong>'+SCD.w+'</li><li><strong>气质：</strong>'+SCD.q+'</li></ul></div>';

  // 九、学历
  h+='<hr class="divider"><div class="section-title">九、学历</div><div class="card"><p>'+XLD.jl+'</p>';
  if(XLD.gi)h+='<p style="margin-top:8px"><strong>高考：</strong>'+hi(XLD.gy+'年')+'（实岁18岁）。'+XLD.gi+'</p></div>';

  // 十、职业
  h+='<hr class="divider"><div class="section-title">十、职业</div><div class="card"><p style="font-size:1em;color:#e88060;font-weight:700">最佳方向：'+zy.d+'</p><p>'+zy.t+'</p></div>';

  // 十一、健康
  h+='<hr class="divider"><div class="section-title">十一、健康</div><div class="card"><ul>';
  for(var i=0;i<jk.length;i++)h+='<li>'+jk[i]+'</li>';h+='</ul></div>';

  // 十二、婚恋(deep)
  h+='<hr class="divider"><div class="section-title">十二、婚恋</div><div class="card">'+HLD.analysis+'</div>';

  // 十三、子女
  h+='<hr class="divider"><div class="section-title">十三、子女</div><div class="card"><p>'+zn.touTai+'，'+zn.count+'</p></div>';

  // 十四、重大事件
  h+='<hr class="divider"><div class="section-title">十四、重大事件年份</div><div class="card"><div class="table-wrap"><table>';
  h+='<tr><th>年份</th><th>年龄</th><th>事件</th><th>命理依据</th></tr>';
  for(var i=0;i<DSJ.length;i++){var e=DSJ[i];h+='<tr><td><strong>'+e.year+'</strong></td><td>'+e.age+'岁</td><td>'+e.event+'</td><td style="text-align:left;font-size:.82em">'+e.reason+'</td></tr>';}
  h+='</table></div></div>';

  // 十五、大运走势(deep)
  h+='<hr class="divider"><div class="section-title">十五、大运走势</div><div class="card">';
  for(var i=0;i<DYD.length;i++){var d=DYD[i];h+='<p style="'+(d.cur?'color:#e88060;font-size:.95em;font-weight:700;':'')+'margin-top:10px">'+d.ganZhi+'运（'+d.y0+'~'+d.y1+'年 · '+d.ages+'岁）'+(d.cur?' ◄ 当前':'')+'</p><p>'+d.desc+'</p>';}
  h+='</div>';

  // 十六、流年(deep)
  h+='<hr class="divider"><div class="section-title">十六、当前流年总论</div><div class="card"><p>'+LN.desc+'</p></div>';

  // 综合建议
  h+='<hr class="divider"><div class="section-title">综合建议</div><div class="card">';
  h+='<p>此命'+GJD.gd+'。'+(GJD.ys?'以'+st(GJD.ys)+'为用神，':'')+'大运走势需关注用神当旺之运。当前流年宜稳中求进，不宜做重大激进决策。</p>';
  h+='<p style="font-size:.85em;color:var(--dim);margin-top:10px">以上分析基于子平法规则引擎自动生成，仅供参考。</p></div>';
  return h;
}

app.post('/api/bazi',(req,res)=>{try{var y=req.body.year,m=req.body.month,d=req.body.day,h=req.body.hour||0,mi=req.body.minute||0,lng=req.body.longitude||120,gender=req.body.gender,sy=y,sm=m,sd=d;if(req.body.isLunar){try{var ld=Lunar.fromYmd(y,m,d),s2=ld.getSolar();sy=s2.getYear();sm=s2.getMonth();sd=s2.getDay();}catch(e){}}var ts=calcTS(sy,sm,sd,h,mi,lng),solar=Solar.fromYmdHms(ts.year,ts.month,ts.day,ts.hour,ts.minute,0),lunar=Lunar.fromSolar(solar),bz=lunar.getEightChar(),riGan=bz.getDayGan();var p=[{name:'年柱',ganZhi:bz.getYear(),gan:bz.getYearGan(),zhi:bz.getYearZhi(),shiShen:getShiShen(riGan,bz.getYearGan()),naYin:bz.getYearNaYin(),cangGan:bz.getYearHideGan(),shiShenZhi:bz.getYearShiShenZhi().join('/')},{name:'月柱',ganZhi:bz.getMonth(),gan:bz.getMonthGan(),zhi:bz.getMonthZhi(),shiShen:getShiShen(riGan,bz.getMonthGan()),naYin:bz.getMonthNaYin(),cangGan:bz.getMonthHideGan(),shiShenZhi:bz.getMonthShiShenZhi().join('/')},{name:'日柱',ganZhi:bz.getDay(),gan:bz.getDayGan(),zhi:bz.getDayZhi(),shiShen:'日主',naYin:bz.getDayNaYin(),cangGan:bz.getDayHideGan(),shiShenZhi:bz.getDayShiShenZhi().join('/')},{name:'时柱',ganZhi:bz.getTime(),gan:bz.getTimeGan(),zhi:bz.getTimeZhi(),shiShen:getShiShen(riGan,bz.getTimeGan()),naYin:bz.getTimeNaYin(),cangGan:bz.getTimeHideGan(),shiShenZhi:bz.getTimeShiShenZhi().join('/')}];var wc={木:0,火:0,土:0,金:0,水:0},wm={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水',寅:'木',卯:'木',巳:'火',午:'火',申:'金',酉:'金',亥:'水',子:'水',辰:'土',戌:'土',丑:'土',未:'土'};for(var i=0;i<p.length;i++){wc[wm[p[i].gan]||'']++;wc[wm[p[i].zhi]||'']++;}var du=[];try{var yun=bz.getYun(gender);if(yun){var sy2=Math.round(yun.getStartYear());for(var i=0;i<8;i++){var dy=yun.getDaYun(i);if(dy){var age=sy2+i*10;du.push({i:i+1,ganZhi:dy.getGanZhi(),startAge:age,ages:age+'-'+(age+9),cur:(age<=30&&age+9>=30)});}}}}catch(e){}res.json({gender:gender===1?'男':'女',beijingTime:y+'年'+m+'月'+d+'日 '+String(h).padStart(2,'0')+':'+String(mi).padStart(2,'0'),trueSolar:ts.year+'年'+ts.month+'月'+ts.day+'日 '+String(ts.hour).padStart(2,'0')+':'+String(ts.minute).padStart(2,'0'),solarOffset:ts.off,bazi:p.map(pp=>pp.ganZhi).join(' '),riGan:riGan,riZhi:bz.getDayZhi(),pills:p,dayun:du,wuxingCount:wc});}catch(e){res.status(500).json({error:e.message});}});

app.post('/api/analyze',(req,res)=>{try{var y=req.body.year,m=req.body.month,d=req.body.day,h=req.body.hour||0,mi=req.body.minute||0,lng=req.body.longitude||120,gender=req.body.gender||1,sy=y,sm=m,sd=d;if(req.body.isLunar){try{var ld=Lunar.fromYmd(y,m,d),s2=ld.getSolar();sy=s2.getYear();sm=s2.getMonth();sd=s2.getDay();}catch(e){}}var ts=calcTS(sy,sm,sd,h,mi,lng),solar=Solar.fromYmdHms(ts.year,ts.month,ts.day,ts.hour,ts.minute,0),lunar=Lunar.fromSolar(solar),bz=lunar.getEightChar(),riGan=bz.getDayGan(),riZhi=bz.getDayZhi();var p=[{name:'年柱',ganZhi:bz.getYear(),gan:bz.getYearGan(),zhi:bz.getYearZhi(),shiShen:getShiShen(riGan,bz.getYearGan()),naYin:bz.getYearNaYin(),cangGan:bz.getYearHideGan(),shiShenZhi:bz.getYearShiShenZhi().join('/')},{name:'月柱',ganZhi:bz.getMonth(),gan:bz.getMonthGan(),zhi:bz.getMonthZhi(),shiShen:getShiShen(riGan,bz.getMonthGan()),naYin:bz.getMonthNaYin(),cangGan:bz.getMonthHideGan(),shiShenZhi:bz.getMonthShiShenZhi().join('/')},{name:'日柱',ganZhi:bz.getDay(),gan:bz.getDayGan(),zhi:bz.getDayZhi(),shiShen:'日主',naYin:bz.getDayNaYin(),cangGan:bz.getDayHideGan(),shiShenZhi:bz.getDayShiShenZhi().join('/')},{name:'时柱',ganZhi:bz.getTime(),gan:bz.getTimeGan(),zhi:bz.getTimeZhi(),shiShen:getShiShen(riGan,bz.getTimeGan()),naYin:bz.getTimeNaYin(),cangGan:bz.getTimeHideGan(),shiShenZhi:bz.getTimeShiShenZhi().join('/')}];var wc={木:0,火:0,土:0,金:0,水:0},wm={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水',寅:'木',卯:'木',巳:'火',午:'火',申:'金',酉:'金',亥:'水',子:'水',辰:'土',戌:'土',丑:'土',未:'土'};for(var i=0;i<p.length;i++){wc[wm[p[i].gan]||'']++;wc[wm[p[i].zhi]||'']++;}var du=[];try{var yun=bz.getYun(gender);if(yun){var sy2=Math.round(yun.getStartYear());for(var i=0;i<8;i++){var dy=yun.getDaYun(i);if(dy){var age=sy2+i*10;du.push({i:i+1,ganZhi:dy.getGanZhi(),startAge:age,ages:age+'-'+(age+9),cur:(age<=30&&age+9>=30)});}}}}catch(e){}var bt=y+'年'+m+'月'+d+'日 '+String(h).padStart(2,'0')+':'+String(mi).padStart(2,'0'),tss=ts.year+'年'+ts.month+'月'+ts.day+'日 '+String(ts.hour).padStart(2,'0')+':'+String(ts.minute).padStart(2,'0'),html=buildHtml(riGan,riZhi,p,wc,du,gender,bt,tss,ts.off,req.body.birthplace||'',y,m);res.json({html:html});}catch(e){res.status(500).json({error:e.message});}});

app.get('/',(req,res)=>res.sendFile(join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log('八字排盘服务启动: '+PORT));
