"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fitsWithin = fitsWithin;
exports.collide = collide;
function fitsWithin(v, p, w, h, l) {
    return p.x + w <= v.width && p.y + h <= v.height && p.z + l <= v.length;
}
function collide(a, aw, ah, al, b, bw, bh, bl) {
    const ax2 = a.x + aw, ay2 = a.y + ah, az2 = a.z + al;
    const bx2 = b.x + bw, by2 = b.y + bh, bz2 = b.z + bl;
    const sep = (ax2 <= b.x) || (bx2 <= a.x) || (ay2 <= b.y) || (by2 <= a.y) || (az2 <= b.z) || (bz2 <= a.z);
    return !sep;
}
//# sourceMappingURL=constraints.js.map