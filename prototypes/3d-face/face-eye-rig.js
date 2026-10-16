// Authored for rory-face-animated.glb. Angles are radians; +yaw is screen right, +pitch down.
// Screen-side names are intentional. The accepted neutral face is the zero state.
const ANCHORS = {"left": {"base": [-0.20573528973224461, 0.004046382708310592, 0.016030829613486564], "deltas": {"left": [-0.009285756957318453, 0.0, -0.0031908198552519362], "right": [0.009902454525887838, 0.0, 0.003412269929583149], "up": [0.0, 0.00444198543459208, -0.000855618881278811], "down": [0.0, -0.005714878215437123, 0.0010980104408744376]}, "triangle": [140226, 140230, 140229], "barycentric": [0.13312858093240199, 0.409897374955161, 0.45697404411243703]}, "right": {"base": [0.21135787421349522, 0.010219661758292246, 0.0043861313353978915], "deltas": {"left": [-0.0100494052645764, 0.0, 0.002489829319628263], "right": [0.009381418078603043, 0.0, -0.0023934826077239017], "up": [0.0, 0.004581389518807415, -0.0004555464313632483], "down": [0.0, -0.005666509353277702, 0.0004310598656090611]}, "triangle": [8750, 49512, 142157], "barycentric": [0.4588998649097272, 0.14225668263719768, 0.3988434524530751]}};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : 0));
export function createFaceEyeRig(root) {
  const face = root.getObjectByName('face');
  const eyes = { left: root.getObjectByName('eye_left'), right: root.getObjectByName('eye_right') };
  if (!face?.morphTargetDictionary || !eyes.left?.morphTargetDictionary || !eyes.right?.morphTargetDictionary) {
    throw new Error('Rory eye rig: expected face, eye_left and eye_right morph meshes.');
  }
  const state = { yaw: 0, pitch: 0, blinkLeft: 0, blinkRight: 0 };
  const weights = { left: 0, right: 0, up: 0, down: 0 };
  function set(mesh, key, value) {
    const index = mesh.morphTargetDictionary[key];
    if (index !== undefined) mesh.morphTargetInfluences[index] = value;
  }
  function apply({ blinkLeft = 0, blinkRight = 0, yaw = 0, pitch = 0 } = {}) {
    let x = clamp(yaw / (Math.PI / 18), -1, 1);
    let y = clamp(pitch / (7 * Math.PI / 180), -1, 1);
    const diagonal = Math.max(1, Math.hypot(x, y)); x /= diagonal; y /= diagonal;
    weights.left = Math.max(0, -x); weights.right = Math.max(0, x);
    weights.up = Math.max(0, -y); weights.down = Math.max(0, y);
    state.yaw = x * Math.PI / 18; state.pitch = y * 7 * Math.PI / 180;
    state.blinkLeft = clamp(blinkLeft, 0, 1); state.blinkRight = clamp(blinkRight, 0, 1);
    for (const side of ['left', 'right']) {
      const b = side === 'left' ? state.blinkLeft : state.blinkRight;
      set(face, `blink_${side}_half`, b <= .5 ? b * 2 : 2 * (1 - b));
      set(face, `blink_${side}_closed`, Math.max(0, 2 * b - 1));
      for (const direction of ['left', 'right', 'up', 'down']) set(eyes[side], `gaze_${side}_${direction}`, weights[direction]);
    }
    return state;
  }
  function getPupilPosition(side, target) {
    if (!ANCHORS[side]) throw new Error('Pupil side must be left or right (screen side).');
    const a = ANCHORS[side];
    target.set(...a.base);
    for (const direction of ['left', 'right', 'up', 'down']) {
      const d = a.deltas[direction], w = weights[direction];
      target.x += d[0] * w; target.y += d[1] * w; target.z += d[2] * w;
    }
    return target;
  }
  function getPupilWorldPosition(side, target) {
    getPupilPosition(side, target);
    eyes[side].updateWorldMatrix(true, false);
    return eyes[side].localToWorld(target);
  }
  apply();
  return { apply, getPupilPosition, getPupilWorldPosition, state, meshes: { face, ...eyes } };
}
