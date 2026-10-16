import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {validateVideoMetadata} from '../video-metadata.js';
await assert.rejects(fs.access(new URL('../assets/youtube-public.json',import.meta.url)),{code:'ENOENT'});
const valid={id:'test',views:20,likes:null,duration:85,fetchedAt:'2026-10-15T00:00:00Z',privateField:'discard'};
assert.deepEqual(validateVideoMetadata({version:1,videos:[valid]}),[{id:'test',views:20,likes:null,duration:85,fetchedAt:valid.fetchedAt}]);
for(const invalid of [{views:-1},{likes:-1},{views:1.5},{duration:-5},{fetchedAt:'bad'}])assert.equal(validateVideoMetadata({version:1,videos:[{...valid,...invalid}]}).length,0);
assert.deepEqual(validateVideoMetadata(null),[]);
console.log('Public video metadata: requested IDs, valid counts, unknown likes, invalid data and field filtering pass.');
