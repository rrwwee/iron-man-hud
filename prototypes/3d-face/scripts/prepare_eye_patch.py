"""Crop/encode a generated closed-eye portrait into the small runtime patch.

Run with Blender --background --python this_file -- source_image output.jpg.
This only prepares a texture atlas; the eyelid artwork comes from imagegen.
The top-origin source rectangle is x=.23..77, y=.34..52.
"""
import sys
import bpy
import numpy as np

source, destination = sys.argv[sys.argv.index("--") + 1:]
image = bpy.data.images.load(source)
width, height = image.size
pixels = np.array(image.pixels[:], dtype=np.float32).reshape(height, width, 4)
crop = pixels[round(height * .48):round(height * .66),
              round(width * .23):round(width * .77)]
patch = bpy.data.images.new("Closed eyelids", width=crop.shape[1], height=crop.shape[0])
patch.pixels.foreach_set(crop.flatten())
patch.scale(512, 170)
patch.file_format = "JPEG"
patch.filepath_raw = destination
bpy.context.scene.render.image_settings.quality = 90
patch.save()
print("EYE_PATCH_SAVED", destination)
