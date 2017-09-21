abstract class Drawer implements IObserver {
  protected CNV: HTMLCanvasElement;
  protected CTX: CanvasRenderingContext2D;
  protected rasterSize: number;
  protected isLittleEndian: boolean = true;
  protected buffer: CanvasRenderingContext2D;

  constructor(cnv: HTMLCanvasElement, rasterSize: number) {
    this.CNV = cnv;
    this.CTX = cnv.getContext("2d");
    this.rasterSize = rasterSize;
    this.buffer = document.createElement("canvas").getContext("2d");
    this.checkEndianness();
  }

  public notify(...args: any[]) {
    this.draw(args[0], ...args.slice(1));
  }

  public abstract draw(grid: BitMap, prev?: BitMap): void;

  private checkEndianness() {
    const buf = new ArrayBuffer(4);
    const buf32 = new Uint32Array(buf);
    buf32[0] = 0x0a0b0c0d;
    if (buf[0] === 0x0a && buf[1] === 0x0b && buf[2] === 0x0c &&
      buf[3] === 0x0d) {
      this.isLittleEndian = false;
    }
  }

}
