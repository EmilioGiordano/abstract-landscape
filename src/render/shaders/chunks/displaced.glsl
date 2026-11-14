bool fineReliefEnabled = true;
float skippedRelief = 0.0;

float displaced(vec3 p, float base, float amplitude, float frequency) {
  vec3 q = p * frequency + uSeed;
  float d = base - amplitude * (coarseRelief(q) - 0.45) + ledge(p);
  skippedRelief = 0.0;
  if (!fineReliefEnabled) return d;
  float reach = FINE_RELIEF_REACH * uDetail * amplitude;
  if (d > max(2.5 * reach, 0.02 * amplitude)) {
    skippedRelief = reach;
    return d - reach;
  }
  return d - amplitude * fineRelief(q);
}
