// Three disposable HUD compositions. Each is rasterized only when invalidated.
const PI=Math.PI,TAU=2*PI;
const C={ice:'#a9edf5',cyan:'#53c8df',amber:'#ffb668',coral:'#fa795c',white:'#e9f8f4'};

function instruments(ctx){
  function line(points,color=C.ice,alpha=.5,width=1.05){
    ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=1.5;ctx.globalAlpha=Math.min(1,alpha*1.3);ctx.lineWidth=width;ctx.beginPath();
    points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
  }
  function text(value,x,y,size=10,color=C.ice,alpha=.65,align='left'){
    ctx.globalAlpha=Math.min(1,alpha*1.3);ctx.fillStyle=color;ctx.textAlign=align;
    ctx.font=`${size>=18?'300':'400'} ${size}px ${size>=18?'"Arial Narrow", "Helvetica Neue", Arial':'"Arial Narrow", Arial'}, sans-serif`;
    ctx.fillText(value,x,y);
  }
  function mono(value,x,y,size=10,color=C.ice,alpha=.7,align='left'){
    ctx.globalAlpha=Math.min(1,alpha*1.3);ctx.fillStyle=color;ctx.textAlign=align;ctx.font=`${size}px "SFMono-Regular", Consolas, monospace`;ctx.fillText(value,x,y);
  }
  function arc(x,y,r,start=0,end=TAU,color=C.ice,alpha=.5,width=1.05){
    ctx.globalAlpha=Math.min(1,alpha*1.3);ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=1.5;ctx.lineWidth=width;
    ctx.beginPath();ctx.arc(x,y,r,start,end);ctx.stroke();
  }
  function dot(x,y,r=2,color=C.ice,alpha=.8){ctx.globalAlpha=Math.min(1,alpha*1.3);ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}
  function ticks(x,y,r,start,end,n,color=C.ice,alpha=.6){
    for(let i=0;i<=n;i++){const a=start+(end-start)*i/n,len=i%5===0?11:4;
      line([[x+Math.cos(a)*r,y+Math.sin(a)*r],[x+Math.cos(a)*(r+len),y+Math.sin(a)*(r+len)]],color,i%5===0?alpha:alpha*.5);
    }
  }
  function bars(x,y,count,width=3,height=35,color=C.ice,seed=0){
    for(let i=0;i<count;i++){const v=.18+.82*Math.abs(Math.sin(i*1.78+seed)*Math.cos(i*.39+seed));
      ctx.globalAlpha=.3+v*.3;ctx.fillStyle=color;ctx.fillRect(x+i*(width+3),y-height*v,width,height*v);
    }
  }
  function waveform(x,y,w,h,color=C.ice,seed=0){
    line([[x,y],[x+w,y]],color,.17);
    const pts=[];for(let i=0;i<=120;i++){const k=i/120,v=Math.sin(k*75+seed)*Math.sin(k*17+seed)*Math.pow(Math.sin(k*PI),2);pts.push([x+k*w,y+v*h]);}
    line(pts,color,.68,1);line([[x,y-h],[x,y+h],[x+w,y+h]],color,.25);
  }
  function cross(x,y,size,color=C.ice,alpha=.65){line([[x-size,y],[x+size,y]],color,alpha);line([[x,y-size],[x,y+size]],color,alpha);}
  function hex(x,y,r,color=C.ice,alpha=.5){const p=[];for(let i=0;i<=6;i++)p.push([x+r*Math.cos(i*PI/3),y+r*Math.sin(i*PI/3)]);line(p,color,alpha);}
  function rows(x,y,width,labels,color=C.ice){
    labels.forEach(([name,value],i)=>{const yy=y+i*28;text(name,x,yy,9,color,.55);mono(value,x+width,yy,12,color,.9,'right');line([[x,yy+8],[x+width,yy+8]],color,.2);});
  }
  function grid(x,y,w,h,color=C.ice){
    for(let i=0;i<5;i++)line([[x,y+i*h/4],[x+w,y+i*h/4]],color,.1);
    for(let i=0;i<7;i++)line([[x+i*w/6,y],[x+i*w/6,y+h]],color,.1);
  }
  return {line,text,mono,arc,dot,ticks,bars,waveform,cross,hex,rows,grid};
}

