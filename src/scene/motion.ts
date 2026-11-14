import type { Settings } from '../config/params';

export class Motion {
  distance = 0;
  phase = 0;
  roll = 0;
  clock = 0;

  advance(seconds: number, settings: Settings): void {
    this.distance += seconds * settings.speed;
    this.phase += seconds * settings.morph;
    this.roll += seconds * settings.roll;
    this.clock += seconds;
  }
}
