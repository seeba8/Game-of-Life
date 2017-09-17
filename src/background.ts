/// <reference path="drawer.ts" />
/// <reference path="soliddrawer.ts" />
/// <reference path="gradientdrawer.ts" />
/// <reference path="colordrawer.ts" />

namespace GameOfLife {
  let CNV: HTMLCanvasElement;
  let UPS: HTMLInputElement;
  let UPSLABEL: HTMLSpanElement;
  let START: HTMLButtonElement;
  let PAUSE: HTMLButtonElement;
  let RESET: HTMLButtonElement;
  let STOP: HTMLButtonElement;
  let RASTER: HTMLCanvasElement;
  let RCTX: CanvasRenderingContext2D;
  let MENU: HTMLDivElement;
  let WRAPAROUND: HTMLInputElement;
  let DRAWTYPE: HTMLSelectElement;
  let RASTERSIZE: HTMLInputElement;
  let RASTERLABEL: HTMLSpanElement;
  let life: Life;
  let lastCell = { x: -1, y: -1 };
  let editDrawer: Drawer;
  let drawer: Drawer;
  let mouseOffset = {x: 0, y: 0};
  let rasterSize = 20;

  export function init() {
    //     readRLE(`#N Gosper glider gun
    // #C This was the first gun discovered.
    // #C As its name suggests, it was discovered by Bill Gosper.
    // x = 36, y = 9, rule = B3/S23
    // 24bo$22bobo$12b2o6b2o12b2o$11bo3bo4b2o12b2o$2o8bo5bo3b2o$2o8bo3bob2o4b
    // obo$10bo5bo7bo$11bo3bo$12b2o!`);
    declareGlobals();
    addListeners();
    onWindowResize();
    editDrawer = new SolidDrawer(CNV, rasterSize);
    drawer = new SolidDrawer(CNV, rasterSize);
    life.registerObserver(editDrawer);
    setValuesFromUI();
  }

  function declareGlobals() {
    CNV = document.getElementById("canvas") as HTMLCanvasElement;
    RASTER = document.getElementById("raster") as HTMLCanvasElement;
    RCTX = RASTER.getContext("2d") as CanvasRenderingContext2D;
    UPS = document.getElementById("ups") as HTMLInputElement;
    UPSLABEL = document.getElementById("upslabel") as HTMLSpanElement;
    START = document.getElementById("start") as HTMLButtonElement;
    MENU = document.getElementById("menu") as HTMLDivElement;
    WRAPAROUND = document.getElementById("wraparound") as HTMLInputElement;
    DRAWTYPE = document.getElementById("drawtype") as HTMLSelectElement;
    RASTERSIZE = document.getElementById("rastersize") as HTMLInputElement;
    RASTERLABEL = document.getElementById("rasterlabel") as HTMLSpanElement;
    RESET = document.getElementById("reset") as HTMLButtonElement;
    PAUSE = document.getElementById("pause") as HTMLButtonElement;
    STOP = document.getElementById("stop") as HTMLButtonElement;
  }

  function addListeners() {
    CNV.addEventListener("mousedown", onMouseDown);
    CNV.addEventListener("mousemove", onMouseMove);
    START.addEventListener("click", onStartClick);
    UPS.addEventListener("input", onUPSChange);
    MENU.addEventListener("mousedown", onMenuMouseDown, false);
    MENU.addEventListener("mouseup", onMenuMouseUp, false);
    window.addEventListener("resize", onWindowResize);
    WRAPAROUND.addEventListener("change", onWrapAroundChange);
    DRAWTYPE.addEventListener("change", onDrawTypeChange);
    RASTERSIZE.addEventListener("input", onRasterSizeChange);
    RESET.addEventListener("click", onResetClick);
    PAUSE.addEventListener("click", onPauseClick);
    STOP.addEventListener("click", onStopClick);
  }

  function setValuesFromUI() {
    UPS.dispatchEvent(new Event("input"));
    DRAWTYPE.dispatchEvent(new Event("change"));
    WRAPAROUND.dispatchEvent(new Event("change"));
    RASTERSIZE.dispatchEvent(new Event("input"));
  }

  function onDrawTypeChange(e: Event) {
    switch ((e.target as HTMLSelectElement).value) {
      case "gradient":
        drawer = new GradientDrawer(CNV, rasterSize);
        break;
      case "genetic":
        drawer = new ColorDrawer(CNV, rasterSize, ColorDrawerOptions.geneticColorPicker);
        break;
      case "random":
        drawer = new ColorDrawer(CNV, rasterSize, ColorDrawerOptions.randomColorPicker);
        break;
      default:
        drawer = new SolidDrawer(CNV, rasterSize);
    }
  }