function optic(ctx,p,{x,y,r,color,tilt=.65,phase=0}){
  const {arc,line,ticks,text,dot}=p;
  ctx.save();ctx.translate(x,y);ctx.transform(tilt,-.09,.08,1,0,0);
  [.49,.68,.72,.82,.91,1,1.055].forEach((k,i)=>arc(0,0,r*k,phase+i*.18,phase+TAU-.24-i*.08,color,.25+i*.055,i===4?1.8:.7));
  ticks(0,0,r*.94,0,TAU,100,color,.75);
  for(let i=0;i<10;i++){const a=i*TAU/10;arc(0,0,r*.84,a,a+.16,color,i%3===0?.8:.25,i%3===0?4:1);}
  for(let i=0;i<4;i++){const a=i*PI/2;line([[Math.cos(a)*r*.38,Math.sin(a)*r*.38],[Math.cos(a)*r*.7,Math.sin(a)*r*.7]],color,.6);}
  arc(0,0,r*.35,0,TAU,color,.4);arc(0,0,r*.1,0,TAU,color,.55);
  line([[-r*.23,0],[r*.23,0]],color,.35);line([[0,-r*.23],[0,r*.23]],color,.35);
  dot(0,0,2,color);text('OPTICAL INTERFACE',0,-r*1.13,10,color,.75,'center');
  for(let i=0;i<8;i++){const a=i*TAU/8;text(String(i*45).padStart(3,'0'),Math.cos(a)*r*1.13,Math.sin(a)*r*1.13,9,color,.55,'center');}
  ctx.restore();
}

function spatial(ctx,p,x,y,r){
  const {arc,line,ticks,text,dot}=p;
  ctx.save();ctx.translate(x,y);ctx.transform(.85,.08,-.04,1,0,0);
  arc(0,0,r,0,TAU,C.ice,.75,1.3);arc(0,0,r*1.055,.15,6,C.cyan,.35);ticks(0,0,r*.96,0,TAU,120,C.ice,.65);
  [.88,.78].forEach(k=>arc(0,0,r*k,.25,5.6,C.cyan,.32));
  ctx.strokeStyle=C.ice;ctx.lineWidth=.7;ctx.globalAlpha=.28;
  for(let i=-3;i<=3;i++){const yy=i*r*.19,ww=Math.sqrt(r*r*.64-yy*yy);ctx.beginPath();ctx.ellipse(0,yy,ww,r*.07,0,0,TAU);ctx.stroke();}
  for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(0,0,r*(.13+i*.15),r*.8,.1,0,TAU);ctx.stroke();}
  // A deliberately schematic projected route through the spatial volume.
  line([[-r*.7,r*.4],[-r*.3,r*.2],[-r*.1,-r*.25],[r*.25,-r*.05],[r*.56,-r*.45]],C.white,.75,1.1);
  [[-.3,.2],[-.1,-.25],[.25,-.05],[.56,-.45]].forEach(([a,b],i)=>{dot(a*r,b*r,3,i===3?C.coral:C.white);arc(a*r,b*r,9,0,TAU,C.ice,.45);});
  arc(r*.12,-r*.08,r*.64,-.4,2.4,C.white,.7,2.4);
  text('SPATIAL SOLUTION',0,-r*1.16,10,C.ice,.8,'center');
  ctx.restore();
}

export function drawVisor(ctx,p,expression,{interactive=false}={}){
  const {line,text,mono,arc,bars,rows,cross}=p;
  if(!interactive)optic(ctx,p,{x:194,y:406,r:227,color:C.amber,tilt:.69,phase:.25});
  spatial(ctx,p,1428,interactive?314:434,interactive?145:260);
  if(!interactive){ctx.save();ctx.translate(32,89);ctx.transform(1,.055,-.15,1,0,0);
  text('HELMET INTERFACE / OPTICAL RELAY',0,0,10,C.ice,.65);line([[0,12],[348,12]],C.ice,.6);
  rows(0,39,282,[['RETINAL ALIGNMENT','99.84'],['LINK INTEGRITY','NOMINAL'],['EXTERNAL FEED','LIVE']],C.ice);
  bars(0,143,45,3,18,C.ice,2);ctx.restore();}
  ctx.save();ctx.translate(1230,77);ctx.transform(1,-.035,.12,1,0,0);
  mono('03 : 14 : 08',315,0,14,C.ice,.7,'right');text('NAVIGATION / VECTOR RESOLUTION',315,25,9,C.ice,.5,'right');
  rows(0,57,315,[['AZIMUTH','186.024'],['PITCH','−02.91'],['RANGE','000.00']],C.ice);ctx.restore();
  // Foreground optical glass: small local overlays, never a full mask on the face.
  if(!interactive){arc(956,286,61,.1,5.4,C.ice,.3);arc(956,286,50,2.5,6.2,C.amber,.65,1.5);
  cross(956,286,7,C.ice,.45);line([[974,318],[1058,362],[1192,362]],C.ice,.55);
  text('FOCUS LOCK',1062,353,9,C.ice,.6);mono('1.000',1192,380,11,C.white,.8,'right');}
  if(!interactive){ctx.save();ctx.translate(24,666);ctx.rotate(-.045);
  text('J.A.R.V.I.S.',0,0,24,C.amber,.85);text('NEURAL INTERFACE STABLE',0,24,10,C.ice,.6);
  for(let i=0;i<14;i++){const x=i*18;arc(x,48,4,0,TAU,i%5===0?C.amber:C.ice,.45);}
  line([[0,71],[268,71],[303,43]],C.amber,.55);ctx.restore();}
  if(!interactive)text('INTERNAL CAMERA / '+expression.toUpperCase(),1539,742,10,C.ice,.7,'right');
  if(!interactive)mono('SYS  0100 / 042',1539,763,9,C.ice,.35,'right');
  line([[369,538],[484,538],[526,510]],C.ice,.4);text('BIOMETRIC FEED',372,526,10,C.ice,.55);
  for(let i=0;i<23;i++){const y=209+i*17;line([[12,y],[i%4===0?25:18,y]],C.amber,.45);line([[1588,y],[i%4===0?1574:1582,y]],C.ice,.5);}
}

