// Small orthographic 3D globe, drawn into the existing curved HUD texture.
// Coastlines: public-domain Natural Earth 1:110m land, simplified offline.
const rad=Math.PI/180,lat=37.7749*rad,lon=-122.4194*rad;
const xyz=([lng,phi])=>{const a=lng*rad,b=phi*rad;return [Math.cos(b)*Math.sin(a),Math.sin(b),Math.cos(b)*Math.cos(a)];};
export function createGlobeInstrument({invalidate}){
  let yaw=-lon,pitch=lat,ty=yaw,tp=pitch,zoom=1,tz=1,land=[];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const grid=[];
  for(let a=-150;a<=180;a+=30)grid.push(Array.from({length:73},(_,i)=>xyz([a,-90+i*2.5])));
  for(let b=-60;b<=60;b+=30)grid.push(Array.from({length:145},(_,i)=>xyz([-180+i*2.5,b])));
  fetch('./assets/globe-land.json').then(r=>r.json()).then(rings=>{land=rings.map(r=>r.map(xyz));invalidate();});
  const clock=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour:'numeric',minute:'2-digit',timeZoneName:'short'});
  const timer=setInterval(()=>{if(!document.hidden)invalidate();},60000);
  window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
  function project(p){const a=p[0]*Math.cos(yaw)+p[2]*Math.sin(yaw),z=-p[0]*Math.sin(yaw)+p[2]*Math.cos(yaw),b=p[1]*Math.cos(pitch)-z*Math.sin(pitch),d=p[1]*Math.sin(pitch)+z*Math.cos(pitch);return [256+a*174*zoom,226-b*174*zoom,d];}
  function lines(c,paths,color){c.strokeStyle=color;c.lineWidth=1;c.beginPath();for(const path of paths){let pen=false;for(const p of path){const [x,y,z]=project(p);if(z<-.02){pen=false;continue;}if(!pen)c.moveTo(x,y);else c.lineTo(x,y);pen=true;}}c.stroke();}
  return {
    draw(c){
      c.clearRect(0,0,512,512);c.save();c.beginPath();c.arc(256,226,175*zoom,0,Math.PI*2);c.clip();
      lines(c,grid,'#497f8e88');lines(c,land,'#a8e9f2');c.restore();
      c.strokeStyle='#81c5d699';c.lineWidth=1;c.beginPath();c.arc(256,226,175*zoom,0,Math.PI*2);c.stroke();
      const [px,py,pz]=project(xyz([-122.4194,37.7749]));
      if(pz>0){c.strokeStyle='#e8bb87';c.lineWidth=1.5;c.beginPath();c.arc(px,py,9,0,Math.PI*2);c.stroke();c.fillStyle='#ffe0b1';c.beginPath();c.arc(px,py,3,0,Math.PI*2);c.fill();}
      c.fillStyle='#b9e9ef';c.textAlign='center';c.font='22px Arial';c.fillText('San Francisco',256,437);
      c.fillStyle='#90b7c2';c.font='14px Arial';c.fillText(clock.format(new Date()),256,460);
      c.fillStyle='#d9b78f';c.font='13px Arial';c.fillText('↗ Open map',256,493);
      c.textAlign='left';
    },
    drag(dx,dy){ty+=dx*.012;tp=Math.max(-1.35,Math.min(1.35,tp+dy*.009));yaw=ty;pitch=tp;invalidate();},
    zoom(delta){tz=Math.max(.7,Math.min(1.12,tz-delta*.001));if(reduced)zoom=tz;invalidate();},
    home(){ty=yaw+Math.atan2(Math.sin(-lon-yaw),Math.cos(-lon-yaw));tp=lat;tz=1;if(reduced){yaw=ty;pitch=tp;zoom=tz;}invalidate();},
    turn(delta){ty+=delta;if(reduced)yaw=ty;invalidate();},
    tick(){const active=Math.abs(ty-yaw)+Math.abs(tp-pitch)+Math.abs(tz-zoom)>.0005;if(active){yaw+=(ty-yaw)*.18;pitch+=(tp-pitch)*.18;zoom+=(tz-zoom)*.18;}return active;},
    get moving(){return Math.abs(ty-yaw)+Math.abs(tp-pitch)+Math.abs(tz-zoom)>.0005;},
    get state(){return {yaw,pitch,zoom};},
  };
}