  function onWrapAroundChange(e: Event) {
    life.wrapAround = (e.target as HTMLInputElement).checked;
  }

  function onWindowResize() {
    CNV.width = window.innerWidth;
    CNV.height = window.innerHeight;
    RASTER.width = window.innerWidth;
    RASTER.height = window.innerHeight;
    if (life === undefined) {
      life = new Life(Math.ceil(CNV.width / rasterSize), Math.ceil(CNV.height / rasterSize));
      drawRaster();
    } else {
      updateLifeSize();
    }
  }

  function updateLifeSize() {
    life.setSize(Math.ceil(CNV.width / rasterSize), Math.ceil(CNV.height / rasterSize));
    drawRaster();
  }

  function onRasterSizeChange(e: Event) {
    RASTERLABEL.textContent  = (e.target as HTMLInputElement).value;
    rasterSize = Number((e.target as HTMLInputElement).value);
    life.removeObserver(editDrawer);
    editDrawer = new SolidDrawer(CNV, rasterSize);
    life.registerObserver(editDrawer);
    DRAWTYPE.dispatchEvent(new Event("change"));
    updateLifeSize();

  }

  function onMenuMouseDown(e: MouseEvent) {
    if ((e.target as HTMLElement).id !== "menu" && (e.target as HTMLElement).id !== "menutitle") {
      return;
    }
    CNV.addEventListener("mousemove", onMenuMouseMove, true);
    MENU.addEventListener("mousemove", onMenuMouseMove, true);
    mouseOffset = {x: e.clientX - MENU.offsetLeft, y: e.clientY - MENU.offsetTop};
  }

  function onMenuMouseUp() {
    CNV.removeEventListener("mousemove", onMenuMouseMove, true);
    MENU.removeEventListener("mousemove", onMenuMouseMove, true);
  }

  function onMenuMouseMove(e: MouseEvent) {
    MENU.style.left = e.clientX - mouseOffset.x + "px";
    MENU.style.top = e.clientY - mouseOffset.y + "px";
  }

  function onStartClick() {
    life.removeObserver(editDrawer);
    CNV.getContext("2d").clearRect(0, 0, CNV.width, CNV.height);
    life.registerObserver(drawer);
    life.start();
    setState(State.running);
  }

  function onStopClick() {
    CNV.getContext("2d").clearRect(0, 0, CNV.width, CNV.height);
    life.removeObserver(drawer);
    life.registerObserver(editDrawer);
    life.reset();
    setState(State.editing);
  }

  enum State {
    "running",
    "paused",
    "editing",
  };
  function setState(state: State) {
    switch (state) {
      case State.running:
        CNV.removeEventListener("mousedown", onMouseDown);
        CNV.removeEventListener("mousemove", onMouseMove);
        START.classList.add("hidden");
        PAUSE.classList.remove("hidden");
        RESET.classList.add("hidden");
        STOP.classList.remove("hidden");
        RASTER.classList.add("hidden");
        break;
      case State.paused:
        PAUSE.classList.add("hidden");
        START.classList.remove("hidden");
        break;
      default:
        START.classList.remove("hidden");
        PAUSE.classList.add("hidden");
        RESET.classList.remove("hidden");
        STOP.classList.add("hidden");
        RASTER.classList.remove("hidden");
        CNV.addEventListener("mousedown", onMouseDown);
        CNV.addEventListener("mousemove", onMouseMove);
    }
  }

  function onPauseClick() {
    life.pause();
    setState(State.paused);
    life.removeObserver(drawer);
  }

  function onResetClick() {
    life = new Life(Math.ceil(CNV.width / rasterSize), Math.ceil(CNV.height / rasterSize));
    life.removeObserver(drawer);
    life.registerObserver(editDrawer);
    life.notifyObservers();
    setState(State.editing);
  }

  function onUPSChange(e) {
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
    return { x: Math.floor(xcoord / rasterSize), y: Math.floor(ycoord / rasterSize) };
  }

  function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function drawRaster() {
    RCTX.strokeStyle = "black";
    const cnvW = CNV.width;
    const cnvH = CNV.height;
    RCTX.clearRect(0, 0, cnvW, cnvH);
    for (let y = 0; y <= cnvH; y += rasterSize) {
      RCTX.beginPath();
      RCTX.moveTo(0, y);
      RCTX.lineTo(cnvW, y);
      RCTX.stroke();
    }
    for (let x = 0; x <= cnvW; x += rasterSize) {
      RCTX.beginPath();
      RCTX.moveTo(x, 0);
      RCTX.lineTo(x, cnvH);
      RCTX.stroke();
    }
  }
}

window.addEventListener("load", GameOfLife.init);