export function drawTargeting(ctx,p,expression){
  const {line,text,mono,arc,ticks,dot,rows,waveform}=p;
  // One quiet instrument frame. The scale flows around the face rather than forming two discs.
  arc(810,400,636,2.62,3.71,C.ice,.33);ticks(810,400,645,2.67,3.62,38,C.ice,.7);
  arc(810,400,636,-.46,.44,C.ice,.25);ticks(810,400,646,-.43,.42,34,C.ice,.45);
  [[548,163,1,1],[1060,163,-1,1],[548,644,1,-1],[1060,644,-1,-1]].forEach(([x,y,dx,dy])=>{
    line([[x,y+dy*67],[x,y],[x+dx*55,y]],C.white,.72,1.2);
    line([[x+dx*5,y+dy*28],[x+dx*5,y+dy*5],[x+dx*28,y+dy*5]],C.cyan,.2);
  });
  line([[611,153],[707,153]],C.ice,.22);line([[899,153],[994,153]],C.ice,.22);
  arc(951,343,41,.2,2.8,C.white,.85,1.2);arc(951,343,41,3.3,6,C.white,.85,1.2);
  arc(951,343,49,.6,1.5,C.amber,.75,2);ticks(951,343,46,0,TAU,24,C.ice,.65);
  p.cross(951,343,7,C.white,.8);arc(951,343,16,0,TAU,C.ice,.3);
  line([[995,343],[1105,284],[1276,284]],C.white,.6);
  text('VISUAL ACQUISITION',1118,272,11,C.white,.85);mono('LOCKED',1276,307,11,C.amber,.9,'right');
  text('FLIGHT VECTOR',93,258,12,C.ice,.9);mono('018.6',86,309,49,C.white,.85);
  mono('m / s',225,309,10,C.ice,.5);line([[91,326],[334,326]],C.ice,.6);
  rows(93,356,216,[['VERTICAL','+0.00'],['HEADING','186°'],['STABILITY','99.8%']],C.ice);
  waveform(96,515,207,28,C.ice,1);text('INERTIAL COMPENSATION',95,565,9,C.ice,.65);
  ctx.save();ctx.translate(1260,390);
  text('SYSTEM READY',0,0,15,C.white,.9);line([[0,15],[247,15]],C.white,.6);
  ['OPTICS','LIFE SUPPORT','CONTROL LINK'].forEach((s,i)=>{const y=49+i*37;dot(4,y-3,2,C.amber,.85);text(s,18,y,10,C.ice,.7);mono('OK',242,y,10,C.white,.9,'right');});ctx.restore();
  // A long pitch ruler provides orientation without obscuring the face.
  for(let i=-10;i<=10;i++){const x=800+i*29,len=i%5===0?18:7;line([[x,706],[x,706+len]],C.ice,i%5===0?.7:.25);if(i%5===0)mono(String(i*3),x,742,9,C.ice,.65,'center');}
  line([[499,700],[1101,700]],C.ice,.35);line([[795,687],[800,695],[805,687]],C.amber,.9,1.3);
  text('INTERNAL DISPLAY',66,80,10,C.ice,.6);mono('MK.III',1531,80,12,C.white,.8,'right');
  text('J.A.R.V.I.S. / '+expression.toUpperCase(),66,739,11,C.ice,.65);
  mono('AUX  01',1531,737,10,C.ice,.45,'right');
}

