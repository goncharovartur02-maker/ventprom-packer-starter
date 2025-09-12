// Helpers for bounds and collisions (stubs)
import { MM, Vehicle, Placement } from './models';

export function fitsWithin(v: Vehicle, p: Placement, w: MM, h: MM, l: MM): boolean {
  return p.x + w <= v.width && p.y + h <= v.height && p.z + l <= v.length;
}

export function collide(a: Placement, aw: MM, ah: MM, al: MM, b: Placement, bw: MM, bh: MM, bl: MM): boolean {
  const ax2 = a.x + aw, ay2 = a.y + ah, az2 = a.z + al;
  const bx2 = b.x + bw, by2 = b.y + bh, bz2 = b.z + bl;
  const sep = (ax2 <= b.x) || (bx2 <= a.x) || (ay2 <= b.y) || (by2 <= a.y) || (az2 <= b.z) || (bz2 <= a.z);
  return !sep;
}
