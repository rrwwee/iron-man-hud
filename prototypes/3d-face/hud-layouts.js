import {diagnosticBounds,referenceToVisor} from './hud-reference-model.js?v=selector-3';
// One visor assembly, measured relative to the face's resting coordinate frame.
export const layoutKey='optical';
export const layout={
  name:'Mark VII', letter:'A',
  menuBounds:diagnosticBounds,
  preview:[...referenceToVisor(207,238),.034], content:[.078,-.025,.094],
  globe:[...referenceToVisor(149,216),.0175], suit:[referenceToVisor(207,238)[0],referenceToVisor(207,238)[1]-.012,.060],
  expandedGlobe:[.095,-.006,.038], expandedSuit:[.095,-.006,.100],
  optic:[.0303,.0062,.105],
};
export const layouts={optical:layout};
document.body.dataset.look=layoutKey;
