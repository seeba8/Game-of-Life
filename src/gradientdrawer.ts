class GradientDrawer extends Drawer implements IObserver {
  public draw(grid: Uint8Array[]): void {
    const w = grid[0].length;
    const h = grid.length;
    const SIZE = Math.round(this.CNV.width / w);
    this.CTX.fillStyle = "rgba(0,0,0,0.2)";
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (grid[y][x] === 1) {
          this.CTX.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
        }
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (grid[y][x] === 0) {
          this.CTX.fillStyle = "rgba(255,255,255,0.2)";
          this.CTX.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
        }
      }
    }
  }

}
