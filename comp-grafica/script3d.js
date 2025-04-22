// ============================
// CONFIGURAÇÃO DO CANVAS 3D
// ============================
let figuraPontos = []; // Array para pontos da figura [x,y,z,w]
let figuraCores = []; // Array paralelo para cores dos pontos
let eixosPontos = []; // Array para pontos dos eixos [x,y,z,w]
let eixosCores = []; // Array paralelo para cores dos eixos

let canvas3D = document.getElementById("canvas3D");
let ctx3D = canvas3D.getContext("2d");

canvas3D.width = 500;
canvas3D.height = 500;
canvas3D.style.backgroundColor = "white";

// ============================
// PROJEÇÃO PARA 2D (ORTOGONAL SIMPLES)
// ============================
function project3DTo2D(point3D) {
  const [x, y, z, w] = point3D;
  const px = x - z * 0.5;
  const py = y - z * 0.5;
  return [px, py];
}

// ============================
// FUNÇÕES PARA MANIPULAÇÃO DOS PONTOS
// ============================
function adicionarPontoEixo(ponto, color = "red") {
  eixosPontos.push(ponto); // [x, y, z, w]
  eixosCores.push(color);
}

function adicionarPontoFigura(ponto, color = "black") {
  figuraPontos.push(ponto); // [x, y, z, w]
  figuraCores.push(color);
}

// ============================
// PIXEL E COORDENADAS
// ============================
function setPixel3D(x, y, color = "red") {
  const centerX = canvas3D.width / 2;
  const centerY = canvas3D.height / 2;
  ctx3D.fillStyle = color;
  ctx3D.fillRect(centerX + x, centerY - y, 1, 1);
}

// ============================
// FUNÇÕES DE DESENHO
// ============================
function desenharTodosPontos() {
  // Desenha eixos primeiro (fundo)
  for (let i = 0; i < eixosPontos.length; i++) {
    const [px, py] = project3DTo2D(eixosPontos[i]);
    setPixel3D(Math.round(px), Math.round(py), eixosCores[i]);
  }

  // Desenha figura depois (frente)
  for (let i = 0; i < figuraPontos.length; i++) {
    const [px, py] = project3DTo2D(figuraPontos[i]);
    setPixel3D(Math.round(px), Math.round(py), figuraCores[i]);
  }
}

// ============================
// FUNÇÕES ORIGINAIS (MANTIDAS)
// ============================
function drawAxisLine(start, end, color = "red") {
  let [x0, y0, z0] = start;
  let [x1, y1, z1] = end;

  const dx = x1 - x0;
  const dy = y1 - y0;
  const dz = z1 - z0;

  const steps = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));

  const xInc = dx / steps;
  const yInc = dy / steps;
  const zInc = dz / steps;

  let x = x0;
  let y = y0;
  let z = z0;

  for (let i = 0; i <= steps; i++) {
    adicionarPontoEixo([x, y, z, 1], color);
    x += xInc;
    y += yInc;
    z += zInc;
  }
}

function LineDDA(start, end, color = "black") {
  // Adiciona os pontos de início e fim
  adicionarPontoFigura(start, color);
  adicionarPontoFigura(end, color);

  let [x0, y0, z0] = start;
  let [x1, y1, z1] = end;

  const dx = x1 - x0;
  const dy = y1 - y0;
  const dz = z1 - z0;

  const steps = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));

  const xInc = dx / steps;
  const yInc = dy / steps;
  const zInc = dz / steps;

  let x = x0;
  let y = y0;
  let z = z0;

  for (let i = 0; i <= steps; i++) {
    adicionarPontoFigura([x, y, z, 1], color);
    x += xInc;
    y += yInc;
    z += zInc;
  }
}

// ============================
// FUNÇÕES DE CANVAS
// ============================
function clearCanvas3D() {
  // Limpa arrays
  figuraPontos = [];
  figuraCores = [];
  eixosPontos = [];
  eixosCores = [];

  // Limpa canvas e redesenha eixos
  ctx3D.clearRect(0, 0, canvas3D.width, canvas3D.height);

  // Desenha eixos
  drawAxisLine([-200, 0, 0, 1], [200, 0, 0, 1], "red"); // X
  drawAxisLine([0, -200, 0, 1], [0, 200, 0, 1], "green"); // Y
  drawAxisLine([0, 0, -200, 1], [0, 0, 200, 1], "blue"); // Z

  // Desenha labels
  drawAxisLabels(220, 220, 220);

  // Renderiza tudo
  desenharTodosPontos();
}

// ============================
// FUNÇÃO PARA ADICIONAR LABELS AOS EIXOS
// ============================
function drawAxisLabels(xPos, yPos, zPos) {
  const centerX = canvas3D.width / 2;
  const centerY = canvas3D.height / 2;

  ctx3D.font = "14px Arial";
  ctx3D.textAlign = "center";
  ctx3D.textBaseline = "middle";

  const [xProjX, xProjY] = project3DTo2D([xPos, 0, 0, 1]);
  const [yProjX, yProjY] = project3DTo2D([0, yPos, 0, 1]);
  const [zProjX, zProjY] = project3DTo2D([0, 0, zPos, 1]);

  ctx3D.fillStyle = "red";
  ctx3D.fillText("X", centerX + xProjX, centerY - xProjY);

  ctx3D.fillStyle = "green";
  ctx3D.fillText("Y", centerX + yProjX, centerY - yProjY);

  ctx3D.fillStyle = "blue";
  ctx3D.fillText("Z", centerX + zProjX, centerY - zProjY);
}

