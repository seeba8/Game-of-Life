/// <reference path="drawer.ts" />
/// <reference path="iobserver.ts" />
/// <reference path="bitmap.ts" />
class GradientDrawer extends Drawer implements IObserver {
  public draw(grid: BitMap): void {
    const w = grid.getWidth();
    const h = grid.getHeight();
    const SIZE = this.rasterSize;
    this.CTX.fillStyle = "rgba(0,0,0,0.2)";
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (grid.get(x, y)) {
          this.CTX.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
        }
      }
    }
    this.CTX.fillStyle = "rgba(255,255,255,0.2)";
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!grid.get(x, y)) {
          this.CTX.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
        }
      }
    }
  }

}
