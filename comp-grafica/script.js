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
  const figure = document.getElementById("figureSelect").value;
  const lado = parseFloat(document.getElementById("lado").value);
  document.getElementById("lineAlgorithm").value = "dda";

  let points;

  if (lado > 0 && figure === "cube") {
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
  document.getElementById("quadParams").style.display =
    figure === "quad" ? "block" : "none";
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
  } else if (figure === "cube" || figure === "quad") {
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

  // Soma diretamente o vetor de translação (tx, ty)
  squarePoints = squarePoints.map(([x, y, z]) => [x + tx, y + ty, z]);

  // Redesenha a figura transladada
  clearCanvas();
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    Line(
      squarePoints[i][0],
      squarePoints[i][1],
      squarePoints[next][0],
      squarePoints[next][1]
    );
  }
}

// Função para aplicar a escala nos pontos usando a matriz homogênea
function scale() {
  console.log("escalonizando...");

  // Pegando os valores de escala
  let sx = parseFloat(document.getElementById("sx").value);
  let sy = parseFloat(document.getElementById("sy").value);

  // Verifica se os valores são válidos (números)
  if (isNaN(sx) || isNaN(sy)) {
    alert("Valores de escala inválidos. Tente novamente.");
    return;
  }

  // Verifica se os valores são negativos para tratar de forma apropriada
  if (sx < 0) {
    sx = 1 / Math.abs(sx); // Se negativo, aplica a inversão para diminuir
  }
  if (sy < 0) {
    sy = 1 / Math.abs(sy); // Se negativo, aplica a inversão para diminuir
  }

  if (!squarePoints || squarePoints.length === 0) {
    alert("Desenhe o quadrado primeiro.");
    return;
  }

  // Matriz de escala homogênea 3x3
  const scaleMatrix = [
    [sx, 0, 0], // Escala no eixo X
    [0, sy, 0], // Escala no eixo Y
    [0, 0, 1], // Coordenada homogênea
  ];

  // Aplica a escala nos pontos
  squarePoints = squarePoints.map(([x, y, z]) => {
    // Coordenadas homogêneas (x, y, 1)
    const point = [x, y, 1];

    // Multiplicação da matriz de escala pelo ponto
    const newX =
      scaleMatrix[0][0] * point[0] +
      scaleMatrix[0][1] * point[1] +
      scaleMatrix[0][2] * point[2];
    const newY =
      scaleMatrix[1][0] * point[0] +
      scaleMatrix[1][1] * point[1] +
      scaleMatrix[1][2] * point[2];
    const newZ =
      scaleMatrix[2][0] * point[0] +
      scaleMatrix[2][1] * point[1] +
      scaleMatrix[2][2] * point[2];

    return [newX, newY, newZ];
  });

  // Redesenha a figura escalonada
  clearCanvas();
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    Line(
      squarePoints[i][0],
      squarePoints[i][1],
      squarePoints[next][0],
      squarePoints[next][1]
    );
  }
}

// Função para aplicar a rotação nos pontos
function rotateSquare() {
  console.log("rotacionando...");
  const angleDegrees = parseFloat(document.getElementById("ang").value);

  if (!squarePoints || squarePoints.length === 0) {
    alert("Desenhe o quadrado primeiro.");
    return;
  }

  const angleRad = (-angleDegrees * Math.PI) / 180;

  // Calcular o centro do quadrado
  let centerX = 0,
    centerY = 0;
  for (const p of squarePoints) {
    centerX += p[0];
    centerY += p[1];
  }
  centerX /= squarePoints.length;
  centerY /= squarePoints.length;

  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  // Aplicar rotação com translação implícita
  squarePoints = squarePoints.map((p) => {
    const dx = p[0] - centerX;
    const dy = p[1] - centerY;
    const xRot = dx * cos - dy * sin + centerX;
    const yRot = dx * sin + dy * cos + centerY;
    return [xRot, yRot, 1];
  });

  // Redesenhar
  clearCanvas();
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    Line(
      squarePoints[i][0],
      squarePoints[i][1],
      squarePoints[next][0],
      squarePoints[next][1]
    );
  }
}

let animando = false;
let intervaloRotacao;

function animacaoRotacao(btn) {
  if (!animando) {
    animando = true;
    btn.textContent = "Parar rotação";
    intervaloRotacao = setInterval(() => {
      document.getElementById("ang").value = "1";
      rotateSquare();
    }, 10);
  } else {
    animando = false;
    clearInterval(intervaloRotacao);
    btn.textContent = "Animação";
  }
}

