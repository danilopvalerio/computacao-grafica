let canva_width = 500;
let canva_height = 500;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function updateCanva() {
  let largura = parseInt(document.getElementById("width").value);
  let altura = parseInt(document.getElementById("height").value);
  //const backgroundColor =
  // document.getElementById("backgroundColor").value;

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

function drawAxis() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  ctx.strokeStyle =
    canvas.style.backgroundColor === "black";
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
  drawAxis();
}

function changeFigure() {
  const figure = document.getElementById("figureSelect").value;
  document.getElementById("lineParams").style.display =
    figure === "line" ? "block" : "none";
  document.getElementById("circleParams").style.display =
    figure === "circle" ? "block" : "none";
  document.getElementById("cubeParams").style.display =
    figure === "cube" ? "block" : "none";
}

function logIteration(x, y, d = null, k = null) {
  const logContainer = document.getElementById("iterationLog");
  
  // Verifica se já existe uma tabela dentro do contêiner de logs
  if (!logContainer.querySelector("table")) {
    logContainer.innerHTML = ""; // Limpa o contêiner antes de criar a tabela
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.maxWidth = "600px";
    table.style.borderCollapse = "collapse";
    
    // Criação do cabeçalho da tabela com os nomes das colunas
    table.innerHTML = `
      <thead>
        <tr>
          <th style="border: 1px solid black; padding: 8px;">${d !== null ? "D" : "K"}</th>
          <th style="border: 1px solid black; padding: 8px;">X</th>
          <th style="border: 1px solid black; padding: 8px;">Y</th>
        </tr>
      </thead>
      <tbody></tbody>`;
    
    logContainer.appendChild(table); // Adiciona a tabela ao contêiner
  }
  
  const tbody = logContainer.querySelector("tbody");
  const row = document.createElement("tr");
  
  // Criação da linha com os valores atuais da iteração
  row.innerHTML = `
    <td style="border: 1px solid black; padding: 8px;">${d !== null ? d : k}</td>
    <td style="border: 1px solid black; padding: 8px;">${x}</td>
    <td style="border: 1px solid black; padding: 8px;">${y}</td>
  `;
  
  tbody.appendChild(row); // Adiciona a linha à tabela
}
  
function clearLog() {
    document.getElementById("iterationLog").innerHTML = "";
}
  
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
  
function LineBresenham(x1, y1, x2, y2) {
    clearLog();
    const dx = x2 - x1;
    const dy = y2 - y1;
    let ds, incE, incNE;
    let x = x1, y = y1;
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
      incE = 2 * dx;
      incNE = 2 * (dx - dy);
      while (y < y2) {
        logIteration(x, y, ds);
        if (ds <= 0) {
          ds += incE;
        } else {
          ds += incNE;
          x += 1;
        }
        y += 1;
        setPixel(x, y);
      }
    }
}
  
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
  
