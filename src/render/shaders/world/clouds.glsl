const float STEP_SCALE = 0.30;
const float STEP_RELAXED = 0.52;
const float FOG_DENSITY = 0.0013;
const float MAX_DISTANCE = 46.0;

float map(vec3 p) {
  float lateral = length(p.xz) - PATH_RADIUS;
  float base = 0.9 + 2.2 * exp(-(lateral * lateral + p.y * p.y) * 0.25);
  return displaced(p, base, 3.0, 0.2);
}
