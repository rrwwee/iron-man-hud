// Blink asymmetry is informed by https://pubmed.ncbi.nlm.nih.gov/19157026/.
// The short range here is tuned visually for this portrait. Seconds and radians throughout. Randomness is injectable for repeatable checks.
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const smooth = value => value * value * (3 - 2 * value);

export function makeBlinkPlan(random = Math.random, allowDouble = true) {
  const close = .075 + random() * .025;
  const hold = .012 + random() * .014;
  const open = .15 + random() * .065;
  const double = allowDouble && random() < .09;
  return {close, hold, open, next: double ? .42 + random() * .16 : 3.2 + random() * 3.6, double};
}

export function blinkWeight(age, {close, hold, open}) {
  if (age < 0) return 0;
  if (age < close) return smooth(age / close);
  if (age < close + hold) return 1;
  if (age < close + hold + open) return 1 - smooth((age - close - hold) / open);
  return 0;
}

export function gazeTarget(pointerX, pointerY, headYaw, headPitch) {
  // The eyes lead, while the slower head takes up most of the sustained turn.
  // Both eyes share one direction to avoid accidental divergent gaze.
  return {
    yaw: clamp(pointerX * .30 - headYaw * .65, -.20, .20),
    pitch: clamp(pointerY * .20 - headPitch * .65, -.135, .135),
  };
}

export function dampGaze(current, target, dt, reducedMotion = false) {
  const gain = reducedMotion ? 1 : 1 - Math.exp(-Math.max(0, dt) * 20);
  return current + (target - current) * gain;
}
