// Intersect the camera-to-pupil ray with the visor's local depth plane.
// Keeping the optic at that intersection preserves its screen alignment while
// letting the rest of the visor retain its actual depth and parallax.
export function eyeOnVisorPlane(camera,eye,depth){
  const dz=eye.z-camera.z;
  const t=Math.abs(dz)>1e-8?(depth-camera.z)/dz:0;
  return [camera.x+(eye.x-camera.x)*t,camera.y+(eye.y-camera.y)*t,depth];
}
