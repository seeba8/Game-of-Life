/// <reference path="drawer.ts" />
/// <reference path="iobserver.ts" />
/// <reference path="bitmap.ts" />

class SolidDrawer extends Drawer implements IObserver {

  constructor(cnv: HTMLCanvasElement, rasterSize: number) {
    super(cnv, rasterSize);
  }

  public draw(grid: BitMap): void {
    this.CTX.fillStyle = "rgba(0,0,0,1)";
    const w = grid.getWidth();
    const h = grid.getHeight();
    const SIZE = this.rasterSize;
    this.CTX.clearRect(0, 0, w * SIZE, h * SIZE);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (grid.get(x, y)) {
          this.CTX.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
        }
      }
    }
  }

}
