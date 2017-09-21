/// <reference path="drawer.ts" />

declare interface IColor {
  r: number,
  b: number,
  g: number,
}
class ColorDrawer extends Drawer {
  protected getNewColor: (x: number, y: number, previous: BitMap) => IColor;
  private colors: IColor[][];
  private imagedata: ImageData;

  constructor(cnv: HTMLCanvasElement, rasterSize: number,
              colorpicker: (x: number, y: number, previous: BitMap) => IColor) {
    super(cnv, rasterSize);
    this.getNewColor = colorpicker.bind(this);
  }

  public draw(grid: BitMap, previous: BitMap): void {
    const w = grid.getWidth();
    const h = grid.getHeight();
    if (this.imagedata === undefined) {
      this.imagedata = new ImageData(w, h);
      this.createInitialColors(grid);
    }  else {
      this.adjustPrevColors(grid, previous);
    }
    this.CTX.clearRect(0, 0, this.CNV.width, this.CNV.height);
    // https://stackoverflow.com/questions/3448347/how-to-scale-an-imagedata-in-html-canvas

    const data = this.imagedata.data;
    const d32 = new Uint32Array(data.buffer);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (grid.get(x, y)) {
          const c = this.colors[y][x];
          if (this.isLittleEndian) {
            // tslint:disable-next-line:no-bitwise
            d32[y * w + x] = (255 << 24) | (c.b << 16) | (c.g << 8) | c.r;
          } else {
            // tslint:disable-next-line:no-bitwise
            d32[y * w + x] = (c.r << 24) | (c.g << 16) | (c.b << 8) | 255;
          }

          /* this.CTX.fillStyle = `rgba(${c.r},${c.g},${c.b},.2)`;
          this.CTX.fillRect(x * SIZE, y * SIZE, SIZE, SIZE); */
        } else {
          d32[y * w + x] = 0;
          /* this.CTX.fillStyle = "rgba(255,255,255,.2)";
          this.CTX.fillRect(x * SIZE, y * SIZE, SIZE, SIZE); */
        }
      }
    }
    this.buffer.putImageData(this.imagedata, 0, 0);
    this.CTX.drawImage(this.buffer.canvas, 0, 0);
  }

/*   public draw(grid: BitMap, previous: BitMap): void {
    const w = grid.getWidth();
    const h = grid.getHeight();
    if (this.imagedata === undefined) {
      this.imagedata = new ImageData(w, h);
    }
    if (this.previous === undefined) {
      this.createInitialColors(grid);
    } else {
      this.previous = previous;
      this.adjustPrevColors(grid);
    }

    const SIZE = this.rasterSize;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (grid.get(x, y)) {
          const c = this.colors[y][x];
          this.CTX.fillStyle = `rgba(${c.r},${c.g},${c.b},.2)`;
          this.CTX.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
        } else {
          this.CTX.fillStyle = "rgba(255,255,255,.2)";
          this.CTX.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
        }
      }
    }
  } */

  // protected getNewColor(x: number, y: number): IColor;

  protected getParentColors(x: number, y: number, previous: BitMap): IColor[] {
    const width = previous.getWidth();
    const height = previous.getHeight();
    const parents: IColor[] = new Array();
    // needs to know about wraparound to do it correctly though
    for (let offsetX = -1; offsetX < 2; offsetX++) {
      for (let offsetY = -1; offsetY < 2; offsetY++) {
        if (x + offsetX !== -1 && x + offsetX !==  width &&
          y + offsetY !== -1 && y + offsetY !== height &&
          previous.get(x + offsetX, y + offsetY)) {
          parents.push(this.colors[y + offsetY][x + offsetX]);
        }
      }
    }
    return parents;
  }

  protected adjustPrevColors(grid: BitMap, previous: BitMap): void {
    const width = grid.getWidth();
    const height = grid.getHeight();
    // adjust height of array
    const minH = Math.min(height, this.colors.length);
    while (height > this.colors.length) {
      this.colors.push(new Array(width));
    }
    if (this.colors.length > height) {
      this.colors = this.colors.slice(0, height);
    }

    // adjust width of array
    while (width > this.colors[0].length) {
      for (let i = 0; i < minH; i++) {
        this.colors[i].push({r: 0, g: 0, b: 0});
      }
    }
    if ( width < this.colors[0].length) {
      for (let i = 0; i < minH; i++) {
        this.colors[i] = this.colors[i].slice(0, width);
      }
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid.get(x, y) && !previous.get(x, y)) {
          // new born, mix parents' colors
          this.colors[y][x] = this.getNewColor(x, y, previous);
        }
      }
    }
  }

  private createInitialColors(grid: BitMap): void {
    let c = 0;
    const h = grid.getHeight();
    const w = grid.getWidth();
    this.colors = new Array(h);
    for (let y = 0; y < h; y++) {
      this.colors[y] = new Array(w);
      for (let x = 0; x < w; x++) {
        if (grid.get(x, y)) {
          this.colors[y][x] = {
            r: (c % 3 === 0 ? 255 : 0),
            // tslint:disable-next-line:object-literal-sort-keys
            g: (c % 3 === 1 ? 255 : 0),
            b: (c % 3 === 2 ? 255 : 0),
          };
          // this.colors[y][x] = {
          //   r: Math.round((y / h) * 255),
          //   // tslint:disable-next-line:object-literal-sort-keys
          //   g: 0,
          //   b: 0,
          // };
          c++;
        }
      }
    }
  }
}
namespace ColorDrawerOptions {
  export function geneticColorPicker(x: number, y: number, previous: BitMap): IColor {
    const parentColors = this.getParentColors(x, y, previous);
    const order = ["r", "g", "b"];
    const sum = [0, 0, 0];
    for (const color of parentColors) {
      for (let count = 0; count < 3; count++) {
        sum[count] += color[order[count]];
        count++;
      }
    }
    const max = Math.max.apply(null, sum);
    const normalized = sum.map((v) => Math.round((v / max) * 255));
    return { r: normalized[0], g: normalized[1], b: normalized[2]};
  }

  export function randomColorPicker(): IColor {
    return {
      r: Math.random() * 255,
      g: Math.random() * 255,
      b: Math.random() * 255,
    };
  }
}