export function drawDiagnostic(ctx,p,expression){
  const {line,text,mono,arc,bars,waveform,hex,grid,dot}=p;
  // Two horizontal instrument planes with asymmetric signal banks at their ends.
  ctx.save();ctx.translate(31,87);ctx.transform(1,.018,-.13,1,0,0);
  line([[0,0],[449,0],[495,34],[1470,34]],C.amber,.65,1.1);
  text('STARK INDUSTRIES',0,-13,14,C.amber,.85);text('HELMET DIAGNOSTIC ARRAY',183,-13,10,C.ice,.6);
  ['NEURAL LINK','POWER DISTRIBUTION','OPTICAL FEED','ENVIRONMENT'].forEach((v,i)=>{const x=510+i*236;text(v,x,5,9,C.ice,.55);bars(x,27,22,3,13,i===1?C.amber:C.ice,i);});ctx.restore();
  ctx.save();ctx.translate(54,267);ctx.transform(.96,.06,-.09,1,0,0);
  text('POWER DISTRIBUTION',0,-24,14,C.amber,.85);mono('97.8%',293,-23,17,C.white,.9,'right');
  hex(123,96,95,C.amber,.65);hex(123,96,78,C.ice,.4);hex(123,96,41,C.ice,.7);
  for(let i=0;i<6;i++){const a=i*PI/3;line([[123+41*Math.cos(a),96+41*Math.sin(a)],[123+95*Math.cos(a),96+95*Math.sin(a)]],C.amber,.5);}
  arc(123,96,25,0,TAU,C.white,.65,1.5);dot(123,96,4,C.white);
  [[0,64],[245,80],[211,177]].forEach(([x,y],i)=>{line([[123,96],[x,y],[x+47,y]],C.ice,.4);mono(['A.04','B.18','C.07'][i],x,y-9,9,C.ice,.75);});
  bars(0,258,49,3,35,C.amber,5);text('REACTOR / LOAD BALANCE',0,284,9,C.amber,.7);ctx.restore();
  ctx.save();ctx.translate(1281,216);ctx.transform(1,-.035,.09,1,0,0);
  text('SIGNAL ANALYSIS',0,0,14,C.ice,.85);line([[0,14],[268,14]],C.ice,.5);
  ['NEURAL','OPTICAL','EXTERNAL'].forEach((s,i)=>{const yy=64+i*96;text(s,0,yy-24,9,C.ice,.65);mono(['0.024','1.000','0.186'][i],257,yy-24,10,C.white,.8,'right');grid(0,yy-17,256,39);waveform(0,yy+3,256,18,i===1?C.amber:C.ice,i+1);});ctx.restore();
  // Schematic face alignment rails avoid the eye/nose center.
  line([[349,232],[426,232],[483,309],[512,309]],C.coral,.65);
  mono('TEMP  36.8',353,221,11,C.coral,.8);line([[1181,481],[1095,481],[1066,440]],C.ice,.55);
  text('OCULAR RESPONSE / NOMINAL',1169,502,9,C.ice,.65,'right');
  arc(802,177,537,.74,2.38,C.amber,.4);arc(802,177,550,.83,2.27,C.ice,.25);
  for(let i=0;i<55;i++){const a=.85+i*.026,r=545;line([[802+Math.cos(a)*r,177+Math.sin(a)*r],[802+Math.cos(a)*(r+(i%5===0?10:4)),177+Math.sin(a)*(r+(i%5===0?10:4))]],C.amber,i%5===0?.65:.3);}
  line([[29,689],[387,689],[425,731],[1175,731],[1214,689],[1571,689]],C.amber,.7,1.1);
  mono('CORE  08.42',48,722,17,C.amber,.85);text('OUTPUT STABLE',49,747,9,C.ice,.5);
  text('J.A.R.V.I.S.',800,770,12,C.amber,.75,'center');
  text('BIOMETRIC / '+expression.toUpperCase(),1539,719,12,C.ice,.8,'right');mono('99.82 / SYNC',1539,743,10,C.ice,.45,'right');
}

export const treatments=[
  {key:'visor',letter:'A',name:'Visor projection',description:'Layered optics · cyan + amber',draw:drawVisor},
  {key:'targeting',letter:'B',name:'Targeting',description:'Open center · precise alignment',draw:drawTargeting},
  {key:'diagnostic',letter:'C',name:'Diagnostic',description:'Signal banks · panoramic telemetry',draw:drawDiagnostic},
];

export function drawTreatment(ctx,w,h,key,expression,options={}){
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);ctx.save();ctx.scale(w/1600,h/800);
  ctx.globalCompositeOperation='source-over';ctx.lineCap='butt';ctx.lineJoin='round';
  if(!options.interactive)(treatments.find(t=>t.key===key)||treatments[0]).draw(ctx,instruments(ctx),expression,options);
  ctx.restore();
}
