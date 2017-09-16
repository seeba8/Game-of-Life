"use strict";
let CNV, UPS, UPSLABEL, START, RASTER;
/**
 * @type {CanvasRenderingContext2D}
 */
let CTX;

/**
 * @type {CanvasRenderingContext2D}
 */
let RCTX;
let ups = 1;
let w = 60;
let h = 60;
let buffer = { 0: new Array(), 1: new Array() };
let c = 0;
let lastCell = { x: -1, y: -1 };
let wrapAround = false;

function initGrid(grid, w, h) {
    for (let y = 0; y < h; y++) {
        grid[y] = new Uint8Array(w);
        for (let x = 0; x < w; x++) {
            grid[y][x] = 0;
        }
    }
}

function countNeighbours(grid, x, y, wraparound = false) {
    let count = 0;
    for (let offsetY = -1; offsetY < 2; offsetY++) {
        for (let offsetX = -1; offsetX < 2; offsetX++) {
            if (offsetY === 0 && offsetX === 0) continue;
            if (((x + offsetX !== -1 && y + offsetY !== -1 && y + offsetY !== h && x + offsetX !== w) || wraparound) &&
                grid[(h + y + offsetY) % h][(w + x + offsetX) % w] === 1) count++;
        }
    }
    return count;
}

/* function copyGrid() {
    let buff = Array();
    for (let y = 0; y < h; y++) {
        buff[y] = new Uint8Array(w);
        for (let x = 0; x < w; x++) {
            buff[y][x] = grid[y][x];
        }
    }
    return buff;
} */

function tick() {
    c++;
    let buff = buffer[c % 2];
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const neighbours = countNeighbours(buffer[(c + 1) % 2], x, y, wrapAround);
            switch (neighbours) {
                case 0:
                case 1:
                    buff[y][x] = 0;
                    break;
                case 2:
                    buff[y][x] = buffer[(c + 1) % 2][y][x];
                    break;
                case 3:
                    buff[y][x] = 1;
                    break;
                default:
                    buff[y][x] = 0;
            }
        }
    }
    drawGradient(buff);
    setTimeout(tick, (1000 / ups));
}

function startLife() {
    CTX.fillStyle = "rgba(0,0,0,0.3)";
    RASTER.classList.add("hidden");
    CNV.removeEventListener("mousedown", onMouseDown);
    CNV.removeEventListener("mousemove", onMouseMove);
    tick();
}

/* function onCanvasClick(e) {
    const cursorPos = getCursorPosition(CNV, e);
    const cell = getCell(cursorPos.x, cursorPos.y);
    toggleCell(buffer[0], cell.x, cell.y);
    show(buffer[0]);
} */
function onCanvasDrag(e) {
    const cursorPos = getCursorPosition(CNV, e);
    const cell = getCell(cursorPos.x, cursorPos.y);
    if (cell.x !== lastCell.x || cell.y !== lastCell.y) {
        toggleCell(buffer[0], cell.x, cell.y);
        drawSolid(buffer[0]);
        lastCell = cell;
    }

}

function getCursorPosition(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    //console.log("x: " + x + " y: " + y);
    return { x: x, y: y };
}

function toggleCell(grid, x, y) {
    if (grid[y][x] === 1) {
        grid[y][x] = 0;
    } else {
        grid[y][x] = 1;
    }
}

function getCell(xcoord, ycoord) {
    return { x: Math.floor(xcoord / (CNV.height / h)), y: Math.floor(ycoord / (CNV.height / h)) };
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

function init() {
    readRLE(`#N Gosper glider gun
#C This was the first gun discovered.
#C As its name suggests, it was discovered by Bill Gosper.
x = 36, y = 9, rule = B3/S23
24bo$22bobo$12b2o6b2o12b2o$11bo3bo4b2o12b2o$2o8bo5bo3b2o$2o8bo3bob2o4b
obo$10bo5bo7bo$11bo3bo$12b2o!`);
    CNV = document.getElementById("canvas");
    RASTER = document.getElementById("raster");
    CTX = CNV.getContext("2d");
    RCTX = RASTER.getContext("2d");
    UPS = document.getElementById("ups");
    UPSLABEL = document.getElementById("upslabel");
    START = document.getElementById("start");
    START.addEventListener("click", startLife);
    UPS.addEventListener("input", updateUPS);
    // CNV.addEventListener("click", onCanvasClick);
    CNV.addEventListener("mousedown", onMouseDown);

    CNV.addEventListener("mousemove", onMouseMove);
    initGrid(buffer[0], w, h);
    initGrid(buffer[1], w, h);
    drawGrid(w, h);
}

function drawGradient(grid) {
    const SIZE = Math.round(CNV.width / w);
    CTX.fillStyle = "rgba(0,0,0,0.2)";
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (grid[y][x] === 1) {

                CTX.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
            }
        }
    }
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (grid[y][x] === 0) {
                CTX.fillStyle = "rgba(255,255,255,0.2)";
                CTX.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
            }
        }
    }
}

function drawSolid(grid) {
    const SIZE = Math.round(CNV.width / w);
    CTX.fillStyle = "rgba(0,0,0,1)";
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (grid[y][x] === 1) {
                CTX.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
            } else {
                CTX.clearRect(x * SIZE, y * SIZE, SIZE, SIZE);
            }
        }
    }
}

function readRLE(str) {
    const regex = /(\n([\dbo].*))+!/i; // beginning of pattern
    let m = regex.exec(str);
    console.log(m[0].trim());
    if (m !== null) {
        // The result can be accessed through the `m`-variable.
        // m.forEach((match, groupIndex) => {
        //     console.log(`Found match, group ${groupIndex}: ${match}`);
        // });
    }

}

function drawGrid(r, c) {
    RCTX.strokeStyle = "black";
    const cnvW = CNV.width;
    const cnvH = CNV.height;
    const h = Math.round(cnvH / r);
    const w = Math.round(cnvW / c);
    for (let y = 0; y < r + 1; y++) {
        RCTX.beginPath();
        RCTX.moveTo(0, y * h);
        RCTX.lineTo(cnvW, y * h);
        RCTX.stroke();
    }
    for (let x = 0; x < c + 1; x++) {
        RCTX.beginPath();
        RCTX.moveTo(x * w, 0);
        RCTX.lineTo(x * w, cnvH);
        RCTX.stroke();
    }
}

function updateUPS(e) {
    UPSLABEL.textContent = e.target.value;
    ups = parseInt(e.target.value);
}

window.addEventListener("load", init);