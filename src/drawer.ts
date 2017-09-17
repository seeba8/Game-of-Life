abstract class Drawer implements IObserver {
  protected CNV: HTMLCanvasElement;
  protected CTX: CanvasRenderingContext2D;
  protected rasterSize: number;

  constructor(cnv: HTMLCanvasElement, rasterSize: number) {
    this.CNV = cnv;
    this.CTX = cnv.getContext("2d");
    this.rasterSize = rasterSize;
  }

  public notify(args: any) {
    this.draw(args);
  }

  public abstract draw(grid: BitMap, prev?: BitMap): void;

}