// ============================
// FUNÇÕES DE INTERFACE
// ============================
function drawLineFromInputs() {
  clearCanvas3D();
  const x0 = parseInt(document.getElementById("x1_3d").value);
  const y0 = parseInt(document.getElementById("y1_3d").value);
  const z0 = parseInt(document.getElementById("z1_3d").value);
  const x1 = parseInt(document.getElementById("x2_3d").value);
  const y1 = parseInt(document.getElementById("y2_3d").value);
  const z1 = parseInt(document.getElementById("z2_3d").value);

  LineDDA([x0, y0, z0, 1], [x1, y1, z1, 1], "black");
  desenharTodosPontos();
}

// ============================
// FUNÇÕES DE TRANSFORMAÇÃO
// ============================

function rotacionarFigura(eixo, anguloGraus) {
  const angulo = (anguloGraus * Math.PI) / 180; // Converte para radianos
  const cos = Math.cos(angulo);
  const sin = Math.sin(angulo);

  // Matriz de rotação adequada para o eixo selecionado
  let matrizRotacao;
  switch (eixo.toLowerCase()) {
    case "x":
      matrizRotacao = [
        [1, 0, 0, 0],
        [0, cos, -sin, 0],
        [0, sin, cos, 0],
        [0, 0, 0, 1],
      ];
      break;
    case "y":
      matrizRotacao = [
        [cos, 0, sin, 0],
        [0, 1, 0, 0],
        [-sin, 0, cos, 0],
        [0, 0, 0, 1],
      ];
      break;
    case "z":
      matrizRotacao = [
        [cos, -sin, 0, 0],
        [sin, cos, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ];
      break;
    default:
      console.error("Eixo inválido. Use 'x', 'y' ou 'z'");
      return;
  }

  // Aplica a rotação a todos os pontos da figura
  for (let i = 0; i < figuraPontos.length; i++) {
    figuraPontos[i] = multiplicarMatrizPonto(matrizRotacao, figuraPontos[i]);
  }

  // Redesenha a cena
  redesenharCena();
}

function multiplicarMatrizPonto(matriz, ponto) {
  const resultado = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      resultado[i] += matriz[i][j] * ponto[j];
    }
  }
  return resultado;
}

function redesenharCena() {
  // Limpa o canvas
  ctx3D.clearRect(0, 0, canvas3D.width, canvas3D.height);

  // Redesenha tudo
  desenharTodosPontos();
  drawAxisLabels(220, 220, 220);
}

// ============================
// ATUALIZAÇÃO DA FUNÇÃO DE INTERFACE
// ============================
function atualizarRotacao(eixo, valor) {
  // Atualiza o valor exibido
  updateAxisValue(`${eixo}AxisValue`, valor);

  // Converte para número e aplica a rotação
  const angulo = parseFloat(valor);
  rotacionarFigura(eixo, angulo);
}

function updateAxisValue(elementId, value) {
  document.getElementById(elementId).textContent = value;
}

// ============================
// DESENHA UM CUBO DE EXEMPLO
// ============================

function draw3DFigure() {
  clearCanvas3D();
  const size = parseInt(document.getElementById("cubeSize").value);
  const cx = parseInt(document.getElementById("cx3d").value);
  const cy = parseInt(document.getElementById("cy3d").value);
  const cz = parseInt(document.getElementById("cz3d").value);

  const half = size / 2;

  // Base
  LineDDA(
    [cx - half, cy - half, cz - half, 1],
    [cx + half, cy - half, cz - half, 1]
  );
  LineDDA(
    [cx + half, cy - half, cz - half, 1],
    [cx + half, cy + half, cz - half, 1]
  );
  LineDDA(
    [cx + half, cy + half, cz - half, 1],
    [cx - half, cy + half, cz - half, 1]
  );
  LineDDA(
    [cx - half, cy + half, cz - half, 1],
    [cx - half, cy - half, cz - half, 1]
  );

  // Topo
  LineDDA(
    [cx - half, cy - half, cz + half, 1],
    [cx + half, cy - half, cz + half, 1]
  );
  LineDDA(
    [cx + half, cy - half, cz + half, 1],
    [cx + half, cy + half, cz + half, 1]
  );
  LineDDA(
    [cx + half, cy + half, cz + half, 1],
    [cx - half, cy + half, cz + half, 1]
  );
  LineDDA(
    [cx - half, cy + half, cz + half, 1],
    [cx - half, cy - half, cz + half, 1]
  );

  // Arestas verticais
  LineDDA(
    [cx - half, cy - half, cz - half, 1],
    [cx - half, cy - half, cz + half, 1]
  );
  LineDDA(
    [cx + half, cy - half, cz - half, 1],
    [cx + half, cy - half, cz + half, 1]
  );
  LineDDA(
    [cx + half, cy + half, cz - half, 1],
    [cx + half, cy + half, cz + half, 1]
  );
  LineDDA(
    [cx - half, cy + half, cz - half, 1],
    [cx - half, cy + half, cz + half, 1]
  );

  desenharTodosPontos();
}

// ============================
// INICIALIZAÇÃO
// ============================
window.onload = () => {
  clearCanvas3D();
  draw3DFigure();
};
