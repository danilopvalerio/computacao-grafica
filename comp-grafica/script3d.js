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
 * Calcula a transposta de uma matriz 4x4.
 * Para matrizes de rotação, a transposta é igual à inversa.
 * @param {Array} matrix - Matriz 4x4
 * @returns {Array} Matriz transposta
 */
function transposeMatrix(matrix) {
  const result = createIdentityMatrix(); // Cria uma matriz 4x4 vazia
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      result[i][j] = matrix[j][i];
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
// FUNÇÕES DE PROJEÇÃO E CONVERSÃO DE COORDENADAS
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

/**
 * Converte coordenadas do dispositivo (tela) para coordenadas do mundo 3D.
 * Esta função inverte a pipeline de projeção e rotação.
 * @param {number} dx - Coordenada X do dispositivo (mouse).
 * @param {number} dy - Coordenada Y do dispositivo (mouse).
 * @returns {object} Coordenadas do mundo {x, y, z}.
 */
function deviceToWorld3D(dx, dy) {
    // Passo 1: Inverter a projeção isométrica para obter o ponto no espaço rotacionado.
    const f = zoom / 100;
    const iso_const = f * 0.7071;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Evitar divisão por zero se o zoom for 0
    if (Math.abs(iso_const) < 0.0001) {
        return { x: 0, y: 0, z: 0 };
    }

    // Invertendo as equações de projeção, assumindo que o ponto clicado está no plano Z=0 do espaço rotacionado.
    // Equações originais:
    // px = (worldX - worldZ) * iso_const + centerX;
    // py = (-worldY + (worldX + worldZ) * 0.5) * iso_const + centerY;
    
    // Assumindo z_rotacionado = 0
    const x_rotacionado = (dx - centerX) / iso_const;
    const y_rotacionado = -((dy - centerY) / iso_const - 0.5 * x_rotacionado);
    const z_rotacionado = 0;
    
    let pontoRotacionado = [x_rotacionado, y_rotacionado, z_rotacionado, 1];

    // Passo 2: Obter a matriz de rotação inversa para "desfazer" a rotação da cena.
    const rotX = createRotationXMatrix(rotationX);
    const rotY = createRotationYMatrix(rotationY);
    const rotZ = createRotationZMatrix(rotationZ);

    // Ordem da rotação original: Z * Y * X
    let transformacao = multiplyMatrices(rotY, rotX);
    transformacao = multiplyMatrices(rotZ, transformacao);
    
    // A inversa de uma matriz de rotação é sua transposta
    const inversaTransformacao = transposeMatrix(transformacao);

    // Passo 3: Aplicar a transformação inversa para obter as coordenadas do mundo originais.
    const pontoMundo = multiplyMatrixVector(inversaTransformacao, pontoRotacionado);

    return { x: pontoMundo[0], y: pontoMundo[1], z: pontoMundo[2] };
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
 * Pega o valor digitado no input (cube-size)
 * Transforma ele em número (caso esteja como string)
 *Usa esse valor para criar os vértices do cubo
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
  const checkbox = document.getElementById("centro-vertice");
  const centroNaQuina = checkbox.checked;

  // Resetar rotações
  rotationX = 0;
  rotationY = 0;
  rotationZ = 0;

  let startX = 0;
  let startY = 0;
  let startZ = 0;

  if (!centroNaQuina) {
    // Se não estiver marcado, o centro do cubo fica na origem
    startX = -size / 2;
    startY = -size / 2;
    startZ = -size / 2;
  }
  // Se estiver marcado, o canto do cubo já será na origem (startX = 0, etc.)

  cubePoints = [
    // Frente (z + size)
    [startX, startY, startZ + size, 1],
    [startX + size, startY, startZ + size, 1],
    [startX + size, startY + size, startZ + size, 1],
    [startX, startY + size, startZ + size, 1],

    // Trás (z)
    [startX, startY, startZ, 1],
    [startX + size, startY, startZ, 1],
    [startX + size, startY + size, startZ, 1],
    [startX, startY + size, startZ, 1],
  ];

  drawScene();
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

  // Atualizar informações da figura
  updateFigureInfo3D();
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
    return [vertex[0] + cx / 2, vertex[1] + cy / 2, vertex[2] + cz / 2, 1];
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
  rotationY += 1;

  drawScene();

  if (rotationY < 360) {
    setTimeout(animarRotacao, 16);
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
  // Resetar rotações
  rotationX = 0;
  rotationY = 0;
  rotationZ = 0;

  // Resetar zoom
  zoom = 100;

  // Parar qualquer rotação contínua
  stopContinuousRotation();

  // Resetar pontos da linha para valores padrão
  linePoints = [
    [0, 0, 0, 1], // Ponto inicial
    [0, 0, 0, 1], // Ponto final
  ];

  // Atualizar inputs da linha para valores padrão
  document.getElementById("x1_3d").value = "10";
  document.getElementById("y1_3d").value = "10";
  document.getElementById("z1_3d").value = "10";
  document.getElementById("x2_3d").value = "50";
  document.getElementById("y2_3d").value = "15";
  document.getElementById("z2_3d").value = "40";

  // Resetar o cubo para o tamanho padrão
  cubePoints = [
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

  // Resetar inputs do cubo para valores padrão
  document.getElementById("cubeSize").value = "50";
  document.getElementById("cx3d").value = "0";
  document.getElementById("cy3d").value = "0";
  document.getElementById("cz3d").value = "0";
  document.getElementById("centro-vertice").checked = false;

  // Limpar histórico de transformações
  const historyDiv = document.getElementById("historico3D");
  historyDiv.innerHTML = "";

  // Desenhar cena limpa (apenas eixos)
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

function changeTransformer3D() {
  const transformType = document.getElementById("transformSelect3D").value;

  // Esconder todos os painéis de transformação
  document.getElementById("translacao3d").style.display = "none";
  document.getElementById("escala3d").style.display = "none";
  document.getElementById("rotacao3d").style.display = "none";
  document.getElementById("reflexao3d").style.display = "none";
  document.getElementById("cisalhamento3d").style.display = "none";

  // Mostrar apenas o painel selecionado
  document.getElementById(transformType).style.display = "block";
}

// ====================================================================================
// FUNÇÕES DE TRANSFORMAÇÃO 3D
// ====================================================================================

/**
 * Cria matriz de translação 3D
 * @param {number} tx - Translação em X
 * @param {number} ty - Translação em Y
 * @param {number} tz - Translação em Z
 * @returns {Array} Matriz 4x4 de translação
 */
function createTranslationMatrix(tx, ty, tz) {
  return [
    [1, 0, 0, tx],
    [0, 1, 0, ty],
    [0, 0, 1, tz],
    [0, 0, 0, 1],
  ];
}

/**
 * Cria matriz de escala 3D
 * @param {number} sx - Escala em X
 * @param {number} sy - Escala em Y
 * @param {number} sz - Escala em Z
 * @returns {Array} Matriz 4x4 de escala
 */
function createScaleMatrix(sx, sy, sz) {
  return [
    [sx, 0, 0, 0],
    [0, sy, 0, 0],
    [0, 0, sz, 0],
    [0, 0, 0, 1],
  ];
}

/**
 * Cria matriz de reflexão 3D
 * @param {string} plane - Plano de reflexão ('xy', 'xz' ou 'yz')
 * @returns {Array} Matriz 4x4 de reflexão
 */
function createReflectionMatrix(plane) {
  switch (plane) {
    case "xy": // Reflexão no plano XY (inverte Z)
      return [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, -1, 0],
        [0, 0, 0, 1],
      ];
    case "xz": // Reflexão no plano XZ (inverte Y)
      return [
        [1, 0, 0, 0],
        [0, -1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ];
    case "yz": // Reflexão no plano YZ (inverte X)
      return [
        [-1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ];
    default:
      return createIdentityMatrix();
  }
}

/**
 * Cria matriz de cisalhamento 3D
 * @param {string} type - Tipo de cisalhamento ('xy', 'xz', 'yx', 'yz', 'zx', 'zy')
 * @param {number} sh - Fator de cisalhamento
 * @returns {Array} Matriz 4x4 de cisalhamento
 */
function createShearMatrix(type, sh) {
  switch (type) {
    case "xy": // Cisalhamento em X sobre Y
      return [
        [1, sh, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ];
    case "xz": // Cisalhamento em X sobre Z
      return [
        [1, 0, sh, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ];
    case "yx": // Cisalhamento em Y sobre X
      return [
        [1, 0, 0, 0],
        [sh, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ];
    case "yz": // Cisalhamento em Y sobre Z
      return [
        [1, 0, 0, 0],
        [0, 1, sh, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ];
    case "zx": // Cisalhamento em Z sobre X
      return [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [sh, 0, 1, 0],
        [0, 0, 0, 1],
      ];
    case "zy": // Cisalhamento em Z sobre Y
      return [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, sh, 1, 0],
        [0, 0, 0, 1],
      ];
    default:
      return createIdentityMatrix();
  }
}

/**
 * Cria matriz identidade 4x4
 * @returns {Array} Matriz identidade
 */
function createIdentityMatrix() {
  return [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
}

/**
 * Aplica transformação aos pontos do cubo
 * @param {Array} matrix - Matriz de transformação 4x4
 */
function applyTransformationToCube(matrix) {
  cubePoints = cubePoints.map((point) => multiplyMatrixVector(matrix, point));
  drawScene();
}

// ====================================================================================
// FUNÇÕES DE INTERFACE PARA AS TRANSFORMAÇÕES
// ====================================================================================

function applyTranslation3D() {
  const tx = parseFloat(document.getElementById("tx3d").value);
  const ty = parseFloat(document.getElementById("ty3d").value);
  const tz = parseFloat(document.getElementById("tz3d").value);

  const translationMatrix = createTranslationMatrix(tx, ty, tz);
  applyTransformationToCube(translationMatrix);

  addToHistory(`\nTranslação: tx=${tx}, ty=${ty}, tz=${tz}`);
}

function applyScale3D() {
  const sx = parseFloat(document.getElementById("sx3d").value);
  const sy = parseFloat(document.getElementById("sy3d").value);
  const sz = parseFloat(document.getElementById("sz3d").value);

  const scaleMatrix = createScaleMatrix(sx, sy, sz);
  applyTransformationToCube(scaleMatrix);

  addToHistory(`\nEscala: sx=${sx}, sy=${sy}, sz=${sz}`);
}

function applyRotation3D() {
  const angle = parseFloat(document.getElementById("ang3d").value);
  const axis = document.getElementById("rotationAxis3D").value;

  let rotationMatrix;
  switch (axis) {
    case "x":
      rotationMatrix = createRotationXMatrix(angle);
      break;
    case "y":
      rotationMatrix = createRotationYMatrix(angle);
      break;
    case "z":
      rotationMatrix = createRotationZMatrix(angle);
      break;
  }

  applyTransformationToCube(rotationMatrix);
  addToHistory(`\nRotação: ${angle}° em torno do eixo ${axis.toUpperCase()}`);
}

function applyReflection3D() {
  const plane = document.getElementById("reflectionPlane3D").value;
  const reflectionMatrix = createReflectionMatrix(plane);
  applyTransformationToCube(reflectionMatrix);

  addToHistory(`\nReflexão no plano ${plane.toUpperCase()}`);
}

function applyShear3D() {
  const type = document.getElementById("shearType3D").value;
  const sh = parseFloat(document.getElementById("shearFactor3D").value);

  const shearMatrix = createShearMatrix(type, sh);
  applyTransformationToCube(shearMatrix);

  addToHistory(`\nCisalhamento: tipo=${type}, fator=${sh}`);
}

function startRotationAnimation3D() {
  const angle = parseFloat(document.getElementById("ang3d").value);
  const axis = document.getElementById("rotationAxis3D").value;

  let steps = 30;
  let currentStep = 0;
  const angleStep = angle / steps;

  const animation = setInterval(() => {
    if (currentStep >= steps) {
      clearInterval(animation);
      return;
    }

    let rotationMatrix;
    switch (axis) {
      case "x":
        rotationMatrix = createRotationXMatrix(angleStep);
        break;
      case "y":
        rotationMatrix = createRotationYMatrix(angleStep);
        break;
      case "z":
        rotationMatrix = createRotationZMatrix(angleStep);
        break;
    }

    applyTransformationToCube(rotationMatrix);
    currentStep++;
  }, 50);
}

function addToHistory(text) {
  const historyDiv = document.getElementById("historico3D");
  const entry = document.createElement("div");
  entry.textContent = text;
  historyDiv.appendChild(entry);
  historyDiv.scrollTop = historyDiv.scrollHeight;
}

// ====================================================================================
// OBTENÇÃO DE INFORMAÇÕES SOBRE AS FIGURAS
// ====================================================================================
/**
 * Atualiza as informações da figura 3D atual
 * Adaptada para trabalhar com o formato de dados atual (arrays de pontos)
 */
function updateFigureInfo3D() {
  const infoContainer = document.getElementById("figuraInfo3D");
  infoContainer.innerHTML = "";

  const figureSelect = document.getElementById("figureSelect3D").value;

  if (figureSelect === "cube3d") {
    // Calcular tamanho do cubo (distância entre vértices opostos)
    const size = Math.abs(cubePoints[0][0] - cubePoints[1][0]);

    // Calcular o centro do cubo
    const centerX = (cubePoints[0][0] + cubePoints[6][0]) / 2;
    const centerY = (cubePoints[0][1] + cubePoints[6][1]) / 2;
    const centerZ = (cubePoints[0][2] + cubePoints[6][2]) / 2;

    // Verificar se o cubo foi deformado por transformações
    const isRegularCube = checkIfRegularCube();
    const volume = isRegularCube ? size * size * size : calculateCubeVolume();

    const infoHTML = `
      <p><strong>Tipo:</strong> Cubo 3D</p>
      <p><strong>Tamanho:</strong> ${size.toFixed(2)}px</p>
      <p><strong>Centro:</strong> (${centerX.toFixed(2)}, ${centerY.toFixed(
      2
    )}, ${centerZ.toFixed(2)})</p>
      <p><strong class="vertex-info">Vértices:</strong> 8</p>
      <p><strong class="edge-info">Arestas:</strong> 12</p>
      <p><strong>Faces:</strong> 6</p>
      <p><strong>Volume:</strong> ${volume.toFixed(2)} u³</p>
    `;

    infoContainer.innerHTML = infoHTML;
  } else if (figureSelect === "line3d") {
    const p1 = linePoints[0];
    const p2 = linePoints[1];

    // Cálculo do comprimento da linha 3D
    const length = Math.sqrt(
      Math.pow(p2[0] - p1[0], 2) +
        Math.pow(p2[1] - p1[1], 2) +
        Math.pow(p2[2] - p1[2], 2)
    );

    const infoHTML = `
      <p><strong>Tipo:</strong> Reta 3D</p>
      <p><strong>Ponto A:</strong> (${p1[0]}, ${p1[1]}, ${p1[2]})</p>
      <p><strong>Ponto B:</strong> (${p2[0]}, ${p2[1]}, ${p2[2]})</p>
      <p><strong>Comprimento:</strong> ${length.toFixed(2)} u</p>
      <p><strong>Ângulo XY:</strong> ${calculateAngleFromArrays(
        p1,
        p2,
        "xy"
      ).toFixed(2)}°</p>
      <p><strong>Ângulo XZ:</strong> ${calculateAngleFromArrays(
        p1,
        p2,
        "xz"
      ).toFixed(2)}°</p>
      <p><strong>Ângulo YZ:</strong> ${calculateAngleFromArrays(
        p1,
        p2,
        "yz"
      ).toFixed(2)}°</p>
    `;

    infoContainer.innerHTML = infoHTML;
  }
}

/**
 * Calcula o ângulo entre dois pontos em um plano específico
 * Adaptada para trabalhar com arrays de pontos
 * @param {Array} p1 - Primeiro ponto [x, y, z, 1]
 * @param {Array} p2 - Segundo ponto [x, y, z, 1]
 * @param {string} plane - Plano de projeção ('xy', 'xz' ou 'yz')
 * @returns {number} Ângulo em graus
 */
function calculateAngleFromArrays(p1, p2, plane) {
  let dx, dy;

  if (plane === "xy") {
    dx = p2[0] - p1[0]; // x
    dy = p2[1] - p1[1]; // y
  } else if (plane === "xz") {
    dx = p2[0] - p1[0]; // x
    dy = p2[2] - p1[2]; // z
  } else {
    // yz
    dx = p2[1] - p1[1]; // y
    dy = p2[2] - p1[2]; // z
  }

  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return angle;
}

/**
 * Verifica se o cubo ainda mantém formato regular após transformações
 * @returns {boolean} true se o cubo for regular, false caso contrário
 */
function checkIfRegularCube() {
  // Verificar se todas as arestas têm o mesmo comprimento
  const edgeLengths = [];

  // Verificar comprimento das arestas horizontais da face frontal
  const frontEdge = Math.sqrt(
    Math.pow(cubePoints[1][0] - cubePoints[0][0], 2) +
      Math.pow(cubePoints[1][1] - cubePoints[0][1], 2) +
      Math.pow(cubePoints[1][2] - cubePoints[0][2], 2)
  );

  // Verificar comprimento das arestas verticais da face frontal
  const frontVertical = Math.sqrt(
    Math.pow(cubePoints[3][0] - cubePoints[0][0], 2) +
      Math.pow(cubePoints[3][1] - cubePoints[0][1], 2) +
      Math.pow(cubePoints[3][2] - cubePoints[0][2], 2)
  );

  // Verificar profundidade (distância entre face frontal e traseira)
  const depth = Math.sqrt(
    Math.pow(cubePoints[4][0] - cubePoints[0][0], 2) +
      Math.pow(cubePoints[4][1] - cubePoints[0][1], 2) +
      Math.pow(cubePoints[4][2] - cubePoints[0][2], 2)
  );

  // Tolerância para comparação de ponto flutuante
  const epsilon = 0.01;

  // Se todas as dimensões forem aproximadamente iguais, o cubo é regular
  return (
    Math.abs(frontEdge - frontVertical) < epsilon &&
    Math.abs(frontEdge - depth) < epsilon
  );
}

/**
 * Calcula o volume aproximado do cubo mesmo após transformações
 * @returns {number} Volume do cubo
 */
function calculateCubeVolume() {
  // Calcular os vetores que representam as arestas do cubo
  const edge1 = [
    cubePoints[1][0] - cubePoints[0][0],
    cubePoints[1][1] - cubePoints[0][1],
    cubePoints[1][2] - cubePoints[0][2],
  ];

  const edge2 = [
    cubePoints[3][0] - cubePoints[0][0],
    cubePoints[3][1] - cubePoints[0][1],
    cubePoints[3][2] - cubePoints[0][2],
  ];

  const edge3 = [
    cubePoints[4][0] - cubePoints[0][0],
    cubePoints[4][1] - cubePoints[0][1],
    cubePoints[4][2] - cubePoints[0][2],
  ];

  // Calcular o produto escalar para volume do paralelepípedo
  // Volume = |a · (b × c)|

  // Calcular o produto vetorial b × c
  const crossProduct = [
    edge2[1] * edge3[2] - edge2[2] * edge3[1],
    edge2[2] * edge3[0] - edge2[0] * edge3[2],
    edge2[0] * edge3[1] - edge2[1] * edge3[0],
  ];

  // Calcular o produto escalar a · (b × c)
  const volume = Math.abs(
    edge1[0] * crossProduct[0] +
      edge1[1] * crossProduct[1] +
      edge1[2] * crossProduct[2]
  );

  return volume;
}

// ====================================================================================
// INICIALIZAÇÃO
// ====================================================================================

document.addEventListener("DOMContentLoaded", function () {
  // Configurar evento de coordenadas do mouse
  canvas.addEventListener("mousemove", function (e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Converte as coordenadas do mouse (dispositivo) para o mundo 3D
    const worldCoords = deviceToWorld3D(mouseX, mouseY);
    
    // Atualiza o texto na tela para mostrar as coordenadas do mundo
    document.getElementById(
      "mouseCoords3D"
    ).textContent = `Mundo: (${worldCoords.x.toFixed(2)}, ${worldCoords.y.toFixed(2)}, ${worldCoords.z.toFixed(2)})`;
  });

  // Desenhar cena inicial
  drawScene();
});