// Função para aplicar a reflexão nos pontos
function reflectSquare(eixo) {
  console.log("refletindo...");

  if (!squarePoints || squarePoints.length === 0) {
    alert("Desenhe o quadrado primeiro.");
    return;
  }

  // Verifica se a reflexão é em X ou Y
  let reflexaoMatrix;
  if (eixo === "x") {
    // Matriz de reflexão em X
    reflexaoMatrix = [
      [1, 0, 0], // Escala no eixo X
      [0, -1, 0], // Escala no eixo Y
      [0, 0, 1], // Coordenada homogênea
    ];
  } else if (eixo === "y") {
    // Matriz de reflexão em Y
    reflexaoMatrix = [
      [-1, 0, 0], // Escala no eixo X
      [0, 1, 0], // Escala no eixo Y
      [0, 0, 1], // Coordenada homogênea
    ];
  }

  // Aplica a reflexão nos pontos
  squarePoints = squarePoints.map(([x, y, z]) => {
    const point = [x, y, 1]; // Coordenadas homogêneas (x, y, 1)

    // Multiplicação da matriz de reflexão pelo ponto
    const newX =
      reflexaoMatrix[0][0] * point[0] +
      reflexaoMatrix[0][1] * point[1] +
      reflexaoMatrix[0][2] * point[2];
    const newY =
      reflexaoMatrix[1][0] * point[0] +
      reflexaoMatrix[1][1] * point[1] +
      reflexaoMatrix[1][2] * point[2];
    const newZ =
      reflexaoMatrix[2][0] * point[0] +
      reflexaoMatrix[2][1] * point[1] +
      reflexaoMatrix[2][2] * point[2];

    return [newX, newY, newZ];
  });

  // Redesenha a figura refletida
  clearCanvas();
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    Line(
      squarePoints[i][0],
      squarePoints[i][1],
      squarePoints[next][0],
      squarePoints[next][1]
    );
  }
}

// Função para aplicar o cisalhamento
function applyShear() {
  const eixo = document.getElementById("cisalhamentoEixo").value;
  const shx = parseFloat(document.getElementById("shx").value);
  const shy = parseFloat(document.getElementById("shy").value);

  // Define valores padrão como 0 se o campo estiver desabilitado
  const a = document.getElementById("shx").disabled ? 0 : shx;
  const b = document.getElementById("shy").disabled ? 0 : shy;

  // Matriz geral de cisalhamento
  const shearMatrix = [
    [1, a, 0],
    [b, 1, 0],
    [0, 0, 1],
  ];

  squarePoints = squarePoints.map(([x, y, z]) => {
    const point = [x, y, 1]; // Coordenadas homogêneas
    const newX = shearMatrix[0][0] * point[0] + shearMatrix[0][1] * point[1];
    const newY = shearMatrix[1][0] * point[0] + shearMatrix[1][1] * point[1];
    return [newX, newY, 1];
  });

  clearCanvas();
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    Line(
      squarePoints[i][0],
      squarePoints[i][1],
      squarePoints[next][0],
      squarePoints[next][1]
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

// ============================
// FUNÇÃO PARA MANIPULAR O SELECT DE CISALHAMENTO (FRONT-END)
// ============================
function updateCisalhamentoEixo() {
  const eixo = document.getElementById("cisalhamentoEixo").value;

  // Se for cisalhamento em X, desabilita o campo shy
  if (eixo === "cisX") {
    document.getElementById("shx").disabled = false;
    document.getElementById("shy").disabled = true;
  }
  // Se for cisalhamento em Y, desabilita o campo shx
  else if (eixo === "cisY") {
    document.getElementById("shx").disabled = true;
    document.getElementById("shy").disabled = false;
  }
  // Se for cisalhamento em X e Y, habilita ambos os campos
  else if (eixo === "cisXY") {
    document.getElementById("shx").disabled = false;
    document.getElementById("shy").disabled = false;
  }
}

// Função chamada ao carregar a página para definir o comportamento inicial do select de cisalhamento
// OBS: Não aplica transformação, é meramente de uso para o dinamismo do front-end
window.onload = function () {
  updateCisalhamentoEixo(); // Chama a função para aplicar a configuração padrão
};

setupMouseCoordsTracker();

updateCanva();
