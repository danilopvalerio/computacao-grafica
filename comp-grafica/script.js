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
    //clearLog();
    const dx = x1 - x0;
    const dy = y1 - y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    const xIncrement = dx / steps;
    const yIncrement = dy / steps;
    let x = x0;
    let y = y0;
  
    for (let i = 0; i <= steps; i++) {
      setPixel(Math.round(x), Math.round(y));
      //logIteration(Math.round(x), Math.round(y), null, i);
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

 // Receber os pontos do quadrado e aplicar no desenho
function drawSquare(size) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const halfSize = size / 2;
  
  // Pontos do quadrado (relativos ao centro)
  const points = [
      { x: -halfSize, y: -halfSize }, // canto superior esquerdo
      { x: halfSize, y: -halfSize },  // canto superior direito
      { x: halfSize, y: halfSize },   // canto inferior direito
      { x: -halfSize, y: halfSize }   // canto inferior esquerdo
  ];
  
  // Desenha as 4 linhas do quadrado
  for (let i = 0; i < 4; i++) {
      const next = (i + 1) % 4; // Conecta o último ponto ao primeiro
      Line(points[i].x, points[i].y, points[next].x, points[next].y);
  }
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
} else{
  const lado = parseInt(document.getElementById("lado").value);
  drawSquare(lado); // Agora desenha um quadrado simples
}
}

updateCanva();