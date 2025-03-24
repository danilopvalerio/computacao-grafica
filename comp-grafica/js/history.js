// history.js - Gerencia o histórico de ações no canvas

let historyList = []; // Armazena o histórico de ações

// Função para adicionar uma entrada ao histórico
function addToHistory(action) {
    historyList.push(action);
    updateHistoryUI();
}

// Função para exibir o histórico na interface
function updateHistoryUI() {
    const historyContainer = document.getElementById("historyList");
    historyContainer.innerHTML = ""; // Limpa a lista antes de recriar

    historyList.forEach((action, index) => {
        const item = document.createElement("div");
        item.classList.add("history-item");
        item.textContent = `${index + 1}. ${action}`;
        historyContainer.appendChild(item);
    });
}

// Função para limpar o histórico
function clearHistory() {
    historyList = [];
    updateHistoryUI();
}
