/// <reference path="drawer.ts" />
/// <reference path="soliddrawer.ts" />
/// <reference path="gradientdrawer.ts" />
/// <reference path="colordrawer.ts" />

namespace GameOfLife {
  let CNV: HTMLCanvasElement;
  let UPS: HTMLInputElement;
  let UPSLABEL: HTMLSpanElement;
  let START: HTMLButtonElement;
  let RASTER: HTMLCanvasElement;
  let RCTX: CanvasRenderingContext2D;
  let CTX;
  let life: Life;
  let lastCell = { x: -1, y: -1 };
  let drawer: Drawer;

  export function init() {
    //     readRLE(`#N Gosper glider gun
    // #C This was the first gun discovered.
    // #C As its name suggests, it was discovered by Bill Gosper.
    // x = 36, y = 9, rule = B3/S23
    // 24bo$22bobo$12b2o6b2o12b2o$11bo3bo4b2o12b2o$2o8bo5bo3b2o$2o8bo3bob2o4b
    // obo$10bo5bo7bo$11bo3bo$12b2o!`);
    declareGlobals();
    addListeners();
    life = new Life(40, 40);
    life.wrapAround = true;
    drawer = new SolidDrawer(CNV);
    life.registerObserver(drawer);
    drawRaster(life);
  }

  function declareGlobals() {
    CNV = document.getElementById("canvas") as HTMLCanvasElement;
    RASTER = document.getElementById("raster") as HTMLCanvasElement;
    CTX = CNV.getContext("2d") as CanvasRenderingContext2D;
    RCTX = RASTER.getContext("2d") as CanvasRenderingContext2D;
    UPS = document.getElementById("ups") as HTMLInputElement;
    UPSLABEL = document.getElementById("upslabel") as HTMLSpanElement;
    START = document.getElementById("start") as HTMLButtonElement;
    UPS.value = "1";
  }

  function addListeners() {
    CNV.addEventListener("mousedown", onMouseDown);
    CNV.addEventListener("mousemove", onMouseMove);
    START.addEventListener("click", onStartClick);
    UPS.addEventListener("input", updateUPS);
  }

  function onStartClick() {
    RASTER.classList.add("hidden");
    CNV.removeEventListener("mousedown", onMouseDown);
    CNV.removeEventListener("mousemove", onMouseMove);
    life.removeObserver(drawer);
    drawer = new ColorDrawer(CNV, ColorDrawerOptions.geneticColorPicker);
    life.registerObserver(drawer);
    life.start();
  }

  function updateUPS(e) {
    UPSLABEL.textContent = e.target.value;
    life.ups = parseInt(e.target.value, 10);
  }

  function onMouseDown(e) {
    lastCell = { x: -1, y: -1 };
    onCanvasDrag(e);
  }

  function onMouseMove(e) {
    if (e.buttons === 1) {
      onCanvasDrag(e);
    }
  }

  function onCanvasDrag(e) {
    const cursorPos = getCursorPosition(CNV, e);
    const cell = getCell(cursorPos.x, cursorPos.y);
    if (cell.x !== lastCell.x || cell.y !== lastCell.y) {
      life.toggleCell(cell.x, cell.y);
      lastCell = cell;
    }
  }

  function getCell(xcoord, ycoord) {
    return { x: Math.floor(xcoord / (CNV.width / life.w)), y: Math.floor(ycoord / (CNV.height / life.h)) };
  }

  function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function drawRaster(l: Life) {
    RCTX.strokeStyle = "black";
    const cnvW = CNV.width;
    const cnvH = CNV.height;
    const h = Math.round(cnvH / life.h);
    const w = Math.round(cnvW / life.w);
    for (let y = 0; y < life.h + 1; y++) {
      RCTX.beginPath();
      RCTX.moveTo(0, y * h);
      RCTX.lineTo(cnvW, y * h);
      RCTX.stroke();
    }
    for (let x = 0; x < life.w + 1; x++) {
      RCTX.beginPath();
      RCTX.moveTo(x * w, 0);
      RCTX.lineTo(x * w, cnvH);
      RCTX.stroke();
    }
  }

}
window.addEventListener("load", GameOfLife.init);
