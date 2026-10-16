// Opt-in local diagnostic: ?motionAudit records rendered local-space poses.
// No telemetry is sent; the last transfer trace is exposed on the stage for tests.
import {transferPhase} from './hud-transfer.js?v=rory-29f';
export function createMotionAudit(stage,read){
  let trace=null;
  const capture=()=>({at:performance.now(),objects:read()});
  return {
    start(transfer){trace={transfer:{...transfer},samples:[capture()]};stage.dataset.motionAudit='recording';},
    sample(){if(!trace)return;trace.samples.push(capture());if(trace.transfer.duration?performance.now()-trace.transfer.at>=trace.transfer.duration:transferPhase(performance.now(),trace.transfer).done){stage.dataset.motionTrace=JSON.stringify(trace);stage.dataset.motionAudit='complete';trace=null;}},
  };
}
