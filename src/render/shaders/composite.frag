#version 300 es
precision highp float;

uniform sampler2D uScene;
uniform vec2 uResolution;
uniform vec2 uViewOrigin;
uniform vec2 uViewSize;
uniform int uSymmetry;
uniform float uContrast;
uniform float uTint;
uniform float uIris;
uniform float uFade;
uniform float uPhase;
uniform float uStorm;
uniform float uFlash;
uniform float uTime;
uniform float uFrame;
uniform float uLens;
uniform vec3 uOrigin;
uniform vec3 uForward;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec3 uShadow;
uniform vec3 uMid;
uniform vec3 uLight;
uniform vec3 uBolt[17];
uniform vec3 uFork[9];

out vec4 fragment;

const float TAU = 6.2831853;
const float DEPTH_RANGE = 90.0;
const int SYMMETRY_MIRROR = 1;
const int SYMMETRY_QUAD = 2;
const int SYMMETRY_KALEIDOSCOPE_6 = 3;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 fold(vec2 uv) {
  if (uSymmetry == SYMMETRY_MIRROR) return vec2(abs(uv.x), uv.y);
  if (uSymmetry == SYMMETRY_QUAD) return abs(uv);
  if (uSymmetry >= SYMMETRY_KALEIDOSCOPE_6) {
    float sector = TAU / (uSymmetry == SYMMETRY_KALEIDOSCOPE_6 ? 6.0 : 10.0);
    float angle = abs(mod(atan(uv.y, uv.x) + TAU, sector) - 0.5 * sector);
    return length(uv) * vec2(cos(angle), sin(angle));
  }
  return uv;
}

vec3 project(vec3 point) {
  vec3 q = point - uOrigin;
  float depth = dot(q, uForward);
  return vec3(vec2(dot(q, uRight), dot(q, uUp)) * uLens / max(depth, 0.05), depth);
}

float boltSegment(vec2 uv, vec3 a, vec3 b, float sceneDepth) {
  if (a.z < 0.1 || b.z < 0.1) return 0.0;
  vec2 toPixel = uv - a.xy;
  vec2 span = b.xy - a.xy;
  float h = clamp(dot(toPixel, span) / max(dot(span, span), 1e-6), 0.0, 1.0);
  float gap = length(toPixel - span * h);
  float visible = smoothstep(-0.5, 0.2, sceneDepth - mix(a.z, b.z, h));
  return visible * (pow(0.0036 / (gap + 0.0010), 1.3) + 0.11 * exp(-gap * 13.0));
}

float boltGlow(vec2 uv, float sceneDepth) {
  float glow = 0.0;
  vec3 a = project(uBolt[0]);
  for (int i = 1; i < 17; i++) {
    vec3 b = project(uBolt[i]);
    glow = max(glow, boltSegment(uv, a, b, sceneDepth));
    a = b;
  }
  a = project(uFork[0]);
  for (int i = 1; i < 9; i++) {
    vec3 b = project(uFork[i]);
    glow = max(glow, 0.5 * boltSegment(uv, a, b, sceneDepth));
    a = b;
  }
  return glow;
}

float rain(vec2 uv) {
  float column = uv.x * 220.0 + uv.y * 34.0;
  float id = floor(column);
  float fall = uv.y * 2.2 + uTime * (5.0 + 4.0 * hash21(vec2(id, 3.0))) + hash21(vec2(id, 9.0)) * 20.0;
  float along = fract(fall);
  float streak = smoothstep(0.5, 0.1, abs(fract(column) - 0.5)) * smoothstep(0.0, 0.05, along) * smoothstep(0.35, 0.05, along);
  return streak * step(0.55, hash21(vec2(id, floor(fall))));
}

void main() {
  vec2 screen = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  vec2 uv = fold(screen);
  vec2 coord = (uv - uViewOrigin) / uViewSize;
  vec4 scene = texture(uScene, coord);

  float tone = scene.r;

  float added = 0.0;
  if (uFlash > 0.0) added += uFlash * boltGlow(uv, scene.b * DEPTH_RANGE);
  if (uStorm > 0.0) added += rain(screen) * uStorm * (0.07 + 0.25 * uFlash);
  tone = 1.0 - (1.0 - tone) * exp(-added * 1.55);

  tone = mix(tone, smoothstep(0.0, 1.0, tone), uContrast);
  tone *= 1.0 - 0.28 * dot(screen, screen);
  tone += (hash21(gl_FragCoord.xy * 1.7 + uFrame * 3.1) - 0.5) * 0.028;
  tone = clamp(tone, 0.0, 1.0);

  vec3 ramp = tone < 0.5 ? mix(uShadow, uMid, tone * 2.0) : mix(uMid, uLight, tone * 2.0 - 1.0);
  vec3 color = mix(vec3(tone), ramp, uTint);
  float iridescenceKey = scene.g * 8.0 - 0.5;
  color *= 1.0 + uIris * 0.6 * cos(TAU * (iridescenceKey + uPhase * 0.16 + vec3(0.0, 0.33, 0.67)));
  fragment = vec4(clamp(color, 0.0, 1.0) * uFade, 1.0);
}
