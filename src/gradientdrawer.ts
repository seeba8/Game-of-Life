/// <reference path="drawer.ts" />
/// <reference path="iobserver.ts" />
/// <reference path="bitmap.ts" />
class GradientDrawer extends Drawer implements IObserver {
  private imagedata: ImageData;

  public draw(grid: BitMap): void {
    const w = grid.getWidth();
    const h = grid.getHeight();
    if (this.imagedata === undefined) {
       this.imagedata = new ImageData(w, h);
    }
    this.CTX.clearRect(0, 0, this.CNV.width, this.CNV.height);
    // https://stackoverflow.com/questions/3448347/how-to-scale-an-imagedata-in-html-canvas

    const data = this.imagedata.data;
    const diff = 0x10;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {

        if (grid.get(x, y)) {
          data[(y * w + x) * 4 + 3] += diff;
        } else {
          data[(y * w + x) * 4 + 3] -= diff;
        }
      }
    }
    this.buffer.putImageData(this.imagedata, 0, 0);
    this.CTX.drawImage(this.buffer.canvas, 0, 0);
  }
 /*  public draw(grid: BitMap): void {
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
  } */

}
