"use strict";
class Drawer {
    constructor(cnv, rasterSize) {
        this.isLittleEndian = true;
        this.CNV = cnv;
        this.CTX = cnv.getContext("2d");
        this.rasterSize = rasterSize;
        this.buffer = document.createElement("canvas").getContext("2d");
        this.checkEndianness();
    }
    notify(...args) {
        this.draw(args[0], ...args.slice(1));
    }
    checkEndianness() {
        const buf = new ArrayBuffer(4);
        const buf32 = new Uint32Array(buf);
        buf32[0] = 0x0a0b0c0d;
        if (buf[0] === 0x0a && buf[1] === 0x0b && buf[2] === 0x0c &&
            buf[3] === 0x0d) {
            this.isLittleEndian = false;
        }
    }
}
class BitMap {
    constructor(w, h) {
        this.buffer = new ArrayBuffer(((w * h) >> 3) + 1);
        this.w = w;
        this.h = h;
        this.b = new Uint8Array(this.buffer);
        this.wrapAround = false;
    }
    clone() {
        const b = new BitMap(this.getWidth(), this.getHeight());
        b.buffer = this.buffer.slice(0);
        b.b = new Uint8Array(b.buffer);
        b.wrapAround = this.wrapAround;
        return b;
    }
    getWidth() {
        return this.w;
    }
    getHeight() {
        return this.h;
    }
    changeSize(newW, newH) {
        if (newW === this.w && newH === this.h) {
            return;
        }
        const newBuffer = new ArrayBuffer(((newW * newH) >> 3) + 1);
        const newB = new Uint8Array(newBuffer);
        const minW = Math.min(this.w, newW);
        const minH = Math.min(this.h, newH);
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
    get(x, y) {
        const i = this.getIndex(x, y);
        return this.getAt(i);
    }
    getAt(i) {
        return (this.b[i >> 3] & (1 << (i & 0b111))) !== 0;
    }
    set(x, y) {
        const i = this.getIndex(x, y);
        this.setAt(i);
    }
    setAt(i) {
        this.b[i >> 3] |= (1 << (i & 0b111));
    }
    unset(x, y) {
        const i = this.getIndex(x, y);
        this.unsetAt(i);
    }
    unsetAt(i) {
        this.b[i >> 3] &= ~(1 << (i & 0b111));
    }
    toggle(x, y) {
        const i = this.getIndex(x, y);
        this.toggleAt(i);
    }
    toggleAt(i) {
        this.b[i >> 3] ^= (1 << (i & 0b111));
    }
    getNeighbors(x, y) {
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
    printBitMap() {
        let str = "";
        for (const b of this.b) {
            str += Number(b).toString(2).padStart(8, "0");
        }
        str = str.replace(/(.{8})/g, "$1\n");
        console.log(str);
    }
    getIndex(x, y) {
        return y * this.w + x;
    }
}
class SolidDrawer extends Drawer {
    constructor(cnv, rasterSize) {
        super(cnv, rasterSize);
    }
    draw(grid) {
        const w = grid.getWidth();
        const h = grid.getHeight();
        const imagedata = new ImageData(w, h);
        const data = imagedata.data;
        const buf = data.buffer;
        const v32 = new Uint32Array(buf);
        const white = 0xffffffff;
        const black = this.isLittleEndian ? 0xff000000 : 0x000000ff;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (grid.get(x, y)) {
                    v32[y * w + x] = black;
                }
                else {
                    v32[y * w + x] = white;
                }
            }
        }
        this.buffer.putImageData(imagedata, 0, 0);
        this.CTX.drawImage(this.buffer.canvas, 0, 0);
    }
}
class GradientDrawer extends Drawer {
    draw(grid) {
        const w = grid.getWidth();
        const h = grid.getHeight();
        if (this.imagedata === undefined) {
            this.imagedata = new ImageData(w, h);
        }
        this.CTX.clearRect(0, 0, this.CNV.width, this.CNV.height);
        const data = this.imagedata.data;
        const diff = 0x10;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (grid.get(x, y)) {
                    data[(y * w + x) * 4 + 3] += diff;
                }
                else {
                    data[(y * w + x) * 4 + 3] -= diff;
                }
            }
        }
        this.buffer.putImageData(this.imagedata, 0, 0);
        this.CTX.drawImage(this.buffer.canvas, 0, 0);
    }
}
class ColorDrawer extends Drawer {
    constructor(cnv, rasterSize, colorpicker) {
        super(cnv, rasterSize);
        this.getNewColor = colorpicker.bind(this);
    }
    draw(grid, previous) {
        const w = grid.getWidth();
        const h = grid.getHeight();
        if (this.imagedata === undefined) {
            this.imagedata = new ImageData(w, h);
            this.createInitialColors(grid);
        }
        else {
            this.adjustPrevColors(grid, previous);
        }
        this.CTX.clearRect(0, 0, this.CNV.width, this.CNV.height);
        const data = this.imagedata.data;
        const d32 = new Uint32Array(data.buffer);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (grid.get(x, y)) {
                    const c = this.colors[y][x];
                    if (this.isLittleEndian) {
                        d32[y * w + x] = (255 << 24) | (c.b << 16) | (c.g << 8) | c.r;
                    }
                    else {
                        d32[y * w + x] = (c.r << 24) | (c.g << 16) | (c.b << 8) | 255;
                    }
                }
                else {
                    d32[y * w + x] = 0;
                }
            }
        }
        this.buffer.putImageData(this.imagedata, 0, 0);
        this.CTX.drawImage(this.buffer.canvas, 0, 0);
    }
    getParentColors(x, y, previous) {
        const width = previous.getWidth();
        const height = previous.getHeight();
        const parents = new Array();
        for (let offsetX = -1; offsetX < 2; offsetX++) {
            for (let offsetY = -1; offsetY < 2; offsetY++) {
                if (x + offsetX !== -1 && x + offsetX !== width &&
                    y + offsetY !== -1 && y + offsetY !== height &&
                    previous.get(x + offsetX, y + offsetY)) {
                    parents.push(this.colors[y + offsetY][x + offsetX]);
                }
            }
        }
        return parents;
    }
    adjustPrevColors(grid, previous) {
        const width = grid.getWidth();
        const height = grid.getHeight();
        const minH = Math.min(height, this.colors.length);
        while (height > this.colors.length) {
            this.colors.push(new Array(width));
        }
        if (this.colors.length > height) {
            this.colors = this.colors.slice(0, height);
        }
        while (width > this.colors[0].length) {
            for (let i = 0; i < minH; i++) {
                this.colors[i].push({ r: 0, g: 0, b: 0 });
            }
        }
        if (width < this.colors[0].length) {
            for (let i = 0; i < minH; i++) {
                this.colors[i] = this.colors[i].slice(0, width);
            }
        }
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (grid.get(x, y) && !previous.get(x, y)) {
                    this.colors[y][x] = this.getNewColor(x, y, previous);
                }
            }
        }
    }
    createInitialColors(grid) {
        let c = 0;
        const h = grid.getHeight();
        const w = grid.getWidth();
        this.colors = new Array(h);
        for (let y = 0; y < h; y++) {
            this.colors[y] = new Array(w);
            for (let x = 0; x < w; x++) {
                if (grid.get(x, y)) {
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
    function geneticColorPicker(x, y, previous) {
        const parentColors = this.getParentColors(x, y, previous);
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
var State;
(function (State) {
    State[State["running"] = 0] = "running";
    State[State["paused"] = 1] = "paused";
    State[State["editing"] = 2] = "editing";
})(State || (State = {}));
;
var GameOfLife;
(function (GameOfLife) {
    let CNV;
    let UPS;
    let UPSLABEL;
    let START;
    let PAUSE;
    let RESET;
    let STOP;
    let RASTER;
    let CTX;
    let RCTX;
    let MENU;
    let WRAPAROUND;
    let DRAWTYPE;
    let RASTERSIZE;
    let RASTERLABEL;
    let life;
    let lastCell = { x: -1, y: -1 };
    let editDrawer;
    let drawer;
    let mouseOffset = { x: 0, y: 0 };
    let rasterSize = 20;
    let state = State.editing;
    function init() {
        declareGlobals();
        addListeners();
        onWindowResize();
        setValuesFromUI();
        editDrawer = new SolidDrawer(CNV, rasterSize);
        life.registerObserver(editDrawer);
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
        MENU = document.getElementById("menu");
        WRAPAROUND = document.getElementById("wraparound");
        DRAWTYPE = document.getElementById("drawtype");
        RASTERSIZE = document.getElementById("rastersize");
        RASTERLABEL = document.getElementById("rasterlabel");
        RESET = document.getElementById("reset");
        PAUSE = document.getElementById("pause");
        STOP = document.getElementById("stop");
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
    function onDrawTypeChange(e) {
        ;
        if (state !== State.editing) {
            console.log(state);
            life.removeObserver(drawer);
        }
        switch (e.target.value) {
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
        if (state !== State.editing) {
            life.registerObserver(drawer);
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
            updateLifeSize();
            drawRaster();
        }
    }
    function updateLifeSize() {
        life.setSize(Math.ceil(CNV.width / rasterSize), Math.ceil(CNV.height / rasterSize));
        drawRaster();
        CTX.setTransform(1, 0, 0, 1, 0, 0);
        CTX.scale(rasterSize, rasterSize);
        CTX.imageSmoothingEnabled = false;
        life.notifyObservers();
    }
    function onRasterSizeChange(e) {
        RASTERLABEL.textContent = e.target.value;
        rasterSize = Number(e.target.value);
        DRAWTYPE.dispatchEvent(new Event("change"));
        updateLifeSize();
    }
    function onMenuMouseDown(e) {
        if (e.target.id !== "menu" && e.target.id !== "menutitle") {
            return;
        }
        CNV.addEventListener("mousemove", onMenuMouseMove, true);
        MENU.addEventListener("mousemove", onMenuMouseMove, true);
        mouseOffset = { x: e.clientX - MENU.offsetLeft, y: e.clientY - MENU.offsetTop };
    }
    function onMenuMouseUp() {
        CNV.removeEventListener("mousemove", onMenuMouseMove, true);
        MENU.removeEventListener("mousemove", onMenuMouseMove, true);
    }
    function onMenuMouseMove(e) {
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
        setState(State.editing);
        life.reset();
    }
    function setState(s) {
        state = s;
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
        if (e.button !== 0) {
            return;
        }
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
        this.c = 0;
        this._ups = 1;
        this._wrapAround = false;
        this.buffer = { 0: new BitMap(width, height), 1: new BitMap(width, height) };
        this.w = width;
        this.h = height;
        this.startBitMap = new BitMap(width, height);
    }
    get wrapAround() {
        return this._wrapAround;
    }
    set wrapAround(wrapAround) {
        this._wrapAround = wrapAround;
        this.buffer[0].wrapAround = wrapAround;
        this.buffer[1].wrapAround = wrapAround;
    }
    isRunning() {
        return this.clock !== undefined;
    }
    reset() {
        if (this.clock !== undefined) {
            clearInterval(this.clock);
            this.clock = undefined;
        }
        this.c = 0;
        this.buffer[this.c] = this.startBitMap;
        this.notifyObservers();
    }
    getGrid() {
        return this.buffer[this.c % 2];
    }
    setSize(w, h) {
        this.buffer[0].changeSize(w, h);
        this.buffer[1].changeSize(w, h);
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
                const neighbours = off.getNeighbors(x, y);
                switch (neighbours) {
                    case 0:
                    case 1:
                        grid.unset(x, y);
                        break;
                    case 2:
                        if (off.get(x, y)) {
                            grid.set(x, y);
                        }
                        else {
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
    pause() {
        clearInterval(this.clock);
    }
    start() {
        this.notifyObservers();
        this.clock = setInterval(this.tick.bind(this), 1000 / this.ups);
        this.startBitMap = this.buffer[0].clone();
    }
    toggleCell(x, y) {
        const grid = this.buffer[this.c % 2];
        grid.toggle(x, y);
        this.notifyObservers();
    }
    notifyObservers() {
        for (const observer of this.observers) {
            observer.notify(this.buffer[this.c % 2], this.buffer[(this.c + 1) % 2]);
        }
    }
}
//# sourceMappingURL=script.js.map