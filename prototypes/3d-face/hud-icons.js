// Tiny vector glyphs shared by the interactive instruments; no image/font payload.
export function drawIcon(c,name,x,y,size,color='#a3e7f0'){
  c.save();c.translate(x,y);c.scale(size/24,size/24);c.strokeStyle=color;c.fillStyle=color;c.lineWidth=1.5;c.lineCap='round';c.lineJoin='round';
  const line=(...p)=>{c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.stroke();};
  const circle=(x,y,r)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();};
  if(name==='views'){c.beginPath();c.ellipse(0,0,10,6,0,0,Math.PI*2);c.stroke();circle(0,0,2.5);}
  else if(name==='like'){line(-9,-1,-5,-1,-5,9,-9,9,-9,-1);line(-3,9,-3,-1,1,-8,4,-8,4,-1,10,-1,8,9,-3,9);}
  else if(name==='clock'){circle(0,0,10);line(0,-6,0,0,5,3);}
  else if(name==='flight'){line(0,-11,2,-3,10,2,10,4,2,1,2,7,5,10,5,11,0,9,-5,11,-5,10,-2,7,-2,1,-10,4,-10,2,-2,-3,0,-11);}
  else if(name==='about'){circle(0,-4,4);c.beginPath();c.arc(0,8,8,Math.PI,0);c.stroke();}
  else if(name==='work'){c.strokeRect(-9,-5,18,13);line(-4,-5,-4,-9,4,-9,4,-5);line(-9,0,9,0);line(0,-2,0,3);}
  else if(name==='video'){c.beginPath();c.moveTo(-5,-8);c.lineTo(8,0);c.lineTo(-5,8);c.closePath();c.stroke();}
  else if(name==='audio'){for(let i=-3;i<=3;i++){const h=[3,6,9,5,9,6,3][i+3];line(i*3,-h,i*3,h);}}
  else if(name==='axis-x'||name==='axis-y'){if(name==='axis-y')c.rotate(-Math.PI/2);line(-9,0,9,0,5,-4);line(9,0,5,4);line(0,-3,0,3);}
  else if(name==='radius'){circle(-5,5,2);line(-3,3,8,-8,3,-8);line(8,-8,8,-3);}
  else if(name==='notes'||name==='cv'){line(-8,-10,5,-10,9,-6,9,10,-8,10,-8,-10);line(4,-10,4,-5,9,-5);for(let y=-1;y<7;y+=4)line(-4,y,5,y);}
  else if(name==='x'){line(-8,-9,8,9);line(8,-9,-8,9);}
  else if(name==='linkedin'){c.font='bold 21px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText('in',0,1);}
  else if(name==='github'){line(-6,-8,-6,7,6,7,6,-2);circle(-6,-9,2);circle(-6,8,2);circle(6,-4,2);}
  else if(name==='codex'){for(let i=0;i<6;i++){c.save();c.rotate(i*Math.PI/3);line(0,2,7,6,9,2);c.restore();}}
  else if(name==='education'){line(-11,-3,0,-9,11,-3,0,3,-11,-3);line(-7,0,-7,6,0,9,7,6,7,0);line(11,-3,11,6);}
  else if(name==='award'){circle(0,-3,6);line(-4,2,-6,11,0,8,6,11,4,2);}
  else if(name==='sail'){line(0,-10,0,5,-10,5,0,-10);line(2,-6,9,4,2,4,2,-6);line(-11,8,10,8,5,11,-6,11,-11,8);}
  else if(name==='suit'){line(-8,-9,8,-9,10,-2,6,9,-6,9,-10,-2,-8,-9);line(-7,-1,-2,0);line(2,0,7,-1);line(-4,5,4,5);}
  else if(name==='left'||name==='right'){const d=name==='left'?-1:1;c.scale(d,1);c.beginPath();c.arc(0,0,8,-2.3,2.3);c.stroke();line(-6,6,-7,1,-2,3);}
  else if(name==='explode'||name==='assemble'){
    const d=name==='explode'?1:-1;for(let i=0;i<4;i++){c.save();c.rotate(i*Math.PI/2);line(0,3,0,10);if(d===1)line(-3,7,0,10,3,7);else line(-3,6,0,3,3,6);c.restore();}
  }else if(name==='globe'){circle(0,0,9);c.beginPath();c.ellipse(0,0,4,9,0,0,Math.PI*2);c.stroke();line(-9,0,9,0);}
  else if(name==='links'){circle(-5,-3,5);circle(5,3,5);line(-3,1,3,-1);}
  else if(name==='expand'){line(-9,-3,-9,-9,-3,-9);line(3,9,9,9,9,3);line(-9,-9,-2,-2);line(9,9,2,2);}
  else if(name==='map'){line(-10,-7,-3,-10,4,-7,10,-10,10,7,4,10,-3,7,-10,10,-10,-7);line(-3,-10,-3,7);line(4,-7,4,10);}
  else if(name==='close'){line(-6,-6,6,6);line(-6,6,6,-6);}
  c.restore();
}
