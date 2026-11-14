uniform sampler2D uPrepass;
uniform bool uPrepassEnabled;
uniform bool uPreciseSteps;
uniform int uStyle;
uniform float uGlow;
uniform float uStorm;
uniform float uFlash;
uniform vec3 uBoltLight;
uniform float uFrame;
uniform int uNormalTaps;
uniform int uOcclusionTaps;

out vec4 fragment;

const int MAX_STEPS = 210;
const int STYLE_BACKLIGHT = 0;
const int STYLE_NIGHT = 1;
const int STYLE_CLAY = 2;
const int STYLE_CONTOUR = 3;
const int STYLE_AURA = 4;

const vec3 TETRAHEDRON[4] = vec3[4](
  vec3(1.0, -1.0, -1.0),
  vec3(-1.0, -1.0, 1.0),
  vec3(-1.0, 1.0, -1.0),
  vec3(1.0, 1.0, 1.0)
);
const float OCCLUSION_REACH[2] = float[2](0.12, 0.50);

vec3 surfaceNormal(vec3 p, float epsilon) {
  vec3 gradient = vec3(0.0);
  for (int i = 0; i < uNormalTaps; i++) {
    gradient += TETRAHEDRON[i] * map(p + TETRAHEDRON[i] * epsilon);
  }
  return normalize(gradient);
}

float occlusion(vec3 p, vec3 normal) {
  float shade = 0.0;
  for (int i = 0; i < uOcclusionTaps; i++) {
    float reach = OCCLUSION_REACH[i];
    fineReliefEnabled = i == 0;
    shade += 0.5 * clamp(map(p + normal * reach) / reach, 0.0, 1.0);
  }
  fineReliefEnabled = true;
  return shade;
}

float clearedDistance() {
  ivec2 tile = ivec2(gl_FragCoord.xy) / PREPASS_TILE;
  ivec2 lastTile = textureSize(uPrepass, 0) - 1;
  float cleared = MAX_DISTANCE;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      cleared = min(cleared, texelFetch(uPrepass, clamp(tile + ivec2(x, y), ivec2(0), lastTile), 0).r);
    }
  }
  return cleared;
}

float stormClouds(vec3 direction) {
  vec3 q = direction * 2.6 + vec3(0.0, uTime * 0.02, uTime * 0.035);
  return gyroid(q, 1.0, vec3(0.0)) * 0.6 + gyroid(ROTATE3 * q, 2.0, vec3(1.3)) * 0.3 + gyroid(q, 4.3, vec3(2.1)) * 0.15;
}

float skyLight(vec3 direction, bool darkSky) {
  float sky = darkSky
    ? 0.012 + 0.05 * smoothstep(-0.3, 0.8, direction.y)
    : mix(1.25, 1.9, smoothstep(-0.25, 0.55, direction.y));
  if (!darkSky) sky = mix(sky, 0.10 + 0.14 * smoothstep(-0.2, 0.7, direction.y), clamp(uStorm * 2.0, 0.0, 1.0));
  return sky + uFlash * (darkSky ? 0.10 : 0.75);
}

float surfaceLight(vec3 normal, vec3 direction, float shade, float contourLevel, float contourWidth) {
  float skyFacing = 0.5 + 0.5 * normal.y;
  float grazing = 1.0 - abs(dot(normal, direction));
  if (uStyle == STYLE_BACKLIGHT) {
    return 0.006 + 0.055 * skyFacing * shade * shade + 1.6 * pow(grazing, 3.5) * (0.35 + 0.65 * shade);
  }
  if (uStyle == STYLE_NIGHT) {
    return 0.003 + 0.02 * skyFacing * shade + 2.4 * pow(grazing, 3.0) * (0.3 + 0.7 * shade);
  }
  if (uStyle == STYLE_CLAY) {
    return (0.10 + 0.95 * skyFacing) * shade * shade * 0.9 + 0.25 * pow(grazing, 2.5);
  }
  if (uStyle == STYLE_CONTOUR) {
    float line = 1.0 - smoothstep(0.0, 1.5 * contourWidth + 0.02, abs(fract(contourLevel) - 0.5));
    line *= clamp(1.4 - contourWidth * 1.6, 0.0, 1.0);
    return 0.015 + 0.06 * skyFacing * shade + 1.7 * line + 0.5 * pow(grazing, 4.0);
  }
  return 0.0;
}

