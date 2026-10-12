"""Fast resource-budget check for the face-only trial's shipped GLB."""
import json
import struct
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "assets" / "tony-head.glb"
data = path.read_bytes()
size = struct.unpack_from("<I", data, 12)[0]
model = json.loads(data[20:20 + size])
bones = max(len(s["joints"]) for s in model.get("skins", [{"joints": []}]))
morphs = max(len(p.get("targets", [])) for m in model["meshes"] for p in m["primitives"])
triangles = sum(model["accessors"][p["indices"]]["count"] // 3 for m in model["meshes"] for p in m["primitives"])
result = {"bytes": len(data), "bones": bones, "max_morphs": morphs, "triangles": triangles,
          "meshes": len(model["meshes"]), "images": len(model.get("images", []))}
print(json.dumps(result, indent=2))
violations = []
for label, value, limit in [("bytes", len(data), 3_000_000), ("bones", bones, 4),
                            ("morphs", morphs, 16), ("triangles", triangles, 12_000),
                            ("meshes", len(model["meshes"]), 6)]:
    if value > limit:
        violations.append(f"{label}: {value} exceeds {limit}")
face = next(m for m in model["meshes"] if m["name"].startswith("base"))
for primitive in face["primitives"]:
    bounds = model["accessors"][primitive["attributes"]["POSITION"]]
    low, high = bounds["min"], bounds["max"]
    if low[1] < 1.49 or low[0] < -0.075 or high[0] > 0.075 or low[2] < 0.01:
        violations.append("face bounds include the neck, ears, or rear head")
if violations:
    raise SystemExit("FACE BUDGET FAIL: " + "; ".join(violations))
print("FACE BUDGET PASS")
