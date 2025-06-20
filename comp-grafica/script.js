/**
 * @file script.js
 * @description Implementação de algoritmos de Computação Gráfica 2D.
 * @author UEPB - Danilo Pedro da Silva Valério, Laura Barbosa Vasconcelos, Diogo Silva Vilar
 */

// =========================================================================
// == VARIÁVEIS GLOBAIS E ESTRUTURAS DE DADOS
// =========================================================================

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let world = {};
let viewport = {};
let activeObject = null;

let isClippingActive = false;
let clipObjects = {
  line: null,
  window: null,
};

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
  const deviceY = ((1 - ndcY) / 2) * (vp.yvmax - vp.yvmin) + vp.yvmin;
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
// == FUNÇÕES DE DESENHO DE PIXEL
// =========================================================================
function setPixelWorld(xw, yw) {
  if (isClippingActive && clipObjects.window) {
    if (
      xw < clipObjects.window.xmin ||
      xw > clipObjects.window.xmax ||
      yw < clipObjects.window.ymin ||
      yw > clipObjects.window.ymax
    ) {
      return;
    }
  }
  const ndcPoint = worldToNDC(xw, yw);
  const devicePoint = ndcToDevice(ndcPoint.x, ndcPoint.y);
  setPixel(devicePoint.x, devicePoint.y);
}

function setPixel(dx, dy) {
  let cor = "red";
  const useViewport = document.getElementById("viewport_toggle").checked;

  if (useViewport) {
    if (
      dx < viewport.xvmin ||
      dx > viewport.xvmax ||
      dy < viewport.yvmin ||
      dy > viewport.yvmax
    ) {
      cor = "blue";
    }
  }

  if (dx < 0 || dx >= canvas.width || dy < 0 || dy >= canvas.height) {
    return;
  }

  ctx.fillStyle = cor;
  ctx.fillRect(Math.round(dx), Math.round(dy), 1, 1);
}

// =========================================================================
// == FUNÇÕES DE GERENCIAMENTO DO CANVAS E DA CENA
// =========================================================================

function readDisplaySettings() {
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
}

function updateAndRedraw() {
  readDisplaySettings();
  redrawScene();
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
  const p0_device = ndcToDevice(worldToNDC(xw0, yw0).x, worldToNDC(xw0, yw0).y);
  const p1_device = ndcToDevice(worldToNDC(xw1, yw1).x, worldToNDC(xw1, yw1).y);
  let dx_device = p1_device.x - p0_device.x;
  let dy_device = p1_device.y - p0_device.y;
  const steps = Math.max(Math.abs(dx_device), Math.abs(dy_device));

  if (steps === 0) {
    setPixelWorld(xw0, yw0);
    return;
  }

  const xInc_world = (xw1 - xw0) / steps;
  const yInc_world = (yw1 - yw0) / steps;
  let x_world = xw0;
  let y_world = yw0;

  for (let i = 0; i <= steps; i++) {
    setPixelWorld(x_world, y_world);
    logIteration(x_world, y_world, null, i);
    x_world += xInc_world;
    y_world += yInc_world;
  }
}

function LineBresenham(xw0, yw0, xw1, yw1) {
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

  const plot = (px, py) => {
    const worldCoords = deviceToWorld(px, py);
    setPixelWorld(worldCoords.x, worldCoords.y);
  };

  let k = 0;

  if (dy > dx) {
    let err = dx - dy / 2;
    while (y !== y_end) {
      plot(x, y);
      logIteration(deviceToWorld(x, y).x, deviceToWorld(x, y).y, err, k++);
      if (err >= 0) {
        x += sx;
        err -= dy;
      }
      y += sy;
      err += dx;
    }
  } else {
    let err = dy - dx / 2;
    while (x !== x_end) {
      plot(x, y);
      logIteration(deviceToWorld(x, y).x, deviceToWorld(x, y).y, err, k++);
      if (err >= 0) {
        y += sy;
        err -= dx;
      }
      x += sx;
      err += dy;
    }
  }
  plot(x, y);
  logIteration(deviceToWorld(x, y).x, deviceToWorld(x, y).y, null, k);
}

function CircleMidpoint(cx, cy, radius) {
  clearLog();
  let x = 0,
    y = radius,
    d = 1 - radius;
  let k = 0;
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
    logIteration(x, y, d, k++);
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
  let k = 0;
  for (let x_offset = -radius; x_offset <= radius; x_offset++) {
    const y_offset = Math.sqrt(radius * radius - x_offset * x_offset);
    const p1_x = x_offset + cx;
    const p1_y = y_offset + cy;
    const p2_x = x_offset + cx;
    const p2_y = -y_offset + cy;

    setPixelWorld(p1_x, p1_y);
    logIteration(p1_x, p1_y, null, k++);
    setPixelWorld(p2_x, p2_y);
    logIteration(p2_x, p2_y, null, k++);
  }
}

