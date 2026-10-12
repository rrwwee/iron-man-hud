"""Crop the matching generated closed-eye render; run through Blender with -- <image>."""
from pathlib import Path
import bpy
import json
import sys

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[sys.argv.index('--')+1])
image = bpy.data.images.load(str(source))
width, height = image.size
pixels = list(image.pixels)
# Normalized top-origin bounds, also used in nathang30-viewer.js.
left, top, right, bottom = .30, .43, .72, .66
x0, x1 = round(left*width), round(right*width)
y0, y1 = round((1-bottom)*height), round((1-top)*height)
cropped = []
for y in range(y0, y1):
    cropped.extend(pixels[(y*width+x0)*4:(y*width+x1)*4])
out = bpy.data.images.new('Nathang30 closed eyes', width=x1-x0, height=y1-y0)
out.pixels = cropped
out.scale(512, 280)
out.file_format = 'JPEG'
out.filepath_raw = str(root/'assets/nathang30-closed-eyes.jpg')
out.save()
record = {'generated_source': str(source), 'reference': 'Front render of user-supplied Nathang30 model',
          'tool': 'image_gen', 'edit': 'Close both eyelids; preserve pose, framing, likeness, lighting and all other features',
          'crop_top_origin': [left, top, right, bottom], 'size': [512,280],
          'purpose': 'Approximate texture blink on the original fitted eye surfaces',
          'license': 'Derivative supplied under CC BY-NC-SA 4.0; see NATHANG30-LICENSE.md'}
(root/'assets/nathang30-lids-provenance.json').write_text(json.dumps(record, indent=2)+'\n')
