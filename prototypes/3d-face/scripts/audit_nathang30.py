"""Resource and control checks for the disposable Nathang30 head trial."""
import json
import math
import struct
from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / 'assets/nathang30-head.glb'
data = path.read_bytes()
length = struct.unpack_from('<I', data, 12)[0]
gltf = json.loads(data[20:20+length])
triangles = sum(gltf['accessors'][p['indices']]['count']//3
                for m in gltf['meshes'] for p in m['primitives'])
names = set(name for m in gltf['meshes'] for name in m.get('extras', {}).get('targetNames', []))
assert names == {'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight', 'browDownLeft',
                 'mouthSmileLeft', 'mouthSmileRight', 'jawOpen', 'eyeBlinkLeft', 'eyeBlinkRight'}, names
eyelids = root / 'assets/nathang30-closed-eyes.jpg'
size = len(data) + (eyelids.stat().st_size if eyelids.exists() else 0)
assert size < 1_500_000, size
assert triangles < 10_000, triangles
assert len(gltf['meshes']) == 3
assert not gltf.get('skins') and not gltf.get('animations')
for mesh in gltf['meshes']:
    for primitive in mesh['primitives']:
        bounds = gltf['accessors'][primitive['attributes']['POSITION']]
        assert all(math.isfinite(v) for v in bounds['min'] + bounds['max'])
        assert bounds['min'][1] > 1.52, 'Neck retained'
        assert max(abs(bounds['min'][0]), abs(bounds['max'][0])) < .073, 'Ears retained'
        assert len(primitive.get('targets', [])) <= 7
print(json.dumps({'runtime_asset_bytes': size, 'triangles': triangles, 'meshes': 3,
                  'custom_morphs': sorted(names), 'bones': 0}, indent=2))
print('NATHANG30 BUDGET PASS')
