import {fromReference,previewHousingPoint} from './hud-reference-model.js?v=rory-29f';
// Open layouts share a coordinate space, not a shared visible box. The islands
// occupy the upper tip, broad centre and lower arc of the diagnostic wing.
export const sectionLayouts={
  links:{height:820},
  about:{height:820,nodes:[[90,560],[225,655],[380,715],[535,640]]},
  video:{height:820,player:{left:52,top:250,width:520,height:328.25},audioY:685},
};
export function sectionPreviewPoint(id,u,v,aspect){
  if(!sectionLayouts[id])return previewHousingPoint(u,v,aspect);
  return fromReference(250-u*190,90+v*aspect*190);
}
