#define HAS_LAVA

const float STEP_SCALE = 0.34;
const float STEP_RELAXED = 0.52;
const float FOG_DENSITY = 0.00030;
const float MAX_DISTANCE = 84.0;
const vec3 CRATER_GLOW_CENTER = vec3(0.0, 2.4, 0.0);
const float CRATER_GLOW_FALLOFF = 0.7;

vec3 heightfield(vec3 p) {
  return vec3(p.x, p.y * 0.3, p.z);
}

float map(vec3 p) {
  float r = length(p.xz);
  float cone = 13.0 * exp(-r * 0.16) - 6.2;
  float height = smoothMin(cone, 3.0, 0.6) - 2.6 * smoothstep(2.0, 0.4, r);
  float amplitude = mix(0.7, 2.0, smoothstep(6.0, 18.0, r)) * (0.4 + 0.6 * smoothstep(1.0, 3.5, r));
  return displaced(heightfield(p), (p.y - height) * 0.55, amplitude, 0.3);
}

float lavaSurface(vec3 p) {
  float r = length(p.xz);
  float relief = coarseRelief(heightfield(p) * 0.3 + uSeed);
  float streams = smoothstep(0.88, 0.97, sin(atan(p.z, p.x) * 5.0 + 2.5 * relief + uSeed.x));
  float flow = streams * smoothstep(1.9, 2.7, r) * exp(-r * 0.11) * (0.7 + 0.3 * sin(r * 3.0 - uTime * 1.5));
  float lake = smoothstep(2.1, 1.0, r) * smoothstep(2.4, 1.4, p.y);
  return 2.6 * max(flow, lake);
}

float lavaHaze(vec3 origin, vec3 direction, float reach) {
  float nearest = dot(CRATER_GLOW_CENTER - origin, direction);
  float along = clamp(nearest, 0.0, reach);
  float miss = length(origin + direction * along - CRATER_GLOW_CENTER);
  float visible = 0.5 + 0.5 * clamp((reach - nearest) * 0.5, -1.0, 1.0);
  return exp(-CRATER_GLOW_FALLOFF * miss) * (2.0 / CRATER_GLOW_FALLOFF + 1.2 * miss) * visible;
}
