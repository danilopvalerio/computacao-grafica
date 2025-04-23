// ====================================================================================
// VARIÁVEIS GLOBAIS - ESTADO
// ====================================================================================
const canvas = document.getElementById("canvas3D");
const ctx = canvas.getContext("2d");

// Configurações de visualização
let rotationX = 0; // Ângulo de rotação no eixo X (graus)
let rotationY = 0; // Ângulo de rotação no eixo Y (graus)
let rotationZ = 0; // Ângulo de rotação no eixo Z (graus)
let zoom = 100; // Nível de zoom (percentual)

// Controles de rotação contínua
let rotationInterval = null;
let currentRotationAxis = null;
let rotationDirection = 0;

// ====================================================================================
// DEFINIÇÃO DAS FIGURAS GEOMÉTRICAS (COORDENADAS HOMOGÊNEAS [x, y, z, 1])
// ====================================================================================

// Pontos da linha 3D
let linePoints = [
  [0, 0, 0, 1], // Ponto inicial
  [0, 0, 0, 1], // Ponto final
];

// Pontos do cubo 3D
let cubePoints = [
  // Face frontal
  [-50, -50, 50, 1], // Vértice 0
  [50, -50, 50, 1], // Vértice 1
  [50, 50, 50, 1], // Vértice 2
  [-50, 50, 50, 1], // Vértice 3

  // Face traseira
  [-50, -50, -50, 1], // Vértice 4
  [50, -50, -50, 1], // Vértice 5
  [50, 50, -50, 1], // Vértice 6
  [-50, 50, -50, 1], // Vértice 7
];

