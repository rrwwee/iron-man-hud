// A public snapshot works on static hosting without exposing an API credential.
export function validateVideoMetadata(value){
  if(value?.version!==1||!Array.isArray(value.videos))return [];
  return value.videos.filter(v=>typeof v.id==='string'&&Number.isSafeInteger(v.views)&&v.views>=0&&
    (v.likes===null||Number.isSafeInteger(v.likes)&&v.likes>=0)&&Number.isSafeInteger(v.duration)&&v.duration>=0&&Number.isFinite(Date.parse(v.fetchedAt)))
    .map(v=>({id:v.id,views:v.views,likes:v.likes,duration:v.duration,fetchedAt:v.fetchedAt}));
}
let pending;
export function loadVideoMetadata(){
  // No approved Data API snapshot is configured; do not scrape or invent counts.
  return pending??=Promise.resolve([]);
}
