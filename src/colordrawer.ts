/// <reference path="drawer.ts" />

declare interface IColor {
  r: number,
  b: number,
  g: number,
}
class ColorDrawer extends Drawer {
  protected getNewColor: (x: number, y: number) => IColor;
  private colors: IColor[][];
  private previous: Uint8Array[];

  constructor(cnv: HTMLCanvasElement, colorpicker: (x: number, y: number) => IColor) {
    super(cnv);
    this.getNewColor = colorpicker.bind(this);
  }

  public draw(grid: Uint8Array[]): void {
    if (this.previous === undefined) {
      this.createInitialColors(grid);
    } else {
      this.adjustPrevColors(grid);
    }
    this.previous = grid;
    const w = grid[0].length;
    const h = grid.length;
    const SIZE = Math.round(this.CNV.width / w);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (grid[y][x] === 1) {
          const c = this.colors[y][x];
          this.CTX.fillStyle = `rgba(${c.r},${c.g},${c.b},.2)`;
          this.CTX.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
        } else {
          this.CTX.fillStyle = "rgba(255,255,255,.2)";
          this.CTX.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
        }
      }
    }
  }

  // protected getNewColor(x: number, y: number): IColor;

  protected getParentColors(x: number, y: number): IColor[] {
    const parents: IColor[] = new Array();
    // needs to know about wraparound to do it correctly though
    for (let offsetX = -1; offsetX < 2; offsetX++) {
      for (let offsetY = -1; offsetY < 2; offsetY++) {
        if (x + offsetX !== -1 && x + offsetX !== this.previous[0].length &&
          y + offsetY !== -1 && y + offsetY !== this.previous.length &&
          this.previous[y + offsetY][x + offsetX] === 1) {
          parents.push(this.colors[y + offsetY][x + offsetX]);
        }
      }
    }
    return parents;
  }

  protected adjustPrevColors(grid: Uint8Array[]): void {
    const h = grid.length;
    const w = grid[0].length;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (grid[y][x] === 1 && this.previous[y][x] === 0) {
          // new born, mix parents' colors
          this.colors[y][x] = this.getNewColor(x, y);
        }
      }
    }
  }

  private createInitialColors(grid: Uint8Array[]): void {
    let c = 0;
    const h = grid.length;
    const w = grid[0].length;
    this.colors = new Array(h);
    for (let y = 0; y < h; y++) {
      this.colors[y] = new Array(w);
      for (let x = 0; x < w; x++) {
        if (grid[y][x] === 1) {
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
  export function geneticColorPicker(x: number, y: number): IColor {
    const parentColors = this.getParentColors(x, y);
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

  export function randomColorPicker(x: number, y: number): IColor {
    return {
      r: Math.random() * 255,
      g: Math.random() * 255,
      b: Math.random() * 255,
    };
  }
}
