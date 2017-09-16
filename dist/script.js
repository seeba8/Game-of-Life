"use strict";
class Drawer {
    constructor(cnv) {
        this.CNV = cnv;
        this.CTX = cnv.getContext("2d");
    }
    notify(args) {
        this.draw(args);
    }
}
/// <reference path="drawer.ts" />
/// <reference path="iobserver.ts" />
class SolidDrawer extends Drawer {
    constructor(cnv) {
        super(cnv);
        this.CTX.fillStyle = "rgba(0,0,0,1)";
    }
    draw(grid) {
        const w = grid[0].length;
        const h = grid.length;
        const SIZE = Math.round(this.CNV.width / w);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (grid[y][x] === 1) {
                    this.CTX.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
                }
                else {
                    this.CTX.clearRect(x * SIZE, y * SIZE, SIZE, SIZE);
                }
            }
        }
    }
}
class GradientDrawer extends Drawer {
    draw(grid) {
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
/// <reference path="drawer.ts" />
class ColorDrawer extends Drawer {
    constructor(cnv, colorpicker) {
        super(cnv);
        this.getNewColor = colorpicker.bind(this);
    }
    draw(grid) {
        if (this.previous === undefined) {
            this.createInitialColors(grid);
        }
        else {
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
                }
                else {
                    this.CTX.fillStyle = "rgba(255,255,255,.2)";
                    this.CTX.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
                }
            }
        }
    }
    // protected getNewColor(x: number, y: number): IColor;
    getParentColors(x, y) {
        const parents = new Array();
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
    adjustPrevColors(grid) {
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
    createInitialColors(grid) {
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
var ColorDrawerOptions;
(function (ColorDrawerOptions) {
    function geneticColorPicker(x, y) {
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
        return { r: normalized[0], g: normalized[1], b: normalized[2] };
    }
    ColorDrawerOptions.geneticColorPicker = geneticColorPicker;
    function randomColorPicker(x, y) {
        return {
            r: Math.random() * 255,
            g: Math.random() * 255,
            b: Math.random() * 255,
        };
    }
    ColorDrawerOptions.randomColorPicker = randomColorPicker;
})(ColorDrawerOptions || (ColorDrawerOptions = {}));
/// <reference path="drawer.ts" />
/// <reference path="soliddrawer.ts" />
/// <reference path="gradientdrawer.ts" />
/// <reference path="colordrawer.ts" />
var GameOfLife;
(function (GameOfLife) {
    let CNV;
    let UPS;
    let UPSLABEL;
    let START;
    let RASTER;
    let RCTX;
    let CTX;
    let life;
    let lastCell = { x: -1, y: -1 };
    let drawer;
    function init() {
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
    GameOfLife.init = init;
    function declareGlobals() {
        CNV = document.getElementById("canvas");
        RASTER = document.getElementById("raster");
        CTX = CNV.getContext("2d");
        RCTX = RASTER.getContext("2d");
        UPS = document.getElementById("ups");
        UPSLABEL = document.getElementById("upslabel");
        START = document.getElementById("start");
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
    function drawRaster(l) {
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
})(GameOfLife || (GameOfLife = {}));
window.addEventListener("load", GameOfLife.init);
/// <reference path="iobserver.ts" />
class Observable {
    constructor() {
        this.observers = new Array();
    }
    registerObserver(observer) {
        this.observers.push(observer);
    }
    removeObserver(observer) {
        const index = this.observers.indexOf(observer);
        if (index === -1) {
            return false;
        }
        this.observers.splice(index, 1);
        return true;
    }
}
/// <reference path="observable.ts" />
class Life extends Observable {
    constructor(width, height) {
        super();
        this.wrapAround = false;
        this.buffer = { 0: new Array(), 1: new Array() };
        this.c = 0;
        this._ups = 1;
        this.w = width;
        this.h = height;
        this.initGrid();
    }
    set ups(ups) {
        this._ups = ups;
        if (this.clock !== undefined) {
            clearInterval(this.clock);
            this.clock = setInterval(this.tick.bind(this), 1000 / this.ups);
        }
    }
    get ups() {
        return this._ups;
    }
    tick() {
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
    start() {
        this.clock = setInterval(this.tick.bind(this), 1000 / this.ups);
        // this.tick();
    }
    toggleCell(x, y) {
        const grid = this.buffer[this.c % 2];
        if (grid[y][x] === 1) {
            grid[y][x] = 0;
        }
        else {
            grid[y][x] = 1;
        }
        this.notifyObservers();
    }
    /**
     * @override
     */
    notifyObservers() {
        for (const observer of this.observers) {
            observer.notify(this.buffer[this.c % 2]);
        }
    }
    countNeighbours(grid, x, y) {
        let count = 0;
        for (let offsetY = -1; offsetY < 2; offsetY++) {
            for (let offsetX = -1; offsetX < 2; offsetX++) {
                if (offsetY === 0 && offsetX === 0) {
                    continue;
                }
                if (((x + offsetX !== -1 && y + offsetY !== -1 && y + offsetY !== this.h &&
                    x + offsetX !== this.w) || this.wrapAround) &&
                    grid[(this.h + y + offsetY) % this.h][(this.w + x + offsetX) % this.w] === 1) {
                    count++;
                }
            }
        }
        return count;
    }
    initGrid() {
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
//# sourceMappingURL=script.js.map