function CircleTrigonometric(cx, cy, radius) {
  clearLog();
  const steps = 100;
  for (let i = 0; i < steps; i++) {
    const angle = (2 * Math.PI * i) / steps;
    const x = Math.round(radius * Math.cos(angle));
    const y = Math.round(radius * Math.sin(angle));
    const p_x = x + cx;
    const p_y = y + cy;
    setPixelWorld(p_x, p_y);
    logIteration(p_x, p_y, null, i);
  }
}

function EllipseMidpoint(cx, cy, rx, ry) {
  clearLog();
  let x = 0,
    y = ry;
  let d1 = ry * ry - rx * rx * ry + 0.25 * rx * rx;
  let dx = 2 * ry * ry * x;
  let dy = 2 * rx * rx * y;
  let k = 0;
  const plot = (xc, yc, x, y) => {
    setPixelWorld(xc + x, yc + y);
    setPixelWorld(xc - x, yc + y);
    setPixelWorld(xc + x, yc - y);
    setPixelWorld(xc - x, yc - y);
  };
  while (dx < dy) {
    plot(cx, cy, x, y);
    logIteration(x, y, d1, k++);
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
    logIteration(x, y, d2, k++);
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

// =========================================================================
// == LÓGICA DE CONTROLE DA INTERFACE (UI)
// =========================================================================

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
    "img-pgmParams",
  ].forEach((id) => {
    document.getElementById(id).style.display = "none";
  });
  document.getElementById(figure + "Params").style.display = "block";
  drawFigure();
}

function drawFigure() {
  const figure = document.getElementById("figureSelect").value;
  activeObject = null;

  if (figure === "line") {
    activeObject = {
      type: "line",
      alg: document.getElementById("lineAlgorithm").value,
      x1: parseInt(document.getElementById("x1").value),
      y1: parseInt(document.getElementById("y1").value),
      x2: parseInt(document.getElementById("x2").value),
      y2: parseInt(document.getElementById("y2").value),
    };
  } else if (figure === "circle") {
    activeObject = {
      type: "circle",
      alg: document.getElementById("circleAlgorithm").value,
      cx: parseInt(document.getElementById("cx").value),
      cy: parseInt(document.getElementById("cy").value),
      radius: parseInt(document.getElementById("radius").value),
    };
  } else if (figure === "ellipse") {
    activeObject = {
      type: "ellipse",
      cx: parseInt(document.getElementById("el_cx").value),
      cy: parseInt(document.getElementById("el_cy").value),
      rx: parseInt(document.getElementById("el_rx").value),
      ry: parseInt(document.getElementById("el_ry").value),
    };
  } else if (figure === "cube" || figure === "quad") {
    createPolygonObject();
  } else if (figure === "img-pgm") {
    loadAndDrawPGM();
    return;
  }

  redrawScene();
}

