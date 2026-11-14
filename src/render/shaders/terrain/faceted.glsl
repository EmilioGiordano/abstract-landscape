const float FINE_RELIEF_REACH = 0.024;

vec3 triangleWave(vec3 x) {
  return abs(fract(x) - 0.5) * 2.0;
}

float facet(vec3 q, float scale, vec3 phase) {
  return abs(dot(triangleWave(q * scale * 0.5 + phase), vec3(1.0)) - 1.5) / 1.5;
}

float coarseRelief(vec3 q) {
  vec3 phase = uPhase / TAU;
  float n = 0.0;
  float scale = 1.0;
  float weight = 0.9;
  for (int i = 0; i < 3; i++) {
    n += facet(q, scale, phase) * weight;
    q = ROTATE3 * q;
    scale *= 2.0;
    weight *= 0.5;
  }
  return min(n, 1.25);
}

float fineRelief(vec3 q) {
  q = ROTATE3 * (ROTATE3 * (ROTATE3 * q));
  vec3 phase = uPhase.zxy / TAU;
  float n = 0.0;
  float scale = 8.0;
  float weight = 0.05 * uDetail;
  for (int i = 0; i < 3; i++) {
    n += (0.27 - facet(q, scale, phase)) * weight;
    q = ROTATE3 * q;
    scale *= 2.0;
    weight *= 0.5;
  }
  return n;
}

float ledge(vec3 p) {
  return 0.0;
}