float haloWeight(bool hit, bool darkSky) {
  if (uStyle == STYLE_CLAY) return hit ? 0.05 : 0.25;
  if (hit) return darkSky ? 0.30 : 0.12;
  return darkSky ? 0.45 : 0.55;
}

void main() {
  vec3 direction = rayDirection(viewUv(gl_FragCoord.xy));

  float jitter = hash21(gl_FragCoord.xy + uFrame);
  float t = 0.05 + 0.05 * jitter;
  if (uPrepassEnabled) t = max(t, clearedDistance() - 0.05 * jitter);

  float d = 0.0;
  float halo = 0.0;
  float clearT = t;
  float clearD = 1.0;
  bool hit = false;
  int steps = 0;
  float stride = uPreciseSteps ? STEP_SCALE : STEP_RELAXED;
  for (int i = 0; i < MAX_STEPS; i++) {
    if (t > MAX_DISTANCE) break;
    steps = i;
    d = map(uOrigin + direction * t);
    if (d < 0.0012 * t) {
      hit = true;
      break;
    }
    float advance = d * stride;
    halo += exp(-(d + skippedRelief) * 7.0) * advance * exp(-t * 0.05);
    clearT = t;
    clearD = d;
    t += advance;
  }
  if (hit && d < 0.0) t = mix(clearT, t, clearD / (clearD - d));

  vec3 p = uOrigin + direction * t;
  float contourLevel = p.y * 3.0;
  float contourWidth = fwidth(contourLevel);

  bool darkSky = uStyle == STYLE_NIGHT || uStyle == STYLE_CONTOUR || uStyle == STYLE_AURA;
  float sky = skyLight(direction, darkSky);
  float clearness = exp(-FOG_DENSITY * t * t);
  float light = sky;
  vec3 normal = vec3(0.0, 1.0, 0.0);

  if (!hit && uStorm > 0.0) {
    float overcast = clamp(uStorm * 2.0, 0.0, 1.0);
    float clouds = stormClouds(direction);
    light = light * mix(1.0, 0.3 + 0.95 * clouds, overcast) + overcast * clouds * (0.04 + 0.5 * uFlash);
  }

  if (hit) {
    normal = surfaceNormal(p, 0.0008 * t + 0.0004);
    float shade = occlusion(p, normal);
    light = surfaceLight(normal, direction, shade, contourLevel, contourWidth);
#ifdef HAS_LAVA
    if (uStyle != STYLE_AURA) light += lavaSurface(p);
#endif
    if (uFlash > 0.0 && uStyle != STYLE_AURA) {
      vec3 toBolt = uBoltLight - p;
      float reach = length(toBolt);
      light += uFlash * 2.4 * max(dot(normal, toBolt / reach), 0.0) / (1.0 + 0.03 * reach * reach) * (0.3 + 0.7 * shade);
    }
    light = mix(sky, light, clearness);
  }

  if (uStyle == STYLE_AURA) {
    light = sky + 3.2 * pow(float(steps) / float(MAX_STEPS), 1.25) * (0.25 + 0.75 * clearness) + halo * uGlow * 0.6;
  } else {
    light += halo * uGlow * haloWeight(hit, darkSky);
  }
#ifdef HAS_LAVA
  light += lavaHaze(uOrigin, direction, t) * 0.4;
#endif

  float tone = 1.0 - exp(-light * 1.55);
  float iridescenceKey = hit ? t * 0.06 + normal.y * 0.25 : direction.y * 0.4 + 0.3;
  float depth = min(t * dot(direction, uForward) / DEPTH_RANGE, 1.0);
  fragment = vec4(tone, (iridescenceKey + 0.5) * 0.125, depth, 1.0);
}
