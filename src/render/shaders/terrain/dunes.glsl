const float FINE_RELIEF_REACH = 0.012;

float crestPhase(vec3 q) {
  return q.x * 1.1 + 1.5 * sin(q.z * 0.6 + uPhase.x) + 0.5 * sin(q.y * 0.9);
}

float coarseRelief(vec3 q) {
  float drift = q.z * 0.7 + 1.2 * sin(q.x * 0.45 + uPhase.y);
  float crest = 1.0 - abs(sin(crestPhase(q)));
  return 0.3 + 0.6 * crest * crest * (0.55 + 0.45 * sin(drift)) + 0.12 * sin(q.y * 1.3 + q.z * 0.5);
}

float fineRelief(vec3 q) {
  return 0.012 * uDetail * sin(q.x * 30.0 + q.z * 17.0 + 3.0 * sin(crestPhase(q)));
}

float ledge(vec3 p) {
  return 0.0;
}
