/**
 * @file script.js
 * @description Implementação de algoritmos de Computação Gráfica para rasterização,
 * transformações 2D e gerenciamento de pipeline de visualização (Mundo -> Viewport).
 * @author UEPB - DC - CG (com anotações e explicações)
 */

// =========================================================================
// == VARIÁVEIS GLOBAIS E ESTRUTURAS DE DADOS
// =========================================================================

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Objeto para armazenar as coordenadas da janela de visualização no mundo.
let world = {};

// Objeto para armazenar as coordenadas da viewport no dispositivo.
let viewport = {};

// Array para armazenar os vértices de um polígono (em coordenadas do mundo)
let squarePoints = [];

// =========================================================================
// == PIPELINE DE VISUALIZAÇÃO (MUNDO -> TELA)
// =========================================================================

function worldToNDC(xw, yw) {
  const ndcX = (2 * (xw - world.xmin)) / (world.xmax - world.xmin) - 1;
  const ndcY = (2 * (yw - world.ymin)) / (world.ymax - world.ymin) - 1;
  return { x: ndcX, y: ndcY };
}

function ndcToDevice(ndcX, ndcY) {
  const useViewport = document.getElementById("viewport_toggle").checked;
  let vp = useViewport
    ? viewport
    : { xvmin: 0, yvmin: 0, xvmax: canvas.width, yvmax: canvas.height };
  const deviceX = ((ndcX + 1) / 2) * (vp.xvmax - vp.xvmin) + vp.xvmin;
  const deviceY = ((1 - ndcY) / 2) * (vp.yvmax - vp.yvmin) + vp.yvmin; // Inversão do eixo Y
  return { x: deviceX, y: deviceY };
}

function deviceToWorld(dx, dy) {
  const useViewport = document.getElementById("viewport_toggle").checked;
  let vp = useViewport
    ? viewport
    : { xvmin: 0, yvmin: 0, xvmax: canvas.width, yvmax: canvas.height };
  let ndcX = ((dx - vp.xvmin) / (vp.xvmax - vp.xvmin)) * 2 - 1;
  let ndcY = (1 - (dy - vp.yvmin) / (vp.yvmax - vp.yvmin)) * 2 - 1;
  const xw = ((ndcX + 1) / 2) * (world.xmax - world.xmin) + world.xmin;
  const yw = ((ndcY + 1) / 2) * (world.ymax - world.ymin) + world.ymin;
  return { x: xw, y: yw };
}

// =========================================================================
// == FUNÇÕES DE DESENHO DE PIXEL (LÓGICA DE COR IMPLEMENTADA AQUI)
// =========================================================================

/**
 * Desenha um pixel na tela a partir de uma coordenada do MUNDO.
 * Esta função agora chama setPixelDevice para centralizar a lógica de cor.
 */
function setPixelWorld(xw, yw) {
  const ndcPoint = worldToNDC(xw, yw);
  const devicePoint = ndcToDevice(ndcPoint.x, ndcPoint.y);
  // Chama a função de pixel de dispositivo, que contém a lógica de cor.
  setPixelDevice(devicePoint.x, devicePoint.y);
}

/**
 * **FUNÇÃO ATUALIZADA**
 * Desenha um pixel na tela a partir de uma coordenada de DISPOSITIVO.
 * AGORA, ela verifica se o pixel está dentro ou fora da viewport para mudar a cor.
 */
function setPixelDevice(dx, dy) {
  let cor = "red"; // Cor padrão para dentro da viewport
  const useViewport = document.getElementById("viewport_toggle").checked;

  // Se a viewport estiver ativa, verificamos a posição do pixel
  if (useViewport) {
    if (
      dx < viewport.xvmin ||
      dx > viewport.xvmax ||
      dy < viewport.yvmin ||
      dy > viewport.yvmax
    ) {
      cor = "blue"; // Um tom de azul para a parte de fora
    }
  }

  // Ignora pixels fora do canvas para evitar erros
  if (dx < 0 || dx >= canvas.width || dy < 0 || dy >= canvas.height) {
    return;
  }

  ctx.fillStyle = cor;
  ctx.fillRect(Math.round(dx), Math.round(dy), 1, 1); // Mantém a largura do pixel
}

// =========================================================================
// == FUNÇÕES DE GERENCIAMENTO DO CANVAS E DA CENA
// =========================================================================

