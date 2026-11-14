const float STEP_SCALE = 0.34;
const float STEP_RELAXED = 0.58;
const float FOG_DENSITY = 0.0018;
const float MAX_DISTANCE = 46.0;

float map(vec3 p) {
  float lateral = length(p.xz) - PATH_RADIUS;
  float along = atan(p.z, p.x);
  float narrowing = 0.06 + 0.03 * sin(17.0 * along + uSeed.y);
  float walls = 3.0 * (sqrt(1.0 + lateral * lateral * narrowing) - 1.0);
  float base = (p.y + 1.25) * 0.6 - walls;
  float opening = smoothstep(-0.35, 0.5, sin(29.0 * along + uSeed.x) + 0.5 * sin(13.0 * along + lateral * 0.35));
  base = smoothMin(base, (3.0 + 30.0 * opening - p.y) * 0.6, 0.9);
  base += 1.6 * exp(-(lateral * lateral + p.y * p.y) * 0.3);
  return displaced(p, base, 2.2, 0.3);
}
