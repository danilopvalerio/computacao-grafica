// transformations.js - Responsável por todas as operações de transformação geométrica

// Aplica as transformações no canvas
function applyTransformations(ctx, figureData) {
    const tx = parseInt(document.getElementById('translateX').value) || 0;
    const ty = parseInt(document.getElementById('translateY').value) || 0;
    const angle = parseInt(document.getElementById('rotation').value) || 0;
    const scale = parseFloat(document.getElementById('scale').value) || 1;

    // Salva o estado atual do contexto
    ctx.save();

    // Aplica as transformações no contexto
    ctx.translate(tx, ty);
    ctx.rotate(angle * Math.PI / 180);  // Converte de graus para radianos
    ctx.scale(scale, scale);

    // Desenha a nova figura transformada com cor diferente (exemplo: azul)
    ctx.fillStyle = "blue";  // Cor para a nova figura transformada

    // Desenha a figura transformada, usando os dados fornecidos
    if (figureData.type === "line") {
        Line(figureData.x0, figureData.y0, figureData.x1, figureData.y1, ctx);
    } else if (figureData.type === "circle") {
        CircleMidpoint(figureData.cx, figureData.cy, figureData.radius, ctx);
    }

    // Restaura o contexto
    ctx.restore();
}