// Arestas do cubo (conexões entre vértices)
let cubeEdges = [
  // Face frontal
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  // Face traseira
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  // Conexões entre faces
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

// Pontos dos eixos coordenados
let axesPoints = {
  x: [
    [0, 0, 0, 1], // Origem
    [200, 0, 0, 1], // Fim do eixo X
  ],
  y: [
    [0, 0, 0, 1], // Origem
    [0, 200, 0, 1], // Fim do eixo Y
  ],
  z: [
    [0, 0, 0, 1], // Origem
    [0, 0, 200, 1], // Fim do eixo Z
  ],
};

// ====================================================================================
// FUNÇÕES DE TRANSFORMAÇÃO GEOMÉTRICA (USANDO COORDENADAS HOMOGÊNEAS)
// ====================================================================================

/**
 * Cria matriz de rotação no eixo X
 * @param {number} angle - Ângulo em graus
 * @returns {Array} Matriz 4x4 de rotação
 */
function createRotationXMatrix(angle) {
  const rad = (angle * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [
    [1, 0, 0, 0],
    [0, c, -s, 0],
    [0, s, c, 0],
    [0, 0, 0, 1],
  ];
}

/**
 * Cria matriz de rotação no eixo Y
 * @param {number} angle - Ângulo em graus
 * @returns {Array} Matriz 4x4 de rotação
 */
function createRotationYMatrix(angle) {
  const rad = (angle * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [
    [c, 0, s, 0],
    [0, 1, 0, 0],
    [-s, 0, c, 0],
    [0, 0, 0, 1],
  ];
}

/**
 * Cria matriz de rotação no eixo Z
 * @param {number} angle - Ângulo em graus
 * @returns {Array} Matriz 4x4 de rotação
 */
function createRotationZMatrix(angle) {
  const rad = (angle * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [
    [c, -s, 0, 0],
    [s, c, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
}

/**
 * Multiplica duas matrizes 4x4
 * @param {Array} a - Primeira matriz
 * @param {Array} b - Segunda matriz
 * @returns {Array} Matriz resultante
 */
function multiplyMatrices(a, b) {
  const result = [];
  for (let i = 0; i < 4; i++) {
    result[i] = [];
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

/**
 * Multiplica matriz 4x4 por vetor de coordenadas homogêneas
 * @param {Array} matrix - Matriz 4x4
 * @param {Array} vector - Vetor [x, y, z, 1]
 * @returns {Array} Vetor transformado
 */
function multiplyMatrixVector(matrix, vector) {
  const result = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      result[i] += matrix[i][j] * vector[j];
    }
  }
  return result;
}

/**
 * Aplica todas as transformações a um conjunto de pontos
 * @param {Array} points - Array de pontos em coordenadas homogêneas
 * @returns {Array} Pontos transformados
 */
function applyTransformations(points) {
  // Criar matrizes de rotação individuais
  const rotX = createRotationXMatrix(rotationX);
  const rotY = createRotationYMatrix(rotationY);
  const rotZ = createRotationZMatrix(rotationZ);

  // Combinar rotações (ordem: Z * Y * X)
  let transform = multiplyMatrices(rotY, rotX);
  transform = multiplyMatrices(rotZ, transform);

  // Aplicar transformação a cada ponto
  return points.map((point) => multiplyMatrixVector(transform, point));
}

// ====================================================================================
// FUNÇÕES DE PROJEÇÃO 3D PARA 2D
// ====================================================================================

/**
 * Projeta um ponto 3D em coordenadas 2D do canvas
 * @param {Array} point - Ponto em coordenadas homogêneas [x, y, z, 1]
 * @returns {Object} Coordenadas {x, y} projetadas
 */
function projectPoint(point) {
  const f = zoom / 100;
  // Projeção isométrica
  const px = (point[0] - point[2]) * f * 0.7071 + canvas.width / 2;
  const py =
    (-point[1] + (point[0] + point[2]) * 0.5) * f * 0.7071 + canvas.height / 2;
  return { x: px, y: py };
}

// ====================================================================================
// FUNÇÕES DE DESENHO NO CANVAS
// ====================================================================================

/**
 * Desenha um pixel no canvas
 * @param {number} x - Coordenada x
 * @param {number} y - Coordenada y
 * @param {string} color - Cor do pixel
 */
function setPixel(x, y, color = "#000000") {
  const canvasX = Math.round(x);
  const canvasY = Math.round(y);

  if (
    canvasX >= 0 &&
    canvasX < canvas.width &&
    canvasY >= 0 &&
    canvasY < canvas.height
  ) {
    ctx.fillStyle = color;
    ctx.fillRect(canvasX, canvasY, 1, 1);
  }
}

/**
 * Algoritmo DDA para desenhar linhas
 * @param {number} x1 - Coordenada x inicial
 * @param {number} y1 - Coordenada y inicial
 * @param {number} x2 - Coordenada x final
 * @param {number} y2 - Coordenada y final
 * @param {string} color - Cor da linha
 */
function drawLineDDA(x1, y1, x2, y2, color = "red") {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));

  const xIncrement = dx / steps;
  const yIncrement = dy / steps;

  let x = x1;
  let y = y1;

  setPixel(x, y, color);

  for (let i = 0; i < steps; i++) {
    x += xIncrement;
    y += yIncrement;
    setPixel(x, y, color);
  }
}

/**
 * Desenha um polígono/forma a partir de vértices e arestas
 * @param {Array} vertices - Vértices em coordenadas homogêneas
 * @param {Array} edges - Arestas (pares de índices de vértices)
 * @param {string} color - Cor da forma
 */
function drawShape(vertices, edges, color = "black") {
  // Projeta todos os vértices primeiro
  const projectedVertices = vertices.map((v) => projectPoint(v));

  // Desenha cada aresta
  edges.forEach((edge) => {
    const [startIdx, endIdx] = edge;
    const start = projectedVertices[startIdx];
    const end = projectedVertices[endIdx];
    drawLineDDA(start.x, start.y, end.x, end.y, color);
  });
}

/**
 * Desenha o cubo 3D
 */
function drawCube() {
  const transformedVertices = applyTransformations(cubePoints);
  drawShape(transformedVertices, cubeEdges, "purple");
}

/**
 * Cria um cubo com tamanho personalizado
 * @param {number} size - Tamanho da aresta do cubo
 */
function createCube(size) {
  const halfSize = size / 2;
  cubePoints = [
    // Face frontal
    [-halfSize, -halfSize, halfSize, 1],
    [halfSize, -halfSize, halfSize, 1],
    [halfSize, halfSize, halfSize, 1],
    [-halfSize, halfSize, halfSize, 1],

    // Face traseira
    [-halfSize, -halfSize, -halfSize, 1],
    [halfSize, -halfSize, -halfSize, 1],
    [halfSize, halfSize, -halfSize, 1],
    [-halfSize, halfSize, -halfSize, 1],
  ];
}

// ====================================================================================
// FUNÇÕES PRINCIPAIS DE DESENHO
// ====================================================================================

/**
 * Desenha toda a cena 3D (eixos + figura selecionada)
 */
function drawScene() {
  // Limpar canvas
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Aplicar transformações e desenhar eixos
  const transformedAxes = {
    x: applyTransformations(axesPoints.x),
    y: applyTransformations(axesPoints.y),
    z: applyTransformations(axesPoints.z),
  };

  // Projetar e desenhar eixos
  const origin = projectPoint(transformedAxes.x[0]);

  // Eixo X (vermelho)
  const xEnd = projectPoint(transformedAxes.x[1]);
  drawLineDDA(origin.x, origin.y, xEnd.x, xEnd.y, "red");

  // Eixo Y (verde)
  const yEnd = projectPoint(transformedAxes.y[1]);
  drawLineDDA(origin.x, origin.y, yEnd.x, yEnd.y, "green");

  // Eixo Z (azul)
  const zEnd = projectPoint(transformedAxes.z[1]);
  drawLineDDA(origin.x, origin.y, zEnd.x, zEnd.y, "blue");

  // Rótulos dos eixos
  ctx.font = "12px Arial";
  ctx.fillStyle = "red";
  ctx.fillText("X", xEnd.x + 15, xEnd.y);
  ctx.fillStyle = "green";
  ctx.fillText("Y", yEnd.x, yEnd.y - 15);
  ctx.fillStyle = "blue";
  ctx.fillText("Z", zEnd.x - 15, zEnd.y);

  // Desenhar figura selecionada
  const figureSelect = document.getElementById("figureSelect3D").value;

  if (figureSelect === "line3d") {
    // Desenhar linha 3D
    const transformedLine = applyTransformations(linePoints);
    const start = projectPoint(transformedLine[0]);
    const end = projectPoint(transformedLine[1]);
    drawLineDDA(start.x, start.y, end.x, end.y, "black");
  } else if (figureSelect === "cube3d") {
    // Desenhar cubo 3D
    drawCube();
  }
}

// ====================================================================================
// FUNÇÕES DE INTERFACE DO USUÁRIO
// ====================================================================================

/**
 * Atualiza os pontos da linha a partir dos inputs e redesenha
 */
function drawLineFromInputs() {
  linePoints[0][0] = parseFloat(document.getElementById("x1_3d").value);
  linePoints[0][1] = parseFloat(document.getElementById("y1_3d").value);
  linePoints[0][2] = parseFloat(document.getElementById("z1_3d").value);

  linePoints[1][0] = parseFloat(document.getElementById("x2_3d").value);
  linePoints[1][1] = parseFloat(document.getElementById("y2_3d").value);
  linePoints[1][2] = parseFloat(document.getElementById("z2_3d").value);

  drawScene();
}

/**
 * Cria e desenha um cubo com parâmetros dos inputs
 */
function draw3DFigure() {
  const size = parseFloat(document.getElementById("cubeSize").value);
  const cx = parseFloat(document.getElementById("cx3d").value);
  const cy = parseFloat(document.getElementById("cy3d").value);
  const cz = parseFloat(document.getElementById("cz3d").value);

  // Criar cubo com tamanho personalizado
  createCube(size);

  // Aplicar translação (posicionamento do cubo)
  cubePoints = cubePoints.map((vertex) => {
    return [vertex[0] + cx, vertex[1] + cy, vertex[2] + cz, 1];
  });

  drawScene();
}

/**
 * Atualiza a rotação da cena
 * @param {string} eixo - Eixo de rotação ('x', 'y' ou 'z')
 * @param {number} valor - Valor do incremento (em graus)
 */
function atualizarRotacao(eixo, valor) {
  if (eixo === "x") rotationX += valor;
  if (eixo === "y") rotationY += valor;
  if (eixo === "z") rotationZ += valor;

  drawScene();
}

/**
 * Animação de rotação automática
 */
function animarRotacao() {
  rotationX += 5;
  rotationY += 5;
  rotationZ += 5;

  drawScene();

  if (rotationX < 360) {
    setTimeout(animarRotacao, 50);
  }
}

/**
 * Atualiza o tamanho do canvas
 */
function updateCanvas3D() {
  const width = parseInt(document.getElementById("width").value);
  const height = parseInt(document.getElementById("height").value);

  canvas.width = width;
  canvas.height = height;

  drawScene();
}

/**
 * Limpa a cena (reseta rotações)
 */
function clearCanvas3D() {
  rotationX = 0;
  rotationY = 0;
  rotationZ = 0;

  drawScene();
}

/**
 * Alterna entre as opções de figura (linha/cubo)
 */
function changeFigure3D() {
  const selectedFigure = document.getElementById("figureSelect3D").value;
  document.getElementById("line3dParams").style.display =
    selectedFigure === "line3d" ? "block" : "none";
  document.getElementById("cube3dParams").style.display =
    selectedFigure === "cube3d" ? "block" : "none";
}

// ====================================================================================
// FUNÇÕES DE ROTAÇÃO CONTÍNUA (ENQUANTO BOTÃO PRESSIONADO)
// ====================================================================================

/**
 * Inicia rotação contínua enquanto o botão estiver pressionado
 * @param {string} axis - Eixo de rotação ('x', 'y' ou 'z')
 * @param {number} direction - Direção (1 ou -1)
 */
function startContinuousRotation(axis, direction) {
  // Parar rotação anterior se existir
  if (rotationInterval) {
    clearInterval(rotationInterval);
  }

  currentRotationAxis = axis;
  rotationDirection = direction;

  // Iniciar rotação contínua (~60fps)
  rotationInterval = setInterval(() => {
    if (currentRotationAxis === "x") rotationX += 2 * rotationDirection;
    if (currentRotationAxis === "y") rotationY += 2 * rotationDirection;
    if (currentRotationAxis === "z") rotationZ += 2 * rotationDirection;

    drawScene();
  }, 16);
}

/**
 * Para a rotação contínua
 */
function stopContinuousRotation() {
  if (rotationInterval) {
    clearInterval(rotationInterval);
    rotationInterval = null;
  }
}

// ====================================================================================
// INICIALIZAÇÃO
// ====================================================================================

document.addEventListener("DOMContentLoaded", function () {
  // Configurar evento de coordenadas do mouse
  canvas.addEventListener("mousemove", function (e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    document.getElementById(
      "mouseCoords3D"
    ).textContent = `Coordenadas: (${Math.round(x)}, ${Math.round(y)})`;
  });

  // Desenhar cena inicial
  drawScene();
});