function updateAndRedraw() {
  canvas.width = parseInt(document.getElementById("width").value);
  canvas.height = parseInt(document.getElementById("height").value);
  world.xmin = parseFloat(document.getElementById("xw_min").value);
  world.ymin = parseFloat(document.getElementById("yw_min").value);
  world.xmax = parseFloat(document.getElementById("xw_max").value);
  world.ymax = parseFloat(document.getElementById("yw_max").value);
  viewport.xvmin = parseFloat(document.getElementById("xv_min").value);
  viewport.yvmin = parseFloat(document.getElementById("yv_min").value);
  viewport.xvmax = parseFloat(document.getElementById("xv_max").value);
  viewport.yvmax = parseFloat(document.getElementById("yv_max").value);
  drawFigure();
}

function clearCanvasAndDrawBase() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  ctx.strokeStyle = "#ADADAD";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, canvas.height);
  ctx.moveTo(0, centerY);
  ctx.lineTo(canvas.width, centerY);
  ctx.stroke();

  ctx.strokeStyle = "#E0E0E0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  let p1_device = ndcToDevice(
    worldToNDC(0, world.ymin).x,
    worldToNDC(0, world.ymin).y
  );
  let p2_device = ndcToDevice(
    worldToNDC(0, world.ymax).x,
    worldToNDC(0, world.ymax).y
  );
  ctx.moveTo(p1_device.x, p1_device.y);
  ctx.lineTo(p2_device.x, p2_device.y);
  p1_device = ndcToDevice(
    worldToNDC(world.xmin, 0).x,
    worldToNDC(world.xmin, 0).y
  );
  p2_device = ndcToDevice(
    worldToNDC(world.xmax, 0).x,
    worldToNDC(world.xmax, 0).y
  );
  ctx.moveTo(p1_device.x, p1_device.y);
  ctx.lineTo(p2_device.x, p2_device.y);
  ctx.stroke();

  if (document.getElementById("viewport_toggle").checked) {
    ctx.strokeStyle = "blue";
    ctx.strokeRect(
      viewport.xvmin,
      viewport.yvmin,
      viewport.xvmax - viewport.xvmin,
      viewport.yvmax - viewport.yvmin
    );
  }
}

// =========================================================================
// == ALGORITMOS DE RASTERIZAÇÃO DE PRIMITIVAS
// =========================================================================

function LineDDA(xw0, yw0, xw1, yw1) {
  clearLog();
  const p0_device = ndcToDevice(worldToNDC(xw0, yw0).x, worldToNDC(xw0, yw0).y);
  const p1_device = ndcToDevice(worldToNDC(xw1, yw1).x, worldToNDC(xw1, yw1).y);
  let dx_device = p1_device.x - p0_device.x;
  let dy_device = p1_device.y - p0_device.y;
  const steps = Math.max(Math.abs(dx_device), Math.abs(dy_device));
  const xInc_device = dx_device / steps;
  const yInc_device = dy_device / steps;
  const xInc_world = (xw1 - xw0) / steps;
  const yInc_world = (yw1 - yw0) / steps;
  let x_device = p0_device.x;
  let y_device = p0_device.y;
  let x_world = xw0;
  let y_world = yw0;

  for (let i = 0; i <= steps; i++) {
    setPixelDevice(x_device, y_device);
    logIteration(x_world, y_world, null, i);
    x_device += xInc_device;
    y_device += yInc_device;
    x_world += xInc_world;
    y_world += yInc_world;
  }
}

