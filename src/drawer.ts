abstract class Drawer implements IObserver {
  protected CNV: HTMLCanvasElement;
  protected CTX: CanvasRenderingContext2D;
  constructor(cnv: HTMLCanvasElement) {
    this.CNV = cnv;
    this.CTX = cnv.getContext("2d");
  }

  public notify(args: any) {
    this.draw(args);
  }

  public abstract draw(grid: Uint8Array[], prev?: Uint8Array[]): void;

}
