/// <reference path="drawer.ts" />
/// <reference path="iobserver.ts" />
/// <reference path="bitmap.ts" />

class SolidDrawer extends Drawer implements IObserver {
  constructor(cnv: HTMLCanvasElement, rasterSize: number) {
    super(cnv, rasterSize);
  }

  public draw(grid: BitMap): void {
    // https://stackoverflow.com/questions/3448347/how-to-scale-an-imagedata-in-html-canvas
    const w = grid.getWidth();
    const h = grid.getHeight();
    // const imagedata = this.CTX.getImageData(0, 0, w, h);
    const imagedata = new ImageData(w, h);
    const data = imagedata.data;
    const buf = data.buffer;
    const v32 = new Uint32Array(buf);
    const white = 0xffffffff;

    /**
     * Little Endian: Alpha Blue Green Red
     * Big Endian: Red Green Blue Alpha
     */
    const black = this.isLittleEndian ? 0xff000000 : 0x000000ff;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (grid.get(x, y)) {
          v32[y * w + x] = black;
        } else {
          v32[y * w + x] = white;
        }
      }
    }
    this.buffer.putImageData(imagedata, 0, 0);
    this.CTX.drawImage(this.buffer.canvas, 0, 0);
  }
}

/* /// <reference path="drawer.ts" />
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
 */
