import assert from 'node:assert/strict';
import {canonicalSiteUrl} from '../site-url.js';
for(const query of ['', '?variant=visor','?variant=targeting&selector=arc','?debug=1&material=clay&light=inspection&motion=wide','?media=local-preview']){
  assert.equal(canonicalSiteUrl('https://rrwwee.github.io/iron-man-hud/'+query),'/iron-man-hud/');
}
assert.equal(canonicalSiteUrl('http://127.0.0.1:4188/?variant=diagnostic#about'),'/#about');
console.log('Canonical HUD URL: all historical option URLs resolve to the same site, preserving anchors.');
