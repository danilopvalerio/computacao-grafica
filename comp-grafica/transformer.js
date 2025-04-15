function changeTransformer() {
  const transformer = document.getElementById("transformeSelect").value;
  document.getElementById("translacao").style.display =
    transformer === "translacao" ? "block" : "none";
  document.getElementById("escala").style.display =
    transformer === "escala" ? "block" : "none";
  document.getElementById("rotacao").style.display =
    transformer === "rotacao" ? "block" : "none";
  document.getElementById("reflexao").style.display =
    transformer === "reflexao" ? "block" : "none";
  document.getElementById("cisalhamento").style.display =
    transformer === "cisalhamento" ? "block" : "none";
}
