// Only explicitly public profile fields enter the HUD. Never needs an API token.
export function cleanProfile(value){
  if(value?.login!=='rrwwee'||![value.followers,value.public_repos].every(n=>Number.isSafeInteger(n)&&n>=0))return null;
  const text=v=>typeof v==='string'?v.replace(/[\u0000-\u001f]/g,' ').trim().slice(0,180):'';
  return {login:value.login,name:text(value.name),bio:text(value.bio),followers:value.followers,public_repos:value.public_repos};
}
export async function loadPublicProfile({fetcher=fetch,storage,now=Date.now()}={}){
  const key='hud:github-profile:v1',freshFor=3600000;
  try{storage??=globalThis.localStorage;}catch{storage=null;}
  let saved;
  try{saved=JSON.parse(storage?.getItem(key)||'null');}catch{}
  const cached=cleanProfile(saved?.profile);
  if(cached&&now-saved.at>=0&&now-saved.at<freshFor)return {...cached,status:'live'};
  try{
    const response=await fetcher('https://api.github.com/users/rrwwee',{signal:AbortSignal.timeout(5000),credentials:'omit'});
    if(!response.ok)throw new Error('Profile unavailable');
    const profile=cleanProfile(await response.json());if(!profile)throw new Error('Invalid profile');
    try{storage?.setItem(key,JSON.stringify({at:now,profile}));}catch{}
    return {...profile,status:'live'};
  }catch{
    if(cached)return {...cached,status:'saved'};
    try{const response=await fetcher('./assets/github-profile.json');if(!response.ok)return null;const profile=cleanProfile(await response.json());return profile?{...profile,status:'saved'}:null;}catch{return null;}
  }
}
