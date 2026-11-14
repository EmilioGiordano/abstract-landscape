const float FINE_RELIEF_REACH = 0.045;

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
  float layered = n * 9.0;
  float stacked = (floor(layered) + smoothstep(0.2, 0.8, fract(layered))) / 9.0;
  return mix(n, stacked, uTerrace);
}

float fineRelief(vec3 q) {
  q = ROTATE3 * (ROTATE3 * (ROTATE3 * q));
  float n = 0.0;
  float scale = 8.0;
  float weight = 0.055 * uDetail;
  for (int i = 0; i < 5; i++) {
    n += (0.42 - gyroid(q, scale, uPhase.zxy)) * weight;
    q = ROTATE3 * q;
    scale *= 2.0;
    weight *= 0.5;
  }
  return n;
}

float ledge(vec3 p) {
  return 0.0;
}
