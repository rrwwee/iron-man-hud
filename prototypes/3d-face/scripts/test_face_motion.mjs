import assert from 'node:assert/strict';
import {makeBlinkPlan, blinkWeight, gazeTarget, dampGaze} from '../face-motion.js';

for (const random of [() => 0, () => .5, () => .999]) {
  const plan = makeBlinkPlan(random);
  assert.ok(plan.close < plan.open, 'Lids close faster than they reopen');
  assert.ok(plan.close + plan.hold + plan.open < .35);
  assert.equal(blinkWeight(-1, plan), 0);
  assert.equal(blinkWeight(plan.close, plan), 1);
  assert.equal(blinkWeight(plan.close + plan.hold + plan.open, plan), 0);
  let previous = 0;
  for (let t = 0; t < plan.close; t += .001) {
    const weight = blinkWeight(t, plan);
    assert.ok(weight >= previous && weight >= 0 && weight <= 1);
    previous = weight;
  }
  previous = 1;
  for (let t = plan.close + plan.hold; t < .4; t += .001) {
    const weight = blinkWeight(t, plan);
    assert.ok(weight <= previous && weight >= 0 && weight <= 1);
    previous = weight;
  }
}
assert.equal(makeBlinkPlan(() => 0, false).double, false, 'No endless double blinks');
assert.deepEqual(gazeTarget(0, 0, 0, 0), {yaw: 0, pitch: 0});
for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) {
  const gaze = gazeTarget(x, y, x * .305, y * .078);
  assert.ok(Math.abs(gaze.yaw) <= .20 && Math.abs(gaze.pitch) <= .135);
  assert.ok(gaze.yaw * x >= 0 && gaze.pitch * y >= 0, 'Look toward the pointer');
}
const whole = dampGaze(0, .2, .1);
let divided = 0;
for (let i = 0; i < 10; i++) divided = dampGaze(divided, .2, .01);
assert.ok(Math.abs(whole - divided) < 1e-12, 'Gaze speed is frame-rate independent');
assert.equal(dampGaze(0, .2, .1, true), .2);
console.log('Blink closure/reopening, cadence, bounded conjugate gaze and frame-rate independence pass.');