function LineBresenham(xw0, yw0, xw1, yw1) {
  clearLog();
  const p0_device = ndcToDevice(worldToNDC(xw0, yw0).x, worldToNDC(xw0, yw0).y);
  const p1_device = ndcToDevice(worldToNDC(xw1, yw1).x, worldToNDC(xw1, yw1).y);
  let x = Math.round(p0_device.x);
  let y = Math.round(p0_device.y);
  const x_end = Math.round(p1_device.x);
  const y_end = Math.round(p1_device.y);
  const dx = Math.abs(x_end - x);
  const dy = Math.abs(y_end - y);
  const sx = x < x_end ? 1 : -1;
  const sy = y < y_end ? 1 : -1;
  const isSteep = dy > dx;

  if (isSteep) {
    let d = 2 * dx - dy;
    let incE = 2 * dx;
    let incNE = 2 * (dx - dy);
    setPixelDevice(x, y);
    logIteration(deviceToWorld(x, y).x, deviceToWorld(x, y).y, "start", 0);
    while (y !== y_end) {
      let d_for_log = d;
      y += sy;
      if (d <= 0) {
        d += incE;
      } else {
        x += sx;
        d += incNE;
      }
      setPixelDevice(x, y);
      logIteration(
        deviceToWorld(x, y).x,
        deviceToWorld(x, y).y,
        d_for_log,
        null
      );
    }
  } else {
    let d = 2 * dy - dx;
    let incE = 2 * dy;
    let incNE = 2 * (dy - dx);
    setPixelDevice(x, y);
    logIteration(deviceToWorld(x, y).x, deviceToWorld(x, y).y, "start", 0);
    while (x !== x_end) {
      let d_for_log = d;
      x += sx;
      if (d <= 0) {
        d += incE;
      } else {
        y += sy;
        d += incNE;
      }
      setPixelDevice(x, y);
      logIteration(
        deviceToWorld(x, y).x,
        deviceToWorld(x, y).y,
        d_for_log,
        null
      );
    }
  }
}

function CircleMidpoint(cx, cy, radius) {
  clearLog();
  let x = 0,
    y = radius,
    d = 1 - radius;
  const plot = (xc, yc, x_offset, y_offset) => {
    setPixelWorld(xc + x_offset, yc + y_offset);
    setPixelWorld(xc - x_offset, yc + y_offset);
    setPixelWorld(xc + x_offset, yc - y_offset);
    setPixelWorld(xc - x_offset, yc - y_offset);
    setPixelWorld(xc + y_offset, yc + x_offset);
    setPixelWorld(xc - y_offset, yc + x_offset);
    setPixelWorld(xc + y_offset, yc - x_offset);
    setPixelWorld(xc - y_offset, yc - x_offset);
  };
  while (y >= x) {
    plot(cx, cy, x, y);
    logIteration(x, y, d);
    if (d < 0) {
      d += 2 * x + 3;
    } else {
      d += 2 * (x - y) + 5;
      y--;
    }
    x++;
  }
}

function CircleEquation(cx, cy, radius) {
  clearLog();
  for (let x = -radius; x <= radius; x++) {
    const y = Math.sqrt(radius * radius - x * x);
    setPixelWorld(x + cx, y + cy);
    setPixelWorld(x + cx, -y + cy);
  }
}

function CircleTrigonometric(cx, cy, radius) {
  clearLog();
  const steps = 100;
  for (let i = 0; i < steps; i++) {
    const angle = (2 * Math.PI * i) / steps;
    const x = Math.round(radius * Math.cos(angle));
    const y = Math.round(radius * Math.sin(angle));
    setPixelWorld(x + cx, y + cy);
  }
}

function EllipseMidpoint(cx, cy, rx, ry) {
  clearLog();
  let x = 0,
    y = ry;
  let d1 = ry * ry - rx * rx * ry + 0.25 * rx * rx;
  let dx = 2 * ry * ry * x;
  let dy = 2 * rx * rx * y;
  const plot = (xc, yc, x, y) => {
    setPixelWorld(xc + x, yc + y);
    setPixelWorld(xc - x, yc + y);
    setPixelWorld(xc + x, yc - y);
    setPixelWorld(xc - x, yc - y);
  };
  while (dx < dy) {
    plot(cx, cy, x, y);
    logIteration(x, y, d1);
    if (d1 < 0) {
      x++;
      dx += 2 * ry * ry;
      d1 += dx + ry * ry;
    } else {
      x++;
      y--;
      dx += 2 * ry * ry;
      dy -= 2 * rx * rx;
      d1 += dx - dy + ry * ry;
    }
  }
  let d2 =
    ry * ry * ((x + 0.5) * (x + 0.5)) +
    rx * rx * ((y - 1) * (y - 1)) -
    rx * rx * ry * ry;
  while (y >= 0) {
    plot(cx, cy, x, y);
    logIteration(x, y, d2);
    if (d2 > 0) {
      y--;
      dy -= 2 * rx * rx;
      d2 += rx * rx - dy;
    } else {
      y--;
      x++;
      dx += 2 * ry * ry;
      dy -= 2 * rx * rx;
      d2 += dx - dy + rx * rx;
    }
  }
}

