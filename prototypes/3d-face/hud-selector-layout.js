import {fromReference} from './hud-reference-model.js?v=selector-3';
// The single published selector: six recessed controls along the lower rim.
export function buttonRowPoint(i){return fromReference(240-i*42,475+(i-2.5)**2*2.4);}
