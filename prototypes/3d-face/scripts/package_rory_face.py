"""Package the fitted face for the HUD without changing its accepted geometry.

Authoring inputs stay private. The output contains only the mesh and baked atlas;
unused authoring vertex colors are removed losslessly.
"""
import argparse
import json
from pathlib import Path
import struct

root = Path(__file__).resolve().parents[3]
parser = argparse.ArgumentParser()
parser.add_argument('--input', type=Path, default=root / '.private-assets/new-face/nose-refinement/final/rory-face-animated.glb')
parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'assets/rory-head.glb')
args = parser.parse_args()
raw = args.input.read_bytes()
magic, version, length = struct.unpack_from('<III', raw)
assert (magic, version, length) == (0x46546C67, 2, len(raw))
chunks, offset = {}, 12
while offset < length:
    size, kind = struct.unpack_from('<II', raw, offset)
    offset += 8
    chunks[kind] = raw[offset:offset + size]
    offset += size
doc = json.loads(chunks[0x4E4F534A])
assert not doc.get('animations') and not doc.get('skins'), 'Expected a fitted face without timeline animation or a skeleton'
accessors = set()
for mesh in doc['meshes']:
    for primitive in mesh['primitives']:
        primitive['attributes'] = {k: v for k, v in primitive['attributes'].items() if not k.startswith('COLOR_')}
        accessors.update(primitive['attributes'].values())
        accessors.add(primitive['indices'])
        for target in primitive.get('targets', []):
            accessors.update(target.values())
accessor_ids = {old: new for new, old in enumerate(sorted(accessors))}
kept = [doc['accessors'][old] for old in sorted(accessors)]
views = {a['bufferView'] for a in kept if 'bufferView' in a} | {i['bufferView'] for i in doc.get('images', [])}
for accessor in kept:
    if 'sparse' in accessor:
        views.update(accessor['sparse'][key]['bufferView'] for key in ('indices', 'values'))
view_ids, packed, new_views = {}, bytearray(), []
for old in sorted(views):
    view = dict(doc['bufferViews'][old])
    assert view['buffer'] == 0
    while len(packed) % 4:
        packed.append(0)
    start = view.get('byteOffset', 0)
    data = chunks[0x004E4942][start:start + view['byteLength']]
    view['byteOffset'] = len(packed)
    packed.extend(data)
    view_ids[old] = len(new_views)
    new_views.append(view)
for accessor in kept:
    if 'bufferView' in accessor:
        accessor['bufferView'] = view_ids[accessor['bufferView']]
    if 'sparse' in accessor:
        for key in ('indices', 'values'):
            entry = accessor['sparse'][key]
            entry['bufferView'] = view_ids[entry['bufferView']]
for image in doc.get('images', []):
    image['bufferView'] = view_ids[image['bufferView']]
for mesh in doc['meshes']:
    for primitive in mesh['primitives']:
        primitive['indices'] = accessor_ids[primitive['indices']]
        primitive['attributes'] = {k: accessor_ids[v] for k, v in primitive['attributes'].items()}
        primitive['targets'] = [{k: accessor_ids[v] for k, v in target.items()} for target in primitive.get('targets', [])]
        if not primitive['targets']:
            del primitive['targets']
doc['accessors'], doc['bufferViews'] = kept, new_views
doc['buffers'] = [{'byteLength': len(packed)}]
encoded = json.dumps(doc, separators=(',', ':')).encode()
encoded += b' ' * (-len(encoded) % 4)
packed += b'\0' * (-len(packed) % 4)
result = struct.pack('<III', magic, 2, 28 + len(encoded) + len(packed))
result += struct.pack('<II', len(encoded), 0x4E4F534A) + encoded
result += struct.pack('<II', len(packed), 0x004E4942) + packed
args.output.write_bytes(result)
print(f'Packaged {args.output}: {len(raw):,} → {len(result):,} bytes; geometry unchanged')
