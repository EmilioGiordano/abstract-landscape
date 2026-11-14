const float FINE_RELIEF_REACH = 0.023;

float coarseRelief(vec3 q) {
  float n = 0.0;
  float scale = 1.0;
  float weight = 0.55;
  for (int i = 0; i < 3; i++) {
    n += gyroid(q, scale, uPhase) * weight;
    q = ROTATE3 * q;
    scale *= 2.0;
    weight *= 0.5;
  }
  return n;
}

float fineRelief(vec3 q) {
  q = ROTATE3 * (ROTATE3 * (ROTATE3 * q));
  float n = 0.0;
  float scale = 8.0;
  float weight = 0.0275 * uDetail;
  for (int i = 0; i < 5; i++) {
    n += (0.42 - gyroid(q, scale, uPhase.zxy)) * weight;
    q = ROTATE3 * q;
    scale *= 2.0;
    weight *= 0.5;
  }
  return n;
}

float ledge(vec3 p) {
  float level = p.y * 1.6;
  float stepped = floor(level) + smoothstep(0.2, 0.8, fract(level));
  return 0.9 * uTerrace * (stepped - level) / 1.6;
}
