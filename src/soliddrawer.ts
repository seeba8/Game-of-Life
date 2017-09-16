/// <reference path="drawer.ts" />
/// <reference path="iobserver.ts" />

class SolidDrawer extends Drawer implements IObserver {

  constructor(cnv: HTMLCanvasElement) {
    super(cnv);
    this.CTX.fillStyle = "rgba(0,0,0,1)";
  }

  public draw(grid: Uint8Array[]): void {
    const w = grid[0].length;
    const h = grid.length;
    const SIZE = Math.round(this.CNV.width / w);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (grid[y][x] === 1) {
          this.CTX.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
        } else {
          this.CTX.clearRect(x * SIZE, y * SIZE, SIZE, SIZE);
        }
      }
    }
  }

}
