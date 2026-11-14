const float PATH_RADIUS = 300.0;
const float TAU = 6.2831853;
const float DEPTH_RANGE = 90.0;
const int PREPASS_TILE = 8;
const float HALO_REACH = 0.6;
const mat3 ROTATE3 = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);
const mat2 ROTATE2 = mat2(0.8, 0.6, -0.6, 0.8);

float gyroid(vec3 q, float scale, vec3 phase) {
  return abs(dot(sin(q * scale + phase), cos(q.yzx * scale)));
}

float smoothMin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 viewUv(vec2 pixel) {
  return uViewOrigin + pixel / uResolution * uViewSize;
}

vec3 rayDirection(vec2 uv) {
  return normalize(uForward * uLens + uRight * uv.x + uUp * uv.y);
}