function Line(x0, y0, x1, y1) {
  const algorithm = document.getElementById("lineAlgorithm").value;
  if (algorithm === "dda") {
    LineDDA(x0, y0, x1, y1);
  } else if (algorithm === "bresenham2") {
    LineBresenham(x0, y0, x1, y1);
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

let squarePoints = [];
const getPoint = (id) => {
  const val = document.getElementById(id).value.trim();
  const match = val.match(/\(?\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*\)?/);
  if (match) {
    return {
      x: parseFloat(match[1]),
      y: parseFloat(match[3])
    };
  }
  return null;
};

 // Receber os pontos do quadrado e aplicar no desenho
 function drawSquare() {
  const lado = parseFloat(document.getElementById("lado").value);
  let points;

  if (lado > 0) {
    const centerX = 0;
    const centerY = 0;
    const halfSize = lado / 2;

    points = [
      { x: -halfSize, y: -halfSize },
      { x: halfSize, y: -halfSize },
      { x: halfSize, y: halfSize },
      { x: -halfSize, y: halfSize }
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

    points = [A, B, C, D];
  }

  // Salva os pontos atuais do quadrado
  squarePoints = points.map(p => ({ x: p.x, y: p.y }));

  // Desenha
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    Line(points[i].x, points[i].y, points[next].x, points[next].y);
  }

  document.getElementById("iterationLog").style.display = "none";
}


// Atualize a função drawFigure para usar drawSquare
function drawFigure() {
clearCanvas();
const figure = document.getElementById("figureSelect").value;

  if (figure === "line") {
    const x0 = parseInt(document.getElementById("x1").value);
    const y0 = parseInt(document.getElementById("y1").value);
    const x1 = parseInt(document.getElementById("x2").value);
    const y1 = parseInt(document.getElementById("y2").value);
    Line(x0, y0, x1, y1);
    document.getElementById('bresenhamParams').style.display = "block"; // Exibe os parâmetros do Bresenham
  } else if (figure === "circle") {
    const cx = parseInt(document.getElementById("cx").value);
    const cy = parseInt(document.getElementById("cy").value);
    const radius = parseInt(document.getElementById("radius").value);
    const algorithm = document.getElementById("circleAlgorithm").value;
    document.getElementById('bresenhamParams').style.display = "block"; 
    if (algorithm === "midpoint") {
      CircleMidpoint(cx, cy, radius);
    } else if (algorithm === "equation") {
      CircleEquation(cx, cy, radius);
    } else if (algorithm === "trigonometric") {
      CircleTrigonometric(cx, cy, radius);
    }
  } else{
    document.getElementById('bresenhamParams').style.display = "none"; 
    const lado = parseInt(document.getElementById("lado").value);
    drawSquare(lado); // Agora desenha um quadrado simples
  }
}





// TRNSFORMAÇÕES
// Função para aplicar a translação nos pontos
function translateSquare() {
  const tx = parseInt(document.getElementById("tx").value);
  const ty = parseInt(document.getElementById("ty").value);
  
  if (!squarePoints || squarePoints.length === 0) {
    alert("Desenhe o quadrado primeiro.");
    return;
  }

  // Aplica a translação nos pontos
  squarePoints = squarePoints.map(p => ({
    x: p.x + tx,
    y: p.y + ty
  }));

  console.log(squarePoints);
  // Redesenha a figura transladada
  clearCanvas();
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    Line(squarePoints[i].x, squarePoints[i].y, squarePoints[next].x, squarePoints[next].y);
  }
}


function scale() {
  const sx = parseInt(document.getElementById("sx").value);
  const sy = parseInt(document.getElementById("sy").value);
  
  if (!squarePoints || squarePoints.length === 0) {
    alert("Desenhe o quadrado primeiro.");
    return;
  }

  if(sx === 0){
    squarePoints = squarePoints.map(p => ({
      x: p.x*1,
      y: p.y*sy
    }));
  }else if(sy === 0){
    squarePoints = squarePoints.map(p => ({
      x: p.x*sx,
      y: p.y*1
  }))}

  // Aplica a translação nos pontos
  

  console.log(squarePoints);
  // Redesenha a figura transladada
  clearCanvas();
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    Line(squarePoints[i].x, squarePoints[i].y, squarePoints[next].x, squarePoints[next].y);
  }
}

function rotateSquare() {
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
  squarePoints = squarePoints.map(p => {
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
    Line(squarePoints[i].x, squarePoints[i].y, squarePoints[next].x, squarePoints[next].y);
  }
}


function reflectSquare() {

  const axis = document.getElementById("ref").value;

  if (!squarePoints || squarePoints.length === 0) {
    alert("Desenhe o quadrado primeiro.");
    return;
  }

  squarePoints = squarePoints.map(p => {
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
    Line(squarePoints[i].x, squarePoints[i].y, squarePoints[next].x, squarePoints[next].y);
  }
}



updateCanva();