// ... (Resto do código, como as funções de UI e transformações, permanece inalterado)

const getPoint = (id) => {
  const val = document.getElementById(id).value.trim();
  const match = val.match(/\(?\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*\)?/);
  if (match) {
    return { x: parseFloat(match[1]), y: parseFloat(match[3]) };
  }
  return null;
};

function changeFigure() {
  const figure = document.getElementById("figureSelect").value;
  [
    "lineParams",
    "circleParams",
    "ellipseParams",
    "cubeParams",
    "quadParams",
  ].forEach((id) => {
    document.getElementById(id).style.display = "none";
  });
  document.getElementById(figure + "Params").style.display = "block";
  document.getElementById("bresenhamParams").style.display = "none";
}

function drawFigure() {
  clearCanvasAndDrawBase();
  const figure = document.getElementById("figureSelect").value;
  if (figure === "line" || figure === "circle" || figure === "ellipse") {
    document.getElementById("bresenhamParams").style.display = "block";
  }

  if (figure === "line") {
    const alg = document.getElementById("lineAlgorithm").value;
    const x0 = parseInt(document.getElementById("x1").value),
      y0 = parseInt(document.getElementById("y1").value);
    const x1 = parseInt(document.getElementById("x2").value),
      y1 = parseInt(document.getElementById("y2").value);
    if (alg === "dda") LineDDA(x0, y0, x1, y1);
    else LineBresenham(x0, y0, x1, y1);
  } else if (figure === "circle") {
    const alg = document.getElementById("circleAlgorithm").value;
    const cx = parseInt(document.getElementById("cx").value),
      cy = parseInt(document.getElementById("cy").value);
    const r = parseInt(document.getElementById("radius").value);
    if (alg === "midpoint") CircleMidpoint(cx, cy, r);
    else if (alg === "equation") CircleEquation(cx, cy, r);
    else if (alg === "trigonometric") CircleTrigonometric(cx, cy, r);
  } else if (figure === "ellipse") {
    const cx = parseInt(document.getElementById("el_cx").value),
      cy = parseInt(document.getElementById("el_cy").value);
    const rx = parseInt(document.getElementById("el_rx").value),
      ry = parseInt(document.getElementById("el_ry").value);
    EllipseMidpoint(cx, cy, rx, ry);
  } else if (figure === "cube" || figure === "quad") {
    drawSquare();
  }
}

function drawSquare() {
  const figure = document.getElementById("figureSelect").value;
  const lado = parseFloat(document.getElementById("lado").value);
  let points;
  if (figure === "cube") {
    const halfSize = lado / 2;
    points = [
      [-halfSize, -halfSize, 1],
      [halfSize, -halfSize, 1],
      [halfSize, halfSize, 1],
      [-halfSize, halfSize, 1],
    ];
  } else {
    const A = getPoint("A"),
      B = getPoint("B"),
      C = getPoint("C"),
      D = getPoint("D");
    if (!A || !B || !C || !D) {
      alert("Coordenadas do quadrilátero inválidas.");
      return;
    }
    points = [
      [A.x, A.y, 1],
      [B.x, B.y, 1],
      [C.x, C.y, 1],
      [D.x, D.y, 1],
    ];
  }
  squarePoints = points;
  redrawPolygon();
  document.getElementById("iterationLog").style.display = "none";
}

function redrawPolygon() {
  clearCanvasAndDrawBase();
  if (!squarePoints || squarePoints.length === 0) return;
  for (let i = 0; i < squarePoints.length; i++) {
    const next = (i + 1) % squarePoints.length;
    LineBresenham(
      squarePoints[i][0],
      squarePoints[i][1],
      squarePoints[next][0],
      squarePoints[next][1]
    );
  }
}

function translateSquare() {
  const tx = parseFloat(document.getElementById("tx").value);
  const ty = parseFloat(document.getElementById("ty").value);
  if (!squarePoints || squarePoints.length === 0) {
    alert("Desenhe a forma primeiro.");
    return;
  }
  squarePoints = squarePoints.map(([x, y, z]) => [x + tx, y + ty, z]);
  redrawPolygon();
}

