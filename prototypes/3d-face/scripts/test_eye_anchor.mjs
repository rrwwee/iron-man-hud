import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {eyeOnVisorPlane} from '../hud-eye-anchor.js';

for(const aspect of [1,16/9,2.5]){
  const camera=new THREE.PerspectiveCamera(26,aspect,.01,10);
  camera.position.set(0,1.619,.55);camera.lookAt(0,1.615,.025);camera.updateMatrixWorld();
  for(const yaw of [-.61,-.3,0,.3,.61])for(const pitch of [-.12,0,.12]){
    const visor=new THREE.Object3D();visor.position.set(0,1.619,.025);visor.rotation.set(pitch,yaw,0,'YXZ');visor.updateMatrixWorld();
    const pupil=new THREE.Vector3(.033,.0062,.048);
    const eyeWorld=pupil.clone().applyMatrix4(visor.matrixWorld);
    const cameraLocal=visor.worldToLocal(camera.position.clone());
    const optic=new THREE.Vector3(...eyeOnVisorPlane(cameraLocal,pupil,.105));
    assert.equal(optic.z,.105,'Optic remains on its forward visor layer');
    const projectedOptic=optic.applyMatrix4(visor.matrixWorld).project(camera);
    const projectedEye=eyeWorld.project(camera);
    assert.ok(Math.hypot(projectedEye.x-projectedOptic.x,projectedEye.y-projectedOptic.y)<1e-10,
      `Pupil alignment: aspect ${aspect}, yaw ${yaw}, pitch ${pitch}`);
  }
}
assert.ok(eyeOnVisorPlane({x:0,y:0,z:1},{x:1,y:1,z:1},.1).every(Number.isFinite));
console.log('Eye optic stays over the projected pupil across visor turns and aspect ratios.');
