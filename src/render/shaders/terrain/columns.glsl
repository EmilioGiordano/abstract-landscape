const float FINE_RELIEF_REACH = 0.044;
const float VERTICAL_STRETCH = 0.18;

float coarseRelief(vec3 q) {
  q.y *= VERTICAL_STRETCH;
  float n = 0.0;
  float scale = 1.0;
  float weight = 0.55;
  for (int i = 0; i < 3; i++) {
    n += gyroid(q, scale, uPhase) * weight;
    q.xz = ROTATE2 * q.xz;
    q.y += 1.7;
    scale *= 2.0;
    weight *= 0.5;
  }
  return n;
}

float fineRelief(vec3 q) {
  q.y = q.y * VERTICAL_STRETCH + 5.1;
  q.xz = ROTATE2 * (ROTATE2 * (ROTATE2 * q.xz));
  float n = 0.0;
  float scale = 8.0;
  float weight = 0.055 * uDetail;
  for (int i = 0; i < 4; i++) {
    n += (0.42 - gyroid(q, scale, uPhase.zxy)) * weight;
    q.xz = ROTATE2 * q.xz;
    q.y += 1.7;
    scale *= 2.0;
    weight *= 0.5;
  }
  return n;
}

float ledge(vec3 p) {
  return 0.0;
}