function scale() {
  const sx = parseFloat(document.getElementById("sx").value);
  const sy = parseFloat(document.getElementById("sy").value);
  if (!squarePoints || squarePoints.length === 0) {
    alert("Desenhe a forma primeiro.");
    return;
  }
  squarePoints = squarePoints.map(([x, y, z]) => [x * sx, y * sy, z]);
  redrawPolygon();
}

function rotateSquare() {
  const angleDegrees = parseFloat(document.getElementById("ang").value);
  if (!squarePoints || squarePoints.length === 0) {
    alert("Desenhe a forma primeiro.");
    return;
  }
  const angleRad = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  squarePoints = squarePoints.map(([x, y, z]) => {
    const xRot = x * cos - y * sin;
    const yRot = x * sin + y * cos;
    return [xRot, yRot, z];
  });
  redrawPolygon();
}

function reflectSquare(eixo) {
  if (!squarePoints || squarePoints.length === 0) {
    alert("Desenhe a forma primeiro.");
    return;
  }
  if (eixo === "x") {
    squarePoints = squarePoints.map(([x, y, z]) => [x, -y, z]);
  } else {
    squarePoints = squarePoints.map(([x, y, z]) => [-x, y, z]);
  }
  redrawPolygon();
}

function applyShear() {
  if (!squarePoints || squarePoints.length === 0) {
    alert("Desenhe a forma primeiro.");
    return;
  }
  const shx = document.getElementById("shx").disabled
    ? 0
    : parseFloat(document.getElementById("shx").value);
  const shy = document.getElementById("shy").disabled
    ? 0
    : parseFloat(document.getElementById("shy").value);
  squarePoints = squarePoints.map(([x, y, z]) => {
    const newX = x + shx * y;
    const newY = y + shy * x;
    return [newX, newY, z];
  });
  redrawPolygon();
}

let animando = false;
let intervaloRotacao;
function animacaoRotacao(btn) {
  if (!animando) {
    animando = true;
    btn.textContent = "Parar rotação";
    intervaloRotacao = setInterval(() => {
      document.getElementById("ang").value = "2";
      rotateSquare();
    }, 20);
  } else {
    animando = false;
    clearInterval(intervaloRotacao);
    btn.textContent = "Animação";
  }
}

function setupMouseCoordsTracker() {
  const mouseCoordsElement = document.getElementById("mouseCoords");
  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const worldCoords = deviceToWorld(mouseX, mouseY);
    mouseCoordsElement.textContent = `Coordenadas do Mundo: (${worldCoords.x.toFixed(
      2
    )}, ${worldCoords.y.toFixed(2)})`;
  });
}

function changeTransformer() {
  const t = document.getElementById("transformeSelect").value;
  ["translacao", "escala", "rotacao", "reflexao", "cisalhamento"].forEach(
    (id) => {
      document.getElementById(id).style.display = "none";
    }
  );
  document.getElementById(t).style.display = "block";
}

function updateCisalhamentoEixo() {
  const eixo = document.getElementById("cisalhamentoEixo").value;
  document.getElementById("shx").disabled = eixo === "cisY";
  document.getElementById("shy").disabled = eixo === "cisX";
  if (eixo === "cisXY") {
    document.getElementById("shx").disabled = false;
    document.getElementById("shy").disabled = false;
  }
}

function logIteration(x, y, d = null, k = null) {
  const logContainer = document.getElementById("iterationLog");
  if (!logContainer.querySelector("table")) {
    logContainer.innerHTML = "";
    const table = document.createElement("table");
    table.className = "table table-bordered table-sm";
    table.innerHTML = `<thead><tr><th>${
      d !== null ? "d" : "k"
    }</th><th>X</th><th>Y</th></tr></thead><tbody></tbody>`;
    logContainer.appendChild(table);
  }
  const tbody = logContainer.querySelector("tbody");
  const row = document.createElement("tr");
  row.innerHTML = `<td>${
    d !== null && typeof d === "number" ? Math.round(d) : d
  }</td><td>${Math.round(x)}</td><td>${Math.round(y)}</td>`;
  tbody.appendChild(row);
}

function clearLog() {
  document.getElementById("iterationLog").innerHTML = "";
}

window.onload = function () {
  changeFigure();
  changeTransformer();
  updateAndRedraw();
  setupMouseCoordsTracker();
  updateCisalhamentoEixo();
};
