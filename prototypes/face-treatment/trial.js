// THROWAWAY visual comparison. No persistence or production integration.
const $ = id => document.getElementById(id);
const sheet = new Image();
const contexts = Object.fromEntries(['cut', 'blend', 'still'].map(id => [id, $(id).getContext('2d')]));
const variants = ['compare', 'cut', 'blend', 'still'];
const names = ['A + B / Side by side', 'A / Direct poses', 'B / Blended poses', 'C / Still control'];
let variant = new URLSearchParams(location.search).get('variant') || 'compare';
if (!variants.includes(variant)) variant = 'compare';
let x = 0, y = 0, tx = 0, ty = 0, last = performance.now(), replayStart = null, freezeStart = null, ready = false;
const route = [[0,0],[0,0],[-1,0],[1,0],[-1,-1],[1,-1],[1,1],[-1,1],[0,0],[-.6,0],[.6,0],[0,0]];
function setVariant(value) {
  variant = value;
  const url = new URL(location.href); url.searchParams.set('variant', value); history.replaceState(null, '', url);
  document.body.dataset.variant = value;
  $('cutView').hidden = !['compare', 'cut'].includes(value);
  $('blendView').hidden = !['compare', 'blend'].includes(value);
  $('stillView').hidden = value !== 'still';
  $('variantLabel').textContent = names[variants.indexOf(value)];
}
function cycle(step) { setVariant(variants[(variants.indexOf(variant) + step + variants.length) % variants.length]); }
$('previous').onclick = () => cycle(-1); $('next').onclick = () => cycle(1);
window.addEventListener('keydown', event => {
  if (event.target.closest('input,textarea,select,[contenteditable]')) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); cycle(event.key === 'ArrowLeft' ? -1 : 1); }
});
function stopReplay() { replayStart = null; $('replay').textContent = 'Replay motion'; }
$('stage').addEventListener('pointermove', event => {
  if ($('freeze').checked) return;
  stopReplay();
  const rect = $('stage').getBoundingClientRect();
  tx = Math.max(-1, Math.min(1, 2 * (event.clientX - rect.left) / rect.width - 1));
  ty = Math.max(-1, Math.min(1, 2 * (event.clientY - rect.top) / rect.height - 1));
});
$('stage').addEventListener('pointerleave', () => { if (replayStart === null && !$('freeze').checked) tx = ty = 0; });
$('center').onclick = () => { stopReplay(); $('freeze').checked = false; freezeStart = null; tx = ty = x = y = 0; };
$('replay').onclick = () => { if (replayStart !== null) {stopReplay(); return;} $('freeze').checked = false; freezeStart = null; replayStart = performance.now(); $('replay').textContent = 'Stop replay'; };
$('freeze').onchange = () => {
  if ($('freeze').checked) freezeStart = performance.now();
  else { if (freezeStart !== null && replayStart !== null) replayStart += performance.now()-freezeStart; freezeStart = null; }
};
$('hud').onchange = () => document.body.classList.toggle('no-hud', !$('hud').checked);
function drawCell(ctx, col, row, alpha = 1, dx = 0, dy = 0) {
  ctx.globalAlpha = alpha;
  const w = sheet.naturalWidth / 5, h = sheet.naturalHeight / 3;
  ctx.drawImage(sheet, col*w, row*h, w, h, dx, dy, 640, 640);
}
function clear(ctx) { ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#05090d'; ctx.fillRect(0,0,640,640); }
function render(now) {
  const dt = Math.min(0.1, (now-last)/1000); last = now;
  if (!$('freeze').checked) {
    if (replayStart !== null) {
      const elapsed = (now-replayStart)/1800, i = Math.floor(elapsed);
      if (i >= route.length-1) { stopReplay(); tx=ty=0; }
      else { const t = elapsed-i; tx=route[i][0]*(1-t)+route[i+1][0]*t; ty=route[i][1]*(1-t)+route[i+1][1]*t; }
    }
    const idle = $('idle').checked && replayStart === null && tx === 0 && ty === 0;
    const targetX = idle ? .08*Math.sin(now/1400) : tx, targetY = idle ? .035*Math.sin(now/2100) : ty;
    x += (targetX-x)*(1-Math.exp(-dt*14)); y += (targetY-y)*(1-Math.exp(-dt*14));
  }
  const range = Number($('range').value), col = 2 + x*2*range, row = 1 + y*range;
  const c0 = Math.floor(col), c1 = Math.min(4,c0+1), r0 = Math.floor(row), r1 = Math.min(2,r0+1), a=col-c0, b=row-r0;
  if (ready) {
    clear(contexts.cut); drawCell(contexts.cut,Math.round(col),Math.round(row));
    clear(contexts.blend);
    // Add weighted pixels against black: ordinary source-over opacity would distort the intended weights.
    contexts.blend.fillStyle = '#000'; contexts.blend.fillRect(0,0,640,640);
    contexts.blend.globalCompositeOperation = 'lighter';
    const samples=[[c0,r0,(1-a)*(1-b)],[c1,r0,a*(1-b)],[c0,r1,(1-a)*b],[c1,r1,a*b]];
    samples.forEach(([c,r,weight]) => { if(weight>0) drawCell(contexts.blend,c,r,weight); });
    contexts.blend.globalCompositeOperation = 'source-over'; contexts.blend.globalAlpha = 1;
    clear(contexts.still); drawCell(contexts.still,2,1,1,x*10,y*6);
    $('cutState').textContent = `Source: row ${Math.round(row)+1}, column ${Math.round(col)+1} / 1 frame`;
    $('blendState').textContent = samples.filter(p=>p[2]>.01).map(([c,r,w])=>`r${r+1}c${c+1} ${Math.round(w*100)}%`).join(' + ');
    $('stillState').textContent = `Source: center only / translation ${Math.round(x*10)}, ${Math.round(y*6)} px`;
  }
  $('target').textContent = `Mapped pose: ${(x*30*range).toFixed(1)}° yaw / ${(y*-12*range).toFixed(1)}° pitch (nominal)`;
  $('mode').textContent = $('freeze').checked ? 'Frozen' : replayStart !== null ? 'Shared motion replay' : $('idle').checked && tx===0 && ty===0 ? 'Idle sway · no blink' : 'Pointer control';
  requestAnimationFrame(render);
}
sheet.onload = () => { ready = true; $('loading').hidden = true; $('loading').style.display = 'none'; };
sheet.onerror = () => { $('loading').textContent = 'Pose sheet could not load. Serve this folder using the README command.'; };
sheet.src = 'assets/tony-pose-sheet.png';
setVariant(variant); requestAnimationFrame(render);
