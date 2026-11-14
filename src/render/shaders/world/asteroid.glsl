const float STEP_SCALE = 0.40;
const float STEP_RELAXED = 0.65;
const float FOG_DENSITY = 0.0007;
const float MAX_DISTANCE = 46.0;

float map(vec3 p) {
  return displaced(p, length(p) - 2.5, 1.7, 0.42);
}
