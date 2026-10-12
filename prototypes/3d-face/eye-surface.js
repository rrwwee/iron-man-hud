// Disposable comparison: blend photographic eyes over the generic sockets.
import * as THREE from 'three';

export function createEyeSurface(original, gaze, lids, lidTexture, lidReady, relaxation) {
  const positions=[],uvs=[],indices=[],joints=[],weights=[];
  const headIndex=original.skeleton.bones.findIndex(b=>b.name==='head');
  for(const side of [-1,1]){
    const start=positions.length/3;
    for(let row=0;row<=4;row++)for(let col=0;col<=8;col++){
      const u=col/4-1,v=row/2-1;
      const x=side*.0287+u*.021,y=1.626+v*.016;
      // Feather the photograph over the mismatched generic eye socket. It
      // remains a shallow surface attached to the head, not a screen overlay.
      const z=.155-.009*(u*u+v*v);
      positions.push(x,y,z);uvs.push(.5+x*4.38,.410+(1.626-y)*4.18);
      joints.push(headIndex,0,0,0);weights.push(1,0,0,0);
      if(row<4&&col<8){const a=start+row*9+col;indices.push(a,a+1,a+10,a,a+10,a+9);}
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(joints,4));
  geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const material=original.material.clone();
  material.name='Photographic_Eyes';material.roughness=1;
  material.transparent=true;material.depthWrite=false;material.side=THREE.FrontSide;
  if('specularIntensity' in material)material.specularIntensity=0;
  material.onBeforeCompile=shader=>{
    shader.uniforms.eyeGaze=gaze;
    shader.uniforms.eyeRelaxation=relaxation;
    shader.uniforms.lidClosure=lids;shader.uniforms.lidTexture={value:lidTexture};shader.uniforms.lidReady=lidReady;
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 eyePoint;').replace('#include <begin_vertex>','#include <begin_vertex>\neyePoint=position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec2 eyeGaze;\nuniform vec2 eyeRelaxation;\nuniform vec2 lidClosure;\nuniform sampler2D lidTexture;\nuniform float lidReady;\nvarying vec3 eyePoint;').replace('#include <map_fragment>',`
#ifdef USE_MAP
vec2 irisCenter=vec2(eyePoint.x>0.0?0.626:0.374,0.410);
float irisMask=1.0-smoothstep(0.025,0.065,length(vMapUv-irisCenter));
vec2 portraitUV=irisCenter+(vMapUv-irisCenter)*vec2(1.08,1.12);
vec2 eyeUV=portraitUV-vec2(eyeGaze.x*0.065,-eyeGaze.y*0.065)*irisMask;
vec4 eyeColor=texture2D(map,eyeUV);
float closure=eyePoint.x>0.0?lidClosure.x:lidClosure.y;
float relaxed=eyePoint.x>0.0?eyeRelaxation.x:eyeRelaxation.y;
if(relaxed>0.001 && lidReady>0.5){
  float across=clamp((portraitUV.x-irisCenter.x)/0.066,-1.0,1.0);
  float arc=across*across;
  float closedLine=0.443-0.024*arc;
  float upper=mix(0.389+0.020*arc,0.398+0.014*arc,relaxed);
  float corner=1.0-smoothstep(0.82,1.0,abs(across));
  float upperMask=smoothstep(0.369,0.384,portraitUV.y)*(1.0-smoothstep(upper-0.0015,upper+0.0015,portraitUV.y))*corner;
  if(upperMask>0.001){
    vec2 lidUV=portraitUV;
    lidUV.y=0.365+(portraitUV.y-0.365)*(closedLine-0.365)/(upper-0.365);
    vec4 lidSkin=texture2D(lidTexture,(lidUV-vec2(0.23,0.34))/vec2(0.54,0.18));
    eyeColor=mix(eyeColor,lidSkin,upperMask*smoothstep(0.0,0.15,relaxed));
  }
}
if(closure>0.001 && lidReady>0.5){
  eyeColor=mix(eyeColor,texture2D(lidTexture,(portraitUV-vec2(0.23,0.34))/vec2(0.54,0.18)),closure);
}
float feather=1.0-smoothstep(0.70,1.0,length((vMapUv-irisCenter)/vec2(0.09,0.067)));
diffuseColor*=eyeColor;
diffuseColor.a*=feather;
#endif`);
  };
  material.customProgramCacheKey=()=> 'photographic-eyes-relaxed-v1';
  const surface=new THREE.SkinnedMesh(geometry,material);
  surface.name='Photographic_Eyes';surface.frustumCulled=false;
  surface.renderOrder=1;
  surface.bind(original.skeleton,original.bindMatrix);
  surface.position.copy(original.position);surface.quaternion.copy(original.quaternion);surface.scale.copy(original.scale);
  original.parent.add(surface);
  return surface;
}
