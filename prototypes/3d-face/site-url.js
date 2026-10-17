// Historical trial links resolve to the one published HUD.
export function canonicalSiteUrl(value){
  const url=new URL(value);
  url.search='';
  return url.pathname+url.hash;
}
