const float STEP_SCALE = 0.34;
const float STEP_RELAXED = 0.58;
const float FOG_DENSITY = 0.0020;
const float MAX_DISTANCE = 46.0;

float map(vec3 p) {
  float ring = length(p.xz);
  float lateral = ring - PATH_RADIUS;
  float along = atan(p.z, p.x);
  float radius = length(vec2(lateral, p.y));
  float sector = TAU / uFolds;
  float angle = atan(p.y, lateral) + 9.0 * along;
  angle = abs(mod(angle, sector) - 0.5 * sector);
  vec2 folded = radius * vec2(cos(angle), sin(angle));
  vec3 q = vec3(p.x / ring * (PATH_RADIUS + folded.x), folded.y, p.z / ring * (PATH_RADIUS + folded.x));
  float base = 2.7 + 0.7 * sin(23.0 * along + uSeed.x) - radius + 1.2 * exp(-radius * radius * 0.3);
  return displaced(q, base, 1.6, 0.36);
}
