// One preview and one expanded item; the expanded item is absent from the menu.
export function createHUDSelection(ids){
  if(ids.length<2||new Set(ids).size!==ids.length)throw new Error('Unique HUD items required');
  const order=[...ids];let selected=order[0],expanded=null;
  const available=()=>order.filter(id=>id!==expanded);
  return {
    get selected(){return selected;},get expanded(){return expanded;},get available(){return available();},
    select(id){if(!available().includes(id))return false;selected=id;return true;},
    browse(delta){const list=available();selected=list[(list.indexOf(selected)+delta%list.length+list.length)%list.length];return selected;},
    expand(){const moved=selected,returned=expanded;expanded=moved;let i=order.indexOf(moved);do{i=(i+1)%order.length;}while(order[i]===expanded);selected=returned||order[i];return {moved,returned};},
    close(){const returned=expanded;expanded=null;if(returned)selected=returned;return returned;},
  };
}