function createPolygonObject() {
  const figure = document.getElementById("figureSelect").value;
  let points;
  if (figure === "cube") {
    const lado = parseFloat(document.getElementById("lado").value);
    const halfSize = lado / 2;
    points = [
      [-halfSize, -halfSize, 1],
      [halfSize, -halfSize, 1],
      [halfSize, halfSize, 1],
      [-halfSize, halfSize, 1],
    ];
  } else {
    // quad
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
  activeObject = { type: "polygon", points: points };
}

// MODIFICADO: Aceita um parâmetro para saber se é uma animação
function redrawScene(isAnimation = false) {
  clearCanvasAndDrawBase();
  if (!squarePoints || squarePoints.length === 0) return;
  const figure = document.getElementById("figureSelect").value;

  if (figure === "img-pgm") {
    for (let i = 0; i < squarePoints.length; i++) {
      setPixelWorld(squarePoints[i][0], squarePoints[i][1]);
    }
  } else {
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
}

// =========================================================================
// == TRANSFORMAÇÕES 2D
// =========================================================================
function calculateCentroid(points) {
  if (!points || points.length === 0) return { x: 0, y: 0 };
  let sumX = 0,
    sumY = 0;
  for (const p of points) {
    sumX += p[0];
    sumY += p[1];
  }
  return { x: sumX / points.length, y: sumY / points.length };
}

function applyTranslation() {
  const tx = parseFloat(document.getElementById("tx").value);
  const ty = parseFloat(document.getElementById("ty").value);
  if (isNaN(tx) || isNaN(ty)) return;
  if (!activeObject) {
    alert("Desenhe a forma primeiro.");
    return;
  }

  switch (activeObject.type) {
    case "polygon":
      activeObject.points = activeObject.points.map(([x, y, z]) => [
        x + tx,
        y + ty,
        z,
      ]);
      break;
    case "line":
      activeObject.x1 += tx;
      activeObject.y1 += ty;
      activeObject.x2 += tx;
      activeObject.y2 += ty;
      break;
    case "circle":
    case "ellipse":
      activeObject.cx += tx;
      activeObject.cy += ty;
      break;
  }
  addToHistory2D(`Translação: tx=${tx}, ty=${ty}`);
  redrawScene();
}

function applyScale() {
  const sx = parseFloat(document.getElementById("sx").value);
  const sy = parseFloat(document.getElementById("sy").value);
  if (isNaN(sx) || isNaN(sy)) return;
  if (!activeObject) {
    alert("Desenhe a forma primeiro.");
    return;
  }

  let center;
  switch (activeObject.type) {
    case "polygon":
      center = calculateCentroid(activeObject.points);
      activeObject.points = activeObject.points.map(([x, y, z]) => {
        const xFinal = center.x + (x - center.x) * sx;
        const yFinal = center.y + (y - center.y) * sy;
        return [xFinal, yFinal, z];
      });
      break;
    case "line":
      center = {
        x: (activeObject.x1 + activeObject.x2) / 2,
        y: (activeObject.y1 + activeObject.y2) / 2,
      };
      activeObject.x1 = center.x + (activeObject.x1 - center.x) * sx;
      activeObject.y1 = center.y + (activeObject.y1 - center.y) * sy;
      activeObject.x2 = center.x + (activeObject.x2 - center.x) * sx;
      activeObject.y2 = center.y + (activeObject.y2 - center.y) * sy;
      break;
    case "circle":
      activeObject.radius *= (sx + sy) / 2;
      break;
    case "ellipse":
      activeObject.rx *= sx;
      activeObject.ry *= sy;
      break;
  }
  addToHistory2D(`Escala: sx=${sx}, sy=${sy}`);
  redrawScene();
}

// MODIFICADO: Aceita um parâmetro para saber se é uma animação
function applyRotation(isAnimation = false) {
  const angleDegrees = parseFloat(document.getElementById("ang").value);
  if (isNaN(angleDegrees)) return;
  if (!activeObject) {
    alert("Desenhe a forma primeiro.");
    return;
  }

  const angleRad = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  let center;

  const rotatePoint = (p, center) => {
    const xOrig = p.x - center.x;
    const yOrig = p.y - center.y;
    const xRot = xOrig * cos - yOrig * sin;
    const yRot = xOrig * sin + yOrig * cos;
    return { x: xRot + center.x, y: yRot + center.y };
  };

  switch (activeObject.type) {
    case "polygon":
      center = calculateCentroid(activeObject.points);
      activeObject.points = activeObject.points.map(([x, y, z]) => {
        const rotated = rotatePoint({ x, y }, center);
        return [rotated.x, rotated.y, z];
      });
      break;
    case "line":
      center = {
        x: (activeObject.x1 + activeObject.x2) / 2,
        y: (activeObject.y1 + activeObject.y2) / 2,
      };
      const p1 = rotatePoint(
        { x: activeObject.x1, y: activeObject.y1 },
        center
      );
      const p2 = rotatePoint(
        { x: activeObject.x2, y: activeObject.y2 },
        center
      );
      activeObject.x1 = p1.x;
      activeObject.y1 = p1.y;
      activeObject.x2 = p2.x;
      activeObject.y2 = p2.y;
      break;
    case "circle":
    case "ellipse":
      break;
  }

  // MODIFICADO: Só adiciona ao histórico se NÃO for uma animação
  if (!isAnimation) {
    addToHistory2D(`Rotação: θ=${angleDegrees}°`);
  }

  redrawScene(isAnimation);
}

function applyReflection(axis) {
  if (!activeObject) {
    alert("Desenhe a forma primeiro.");
    return;
  }

  const reflect = (p, axis) => {
    return axis === "x" ? { x: p.x, y: -p.y } : { x: -p.x, y: p.y };
  };

  switch (activeObject.type) {
    case "polygon":
      activeObject.points = activeObject.points.map(([x, y, z]) => {
        const reflected = reflect({ x, y }, axis);
        return [reflected.x, reflected.y, z];
      });
      break;
    case "line":
      let p1 = reflect({ x: activeObject.x1, y: activeObject.y1 }, axis);
      let p2 = reflect({ x: activeObject.x2, y: activeObject.y2 }, axis);
      activeObject.x1 = p1.x;
      activeObject.y1 = p1.y;
      activeObject.x2 = p2.x;
      activeObject.y2 = p2.y;
      break;
    case "circle":
    case "ellipse":
      let center = reflect({ x: activeObject.cx, y: activeObject.cy }, axis);
      activeObject.cx = center.x;
      activeObject.cy = center.y;
      break;
  }
  addToHistory2D(`Reflexão no eixo ${axis.toUpperCase()}`);
  redrawScene();
}

function applyShear() {
  if (!activeObject) {
    alert("Desenhe a forma primeiro.");
    return;
  }

  const shx = document.getElementById("shx").disabled
    ? 0
    : parseFloat(document.getElementById("shx").value);
  const shy = document.getElementById("shy").disabled
    ? 0
    : parseFloat(document.getElementById("shy").value);
  if (isNaN(shx) || isNaN(shy)) return;

  const shearPoint = (p) => ({ x: p.x + shx * p.y, y: p.y + shy * p.x });

  switch (activeObject.type) {
    case "polygon":
      activeObject.points = activeObject.points.map(([x, y, z]) => {
        const sheared = shearPoint({ x, y });
        return [sheared.x, sheared.y, z];
      });
      break;
    case "line":
      let p1 = shearPoint({ x: activeObject.x1, y: activeObject.y1 });
      let p2 = shearPoint({ x: activeObject.x2, y: activeObject.y2 });
      activeObject.x1 = p1.x;
      activeObject.y1 = p1.y;
      activeObject.x2 = p2.x;
      activeObject.y2 = p2.y;
      break;
    case "circle":
    case "ellipse":
      alert(
        "Cisalhamento não é suportado para círculos ou elipses nesta implementação."
      );
      break;
  }
  addToHistory2D(`Cisalhamento: shx=${shx}, shy=${shy}`);
  redrawScene();
}

let animando = false;
let intervaloRotacao;
// MODIFICADO: Chama applyRotation com o parâmetro 'true'
function animacaoRotacao(btn) {
  if (!animando) {
    if (!activeObject) {
      alert("Desenhe a forma primeiro.");
      return;
    }
    animando = true;
    btn.textContent = "Parar rotação";
    intervaloRotacao = setInterval(() => {
      document.getElementById("ang").value = "2";
      applyRotation(true); // <--- A MUDANÇA ESTÁ AQUI
    }, 20);
  } else {
    animando = false;
    clearInterval(intervaloRotacao);
    btn.textContent = "Animação";
  }
}

// =========================================================================
// == CÓDIGO PARA RECORTE (Clipping)
// =========================================================================
function drawWorldRect(xmin, ymin, xmax, ymax, color) {
  const p_bl = ndcToDevice(worldToNDC(xmin, ymin).x, worldToNDC(xmin, ymin).y);
  const p_tr = ndcToDevice(worldToNDC(xmax, ymax).x, worldToNDC(xmax, ymax).y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(p_bl.x, p_tr.y, p_tr.x - p_bl.x, p_bl.y - p_tr.y);
}

function redrawClippingScene() {
  clearCanvasAndDrawBase();
  if (clipObjects.window) {
    drawWorldRect(
      clipObjects.window.xmin,
      clipObjects.window.ymin,
      clipObjects.window.xmax,
      clipObjects.window.ymax,
      "blue"
    );
  }
  if (clipObjects.line) {
    LineDDA(
      clipObjects.line.x1,
      clipObjects.line.y1,
      clipObjects.line.x2,
      clipObjects.line.y2
    );
  }
}

function drawLineForClipping() {
  isClippingActive = false;
  clipObjects.line = {
    x1: parseFloat(document.getElementById("csLineX1").value),
    y1: parseFloat(document.getElementById("csLineY1").value),
    x2: parseFloat(document.getElementById("csLineX2").value),
    y2: parseFloat(document.getElementById("csLineY2").value),
  };
  redrawClippingScene();
}

function drawWindowForClipping() {
  isClippingActive = false;
  clipObjects.window = {
    xmin: parseFloat(document.getElementById("clipWinXmin").value),
    ymin: parseFloat(document.getElementById("clipWinYmin").value),
    xmax: parseFloat(document.getElementById("clipWinXmax").value),
    ymax: parseFloat(document.getElementById("clipWinYmax").value),
  };
  redrawClippingScene();
}

function applyClipping() {
  if (!clipObjects.line || !clipObjects.window) {
    alert("Defina os parâmetros da reta e da janela primeiro.");
    return;
  }
  isClippingActive = true;
  redrawClippingScene();
}

function clearClippingView() {
  isClippingActive = false;
  clipObjects.line = null;
  clipObjects.window = null;
  activeObject = null;

  const historyDiv = document.getElementById("historyLog2D");
  if (historyDiv) historyDiv.innerHTML = "";

  redrawScene();
}

// =========================================================================
// == CÓDIGO PARA CARREGAMENTO DE IMAGEM PGM
// =========================================================================
function parsePGM(arrayBuffer) {
  const view = new Uint8Array(arrayBuffer);
  let currentIndex = 0;

  function readToken() {
    let token = "";
    while (currentIndex < view.length) {
      const charCode = view[currentIndex];
      if (/\s/.test(String.fromCharCode(charCode))) {
        if (token.length > 0) {
          currentIndex++;
          return token;
        }
      } else if (String.fromCharCode(charCode) === "#") {
        while (
          currentIndex < view.length &&
          String.fromCharCode(view[currentIndex]) !== "\n"
        ) {
          currentIndex++;
        }
      } else {
        token += String.fromCharCode(charCode);
      }
      currentIndex++;
    }
    return token;
  }

  const magic = readToken();
  if (magic !== "P2" && magic !== "P5") {
    alert("Erro: Formato de arquivo PGM inválido.");
    return null;
  }
  const width = parseInt(readToken());
  const height = parseInt(readToken());
  const maxVal = parseInt(readToken());
  if (isNaN(width) || isNaN(height) || isNaN(maxVal)) {
    alert("Erro ao ler o cabeçalho do PGM.");
    return null;
  }
  let pixels;
  if (magic === "P5") {
    pixels = view.subarray(currentIndex);
  } else {
    const textDecoder = new TextDecoder();
    const remainingText = textDecoder.decode(view.subarray(currentIndex));
    pixels = remainingText
      .split(/\s+/)
      .filter((s) => s)
      .map((s) => parseInt(s));
  }
  if (pixels.length < width * height) {
    alert(`Erro: O arquivo PGM está incompleto.`);
    return null;
  }
  pixels = pixels.slice(0, width * height);
  return { width, height, pixels };
}

function loadAndDrawPGM() {
  const fileInput = document.getElementById("pgmFile");
  if (fileInput.files.length === 0) {
    alert("Por favor, selecione um arquivo PGM.");
    return;
  }
  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const pgmData = parsePGM(e.target.result);
    if (!pgmData) {
      activeObject = null;
      redrawScene();
      return;
    }
    const { width, height, pixels } = pgmData;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    let points = [];
    for (let i = 0; i < pixels.length; i++) {
      if (pixels[i] < 250) {
        const x = i % width;
        const y = Math.floor(i / width);
        points.push([x - halfWidth, -(y - halfHeight), 1]);
      }
    }
    activeObject = { type: "polygon", points: points, isPgm: true };
    redrawScene();
  };
  reader.readAsArrayBuffer(file);
}

// =========================================================================
// == FUNÇÕES AUXILIARES E DE INICIALIZAÇÃO
// =========================================================================

function addToHistory2D(text) {
  const historyDiv = document.getElementById("historyLog2D");
  if (!historyDiv) return;
  const entry = document.createElement("div");
  entry.textContent = text;
  historyDiv.appendChild(entry);
  historyDiv.scrollTop = historyDiv.scrollHeight;
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
    }</th><th>X (mundo)</th><th>Y (mundo)</th></tr></thead><tbody></tbody>`;
    logContainer.appendChild(table);
  }
  const tbody = logContainer.querySelector("tbody");
  const row = document.createElement("tr");
  const d_val =
    d !== null && typeof d === "number" ? d.toFixed(2) : k !== null ? k : "-";
  const x_val = x !== null ? x.toFixed(2) : "-";
  const y_val = y !== null ? y.toFixed(2) : "-";
  row.innerHTML = `<td>${d_val}</td><td>${x_val}</td><td>${y_val}</td>`;
  tbody.appendChild(row);
}

function clearLog() {
  document.getElementById("iterationLog").innerHTML = "";
}

window.onload = function () {
  changeTransformer();
  updateCisalhamentoEixo();
  readDisplaySettings();
  changeFigure();
  setupMouseCoordsTracker();
};
