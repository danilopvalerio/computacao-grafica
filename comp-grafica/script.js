// ============================
// VARIÁVEIS GLOBAIS
// ============================
let canva_width = 500;
let canva_height = 500;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let squarePoints = [];

let matrizFigura = null;
// ============================
// FUNÇÕES PARA OBTENÇÃO DE DADOS DO FORMULÁRIO
// ============================

// Retorna um ponto a partir do valor de um input (ex: "(3,4)")
const getPoint = (id) => {
  const val = document.getElementById(id).value.trim();
  const match = val.match(/\(?\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*\)?/);
  if (match) {
    return {
      x: parseFloat(match[1]),
      y: parseFloat(match[3]),
    };
  }
  return null;
};

// ============================
// FUNÇÕES DE GERENCIAMENTO DO CANVAS
// ============================

// Atualiza tamanho do canvas com base nos inputs
function updateCanva() {
  let largura = parseInt(document.getElementById("width").value);
  let altura = parseInt(document.getElementById("height").value);

  if (!isNaN(largura) && !isNaN(altura)) {
    largura = Math.min(Math.max(largura, 100), 1000);
    altura = Math.min(Math.max(altura, 100), 620);

    canvas.width = largura;
    canvas.height = altura;
    canvas.style.backgroundColor = "white";
  } else {
    alert("Preencha os valores corretamente.");
  }
  drawAxis();
}

// Desenha os eixos X e Y no centro do canvas
function drawAxis() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  ctx.strokeStyle = canvas.style.backgroundColor === "black";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, canvas.height);
  ctx.moveTo(0, centerY);
  ctx.lineTo(canvas.width, centerY);
  ctx.stroke();
}

// Limpa o canvas e redesenha os eixos
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawAxis();
}

// ============================
// FUNÇÕES PARA PIXEL E LOGS
// ============================

// Define o pixel no canvas na cor vermelha
function setPixel(x, y) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  ctx.fillStyle = "red";
  ctx.fillRect(centerX + x, centerY - y, 1, 1);
}

