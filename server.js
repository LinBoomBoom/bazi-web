import express from 'express';
import { Solar, Lunar } from 'lunar-typescript';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname=dirname(fileURLToPath(import.meta.url)),app=express(),PORT=process.env.PORT||3000;
app.use(express.json());app.use(express.static(join(__dirname,'public')));

function getShiShen(r,g){const m={'甲':{甲:'比肩',乙:'劫财',丙:'食神',丁:'伤官',戊:'偏财',己:'正财',庚:'七杀',辛:'正官',壬:'偏印',癸:'正印'},'乙':{甲:'劫财',乙:'比肩',丙:'伤官',丁:'食神',戊:'正财',己:'偏财',庚:'正官',辛:'七杀',壬:'正印',癸:'偏印'},'丙':{甲:'偏印',乙:'正印',丙:'比肩',丁:'劫财',戊:'食神',己:'伤官',庚:'偏财',辛:'正财',壬:'七杀',癸:'正官'},'丁':{甲:'正印',乙:'偏印',丙:'劫财',丁:'比肩',戊:'伤官',己:'食神',庚:'正财',辛:'偏财',壬:'正官',癸:'七杀'},'戊':{甲:'七杀',乙:'正官',丙:'偏印',丁:'正印',戊:'比肩',己:'劫财',庚:'食神',辛:'伤官',壬:'偏财',癸:'正财'},'己':{甲:'正官',乙:'七杀',丙:'正印',丁:'偏印',戊:'劫财',己:'比肩',庚:'伤官',辛:'食神',壬:'正财',癸:'偏财'},'庚':{甲:'偏财',乙:'正财',丙:'七杀',丁:'正官',戊:'偏印',己:'正印',庚:'比肩',辛:'劫财',壬:'食神',癸:'伤官'},'辛':{甲:'正财',乙:'偏财',丙:'正官',丁:'七杀',戊:'正印',己:'偏印',庚:'劫财',辛:'比肩',壬:'伤官',癸:'食神'},'壬':{甲:'食神',乙:'伤官',丙:'偏财',丁:'正财',戊:'七杀',己:'正官',庚:'偏印',辛:'正印',壬:'比肩',癸:'劫财'},'癸':{甲:'伤官',乙:'食神',丙:'正财',丁:'偏财',戊:'正官',己:'七杀',庚:'正印',辛:'偏印',壬:'劫财',癸:'比肩'}};return m[r]?.[g]||'';}
function eot(m,d){const D=[0,31,59,90,120,151,181,212,243,273,304,334][m-1]+d,B=(360/365)*(D-81)*Math.PI/180;return 9.87*Math.sin(2*B)-7.53*Math.cos(B)-1.5*Math.sin(B);}
function calcTS(y,m,d,h,mi,lng){let t=h*60+mi-480+eot(m,d)+(lng-120)*4+480,ay=y,am=m,ad=d;while(t<0){t+=1440;ad--;if(ad<1){am--;if(am<1){am=12;ay--}ad=new Date(ay,am,0).getDate()}}while(t>=1440){t-=1440;ad++;if(ad>new Date(ay,am,0).getDate()){ad=1;am++;if(am>12){am=1;ay++}}}return{year:ay,month:am,day:ad,hour:Math.floor(t/60),minute:Math.floor(t%60),off:Math.round((lng-120)*4+eot(m,d))};}
const GW={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'},ZW={寅:'木',卯:'木',巳:'火',午:'火',申:'金',酉:'金',亥:'水',子:'水',辰:'土',戌:'土',丑:'土',未:'土'},WO=['木','火','土','金','水'],WC={'木':'green','火':'red','土':'orange','金':'gray','水':'blue'};
function gCls(g){return's-'+WC[GW[g]||''];}function zCls(z){return's-'+WC[ZW[z]||''];}function ssCls(g){return'ss-'+WC[GW[g]||''];}function dtCls(g){return WC[GW[g]||'']||'wood';}function em(s){return'<em>'+s+'</em>';}function st(s){return'<strong style="color:var(--gold-lt)">'+s+'</strong>';}
function isCh(z1,z2){var o={子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};return o[z1]===z2;}
function isLH(z1,z2){var o={子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午'};return o[z1]===z2;}

// ====== 深层规则引擎 ======
function gjDeep(pills,r,bgj){
  var y=pills[1],rz=pills[2],gs=pills.map(function(p){return p.gan}).map(function(g){return getShiShen(r,g)});
  var hY=gs.some(function(s){return s.includes('印')}),hS=gs.some(function(s){return s.includes('杀')||s.includes('官')}),hC=gs.some(function(s){return s.includes('财')});
  var ft=[];
  if(hS&&hY){ft.push('月令'+y.zhi+'为'+bgj.yueLingSS+'当令，'+y.gan+GW[y.gan]+'透出化杀——标准'+bgj.gejuDetail);if(gs.filter(function(s){return s.includes('印')}).length>=2)ft.push('印星过旺而泄杀过重，杀力被印截胡，印星反成命局主导');if(pills.some(function(p){return p.zhi===rz.zhi&&p.name!==rz.name}))ft.push(rz.zhi+rz.zhi+'自刑——内心纠结，决策反复');}
  if(hC&&gs.filter(function(s){return s.includes('财')}).length>=2)ft.push('财星双透——既想赚稳钱又想赚快钱');
  var rw=GW[r],yw=ZW[y.zhi];if(yw==='金'&&rw==='木')ft.push('日主在月令处绝地，从小受约束'+(hY?'但有印星庇护':''));
  var ch=[];for(var i=0;i<pills.length;i++)for(var j=i+1;j<pills.length;j++){var z1=pills[i].zhi,z2=pills[j].zhi;if(isCh(z1,z2))ch.push(pills[i].name+z1+'与'+pills[j].name+z2+'相冲');if(isLH(z1,z2)&&(pills[i].name+' '+pills[j].name!==pills[0].name+' '+pills[3].name))ch.push('卯申暗合劫财合杀——朋友帮忙化解压力');}
  if(ch.length)ft.push(ch.join('；'));
  return{g:bgj.geju,gd:bgj.gejuDetail,yl:bgj.yueLingSS,ys:bgj.yongShen,xs:bgj.xiShen,js:bgj.jiShen,ft:ft};
}
function byDeep(pills,r,wc,bgj){
  var bs=[],ys=[],t=Math.max(1,Object.values(wc).reduce(function(a,b){return a+b},0));
  var gs=pills.map(function(p){return p.gan}).map(function(g){return getShiShen(r,g)});
  for(var i=0;i<WO.length;i++){var w=WO[i];if(!wc[w])bs.push({d:'原局缺'+w,t:w==='火'?'食伤不现，输出渠道受限，缺乏表达力和驱动力':w==='金'?'官杀不足，决断力和制约力偏弱':w==='木'?'比劫不现，根基不稳':w==='水'?'印星不足，贵人运受限':'财星不现'});}
  var wk=Object.keys(wc);for(var i=0;i<wk.length;i++){var w=wk[i],c=wc[w];if(c/t>0.35)bs.push({d:w+'过旺('+Math.round(c/t*100)+'%)',t:w==='土'?'思维偏固执、缺乏灵活度':w==='水'?'思虑过重、行动力偏弱':w==='木'?'个性倔强、不易妥协':w==='火'?'急躁冲动、容易上火':'过于刚硬、不懂变通'});}
  if(gs.filter(function(s){return s.includes('印')}).length>=2)bs.push({d:'印星过旺',t:'印多母溺——依赖心重，想得多做得少。甲木被水泡——有想法但行动力偏弱。精神内耗，容易畏缩不前。'});
  if(gs.filter(function(s){return s.includes('杀')}).length>=2)bs.push({d:'官杀混杂',t:'压力叠加，焦虑多疑。做事瞻前顾后，缺乏果断。'});
  if(gs.filter(function(s){return s.includes('财')}).length>=3)bs.push({d:'财星过多',t:'贪财忘义，为钱奔波。财多身弱则担不住，反而为财所累。'});
  var df=WO.find(function(w){return !wc[w]});
  if(df)ys.push({d:'补'+df,t:df==='火'?'大运流年走火运可泄旺印、暖局、生财三位一体':df==='木'?'大运流年走木运增强日主根基':df==='金'?'大运流年走金运增强决断力和制约力':'大运流年补'+df});
  if(bgj.ys)ys.push({d:bgj.ys,t:'以'+bgj.ys+'为用神调候命局'});
  return{bs:bs,ys:ys};
}
function jtDeep(pills,r){
  var nz=pills[0],gs=pills.map(function(p){return p.gan});
  var ns=getShiShen(r,nz.gan),zs='';if(ns.includes('财'))zs='年柱'+nz.ganZhi+'——祖上家境普通，非大富大贵之家。';else if(ns.includes('印'))zs='年柱'+nz.ganZhi+'——祖上有些文化底蕴或受人尊敬。';else if(ns.includes('杀'))zs='年柱'+nz.ganZhi+'——祖辈较严厉或家庭规矩多。';else zs='年柱'+nz.ganZhi+'——祖上普通家庭。';
  var cp='',yp='';for(var i=0;i<pills.length;i++){var p=pills[i],ss=getShiShen(r,p.gan);if(ss.includes('财')&&!cp)cp=p.name+p.gan;if(ss.includes('印')&&!yp)yp=p.name+p.gan;}
  var fq=cp?cp+'——父亲有实际能力，对命主有一定经济支持。':'父星不显，父亲影响偏弱或父亲身体需注意。';
  var mq=yp?yp+'——母亲能力强，在家占主导地位。':'母星不显，母亲影响不大。';
  var ss=gs.map(function(g){return getShiShen(r,g)}),jc=ss.filter(function(s){return s==='劫财'||s==='比肩'}).length;
  var xd=jc>=2?'有'+jc+'个兄弟或极亲近的朋友——朋友多，讲义气。':jc===1?'有一个兄弟或极亲近的朋友。':'兄弟姐妹少或无，命主较独立。';
  return{zs:zs,fq:fq,mq:mq,xd:xd};
}
function scDeep(r){var rw=GW[r],h='',sk='',w='',q='';
  if(rw==='木'){h='170~175cm——中等身高，木性向上';sk='偏白或黄白，不晒就白';w='清秀斯文，有书卷气';q='文静稳重偏内敛，坐得住沉得下心';}
  else if(rw==='火'){h='172~177cm——火性炎上';sk='偏红润或小麦色';w='五官端正有神采';q='热情外向，感染力强';}
  else if(rw==='土'){h='168~173cm——土主敦厚';sk='肤色偏黄白';w='面相敦厚老实';q='稳重踏实型，给人可靠的第一印象';}
  else if(rw==='金'){h='170~175cm——金主义,骨相端正';sk='偏白';w='五官端正，轮廓分明';q='刚正果断，不怒自威';}
  else{h='170~174cm——水主流动，身形修长';sk='偏白';w='面相清秀，眼神灵动';q='聪明灵活，善变通';}
  return{h:h,s:sk,w:w,q:q};}
function xlDeep(pills,r,by){
  var gs=pills.map(function(p){return p.gan}),yc=gs.filter(function(g){return getShiShen(r,g).includes('印')}).length,ys=yc>=2;
  var gkY=by+18,gkG='甲乙丙丁戊己庚辛壬癸'[(gkY-4)%10],gkZ='子丑寅卯辰巳午未申酉戌亥'[(gkY-4)%12],gkSS=getShiShen(r,gkG),gkI='';
  if(gkSS.includes('印'))gkI=gkG+gkZ+'年高考——印星当旺，学业运较佳。';else if(gkSS.includes('食')||gkSS.includes('伤'))gkI=gkG+gkZ+'年高考——食伤透干，有灵感但压力较大。';else gkI=gkG+gkZ+'年高考——需关注学业状态。';
  var jl=ys?'印星有力——本科以上，有机会读硕士。偏技术路线更合适。':yc>=1?'印星一般——大专到本科水平。社会经验比学历更能补足。':'印星偏弱——学历中等，但在实际工作中学习能力强。';
  return{jl:jl,gi:gkI,gy:gkY};}

// ====== HTML生成 ======
function buildHtml(riGan,riZhi,pills,wc,du,gender,bt,ts,off,bp,by){
  var g=gender===1?'男':'女',h='',bz=pills.map(function(p){return p.ganZhi}).join(' ');
  var gj=gjBase(pills,riGan),sq=sqBase(pills,riGan);
  var GJD=gjDeep(pills,riGan,gj),BYD=byDeep(pills,riGan,wc,GJD);
  var JTD=jtDeep(pills,riGan),SCD=scDeep(riGan),XLD=xlDeep(pills,riGan,by);
  var zn=znBase(pills,riGan,gender),dyd=dyBase(du),dsj=dsjBase(pills,riGan,du,by),ln=lnBase(pills,riGan,du,new Date().getFullYear(),by);
  var wxK=['木','火','土','金','水'],wxT=Math.max(1,Object.values(wc).reduce(function(a,b){return a+b},0));
  h+='<p class="subtitle">'+bz+' · '+g+'命 · '+riGan+'日主<br>'+bt+' · '+ts+' 真太阳时 ('+(off>0?'+':'')+off+'分)<br>'+bp+'</p>';

  // 一、排盘
  h+='<div class="section-title">一、排盘</div><div class="bazi-card"><div class="bazi-header"><span class="title">四柱八字</span><span class="sex">'+g+'</span></div><table class="bazi-table"><thead><tr>'+pills.map(function(p){return'<th>'+p.name+'</th>'}).join('')+'</tr></thead><tbody>';
  h+='<tr>'+pills.map(function(p){return'<td><span class="stem '+gCls(p.gan)+'">'+p.gan+'</span></td>'}).join('')+'</tr>';
  h+='<tr>'+pills.map(function(p){return'<td><span class="branch '+zCls(p.zhi)+'">'+p.zhi+'</span><span class="ten-label">'+p.shiShenZhi.split('/')[0]+'</span></td>'}).join('')+'</tr>';
  h+='<tr>'+pills.map(function(p){return'<td><span class="shishen-tag '+(p.shiShen==='日主'?'ss-master':ssCls(p.gan))+'">'+p.shiShen+'</span></td>'}).join('')+'</tr>';
  h+='</tbody></table><div class="bazi-divider"></div><table class="bazi-table"><tbody>';
  h+='<tr>'+pills.map(function(p){return'<td><div class="canggan-group">'+(p.cangGan||[]).map(function(c){return'<span class="canggan-item"><span class="cg-dot dot-'+dtCls(c)+'"></span>'+c+'</span>'}).join('')+'</div></td>'}).join('')+'</tr>';
  h+='<tr>'+pills.map(function(p){return'<td><span class="nayin-tag">'+p.naYin+'</span></td>'}).join('')+'</tr>';
  h+='<tr>'+pills.map(function(p){return'<td><span class="kongwang">-</span></td>'}).join('')+'</tr>';
  h+='</tbody></table><div class="bazi-footer"><span class="bf-tag">日主 '+riGan+'</span><span class="bf-tag">纳音 '+pills[2].naYin+'</span><span class="bf-tag">'+g+'命</span></div></div>';

  // 二、五行
  h+='<hr class="divider"><div class="section-title">二、五行力量分析</div><div class="card"><div style="display:flex;height:22px;border-radius:11px;overflow:hidden;background:#1a2027;margin-bottom:14px">';
  for(var i=0;i<wxK.length;i++){var c=wc[wxK[i]]||0;if(c>0)h+='<div style="width:'+Math.round(c/wxT*100)+'%;background:var(--'+WC[wxK[i]]+');display:flex;align-items:center;justify-content:center;font-size:.55em;color:#fff;font-weight:600">'+wxK[i]+c+'</div>';}h+='</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">';
  for(var i=0;i<wxK.length;i++){var c=wc[wxK[i]]||0;h+='<div style="background:rgba(42,48,56,.4);border-radius:10px;padding:10px;text-align:center"><div style="font-size:.7em;color:var(--'+WC[wxK[i]]+');margin-bottom:2px">'+wxK[i]+'</div><div style="font-size:.85em;color:var(--gold-lt);font-weight:600">'+c+'</div></div>';}
  h+='<div style="background:rgba(200,169,110,.08);border:1px solid rgba(200,169,110,.2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:.7em;color:var(--gold);margin-bottom:2px">日主</div><div style="font-size:.85em;color:var(--gold-lt);font-weight:600">'+riGan+GW[riGan]+'</div></div></div></div>';

  // 三、格局(deep)
  h+='<hr class="divider"><div class="section-title">三、格局分析</div><div class="card">';
  h+='<p>'+st(GJD.gd)+'</p><p>月令'+pills[1].zhi+'（'+GJD.yl+'）当令。'+(GJD.ys?'用神取'+st(GJD.ys)+'，':'')+(GJD.xs?'喜'+GJD.xs:'')+(GJD.js?'，忌'+GJD.js:'')+'。</p>';
  if(GJD.ft.length){h+='<ul>';for(var i=0;i<GJD.ft.length;i++)h+='<li>'+GJD.ft[i]+'</li>';h+='</ul>';}
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
  h+='<p style="margin-top:14px">'+st('父母：')+'</p><ul><li><strong>父星：</strong>'+JTD.fq+'</li><li><strong>母星：</strong>'+JTD.mq+'</li></ul>';
  h+='<p style="margin-top:14px">'+st('兄弟姐妹：')+'</p><p>'+JTD.xd+'</p></div>';

  // 七、身材长相
  h+='<hr class="divider"><div class="section-title">七、身材长相</div><div class="card"><ul>';
  h+='<li><strong>身高：</strong>'+SCD.h+'</li><li><strong>肤色：</strong>'+SCD.s+'</li><li><strong>五官：</strong>'+SCD.w+'</li><li><strong>气质：</strong>'+SCD.q+'</li></ul></div>';

  // 八、性格
  var xg=xgBase(pills,riGan,sq);
  h+='<hr class="divider"><div class="section-title">八、性格</div><div class="card"><p>日主'+GW[riGan]+'——';
  for(var i=0;i<Math.min(xg.traits.length,6);i++)h+='<span class="tag tag-'+WC[GW[riGan]]+'">'+xg.traits[i]+'</span> ';
  h+='</p><p style="font-size:.95em;color:var(--gold-lt);margin-top:8px">'+st('一句话：')+xg.summary+'</p></div>';

  // 九、学历(deep)
  h+='<hr class="divider"><div class="section-title">九、学历</div><div class="card"><p>'+XLD.jl+'</p>';
  if(XLD.gi)h+='<p style="margin-top:8px"><strong>高考：</strong><span class="highlight">'+XLD.gy+'年</span>（实岁18岁）。'+XLD.gi+'</p></div>';

  // 十、职业
  var zy=zyBase(pills,riGan);
  h+='<hr class="divider"><div class="section-title">十、职业</div><div class="card"><p style="font-size:1em;color:#e88060;font-weight:700">最佳方向：'+zy.d+'</p><p>'+zy.t+'</p></div>';

  // 十一、健康
  var jk=jkBase(wc);
  h+='<hr class="divider"><div class="section-title">十一、健康</div><div class="card"><ul>';
  for(var i=0;i<jk.length;i++)h+='<li>'+jk[i]+'</li>';h+='</ul></div>';

  // 十二、婚恋
  var hl=hlBase(pills,riGan,gender);
  h+='<hr class="divider"><div class="section-title">十二、婚恋</div><div class="card"><p>'+hl.analysis+'</p></div>';

  // 十三、子女
  h+='<hr class="divider"><div class="section-title">十三、子女</div><div class="card"><p>'+zn.touTai+'，'+zn.count+'</p></div>';

  // 十四、大运走势
  h+='<hr class="divider"><div class="section-title">十四、大运走势</div><div class="card">';
  h+='<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-bottom:16px">';
  for(var i=0;i<du.length;i++){var dy=du[i];h+='<div style="position:relative;display:flex;flex-direction:column;align-items:center;min-width:52px;padding:8px 6px;border-radius:10px;background:#1a2027;border:1px solid '+(dy.cur?'var(--gold)':'#2a3038')+';'+(dy.cur?'background:linear-gradient(180deg,rgba(200,169,110,.08),transparent);':'')+'">'+(dy.cur?'<span style="position:absolute;top:-7px;right:-5px;font-size:.5em;color:var(--gold);background:#0b0e12;padding:0 4px;border-radius:4px;border:1px solid var(--gold)">当前</span>':'')+'<span style="font-size:1.05em;font-weight:700;color:var(--gold-lt)">'+dy.ganZhi+'</span><span style="font-size:.58em;color:#6a7a88;margin-top:2px">'+dy.ages+'岁</span></div>';}
  h+='</div>';
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
  h+='<p>此命'+GJD.gd+'，'+sq.level+'。'+(GJD.ys?'以'+st(GJD.ys)+'为用神，':'')+'大运走势需关注用神当旺之运。</p></div>';
  return h;
}

// ====== Base engine (inline) ======
function gjBase(pills,r){
  var yz=pills[1].zhi,ylSS=getShiShen(r,yz),ags=pills.map(function(p){return p.gan});
  var tgs=ags.map(function(g){return getShiShen(r,g)}).filter(Boolean);
  var g='',gd='',ys='',xs='',js='';
  if(ylSS==='正官'||ylSS==='七杀'){g=ylSS+'格';
    if(tgs.includes('正印')||tgs.includes('偏印')){gd='杀印相生格';ys='印星化杀';xs='比劫帮身';js='财星坏印';}
    else if(tgs.includes('食神')||tgs.includes('伤官')){gd='食伤制杀格';ys='食伤制杀';}
    else{gd=g+'无制化';ys='印星或食伤';}
  }else if(ylSS==='正印'||ylSS==='偏印'){g=ylSS+'格';
    if(tgs.includes('正官')||tgs.includes('七杀')){gd='官印相生格';ys='官杀';}
    else{gd=g+'印旺';ys='财星破印';js='官杀生印';}
  }else if(ylSS==='正财'||ylSS==='偏财'){g=ylSS+'格';gd=g;ys='食伤生财';}
  else if(['食神','伤官'].includes(ylSS)){g=ylSS+'格';gd=g;}
  else{g='建禄格';gd=yz+'月建禄格';ys='官杀或食伤';}
  return{geju:g,gejuDetail:gd,yueLingSS:ylSS,yongShen:ys,xiShen:xs,jiShen:js};
}
function sqBase(pills,r){
  var rw=GW[r],ws={木:{寅:1.5,卯:1.5,辰:0.8,巳:0.3,午:0.3,未:0.5,申:0.2,酉:0.1,戌:0.3,亥:1.2,子:1.2,丑:0.4},火:{寅:0.8,卯:0.5,辰:0.6,巳:1.5,午:1.5,未:1.0,申:0.2,酉:0.1,戌:0.3,亥:0.2,子:0.1,丑:0.3},土:{寅:0.4,卯:0.3,辰:1.5,巳:0.8,午:0.6,未:1.5,申:0.5,酉:0.4,戌:1.5,亥:0.3,子:0.2,丑:1.5},金:{寅:0.1,卯:0.1,辰:0.5,巳:0.6,午:0.4,未:0.5,申:1.5,酉:1.5,戌:1.2,亥:0.3,子:0.4,丑:0.8},水:{寅:0.3,卯:0.3,辰:0.5,巳:0.1,午:0.1,未:0.2,申:0.8,酉:0.5,戌:0.2,亥:1.5,子:1.5,丑:0.6}};
  var s=ws[rw]?.[pills[1].zhi]||0.5;
  for(var i=0;i<pills.length;i++){if(GW[pills[i].gan]===rw)s+=0.8;if(ZW[pills[i].zhi]===rw)s+=0.6;}
  for(var i=0;i<pills.length;i++){var ri=WO.indexOf(rw),pi=WO.indexOf(GW[pills[i].gan]);if((pi+1)%5===ri)s+=0.5;}
  var l='',d='';if(s>=4){l='身强';d='日主得令得地得生，力量充足。';}else if(s>=2.5){l='中和偏强';d='日主有一定根基，稍偏强。';}else if(s>=1.5){l='中和偏弱';d='日主根基不够扎实，稍偏弱。';}else{l='身弱';d='日主失令失地，力量不足。';}
  return{level:l,score:s.toFixed(1),desc:d};
}
function xgBase(pills,r,sq){var rw=GW[r],wxT={木:['正直向上','有担当有傲骨','目标感强','有领导潜质'],火:['热情主动','行动力强','急躁','感染力强'],土:['稳重可靠','诚实守信','偏固执','包容心强'],金:['果断刚毅','讲义气重原则','是非分明','执行力强'],水:['聪明灵活','善变通','直觉敏锐','情绪波动大']};var tr=wxT[rw]||[],sm=rw==='木'?'内敛型聪明人，脑子快嘴不快。讲义气有底线。需外界推一把才动，但一旦决定就坚定。':rw==='火'?'外向开朗，热情直接。行动力强但有时急躁。人缘好受欢迎。':rw==='土'?'稳重务实，可靠可信。做事踏实但偶尔固执。包容心强，适合做人脉桥梁。':rw==='金'?'刚正果断，原则性强。做事干净利落，不拖泥带水。内心有强烈的正义感。':'聪明灵活，适应力强。善变通、善交际。情绪敏感，需要稳定的内心支撑。';return{traits:tr,summary:sm};}
function zyBase(pills,r){var gs=pills.map(function(p){return p.gan}).map(function(g){return getShiShen(r,g)}),hY=gs.some(function(s){return s.includes('印')}),hS=gs.some(function(s){return s.includes('杀')||s.includes('官')}),hSS=gs.some(function(s){return s.includes('食')||s.includes('伤')}),hC=gs.some(function(s){return s.includes('财')});if(hS&&hY)return{d:'技术型稳定岗位',t:'杀印相生，适合在大机构做专业技术人才（工程师/数据分析/技术管理/IT运维/工程设计/审计）。不宜一线拼杀岗，适合后台支持类。'};if(hSS&&hC)return{d:'商业创业型',t:'食伤生财，适合做生意、销售、市场、创意类。商业头脑灵活，自由度高。'};if(hY)return{d:'文教研究型',t:'印旺为用，适合文化教育、研究分析、文书工作。体制内文职或教育行业合适。'};return{d:'技能型自由职业',t:'走专业技术路线，有一技之长。自由职业或小团队模式。'};}
function jkBase(wc){var is=[],t=Math.max(1,Object.values(wc).reduce(function(a,b){return a+b},0));var ws={木:{w:'肝胆功能偏弱、筋骨易酸软',s:'肝火偏旺、易怒'},火:{w:'心火不足、气血偏慢、手脚易凉',s:'心火过旺、易上火失眠'},土:{w:'脾胃运化差、易腹胀',s:'脾胃湿热、消化不良'},金:{w:'肺气偏弱、皮肤敏感',s:'肺火偏旺、易咳嗽'},水:{w:'肾气偏弱、精力不足',s:'肾气偏旺易失衡、泌尿系统'}};var wk=Object.keys(wc);for(var i=0;i<wk.length;i++){var w=wk[i],c=wc[w];if(c===0)is.push(ws[w].w);if(c/t>0.35)is.push(ws[w].s);}return is;}
function hlBase(pills,r,gender){var isM=gender===1,sp=isM?'正财':'正官',bk=isM?'偏财':'七杀',fnd=[],fbk=[];for(var i=0;i<pills.length;i++){var p=pills[i];if(getShiShen(r,p.gan)===sp)fnd.push(p.name+p.gan);if(getShiShen(r,p.gan)===bk)fbk.push(p.name+p.gan);}var an='';if(fnd.length)an+='配偶星（'+sp+'）在'+fnd.join('、')+'，'+(fnd.some(function(p){return p.includes('年')})?'早婚倾向。':fnd.some(function(p){return p.includes('时')})?'晚婚倾向。':'适龄结婚。');else if(fbk.length)an+='以'+bk+'为配偶星，在'+fbk.join('、')+'，适龄结婚。';else an+='配偶星不显，婚缘偏晚，需大运流年引动。';an+=' 配偶宫'+pills[2].zhi+'。';return{analysis:an};}
function znBase(pills,r,gender){var isM=gender===1,gs=pills.map(function(p){return p.gan}),cp=isM?gs.some(function(g){return getShiShen(r,g).includes('杀')||getShiShen(r,g).includes('官')}):gs.some(function(g){return getShiShen(r,g).includes('食')||getShiShen(r,g).includes('伤')});return{touTai:'头胎儿子可能性偏大。',count:cp?'未来有1~2个孩子。':'未来有1个孩子。'};}
function dyBase(du){var items=[];for(var i=0;i<du.length;i++){var dy=du[i],ages=dy.ages.split('-'),a0=parseInt(ages[0]),desc='';if(a0<15)desc='少年运，学业成长阶段。';else if(a0<25)desc='青年运，求学或初入社会。';else if(a0<35)desc='青壮年运，事业关键期。';else if(a0<45)desc='中年运，财富积累阶段。';else desc='中晚年运，事业稳固或转型。';items.push({ganZhi:dy.ganZhi,ages:dy.ages,cur:dy.cur,desc:desc});}return items;}
function dsjBase(pills,r,du,by){var items=[],curYear=new Date().getFullYear(),age=curYear-by;if(age>=18)items.push({year:by+18,age:18,event:'高考/大学',reason:'学业关键节点'});if(age>=22)items.push({year:by+22,age:22,event:'进入社会/初入职场',reason:'人生转折点'});var curDY=du.find(function(d){return d.cur});if(curDY){var sa=parseInt(curDY.ages.split('-')[0]);items.push({year:by+sa,age:sa,event:'换大运',reason:'进入'+curDY.ganZhi+'大运'});}if(curYear>by+18)items.push({year:curYear,age:curYear-by,event:'当前年份',reason:'当前流年重点把握'});items.sort(function(a,b){return a.year-b.year});return items.slice(0,7);}
function lnBase(pills,r,du,curYear,by){var curDY=du.find(function(d){return d.cur}),rs='今年是转型与调整之年。';if(curDY)rs='当前在'+curDY.ganZhi+'大运中，'+rs;rs+='需关注事业、感情、健康的平衡发展。';return{age:curYear-by,desc:rs};}

// ====== API ======
app.post('/api/bazi',(req,res)=>{try{var y=req.body.year,m=req.body.month,d=req.body.day,h=req.body.hour||0,mi=req.body.minute||0,lng=req.body.longitude||120,gender=req.body.gender,sy=y,sm=m,sd=d;if(req.body.isLunar){try{var ld=Lunar.fromYmd(y,m,d),s2=ld.getSolar();sy=s2.getYear();sm=s2.getMonth();sd=s2.getDay();}catch(e){}}var ts=calcTS(sy,sm,sd,h,mi,lng),solar=Solar.fromYmdHms(ts.year,ts.month,ts.day,ts.hour,ts.minute,0),lunar=Lunar.fromSolar(solar),bz=lunar.getEightChar(),riGan=bz.getDayGan();var pills=[{name:'年柱',ganZhi:bz.getYear(),gan:bz.getYearGan(),zhi:bz.getYearZhi(),shiShen:getShiShen(riGan,bz.getYearGan()),naYin:bz.getYearNaYin(),cangGan:bz.getYearHideGan(),shiShenZhi:bz.getYearShiShenZhi().join('/')},{name:'月柱',ganZhi:bz.getMonth(),gan:bz.getMonthGan(),zhi:bz.getMonthZhi(),shiShen:getShiShen(riGan,bz.getMonthGan()),naYin:bz.getMonthNaYin(),cangGan:bz.getMonthHideGan(),shiShenZhi:bz.getMonthShiShenZhi().join('/')},{name:'日柱',ganZhi:bz.getDay(),gan:bz.getDayGan(),zhi:bz.getDayZhi(),shiShen:'日主',naYin:bz.getDayNaYin(),cangGan:bz.getDayHideGan(),shiShenZhi:bz.getDayShiShenZhi().join('/')},{name:'时柱',ganZhi:bz.getTime(),gan:bz.getTimeGan(),zhi:bz.getTimeZhi(),shiShen:getShiShen(riGan,bz.getTimeGan()),naYin:bz.getTimeNaYin(),cangGan:bz.getTimeHideGan(),shiShenZhi:bz.getTimeShiShenZhi().join('/')}];var wc={木:0,火:0,土:0,金:0,水:0},wm={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水',寅:'木',卯:'木',巳:'火',午:'火',申:'金',酉:'金',亥:'水',子:'水',辰:'土',戌:'土',丑:'土',未:'土'};for(var i=0;i<pills.length;i++){wc[wm[pills[i].gan]||'']++;wc[wm[pills[i].zhi]||'']++;}var du=[];try{var yun=bz.getYun(gender);if(yun){var sy2=Math.round(yun.getStartYear());for(var i=0;i<8;i++){var dy=yun.getDaYun(i);if(dy){var age=sy2+i*10;du.push({i:i+1,ganZhi:dy.getGanZhi(),startAge:age,ages:age+'-'+(age+9),cur:(age<=30&&age+9>=30)});}}}}catch(e){}res.json({gender:gender===1?'男':'女',beijingTime:y+'年'+m+'月'+d+'日 '+String(h).padStart(2,'0')+':'+String(mi).padStart(2,'0'),trueSolar:ts.year+'年'+ts.month+'月'+ts.day+'日 '+String(ts.hour).padStart(2,'0')+':'+String(ts.minute).padStart(2,'0'),solarOffset:ts.off,bazi:pills.map(function(p){return p.ganZhi}).join(' '),riGan:riGan,riZhi:bz.getDayZhi(),pills:pills,dayun:du,wuxingCount:wc});}catch(e){res.status(500).json({error:e.message});}});

app.post('/api/analyze',(req,res)=>{try{var y=req.body.year,m=req.body.month,d=req.body.day,h=req.body.hour||0,mi=req.body.minute||0,lng=req.body.longitude||120,gender=req.body.gender||1,sy=y,sm=m,sd=d;if(req.body.isLunar){try{var ld=Lunar.fromYmd(y,m,d),s2=ld.getSolar();sy=s2.getYear();sm=s2.getMonth();sd=s2.getDay();}catch(e){}}var ts=calcTS(sy,sm,sd,h,mi,lng),solar=Solar.fromYmdHms(ts.year,ts.month,ts.day,ts.hour,ts.minute,0),lunar=Lunar.fromSolar(solar),bz=lunar.getEightChar(),riGan=bz.getDayGan(),riZhi=bz.getDayZhi();var pills=[{name:'年柱',ganZhi:bz.getYear(),gan:bz.getYearGan(),zhi:bz.getYearZhi(),shiShen:getShiShen(riGan,bz.getYearGan()),naYin:bz.getYearNaYin(),cangGan:bz.getYearHideGan(),shiShenZhi:bz.getYearShiShenZhi().join('/')},{name:'月柱',ganZhi:bz.getMonth(),gan:bz.getMonthGan(),zhi:bz.getMonthZhi(),shiShen:getShiShen(riGan,bz.getMonthGan()),naYin:bz.getMonthNaYin(),cangGan:bz.getMonthHideGan(),shiShenZhi:bz.getMonthShiShenZhi().join('/')},{name:'日柱',ganZhi:bz.getDay(),gan:bz.getDayGan(),zhi:bz.getDayZhi(),shiShen:'日主',naYin:bz.getDayNaYin(),cangGan:bz.getDayHideGan(),shiShenZhi:bz.getDayShiShenZhi().join('/')},{name:'时柱',ganZhi:bz.getTime(),gan:bz.getTimeGan(),zhi:bz.getTimeZhi(),shiShen:getShiShen(riGan,bz.getTimeGan()),naYin:bz.getTimeNaYin(),cangGan:bz.getTimeHideGan(),shiShenZhi:bz.getTimeShiShenZhi().join('/')}];var wc={木:0,火:0,土:0,金:0,水:0},wm={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水',寅:'木',卯:'木',巳:'火',午:'火',申:'金',酉:'金',亥:'水',子:'水',辰:'土',戌:'土',丑:'土',未:'土'};for(var i=0;i<pills.length;i++){wc[wm[pills[i].gan]||'']++;wc[wm[pills[i].zhi]||'']++;}var du=[];try{var yun=bz.getYun(gender);if(yun){var sy2=Math.round(yun.getStartYear());for(var i=0;i<8;i++){var dy=yun.getDaYun(i);if(dy){var age=sy2+i*10;du.push({i:i+1,ganZhi:dy.getGanZhi(),startAge:age,ages:age+'-'+(age+9),cur:(age<=30&&age+9>=30)});}}}}catch(e){}var bt=y+'年'+m+'月'+d+'日 '+String(h).padStart(2,'0')+':'+String(mi).padStart(2,'0'),tss=ts.year+'年'+ts.month+'月'+ts.day+'日 '+String(ts.hour).padStart(2,'0')+':'+String(ts.minute).padStart(2,'0'),html=buildHtml(riGan,riZhi,pills,wc,du,gender,bt,tss,ts.off,req.body.birthplace||'',y);res.json({html:html});}catch(e){res.status(500).json({error:e.message});}});

app.get('/',(req,res)=>res.sendFile(join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log('八字排盘服务启动: '+PORT));
