const float STEP_SCALE = 0.34;
const float STEP_RELAXED = 0.52;
const float FOG_DENSITY = 0.00035;
const float MAX_DISTANCE = 78.0;

vec3 heightfield(vec3 p) {
  return vec3(p.x, p.y * 0.3, p.z);
}

float map(vec3 p) {
  float r2 = dot(p.xz, p.xz);
  float r = sqrt(r2);
  float height = 9.0 * exp(-r * 0.30) + 3.5 * exp(-r2 * 0.012) - 5.5;
  float amplitude = mix(1.0, 2.4, exp(-r2 * 0.006)) * (0.3 + 0.7 * smoothstep(0.0, 4.0, r));
  return displaced(heightfield(p), (p.y - height) * 0.55, amplitude, 0.3);
}
