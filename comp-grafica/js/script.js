let canvas_width = 500;
let canvas_height = 500;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");


// Histórico para armazenar as figuras desenhadas
let shapes = [];

function updateCanvas() {
  let largura = parseInt(document.getElementById("width").value);
  let altura = parseInt(document.getElementById("height").value);
  const backgroundColor = document.getElementById("backgroundColor").value;

  if (!isNaN(largura) && !isNaN(altura)) {
    largura = Math.min(Math.max(largura, 100), 1000);
    altura = Math.min(Math.max(altura, 100), 620);

    // Atualiza as dimensões do canvas e a cor de fundo
    canvas.width = largura;
    canvas.height = altura;
    canvas.style.backgroundColor = backgroundColor;

    // Limpa o canvas e redesenha os eixos
    clearCanvas();
  } else {
    alert("Preencha os valores corretamente.");
  }

  // Desenha os eixos do canvas
  drawAxis();
}

function drawAxis() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  ctx.strokeStyle = canvas.style.backgroundColor === "black" ? "white" : "black";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, canvas.height);
  ctx.moveTo(0, centerY);
  ctx.lineTo(canvas.width, centerY);
  ctx.stroke();
}

function setPixel(x, y) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  ctx.fillStyle = "red";
  ctx.fillRect(centerX + x, centerY - y, 1, 1);
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawAxis(); // Após limpar o canvas, redesenha os eixos
  shapes = []; // Limpa o histórico de formas
}

function changeFigure() {
  const figure = document.getElementById("figureSelect").value;
  document.getElementById("lineParams").style.display = figure === "line" ? "block" : "none";
  document.getElementById("circleParams").style.display = figure === "circle" ? "block" : "none";
}

// Algoritmo DDA para desenhar retas
function LineDDA(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));

  const xIncrement = dx / steps;
  const yIncrement = dy / steps;

  let x = x0;
  let y = y0;

  for (let i = 0; i < steps; i++) {
    x += xIncrement;
    y += yIncrement;
    setPixel(Math.round(x), Math.round(y));
  }
}

function LineBresenham(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;

  let ds, incE, incNE, x = x1, y = y1;
  setPixel(x, y); // Ativa o primeiro pixel

  if (dy < dx) {
    ds = 2 * dy - dx;
    incE = 2 * dy;
    incNE = 2 * (dy - dx);
    
    while (x < x2) {
      if (ds <= 0) {
        ds += incE;
        x += 1;
      } else {
        ds += incNE;
        x += 1;
        y += 1;
      }
      setPixel(x, y);
    }
  } else {
    ds = 2 * dx - dy;
    incE = 2 * dx;
    incNE = 2 * (dx - dy);
    
    while (y < y2) {
      if (ds <= 0) {
        ds += incE;
        y += 1;
      } else {
        ds += incNE;
        y += 1;
        x += 1;
      }
      setPixel(x, y);
    }
  }
}

function Line(x0, y0, x1, y1) {
  const algorithm = document.getElementById("lineAlgorithm").value;
  if (algorithm === "dda") {
    LineDDA(x0, y0, x1, y1);
  } else if (algorithm === "bresenham") {
    LineBresenham(x0, y0, x1, y1);
  }
}

function CircleMidpoint(cx, cy, radius) {
  let x = 0;
  let y = radius;
  let d = 1 - radius;

  while (y >= x) {
    setPixel(x + cx, y + cy);
    setPixel(y + cx, x + cy);
    setPixel(-x + cx, y + cy);
    setPixel(-y + cx, x + cy);
    setPixel(-x + cx, -y + cy);
    setPixel(-y + cx, -x + cy);
    setPixel(x + cx, -y + cy);
    setPixel(y + cx, -x + cy);

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
  for (let x = -radius; x <= radius; x++) {
    const y = Math.sqrt(radius * radius - x * x);
    setPixel(x + cx, y + cy);
    setPixel(x + cx, -y + cy);
  }
}

function CircleTrigonometric(cx, cy, radius) {
  const steps = 100;
  for (let i = 0; i < steps; i++) {
    const angle = (2 * Math.PI * i) / steps;
    const x = Math.round(radius * Math.cos(angle));
    const y = Math.round(radius * Math.sin(angle));
    setPixel(x + cx, y + cy);
  }
}

function drawFigure() {
  clearCanvas();
  const figure = document.getElementById("figureSelect").value;
  let figureData = {}; // Para armazenar os dados da figura


  if (figure === "line") {
    const x0 = parseInt(document.getElementById("x1").value);
    const y0 = parseInt(document.getElementById("y1").value);
    const x1 = parseInt(document.getElementById("x2").value);
    const y1 = parseInt(document.getElementById("y2").value);
    Line(x0, y0, x1, y1);

    figureData = { type: "line", x0, y0, x1, y1 };
    
  } else if (figure === "circle") {
    const cx = parseInt(document.getElementById("cx").value);
    const cy = parseInt(document.getElementById("cy").value);
    const radius = parseInt(document.getElementById("radius").value);
    const algorithm = document.getElementById("circleAlgorithm").value;

    if (algorithm === "midpoint") {
      CircleMidpoint(cx, cy, radius);
    } else if (algorithm === "equation") {
      CircleEquation(cx, cy, radius);
    } else if (algorithm === "trigonometric") {
      CircleTrigonometric(cx, cy, radius);
    }

    figureData = { type: "circle", cx, cy, radius };
  }
}

// Inicializa o canvas com valores padrão
updateCanvas();



