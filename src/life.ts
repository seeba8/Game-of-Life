/// <reference path="observable.ts" />
/// <reference path="bitmap.ts" />

class Life extends Observable {
  public w: number;
  public h: number;
  private buffer: {0: BitMap, 1: BitMap};
  private c = 0;
  private clock: number;
  private _ups: number = 1;
  private _wrapAround: boolean = false;
  private startBitMap: BitMap;

  constructor(width: number, height: number) {
    super();
    this.buffer = { 0: new BitMap(width, height), 1: new BitMap(width, height)} ;
    this.w = width;
    this.h = height;
    this.startBitMap = new BitMap(width, height);
  }

  public get wrapAround() {
    return this._wrapAround;
  }

  public set wrapAround(wrapAround: boolean) {
    this._wrapAround = wrapAround;
    this.buffer[0].wrapAround = wrapAround;
    this.buffer[1].wrapAround = wrapAround;
  }

  public isRunning(): boolean {
    return this.clock !== undefined;
  }

  public reset() {
    if (this.clock !== undefined) {
      clearInterval(this.clock);
      this.clock = undefined;
    }
    this.c = 0;
    this.buffer[this.c] = this.startBitMap;
    this.notifyObservers();
  }

  public getGrid() {
    return this.buffer[this.c % 2];
  }

  public setSize(w: number, h: number): void {
    this.buffer[0].changeSize(w, h);
    this.buffer[1].changeSize(w, h);
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
    const grid: BitMap = this.buffer[this.c % 2];
    const off: BitMap = this.buffer[(this.c + 1) % 2];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const neighbours = off.getNeighbors(x, y);
        switch (neighbours) {
          case 0:
          case 1:
            grid.unset(x, y);
            break;
          case 2:
            if (off.get(x, y)) {
              grid.set(x, y);
            } else {
              grid.unset(x, y);
            }
            break;
          case 3:
            grid.set(x, y);
            break;
          default:
            grid.unset(x, y);
        }
      }
    }
    this.notifyObservers();
  }

  public pause(): void {
    clearInterval(this.clock);
  }

  public start(): void {
    this.notifyObservers();
    this.clock = setInterval(this.tick.bind(this), 1000 / this.ups)
    this.startBitMap = this.buffer[0].clone();
  }

  public toggleCell(x: number, y: number): void {
    const grid: BitMap = this.buffer[this.c % 2];
    grid.toggle(x, y);
    this.notifyObservers();
  }

  /**
   * @override
   */
  public notifyObservers() {
    for (const observer of this.observers) {
      observer.notify(this.buffer[this.c % 2], this.buffer[(this.c + 1) % 2]);
    }
  }
}
