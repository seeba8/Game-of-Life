/// <reference path="observable.ts" />
class Life extends Observable {
  public w: number;
  public h: number;
  public wrapAround = false;
  private buffer: {0: Uint8Array[], 1: Uint8Array[]} = { 0: new Array(), 1: new Array() };
  private c = 0;
  private clock: number;
  private _ups: number = 1;

  constructor(width: number, height: number) {
    super();
    this.w = width;
    this.h = height;
    this.initGrid();
  }

  public getGrid() {
    return this.buffer[this.c % 2];
  }

  public setSize(w: number, h: number) {
    this.w = w;
    this.h = h;
    const minH = Math.min(h, this.buffer[0].length);
    if (h < this.buffer[0].length) {
      this.buffer[0] = this.buffer[0].slice(0, h);
      this.buffer[1] = this.buffer[1].slice(0, h);
    } else if (h > this.buffer[0].length) {
      for (let i = this.buffer[0].length; i < h; i++) {
        this.buffer[0].push(new Uint8Array(w));
        this.buffer[1].push(new Uint8Array(w));
      }
    }
    if (w < this.buffer[0][0].length) {
      for (let y = 0; y < minH; y++) {
        this.buffer[0][y] = this.buffer[0][y].slice(0, w);
        this.buffer[1][y] = this.buffer[1][y].slice(0, w);
      }
    } else if (w > this.buffer[0][0].length) {
      for (let y = 0; y < minH; y++) {
        for (let i = 0; i < 2; i++) {
          const b: Uint8Array = this.buffer[i][y].slice(0);
          this.buffer[i][y] = new Uint8Array(w);
          for (let x = 0; x < b.length; x++) {
            this.buffer[i][y][x] = b[x];
          }
          // this.buffer[i][y].set(b[0]);
        }
      }
    }
    this.notifyObservers();
  }

  public set ups(ups: number) {
    this._ups = ups;
    if (this.clock !== undefined) {
      clearInterval(this.clock);
      this.clock = setInterval(this.tick.bind(this), 1000 / this.ups);
    }
  }
  public get ups(): number {
    return this._ups;
  }

  public tick(): void {
    this.c++;
    const grid = this.buffer[this.c % 2];
    const off = this.buffer[(this.c + 1) % 2];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const neighbours = this.countNeighbours(off, x, y);
        switch (neighbours) {
          case 0:
          case 1:
            grid[y][x] = 0;
            break;
          case 2:
            grid[y][x] = off[y][x];
            break;
          case 3:
            grid[y][x] = 1;
            break;
          default:
            grid[y][x] = 0;
        }
      }
    }
    this.notifyObservers();
  }

  public start(): void {
    console.log(this.wrapAround);
    this.clock = setInterval(this.tick.bind(this), 1000 / this.ups)
    this.tick();
  }

  public toggleCell(x: number, y: number): void {
    const grid = this.buffer[this.c % 2];
    if (grid[y][x] === 1) {
      grid[y][x] = 0;
    } else {
      grid[y][x] = 1;
    }
    this.notifyObservers();
  }

  /**
   * @override
   */
  protected notifyObservers() {
    for (const observer of this.observers) {
      observer.notify(this.buffer[this.c % 2], this.buffer[(this.c + 1) % 2]);
    }
  }

  private countNeighbours(grid, x: number, y: number): number {
    let count = 0;
    for (let offsetY = -1; offsetY < 2; offsetY++) {
      for (let offsetX = -1; offsetX < 2; offsetX++) {
        if (offsetY === 0 && offsetX === 0) { continue; }
        if (((x + offsetX !== -1 && y + offsetY !== -1 && y + offsetY !== this.h &&
          x + offsetX !== this.w) || this.wrapAround) &&
          grid[(this.h + y + offsetY) % this.h][(this.w + x + offsetX) % this.w] === 1) { count++; }
      }
    }
    return count;
  }

  private initGrid(): void {
    for (let i = 0; i < 2; i++) {
      for (let y = 0; y < this.h; y++) {
        this.buffer[i][y] = new Uint8Array(this.w);
        for (let x = 0; x < this.w; x++) {
          this.buffer[i][y][x] = 0;
        }
      }
    }
  }
}
