// Projected instruments for the disposable cinematic composition study.
const TAU=Math.PI*2;
export function drawHUD(ctx,w,h,t,yaw,pitch,expression){
  ctx.clearRect(0,0,w,h);
  const s=Math.max(.72,Math.min(w/1400,h/800)),tight=w/h<1.15,C='#8edff5',O='#ed7f47';
  const line=(x1,y1,x2,y2,color=C,alpha=.6)=>{ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=.75*s;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
  function text(value,x,y,size=10,color=C,alpha=.7,align='left'){ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.font=`${size*s}px Arial,sans-serif`;ctx.textAlign=align;ctx.fillText(value,x,y);}
  function ring(cx,cy,r,color,phase=0,tilt=1){
    ctx.save();ctx.translate(cx,cy);ctx.transform(1,.035,0,tilt,0,0);ctx.shadowColor=color;ctx.shadowBlur=4*s;
    [.55,.67,.73,.86,.91,1,1.07].forEach((k,i)=>{ctx.globalAlpha=.32+i*.045;ctx.strokeStyle=color;ctx.lineWidth=(i===4?1.8:.9)*s;ctx.beginPath();ctx.arc(0,0,r*k,phase+(i%3)*.32,phase+TAU-.22-i*.08);ctx.stroke();});
    for(let i=0;i<90;i++){const a=i/90*TAU+phase,b=i%5===0;line(Math.cos(a)*r*.93,Math.sin(a)*r*.93,Math.cos(a)*r*(b?1.02:.965),Math.sin(a)*r*(b?1.02:.965),color,b?.75:.38);}
    ctx.lineWidth=3*s;ctx.globalAlpha=.65;ctx.strokeStyle=color;
    [[.2,.48],[1.7,1.98],[3.35,3.75],[5.05,5.27]].forEach(([a,b])=>{ctx.beginPath();ctx.arc(0,0,r*.82,a+phase,b+phase);ctx.stroke();});
    for(let i=-2;i<=2;i++){const a=i*r*.18;line(-r*.5,a,r*.5,a,color,.14);line(a,-r*.5,a,r*.5,color,.14);}
    line(-r*.67,0,r*.67,0,color,.4);line(0,-r*.67,0,r*.67,color,.4);
    ctx.globalAlpha=.3;ctx.lineWidth=.6*s;
    for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,0,r*.58,r*(.16+i*.17),phase+i*.6,0,TAU);ctx.stroke();}
    ctx.globalAlpha=.8;ctx.fillStyle=color;ctx.beginPath();ctx.arc(r*.17*Math.sin(t*.2),r*.08*Math.cos(t*.17),2*s,0,TAU);ctx.fill();
    text('AZ '+(yaw*33+180).toFixed(2),0,-r*1.16,9,color,.7,'center');text('OPTICAL SENSOR ARRAY',0,r*1.28,7,color,.45,'center');
    ctx.restore();
  }
  ctx.save();ctx.globalCompositeOperation='lighter';
  // Instruments overlap the peripheral cheeks, leaving the center readable.
  const lr=Math.min(h*.25,w*.25),rr=Math.min(h*.31,w*.31);
  ring(w*(tight?.065:.20)-yaw*7*s,h*.49+pitch*4*s,lr,O,-.15+t*.009,.91);
  ring(w*(tight?.965:.81)-yaw*9*s,h*.61+pitch*6*s,rr,C,.15-t*.006,.96);
  ctx.save();ctx.translate(w*.64-yaw*6*s,h*.31+pitch*5*s);ctx.scale(1,.83);ctx.strokeStyle=C;ctx.shadowColor=C;ctx.shadowBlur=3*s;
  [24,33,40].forEach((r,i)=>{ctx.globalAlpha=.18+i*.06;ctx.lineWidth=.7*s;ctx.beginPath();ctx.arc(0,0,r*s,.3+i*.35,5.4+i*.15);ctx.stroke();});
  line(-48*s,0,-19*s,0,C,.45);line(19*s,0,48*s,0,C,.45);line(0,-48*s,0,-19*s,C,.45);text('+',0,4*s,12,C,.7,'center');ctx.restore();
  function panel(x,y,color,right=false){
    ctx.save();ctx.translate(x,y);ctx.transform(1,right?-.06:.05,right?.12:-.12,1,0,0);const pw=(tight?132:207)*s;
    line(0,0,pw,0,color,.7);line(0,3*s,pw*.64,3*s,color,.2);text(right?'NAV / TARGET VECTOR':'SYSTEM / HELMET LINK',3*s,-9*s,8,color,.6);
    const rows=right?['AZIMUTH','ELEVATION','RANGE','LOCK CONFIDENCE']:['OCULAR SYNC','REACTOR OUTPUT','NEURAL LINK','FLIGHT SURFACES'];
    rows.forEach((label,i)=>{const yy=(21+i*22)*s;text(label,0,yy,8,color,.5);text([(yaw*33).toFixed(1)+'°',(pitch*-18).toFixed(1)+'°','000.00','100.00'][i],pw,yy,11,color,.9,'right');line(0,yy+6*s,pw,yy+6*s,color,.15);});
    for(let i=0;i<35;i++){ctx.globalAlpha=i%8===0?.8:.32;ctx.fillStyle=color;ctx.fillRect(i*pw/35,123*s,pw/55,(i%3+1)*3*s);}
    ctx.restore();
  }
  panel(w*(tight?-.035:.023),h*.12,C);panel(w*(tight?.79:.82),h*.13,C,true);
  ctx.save();ctx.translate(w*(tight?-.07:.025),h*.80);ctx.rotate(-.045);ctx.shadowColor=O;ctx.shadowBlur=3*s;
  text('J.A.R.V.I.S.  /  BIOMETRIC SCAN',0,0,13,O,.72);
  text('FACE ID: STARK, ANTHONY E.',0,19*s,8,C,.5);
  for(let row=0;row<3;row++)for(let col=0;col<11;col++){const xx=col*14*s,yy=(35+row*12)*s;ctx.globalAlpha=.22+(col%4)*.09;ctx.strokeStyle=O;ctx.lineWidth=.6*s;ctx.beginPath();ctx.arc(xx,yy,3.5*s,0,TAU);ctx.stroke();}
  ctx.restore();
  ctx.save();ctx.translate(w*.30,h*.65);ctx.rotate(-.045);ctx.shadowColor=C;ctx.shadowBlur=5*s;
  text('OPTICAL / RETINAL PROJECTION',0,0,10,C,.3);text('03   004.82   SYS-LINK',0,13*s,7,C,.24);
  ctx.restore();
  ctx.save();ctx.translate(w*.81,h*.88);ctx.rotate(.025);text('SYSTEMS NOMINAL',0,0,11,C,.62);text('DIAGNOSTIC / '+expression.toUpperCase(),0,17*s,7,C,.4);ctx.restore();
  for(let side=0;side<2;side++){const xx=side?w-22*s:22*s;for(let i=0;i<19;i++){const yy=h*.18+i*h*.031;line(xx,yy,xx+(side?-1:1)*(i%3===0?11:5)*s,yy,C,.22);}}
  line(w*.02,h*.065,w*.30,h*.082,O,.25);line(w*.71,h*.08,w*.99,h*.045,C,.32);
  text('STABILIZATION  '+(99.2+Math.sin(t*.1)*.15).toFixed(2),w*.025,h*.96,7,C,.42);
  text('DISPLAY / INTERNAL',w*.98,h*.96,7,C,.35,'right');
  ctx.restore();ctx.globalAlpha=1;
}