// Adiciona uma linha de log da iteração na tabela de logs
function logIteration(x, y, d = null, k = null) {
  const logContainer = document.getElementById("iterationLog");

  if (!logContainer.querySelector("table")) {
    logContainer.innerHTML = "";
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.maxWidth = "600px";
    table.style.borderCollapse = "collapse";
    table.innerHTML = `
      <thead>
        <tr>
          <th style="border: 1px solid black; padding: 8px;">${
            d !== null ? "D" : "K"
          }</th>
          <th style="border: 1px solid black; padding: 8px;">X</th>
          <th style="border: 1px solid black; padding: 8px;">Y</th>
        </tr>
      </thead>
      <tbody></tbody>`;
    logContainer.appendChild(table);
  }

  const tbody = logContainer.querySelector("tbody");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td style="border: 1px solid black; padding: 8px;">${
      d !== null ? d : k
    }</td>
    <td style="border: 1px solid black; padding: 8px;">${x}</td>
    <td style="border: 1px solid black; padding: 8px;">${y}</td>`;
  tbody.appendChild(row);
}

// Limpa a tabela de logs
function clearLog() {
  document.getElementById("iterationLog").innerHTML = "";
}

// ============================
// FUNÇÕES DE DESENHO DE RETAS
// ============================

// Algoritmo DDA para desenhar uma linha entre dois pontos
function LineDDA(x0, y0, x1, y1) {
  clearLog();
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  const xIncrement = dx / steps;
  const yIncrement = dy / steps;
  let x = x0;
  let y = y0;

  for (let i = 0; i <= steps; i++) {
    setPixel(Math.round(x), Math.round(y));
    logIteration(Math.round(x), Math.round(y), null, i);
    x += xIncrement;
    y += yIncrement;
  }
}

// Algoritmo de Bresenham para desenhar linha entre dois pontos (1º e 2º octante)
function LineBresenham(x1, y1, x2, y2) {
  clearLog();
  const dx = x2 - x1;
  const dy = y2 - y1;
  let ds, incE, incNE;
  let x = x1,
    y = y1;
  setPixel(x, y);
  logIteration(x, y, 0);

  if (Math.abs(dy) < Math.abs(dx)) {
    ds = 2 * dy - dx;
    incE = 2 * dy;
    incNE = 2 * (dy - dx);
    while (x < x2) {
      logIteration(x, y, ds);
      if (ds <= 0) {
        ds += incE;
      } else {
        ds += incNE;
        y += 1;
      }
      x += 1;
      setPixel(x, y);
    }
  } else {
    ds = 2 * dx - dy;
    let incN = 2 * dx;
    incNE = 2 * (dx - dy);
    while (y < y2) {
      logIteration(x, y, ds);
      if (ds <= 0) {
        ds += incN;
      } else {
        ds += incNE;
        x += 1;
      }
      y += 1;
      setPixel(x, y);
    }
  }
}

// Função auxiliar que escolhe o algoritmo de linha
function Line(x0, y0, x1, y1) {
  const algorithm = document.getElementById("lineAlgorithm").value;
  if (algorithm === "dda") {
    LineDDA(x0, y0, x1, y1);
  } else if (algorithm === "bresenham2") {
    LineBresenham(x0, y0, x1, y1);
  }
}

// ============================
// FUNÇÕES DE DESENHO DE CÍRCULO
// ============================

// Algoritmo do ponto médio para desenhar circunferência
function CircleMidpoint(cx, cy, radius) {
  clearLog();
  let x = 0;
  let y = radius;
  let d = 1 - radius;

  while (y >= x) {
    setPixel(x + cx, y + cy);
    logIteration(x + cx, y + cy, d);
    setPixel(y + cx, x + cy);
    logIteration(y + cx, x + cy, d);
    setPixel(-x + cx, y + cy);
    logIteration(-x + cx, y + cy, d);
    setPixel(-y + cx, x + cy);
    logIteration(-y + cx, x + cy, d);
    setPixel(-x + cx, -y + cy);
    logIteration(-x + cx, -y + cy, d);
    setPixel(-y + cx, -x + cy);
    logIteration(-y + cx, -x + cy, d);
    setPixel(x + cx, -y + cy);
    logIteration(x + cx, -y + cy, d);
    setPixel(y + cx, -x + cy);
    logIteration(y + cx, -x + cy, d);

    if (d < 0) {
      d += 2 * x + 3;
    } else {
      d += 2 * (x - y) + 5;
      y--;
    }
    x++;
  }
}

// Desenho de circunferência pela equação implícita x² + y² = r²
function CircleEquation(cx, cy, radius) {
  for (let x = -radius; x <= radius; x++) {
    const y = Math.sqrt(radius * radius - x * x);
    setPixel(x + cx, y + cy);
    setPixel(x + cx, -y + cy);
  }
}

// Desenho de circunferência usando funções trigonométricas
function CircleTrigonometric(cx, cy, radius) {
  const steps = 100;
  for (let i = 0; i < steps; i++) {
    const angle = (2 * Math.PI * i) / steps;
    const x = Math.round(radius * Math.cos(angle));
    const y = Math.round(radius * Math.sin(angle));
    setPixel(x + cx, y + cy);
  }
}

// ============================
// FUNÇÕES DE DESENHO DE QUADRADO
// ============================

// Desenha quadrado baseado em lado ou pontos A, B, C, D
function drawSquare() {
  const lado = parseFloat(document.getElementById("lado").value);
  document.getElementById("lineAlgorithm").value = "dda";
  let points;

  if (lado > 0) {
    const centerX = 0;
    const centerY = 0;
    const halfSize = lado / 2;

    // [ x1, y1, 1 ]  // Ponto 1
    // [ x2, y2, 1 ]  // Ponto 2
    // [ x3, y3, 1 ]  // Ponto 3
    // [ x4, y4, 1 ]  // Ponto 4
    points = [
      [-halfSize, -halfSize, 1],
      [halfSize, -halfSize, 1],
      [halfSize, halfSize, 1],
      [-halfSize, halfSize, 1],
    ];
  } else {
    const A = getPoint("A");
    const B = getPoint("B");
    const C = getPoint("C");
    const D = getPoint("D");

    if (!A || !B || !C || !D) {
      alert("Por favor, insira todas as coordenadas corretamente.");
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
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    Line(points[i][0], points[i][1], points[next][0], points[next][1]);
  }

  document.getElementById("iterationLog").style.display = "none";
}

// ============================
// FUNÇÕES DE CONTROLE DE INTERFACE
// ============================

// Mostra/oculta campos de acordo com a figura escolhida
function changeFigure() {
  const figure = document.getElementById("figureSelect").value;
  document.getElementById("lineParams").style.display =
    figure === "line" ? "block" : "none";
  document.getElementById("circleParams").style.display =
    figure === "circle" ? "block" : "none";
  document.getElementById("cubeParams").style.display =
    figure === "cube" ? "block" : "none";
}

// Executa o desenho com base na figura selecionada
function drawFigure() {
  clearCanvas();
  const figure = document.getElementById("figureSelect").value;

  if (figure === "line") {
    const x0 = parseInt(document.getElementById("x1").value);
    const y0 = parseInt(document.getElementById("y1").value);
    const x1 = parseInt(document.getElementById("x2").value);
    const y1 = parseInt(document.getElementById("y2").value);
    Line(x0, y0, x1, y1);
    document.getElementById("bresenhamParams").style.display = "block";
  } else if (figure === "circle") {
    const cx = parseInt(document.getElementById("cx").value);
    const cy = parseInt(document.getElementById("cy").value);
    const radius = parseInt(document.getElementById("radius").value);
    const algorithm = document.getElementById("circleAlgorithm").value;
    document.getElementById("bresenhamParams").style.display = "block";

    if (algorithm === "midpoint") {
      CircleMidpoint(cx, cy, radius);
    } else if (algorithm === "equation") {
      CircleEquation(cx, cy, radius);
    } else if (algorithm === "trigonometric") {
      CircleTrigonometric(cx, cy, radius);
    }
  } else if (figure === "cube") {
    drawSquare();
  }
}

// ============================
// TRANSFORMAÇÕES
// ============================

// Função para aplicar a translação nos pontos
function translateSquare() {
  console.log("transladando...");
  const tx = parseInt(document.getElementById("tx").value);
  const ty = parseInt(document.getElementById("ty").value);

  if (!squarePoints || squarePoints.length === 0) {
    alert("Desenhe o quadrado primeiro.");
    return;
  }

  const translationMatrix = [
    [1, 0, tx],
    [0, 1, ty],
    [0, 0, 1],
  ];

  // Aplica a translação multiplicando o ponto pela matriz
  squarePoints = squarePoints.map((p) => {
    // A multiplicação de matriz é feita para cada ponto
    const newX =
      p[0] * translationMatrix[0][0] +
      p[1] * translationMatrix[0][1] +
      p[2] * translationMatrix[0][2];
    const newY =
      p[0] * translationMatrix[1][0] +
      p[1] * translationMatrix[1][1] +
      p[2] * translationMatrix[1][2];
    const newZ =
      p[0] * translationMatrix[2][0] +
      p[1] * translationMatrix[2][1] +
      p[2] * translationMatrix[2][2];

    return [newX, newY, newZ];
  });

  // Redesenha a figura transladada
  clearCanvas();
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    Line(
      squarePoints[i][0], // x
      squarePoints[i][1], // y
      squarePoints[next][0], // x do próximo ponto
      squarePoints[next][1] // y do próximo ponto
    );
  }
}

// Função para aplicar a escala nos pontos
function scale() {
  console.log("escalonizando...");
  const sx = parseInt(document.getElementById("sx").value);
  const sy = parseInt(document.getElementById("sy").value);

  if (!squarePoints || squarePoints.length === 0) {
    alert("Desenhe o quadrado primeiro.");
    return;
  }

  if (sx === 0) {
    squarePoints = squarePoints.map((p) => ({
      x: p.x * 1,
      y: p.y * sy,
    }));
  } else if (sy === 0) {
    squarePoints = squarePoints.map((p) => ({
      x: p.x * sx,
      y: p.y * 1,
    }));
  }

  // Aplica a translação nos pontos

  console.log(squarePoints);
  // Redesenha a figura transladada
  clearCanvas();
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    Line(
      squarePoints[i].x,
      squarePoints[i].y,
      squarePoints[next].x,
      squarePoints[next].y
    );
  }
}

// Função para aplicar a rotação nos pontos
function rotateSquare() {
  console.log("rotacionando...");
  const angleDegrees = parseInt(document.getElementById("ang").value);

  if (!squarePoints || squarePoints.length === 0) {
    alert("Desenhe o quadrado primeiro.");
    return;
  }

  const angleRad = (angleDegrees * Math.PI) / 180;

  // Calcular o centro do quadrado atual
  const center = squarePoints.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );
  center.x /= squarePoints.length;
  center.y /= squarePoints.length;

  // Aplicar rotação em torno do centro
  squarePoints = squarePoints.map((p) => {
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    return {
      x: center.x + dx * Math.cos(angleRad) - dy * Math.sin(angleRad),
      y: center.y + dx * Math.sin(angleRad) + dy * Math.cos(angleRad),
    };
  });

  clearCanvas();
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    Line(
      squarePoints[i].x,
      squarePoints[i].y,
      squarePoints[next].x,
      squarePoints[next].y
    );
  }
}

// Função para aplicar a reflexão nos pontos
function reflectSquare() {
  console.log("refletindo...");
  const axis = document.getElementById("ref").value;

  if (!squarePoints || squarePoints.length === 0) {
    alert("Desenhe o quadrado primeiro.");
    return;
  }

  squarePoints = squarePoints.map((p) => {
    switch (axis) {
      case "x":
        return { x: p.x, y: -p.y };
      case "y":
        return { x: -p.x, y: p.y };
      case "origem":
        return { x: -p.x, y: -p.y };
      default:
        return p;
    }
  });

  clearCanvas();
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    Line(
      squarePoints[i].x,
      squarePoints[i].y,
      squarePoints[next].x,
      squarePoints[next].y
    );
  }
}

// ============================
// FUNÇÃO PARA ATUALIZAR COORDENADAS DO MOUSE
// ============================

function setupMouseCoordsTracker() {
  const mouseCoordsElement = document.getElementById("mouseCoords");

  canvas.addEventListener("mousemove", (event) => {
    // Obtém a posição do mouse em relação ao canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Converte para coordenadas do plano cartesiano (considerando o centro como (0,0))
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const coordX = mouseX - centerX;
    const coordY = centerY - mouseY; // Invertemos Y porque no canvas Y cresce para baixo

    // Atualiza o elemento HTML com as coordenadas
    mouseCoordsElement.textContent = `Coordenadas: (${coordX.toFixed(
      0
    )}, ${coordY.toFixed(0)})`;
  });
}

setupMouseCoordsTracker();

updateCanva();
