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
class SolidDrawer extends Drawer {
    constructor(cnv) {
        super(cnv);
        this.CTX.fillStyle = "rgba(0,0,0,1)";
    }
    draw(grid) {
        const w = grid[0].length;
        const h = grid.length;
        const SIZE = 20;
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
        const SIZE = 20;
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
class ColorDrawer extends Drawer {
    constructor(cnv, colorpicker) {
        super(cnv);
        this.getNewColor = colorpicker.bind(this);
    }
    draw(grid, previous) {
        if (this.previous === undefined) {
            this.createInitialColors(grid);
        }
        else {
            this.previous = previous;
            this.adjustPrevColors(grid);
        }
        const w = grid[0].length;
        const h = grid.length;
        const SIZE = 20;
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
    getParentColors(x, y) {
        const parents = new Array();
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
        const minH = Math.min(grid.length, this.colors.length);
        while (grid.length > this.colors.length) {
            this.colors.push(new Array(grid[0].length));
        }
        if (this.colors.length > grid.length) {
            this.colors = this.colors.slice(0, grid.length);
        }
        while (grid[0].length > this.colors[0].length) {
            for (let i = 0; i < minH; i++) {
                this.colors[i].push({ r: 0, g: 0, b: 0 });
            }
        }
        if (grid[0].length < this.colors[0].length) {
            for (let i = 0; i < minH; i++) {
                this.colors[i] = this.colors[i].slice(0, grid[0].length);
            }
        }
        const h = grid.length;
        const w = grid[0].length;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (grid[y][x] === 1 && this.previous[y][x] === 0) {
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
                        g: (c % 3 === 1 ? 255 : 0),
                        b: (c % 3 === 2 ? 255 : 0),
                    };
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
    function randomColorPicker() {
        return {
            r: Math.random() * 255,
            g: Math.random() * 255,
            b: Math.random() * 255,
        };
    }
    ColorDrawerOptions.randomColorPicker = randomColorPicker;
})(ColorDrawerOptions || (ColorDrawerOptions = {}));
var GameOfLife;
(function (GameOfLife) {
    let CNV;
    let UPS;
    let UPSLABEL;
    let START;
    let RASTER;
    let RCTX;
    let MENU;
    let WRAPAROUND;
    let DRAWTYPE;
    let life;
    let lastCell = { x: -1, y: -1 };
    let editDrawer;
    let drawer;
    let mouseOffset = { x: 0, y: 0 };
    const rasterSize = 20;
    function init() {
        declareGlobals();
        addListeners();
        onWindowResize();
        editDrawer = new SolidDrawer(CNV);
        drawer = new SolidDrawer(CNV);
        life.registerObserver(editDrawer);
    }
    GameOfLife.init = init;
    function declareGlobals() {
        CNV = document.getElementById("canvas");
        RASTER = document.getElementById("raster");
        RCTX = RASTER.getContext("2d");
        UPS = document.getElementById("ups");
        UPSLABEL = document.getElementById("upslabel");
        START = document.getElementById("start");
        MENU = document.getElementById("menu");
        WRAPAROUND = document.getElementById("wraparound");
        DRAWTYPE = document.getElementById("drawtype");
        UPS.value = "1";
    }
    function addListeners() {
        CNV.addEventListener("mousedown", onMouseDown);
        CNV.addEventListener("mousemove", onMouseMove);
        START.addEventListener("click", onStartClick);
        UPS.addEventListener("input", updateUPS);
        MENU.addEventListener("mousedown", onMenuMouseDown, false);
        MENU.addEventListener("mouseup", onMenuMouseUp, false);
        window.addEventListener("resize", onWindowResize);
        WRAPAROUND.addEventListener("change", onWrapAroundChange);
        DRAWTYPE.addEventListener("change", onDrawTypeChange);
    }
    function onDrawTypeChange(e) {
        switch (e.target.value) {
            case "gradient":
                drawer = new GradientDrawer(CNV);
                break;
            case "genetic":
                drawer = new ColorDrawer(CNV, ColorDrawerOptions.geneticColorPicker);
                break;
            case "random":
                drawer = new ColorDrawer(CNV, ColorDrawerOptions.randomColorPicker);
                break;
            default:
                drawer = new SolidDrawer(CNV);
        }
    }
    function onWrapAroundChange(e) {
        life.wrapAround = e.target.checked;
    }
    function onWindowResize() {
        CNV.width = window.innerWidth;
        CNV.height = window.innerHeight;
        RASTER.width = window.innerWidth;
        RASTER.height = window.innerHeight;
        if (life === undefined) {
            life = new Life(Math.ceil(CNV.width / rasterSize), Math.ceil(CNV.height / rasterSize));
        }
        else {
            life.setSize(Math.ceil(CNV.width / rasterSize), Math.ceil(CNV.height / rasterSize));
        }
        drawRaster();
    }
    function onMenuMouseDown(e) {
        if (e.target.id !== "menu" && e.target.id !== "menutitle") {
            return;
        }
        MENU.addEventListener("mousemove", onMenuMouseMove, true);
        mouseOffset = { x: e.clientX - MENU.offsetLeft, y: e.clientY - MENU.offsetTop };
    }
    function onMenuMouseUp() {
        MENU.removeEventListener("mousemove", onMenuMouseMove, true);
    }
    function onMenuMouseMove(e) {
        MENU.style.left = e.clientX - mouseOffset.x + "px";
        MENU.style.top = e.clientY - mouseOffset.y + "px";
    }
    function onStartClick() {
        RASTER.classList.add("hidden");
        CNV.removeEventListener("mousedown", onMouseDown);
        CNV.removeEventListener("mousemove", onMouseMove);
        life.removeObserver(editDrawer);
        editDrawer = new ColorDrawer(CNV, ColorDrawerOptions.geneticColorPicker);
        CNV.getContext("2d").clearRect(0, 0, CNV.width, CNV.height);
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
})(GameOfLife || (GameOfLife = {}));
window.addEventListener("load", GameOfLife.init);
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
    getGrid() {
        return this.buffer[this.c % 2];
    }
    setSize(w, h) {
        this.w = w;
        this.h = h;
        const minH = Math.min(h, this.buffer[0].length);
        if (h < this.buffer[0].length) {
            this.buffer[0] = this.buffer[0].slice(0, h);
            this.buffer[1] = this.buffer[1].slice(0, h);
        }
        else if (h > this.buffer[0].length) {
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
        }
        else if (w > this.buffer[0][0].length) {
            for (let y = 0; y < minH; y++) {
                for (let i = 0; i < 2; i++) {
                    const b = this.buffer[i][y].slice(0);
                    this.buffer[i][y] = new Uint8Array(w);
                    for (let x = 0; x < b.length; x++) {
                        this.buffer[i][y][x] = b[x];
                    }
                }
            }
        }
        this.notifyObservers();
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
        console.log(this.wrapAround);
        this.clock = setInterval(this.tick.bind(this), 1000 / this.ups);
        this.tick();
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
    notifyObservers() {
        for (const observer of this.observers) {
            observer.notify(this.buffer[this.c % 2], this.buffer[(this.c + 1) % 2]);
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