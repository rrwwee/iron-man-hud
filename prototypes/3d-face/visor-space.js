// Disposable scene layout: meters relative to the same eye-height pivot.
// Every instrument occupies the forward hemisphere of one virtual visor.
export const visor = { pivotY: 1.619, pivotZ: .025, radius: .19, centerZ: 0 };
export function visorDepth(x,y=0){return visor.centerZ+Math.sqrt(Math.max(.0001,visor.radius**2-x*x-y*y));}
export function frameCamera(camera,aspect){
  camera.aspect=aspect;
  camera.position.set(0,1.619,.18+.37*Math.max(1,1.6/aspect));
  camera.lookAt(0,1.615,.025);camera.updateProjectionMatrix();
}
