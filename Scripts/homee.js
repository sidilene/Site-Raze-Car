let todasLavagens = [];

// 🔹 Função para carregar lavagens (com token e fetch)
async function loadLavagens() {
    try {
        let token = localStorage.getItem("token");
        if (!token) {
            alert("Você precisa estar logado para ver as lavagens.");
            return;
        }

        token = token.replace(/"/g, '').trim();

        const response = await fetch("http://localhost:3333/lavagens", {
            headers: { "Authorization": "Bearer " + token }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Erro ao carregar lavagens");
        }

        const data = await response.json();
        let lavagens = data.lavagens || [];

        // Ordenar por dataCadastro (mais recente primeiro)
        lavagens.sort((a, b) => new Date(b.dataCadastro) - new Date(a.dataCadastro));

        todasLavagens = lavagens;
        renderLavagens(lavagens);
        renderHistoricoHoje(lavagens);

    } catch (error) {
        console.error("Erro ao carregar lavagens:", error);
        alert("Não foi possível carregar as lavagens.\n" + error.message);
    }
}

// 🔹 Função para renderizar lavagens nas colunas
function renderLavagens(lavagens) {
    const loader = document.getElementById('loader');
    const columnsContainer = document.getElementById('columnsContainer');

    const aguardandoContainer = document.getElementById('aguardandoContainer');
    const emLavagemContainer = document.getElementById('emLavagemContainer');
    const finalizadoContainer = document.getElementById('finalizadoContainer');

    const aguardandoCount = document.getElementById('aguardandoCount');
    const emLavagemCount = document.getElementById('emLavagemCount');
    const finalizadoCount = document.getElementById('finalizadoCount');

    // Limpa containers
    aguardandoContainer.innerHTML = '';
    emLavagemContainer.innerHTML = '';
    finalizadoContainer.innerHTML = '';

    let aguardando = 0, emLavagem = 0, finalizado = 0;

    lavagens.forEach(l => {
        const card = document.createElement('div');
        card.className = "bg-white rounded-lg shadow-md p-4 border-l-4 transition hover:scale-[1.02]";

        card.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <h4 class="font-bold text-gray-800">${l.placa} - ${l.veiculo}</h4>
                <span class="text-sm text-gray-500">${l.tipoLavagem?.nome || ''}</span>
            </div>
            <p class="text-gray-700 text-sm">${l.servico || ''}</p>
            <p class="text-gray-500 text-xs mt-1">${l.nome || "Cliente não informado"}</p>
            <p class="text-gray-500 text-xs mt-1">📞 ${l.telefone || "Telefone não informado"}</p>
            <p class="text-gray-400 text-xs">${new Date(l.dataCadastro).toLocaleString()}</p>
        `;

        if (l.status.toLowerCase() === "aguardando") {
            card.classList.add("border-gray-400");
            aguardandoContainer.appendChild(card);
            aguardando++;
        } else if (l.status.toLowerCase() === "em lavagem") {
            card.classList.add("border-yellow-400");
            emLavagemContainer.appendChild(card);
            emLavagem++;
        } else if (l.status.toLowerCase() === "finalizada") {
            card.classList.add("border-green-400");
            finalizadoContainer.appendChild(card);
            finalizado++;
        }
    });

    // Atualiza contadores
    aguardandoCount.textContent = aguardando;
    emLavagemCount.textContent = emLavagem;
    finalizadoCount.textContent = finalizado;

    loader.classList.add('hidden');
    columnsContainer.classList.remove('hidden');
}

// 🔹 Função para renderizar histórico diário (lavagens finalizadas hoje)
function renderHistoricoHoje(lavagens) {
    const historicoContainer = document.getElementById('historicoContainer');
    const totalDiario = document.getElementById('totalDiario');

    const hoje = new Date().toISOString().split('T')[0]; // AAAA-MM-DD
    const lavagensHoje = lavagens.filter(l => {
        if (l.status.toLowerCase() !== "finalizada") return false;
        const dataFinal = l.dataAtualizacao || l.dataCadastro;
        if (!dataFinal) return false;
        return new Date(dataFinal).toISOString().split('T')[0] === hoje;
    });

    historicoContainer.innerHTML = '';

    if (lavagensHoje.length === 0) {
        historicoContainer.innerHTML = `<p class="text-gray-500">Nenhuma lavagem finalizada hoje.</p>`;
        totalDiario.textContent = "Total do Dia: R$ 0,00";
        return;
    }

    let total = 0;
    lavagensHoje.forEach(l => {
        const valor = Number(l.price || 0);
        total += valor;

        const item = document.createElement('div');
        item.className = "flex justify-between items-center bg-gray-100 p-3 rounded-lg";
        item.innerHTML = `
            <div>
                <p class="font-semibold text-gray-800">${l.placa} - ${l.veiculo} - ${l.tipoLavagem?.nome || ''}</p>
                <p class="text-sm text-gray-500">${l.nome || "Cliente não informado"} | 📞 ${l.telefone || "Telefone não informado"}</p>
            </div>
            <div class="text-right">
                <p class="font-bold text-green-600">R$ ${valor.toFixed(2)}</p>
                <p class="text-xs text-gray-400">${new Date(l.dataAtualizacao || l.dataCadastro).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
        `;
        historicoContainer.appendChild(item);
    });

    totalDiario.textContent = `Total do Dia: R$ ${total.toFixed(2)}`;
}



// 🔹 Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadLavagens();
});