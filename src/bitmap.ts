// tslint:disable:no-bitwise
/**
 * Creates a two-dimensional field of bits
 */
class BitMap {
  public wrapAround: boolean;
  private buffer: ArrayBuffer;
  private w: number;
  private h: number;
  private b: Uint8Array;

  /**
   * Create a new two-dimensional field of bits with a given width and height
   * @param w
   * @param h
   */
  public constructor(w, h) {
    // Shift 3 because 2**3 = 8
    this.buffer = new ArrayBuffer(((w * h) >> 3) + 1);
    this.w = w;
    this.h = h;
    this.b = new Uint8Array(this.buffer);
    this.wrapAround = false;
  }

  /*   private getXY(i) {
    return [~~(i / this.w), i % this.w];
  } */

  public clone() {
    const b = new BitMap(this.getWidth(), this.getHeight());
    b.buffer = this.buffer.slice(0);
    b.b = new Uint8Array(b.buffer);
    b.wrapAround = this.wrapAround;
    return b;
  }

  public getWidth() {
    return this.w;
  }

  public getHeight() {
    return this.h;
  }

  /**
   * Change the size of the field.
   * Old values that are outside the new size are discarded.
   * New areas are filled with 0's
   * @param newW
   * @param newH
   */
  public changeSize(newW: number, newH: number): void {
    if (newW === this.w && newH === this.h) {
      return;
    }
    const newBuffer = new ArrayBuffer(((newW * newH) >> 3) + 1);
    const newB = new Uint8Array(newBuffer);
    const minW = Math.min(this.w, newW);
    const minH = Math.min(this.h, newH);
    // copy data over bitwise
    // bytewise would be way better performing, but I have no clue how, as rows are not byte-aligned
    for (let x = 0; x < minW; x++) {
      for (let y = 0; y < minH; y++) {
        if (this.get(x, y)) {
          const i = y * newW + x;
          newB[i >> 3] |= (1 << (i & 0b111));
        }
      }
    }
    this.buffer = newBuffer;
    this.b = newB;
    this.w = newW;
    this.h = newH;
  }
  /**
   * Get the bit at the given coordinates as a boolean
   * @param x
   * @param y
   */
  public get(x: number, y: number): boolean {
    const i = this.getIndex(x, y);
    return this.getAt(i);
  }

  /**
   * Get the bit at the given index as a boolean
   * @param i
   */
  public getAt(i: number): boolean {
    // shift 3 for 2^3 = 8, then AND with 111 to get the last three bits (max 7)
    return (this.b[i >> 3] & (1 << (i & 0b111))) !== 0;
  }

  /**
   * Sets the bit as an active bit (value 1)
   * @param x
   * @param y
   */
  public set(x: number, y: number): void {
    const i = this.getIndex(x, y);
    this.setAt(i);
  }

  /**
   * Sets the bit as an active bit (value 1)
   * @param i
   */
  public setAt(i): void {
    this.b[i >> 3] |= (1 << (i & 0b111));
  }

  /**
   * Sets the bit as an inactive bit (value 0)
   * @param x
   * @param y
   */
  public unset(x: number, y: number): void {
    const i = this.getIndex(x, y);
    this.unsetAt(i);
  }

  /**
   * Sets the bit as an inactive bit (value 0)
   * @param i
   */
  public unsetAt(i: number): void {
    this.b[i >> 3] &= ~(1 << (i & 0b111));
  }

  /**
   * Toggles the bit (1 becomes 0, 0 becomes 1)
   * @param x
   * @param y
   */
  public toggle(x: number, y: number): void {
    const i = this.getIndex(x, y);
    this.toggleAt(i);
  }

  /**
   * Toggles the bit (1 becomes 0, 0 becomes 1)
   * @param i
   */
  public toggleAt(i: number): void {
    this.b[i >> 3] ^= (1 << (i & 0b111));
  }
  /**
   * Get the number of alive neighbors of a given cell
   * @param x
   * @param y
   */
  public getNeighbors(x: number, y: number): number {
    const NEIGHBORS = [
      { x: -1, y: -1 },
      { x: -1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: 1, y: -1 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ];
    let c = 0;
    const w = this.w;
    const h = this.h;
    const wrapAround = this.wrapAround;
    for (const n of NEIGHBORS) {
      if ((x + n.x >= 0 && x + n.x < w && y + n.y >= 0 && y + n.y < h) || wrapAround) {
        c += (this.get((w + x + n.x) % w, (h + y + n.y) % h) ? 1 : 0);
      }
    }
    return c;
  }

  /**
   * Prints the bit field for debugging purposes
   * Caution: Endianness might mirror the grid visually, but accesses are still okay. I think
   */
  public printBitMap() {
    let str = "";
    for (const b of this.b) {
      str +=  Number(b).toString(2).padStart(8, "0");
    }
    str = str.replace(/(.{8})/g, "$1\n");
    // tslint:disable-next-line:no-console
    console.log(str);
  }

  private getIndex(x, y) {
    return y * this.w + x;
  }
}
