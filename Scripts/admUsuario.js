 // Inicializa Lucide Icons
        lucide.createIcons();

        // Variável global para armazenar instâncias dos gráficos (para evitar duplicação)
        let chartInstances = {};

        /**
         * Lógica para a navegação por abas
         */
        function showTab(tabId) {
            // Esconde todo o conteúdo
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });

            // Remove o estilo ativo de todos os botões
            document.querySelectorAll('.tab-button').forEach(button => {
                button.classList.remove('tab-active');
            });

            // Mostra o conteúdo da aba selecionada
            document.getElementById(tabId).classList.remove('hidden');

            // Adiciona o estilo ativo ao botão clicado
            document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`).classList.add('tab-active');
            
            // Re-renderiza ícones do Lucide dentro da nova aba (garante que apareçam)
            lucide.createIcons();
            
            // Se for a aba dashboard, carrega os gráficos
            if (tabId === 'dashboard') {
                loadCharts();
            }
        }

        /**
         * Lógica para Modais
         */
        function openModal(modalId) {
            document.getElementById(modalId).classList.remove('hidden');
            lucide.createIcons(); // Recarrega ícones no modal
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.add('hidden');
        }

        function confirmAction(message, actionCallback) {
            document.getElementById('modalMessage').textContent = message;
            openModal('confirmationModal');
            // Nota: Em um projeto real, você ligaria o actionCallback ao botão 'modalConfirm'
        }

        /**
         * Lógica para Formatação de Moeda (R$) em tempo real
         */
        function formatarMoeda(input) {
            // 1. Limpa o valor, mantendo apenas dígitos
            let value = input.value.replace(/\D/g, '');

            // Se o valor estiver vazio, sai da função
            if (value === '') {
                input.value = '';
                return;
            }

            // 2. Converte para número e divide por 100 (para representar centavos)
            // Usamos String.slice para manter a precisão de dois dígitos para os centavos
            let integerPart = value.slice(0, -2);
            let decimalPart = value.slice(-2);
            
            // Se a parte inteira estiver vazia após a formatação, usamos '0'
            if (integerPart === '') {
                integerPart = '0';
            }
            
            // Converte a parte inteira para número para que toLocaleString possa funcionar corretamente
            let numberToFormat = parseInt(integerPart, 10);
            
            // Formata a parte inteira e concatena a parte decimal
            let formattedValue = numberToFormat.toLocaleString('pt-BR');
            
            formattedValue += ',' + decimalPart;

            // 3. Adiciona o prefixo R$
            formattedValue = 'R$ ' + formattedValue;

            // 4. Atualiza o campo de input
            input.value = formattedValue;
        }

        /**
         * Lógica para Gráficos (Chart.js)
         */
       async function loadCharts() {
    const res = await fetch("http://localhost:3333/dashboard", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    });
    const data = await res.json();

    // --- Atualiza os cards ---
    document.querySelector("#lavagensMes").textContent = data.cards.lavagensMes;
    document.querySelector("#receitaMes").textContent = new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
    }).format(data.cards.receitaTotalMes);
    document.querySelector("#usuariosAtivos").textContent = data.cards.usuariosAtivos;

    // --- Função auxiliar para converter número do mês em nome ---
    const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    const getMonthName = (num) => monthNames[num - 1] || num;

    // --- Gráfico: Faturamento semanal ---
    const weeklyRevenueData = {
        labels: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
        datasets: [{
            label: "Faturamento (R$)",
            data: data.charts.faturamentoSemanal.map(d => d.total),
            backgroundColor: "rgba(59, 130, 246, 0.5)",
            borderColor: "rgb(59, 130, 246)",
            tension: 0.4,
            fill: true
        }]
    };

    new Chart(document.getElementById("weeklyRevenueChart"), { 
        type: "line", 
        data: weeklyRevenueData,
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
                        }
                    }
                }
            }
        }
    });

    // --- Gráfico: Distribuição de Serviços ---
    const washTypeData = {
        labels: data.charts.distribuicaoServicos.map(d => d.nome),
        datasets: [{
            data: data.charts.distribuicaoServicos.map(d => d.total),
            backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"]
        }]
    };
    new Chart(document.getElementById("washTypeChart"), { type: "doughnut", data: washTypeData });

    // --- Gráfico: Lavagens por Mês ---
    const monthlyWashesData = {
        labels: data.charts.lavagensPorMes.map(d => getMonthName(d._id)),
        datasets: [{
            label: "Lavagens",
            data: data.charts.lavagensPorMes.map(d => d.total),
            backgroundColor: "rgba(16, 185, 129, 0.7)"
        }]
    };
    new Chart(document.getElementById("monthlyWashesChart"), { type: "bar", data: monthlyWashesData });

    // --- Gráfico: Receita por Mês ---
    const monthlyRevenueData = {
        labels: data.charts.receitaPorMes.map(d => getMonthName(d._id)),
        datasets: [{
            label: "R$",
            data: data.charts.receitaPorMes.map(d => d.total),
            backgroundColor: "rgba(245, 158, 11, 0.7)"
        }]
    };
    new Chart(document.getElementById("monthlyRevenueChart"), { 
        type: "bar", 
        data: monthlyRevenueData,
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
                        }
                    }
                }
            }
        }
    });

    // --- Gráfico: Veículos por Categoria ---
    const vehicleCategoryData = {
        labels: data.charts.veiculosPorCategoria.map(d => d._id),
        datasets: [{
            label: "Total",
            data: data.charts.veiculosPorCategoria.map(d => d.total),
            backgroundColor: [
                "rgba(59,130,246,0.7)",
                "rgba(249,115,22,0.7)",
                "rgba(22,163,74,0.7)",
                "rgba(147,51,234,0.7)",
                "rgba(234,179,8,0.7)"
            ]
        }]
    };
    new Chart(document.getElementById("vehicleCategoryChart"), { type: "bar", data: vehicleCategoryData });
}


        function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
        }

        function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
        }

        function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
        }
    /////////////////////MODAL DE GESTAO DE USUARIOS/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    
// 🔧 MAPEAMENTO DE FUNÇÕES
// =========================
const roleMap = {
    "Administrador": "1",
    "Operador": "0"
};

const roleNameMap = {
    "1": "Administrador",
    "0": "Operador"
};

// =========================
// 🧩 FUNÇÃO ADICIONAR USUÁRIO
// =========================
async function handleAddUser(event) {
    event.preventDefault();

    try {
        const token = localStorage.getItem("token")?.replace(/"/g, '').trim();
        if (!token) {
            alert("Você precisa estar logado para adicionar um funcionário.");
            return;
        }

        const payload = parseJwt(token);
        if (!payload?.id) {
            alert("Token inválido ou expirado. Faça login novamente.");
            return;
        }

        const lavajatoId = payload.id;

        // Pega os valores do formulário
        const nome = document.getElementById('userName')?.value;
        const email = document.getElementById('userEmail')?.value;
        const funcaoTexto = document.getElementById('userRole')?.value;
        if (!nome || !email || !funcaoTexto) {
            alert("Preencha todos os campos.");
            return;
        }

        const funcao = roleMap[funcaoTexto] || "1";

        // 🔹 Define senha padrão para todos (operador ou admin)
        const senha = "123456"; // agora todos recebem 123456 como senha inicial

        const userData = {
            nome,
            email,
            funcao,
            senha,
            lavajatoId
        };

        console.log("📦 Enviando usuário:", userData);

        const response = await fetch('http://localhost:3333/funcionarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("❌ ERRO DETALHADO DO SERVIDOR:");
            console.log("Status:", response.status);
            console.log("Corpo:", text);
            alert(`Erro do servidor (${response.status}): ${text}`);
            throw new Error('Erro ao adicionar funcionário.');
        }

        await loadUsersFromApi();       // Atualiza tabela
        closeModal('addUserModal');     // Fecha modal
        event.target.reset();           // Limpa formulário

        // Mostra alerta com senha padrão
        alert(`Funcionário adicionado com sucesso!\nSenha padrão: ${senha}`);

    } catch (error) {
        console.error("Erro:", error);
        alert('Erro ao salvar usuário: ' + error.message);
    }
}

// =========================
// 🔍 FUNÇÃO DECODIFICAR JWT
// =========================
function parseJwt(token) {
    try {
        const base64Payload = token.split('.')[1];
        const payload = atob(base64Payload);
        return JSON.parse(payload);
    } catch (e) {
        console.error("Erro ao decodificar token:", e);
        return null;
    }
}

// =========================
// 📥 FUNÇÃO CARREGAR USUÁRIOS
// =========================
async function loadUsersFromApi() {
    try {
        const response = await fetch(`http://localhost:3333/lavajatos/usuarios`, {
            method: "GET",
            credentials: "include" // envia cookies automaticamente
        });

        // --- Verifica status da resposta ---
        if (response.status === 401) {
            alert("❌ Você precisa estar logado para ver os usuários.");
            return;
        }

        if (!response.ok) {
            // tenta ler o erro do backend
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                errorData = {};
            }
            throw new Error(errorData.error || `Erro desconhecido. Status: ${response.status}`);
        }

        // --- Se chegou aqui, a requisição foi bem-sucedida ---
        const users = await response.json();

        const tbody = document.getElementById('listaUsuariosDesktop');
        const mobileList = document.getElementById('listaUsuariosMobile');
        if (!tbody || !mobileList) return;

        tbody.innerHTML = '';
        mobileList.innerHTML = '';

        users.forEach(user => {
            const roleName = roleNameMap[user.funcao] || "Desconhecido";
            const roleClass = user.funcao === "1"
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800";

            const buttonsHtml = user.tipo === "dono" ? "" : `
                <button onclick="openEditFuncionarioModalById('${user._id}')" class="text-blue-600 hover:text-blue-900 mr-2">
                    <i data-lucide="pencil" class="h-5 w-5"></i>
                </button>
                <button onclick="confirmarExclusaoFuncionario('${user._id}')" class="text-red-600 hover:text-red-900">
                    <i data-lucide="trash-2" class="h-5 w-5"></i>
                </button>
            `;

            // --- DESKTOP TABELA ---
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.nome}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleClass}">
                        ${roleName}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${buttonsHtml}
                </td>
            `;
            tbody.appendChild(tr);

            // --- MOBILE CARD ---
            const card = document.createElement('div');
            card.className = "bg-white p-4 rounded-lg shadow flex justify-between items-start";
            card.innerHTML = `
                <div>
                    <h3 class="font-bold text-gray-900">${user.nome}</h3>
                    <p class="text-sm text-gray-600">${user.email}</p>
                    <span class="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${roleClass}">
                        ${roleName}
                    </span>
                </div>
                <div class="flex flex-col space-y-2">
                    ${user.tipo === "dono" ? "" : `
                        <button onclick="openEditFuncionarioModalById('${user._id}')" class="text-blue-600 hover:text-blue-900">
                            <i data-lucide="pencil" class="h-5 w-5"></i>
                        </button>
                        <button onclick="confirmarExclusaoFuncionario('${user._id}')" class="text-red-600 hover:text-red-900">
                            <i data-lucide="trash-2" class="h-5 w-5"></i>
                        </button>
                    `}
                </div>
            `;
            mobileList.appendChild(card);
        });

        if (typeof lucide !== "undefined") lucide.createIcons();

    } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        alert("❌ Erro ao carregar usuários: " + error.message);
    }
}

   let funcionarioIdParaDeletar = null;

// Função para abrir modal de confirmação
async function confirmarExclusaoFuncionario(id, tipo) {
    if (tipo === "dono") {
        return alert("Não é possível excluir o dono do lavajato.");
    }

    try {
        const token = localStorage.getItem("token")?.replace(/"/g, '').trim();
        if (!token) throw new Error("Você precisa estar logado.");

        // Buscar o funcionário para mostrar o nome no modal
        const response = await fetch(`http://localhost:3333/funcionarios/${id}`, {
            headers: { "Authorization": "Bearer " + token }
        });

        if (!response.ok) throw new Error("Funcionário não encontrado.");

        const data = await response.json();
        const funcionario = data.funcionario;

        document.getElementById("modalTitle").textContent = "Confirmar Exclusão";
        document.getElementById("modalMessage").textContent = `Deseja realmente excluir o funcionário "${funcionario.nome}"?`;

        funcionarioIdParaDeletar = id;
        openModal("confirmationModal");

    } catch (err) {
        alert("Erro ao buscar funcionário: " + err.message);
    }
}

// Fechar modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.add("hidden");
    funcionarioIdParaDeletar = null;
}

// Confirmar exclusão
document.getElementById("modalConfirm").addEventListener("click", async () => {
    if (!funcionarioIdParaDeletar) return;

    const token = localStorage.getItem("token")?.replace(/"/g, '').trim();
    if (!token) return alert("Você precisa estar logado.");

    try {
        const response = await fetch(`http://localhost:3333/funcionarios/${funcionarioIdParaDeletar}`, {
            method: "DELETE",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });

        if (response.ok) {
            alert("Funcionário excluído com sucesso.");
            await loadUsersFromApi(); // Recarrega tabela
        } else {
            const erro = await response.json();
            alert("Erro ao excluir: " + (erro.error || "Erro desconhecido"));
        }
    } catch (err) {
        alert("Erro na requisição: " + err.message);
    } finally {
        closeModal("confirmationModal");
    }
});

     

// Abrir modal de edição e preencher dados
let funcionarioIdParaEditar = null;

async function openEditFuncionarioModalById(id) {
    try {
        // Pega o token do localStorage
        const token = localStorage.getItem("token")?.replace(/"/g, '').trim();
        if (!token) throw new Error("Você precisa estar logado.");

        // 🔹 Busca o funcionário específico pelo ID
        const response = await fetch(`http://localhost:3333/funcionarios/${id}`, {
            headers: { "Authorization": "Bearer " + token }
        });

        if (!response.ok) throw new Error('Funcionário não encontrado');

        // 🔹 Extrai o funcionário do JSON retornado
        const data = await response.json();
        const funcionario = data.funcionario; // ⚠️ importante: pega o campo correto

        // 🔹 Preenche o formulário do modal
        document.getElementById('editUserName').value = funcionario.nome || '';
        document.getElementById('editUserEmail').value = funcionario.email || '';
        document.getElementById('editUserRole').value = funcionario.funcao || '0';

        // 🔹 Guarda o ID para a atualização
        funcionarioIdParaEditar = id;

        // 🔹 Abre o modal
        openModal('editUserModal');

    } catch (error) {
        alert('Erro ao carregar funcionário: ' + error.message);
        console.error(error);
    }
}

// Submissão do formulário de edição
document.getElementById('editUserForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!funcionarioIdParaEditar) return alert('Nenhum funcionário selecionado para edição.');

    const token = localStorage.getItem("token")?.replace(/"/g, '').trim();
    if (!token) return alert('Você precisa estar logado.');

    const nome = document.getElementById('editUserName').value.trim();
    const email = document.getElementById('editUserEmail').value.trim();
    const funcao = document.getElementById('editUserRole').value;

    if (!nome || !email || !funcao) {
        return alert('Preencha todos os campos obrigatórios.');
    }

    const dadosParaAtualizar = { nome, email, funcao }; // só campos que podem mudar

    try {
        const response = await fetch(`http://localhost:3333/funcionarios/${funcionarioIdParaEditar}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(dadosParaAtualizar)
        });

        if (response.ok) {
            alert('Funcionário atualizado com sucesso!');
            closeModal('editUserModal');
            await loadUsersFromApi(); // recarrega tabela
            funcionarioIdParaEditar = null;
        } else {
            const erro = await response.json();
            alert('Erro ao atualizar funcionário: ' + (erro.error || JSON.stringify(erro)));
        }
    } catch (error) {
        alert('Erro na requisição: ' + error.message);
    }
});
    /////////////////////MODAL DE TIPOS DE LAVAGENS/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        // Sua função async para enviar tipo de lavagem
     async function criarTipoDeLavagem(event) {
        event.preventDefault();

        try {
            const nomeRaw = document.getElementById("tipoNome").value.trim();

            // Função para deixar a primeira letra de cada palavra maiúscula
            function capitalizeWords(str) {
                return str
                    .toLowerCase() // garante que o resto fique em minúsculas
                    .replace(/\b\w/g, char => char.toUpperCase());
            }

            const nome = capitalizeWords(nomeRaw);

            const precoTexto = document.getElementById("tipoPreco").value;
            const precoNumerico = parseFloat(
                precoTexto.replace("R$", "").replace(/\./g, "").replace(",", ".").trim()
            );

            if (!nome || isNaN(precoNumerico)) {
                alert("Preencha nome e preço corretamente.");
                return;
            }

            let token = localStorage.getItem("token");
            if (!token) {
                alert("Você precisa estar logado para adicionar tipos de serviço.");
                return;
            }
            token = token.replace(/"/g, '').trim();

            const response = await fetch(`http://localhost:3333/tipos-lavagem`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ nome, precoPadrao: precoNumerico })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Erro ao criar tipo de serviço");
            }

            alert("Tipo de serviço criado com sucesso!");
            closeModal('addTipoModal');
            document.getElementById("tipoNome").value = "";
            document.getElementById("tipoPreco").value = "";
            loadTiposDeLavagem();

        } catch (error) {
            console.error("Erro ao criar tipo de lavagem:", error);
            alert("Erro ao criar tipo de lavagem: " + error.message);
        }
    }

async function loadTiposDeLavagem() {
    try {
        let token = localStorage.getItem("token");
        if (!token) return alert("Você precisa estar logado para ver os tipos de lavagem.");
        token = token.replace(/"/g, '').trim();

        const response = await fetch(`http://localhost:3333/tipos-lavagem`, {
            headers: { "Authorization": "Bearer " + token }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Erro ao carregar tipos de lavagem");
        }

        const data = await response.json();
        const tipos = data.tiposLavagem;

        const ul = document.getElementById('listaTiposLavagem');
        if (!ul) return;
        ul.innerHTML = ''; // limpa antes de renderizar

        tipos.forEach(tipo => {
            const precoFormatado = formatarPreco(tipo.precoPadrao || 0);

            const li = document.createElement('li');
            li.className = "flex justify-between items-center py-2";

            li.innerHTML = `
                <span>${tipo.nome} - ${precoFormatado}</span> 
                <div class="space-x-2 flex items-center">
                    <button data-lucide="pencil" 
                            onclick="openEditTipoModalById('${tipo._id}')" 
                            class="text-blue-600 hover:text-blue-900 h-5 w-5 flex-shrink-0"></button>
                    <button data-lucide="trash-2" 
                            onclick="openConfirmDeleteModal('${tipo._id}', '${tipo.nome}')" 
                            class="text-red-600 hover:text-red-900 h-5 w-5 flex-shrink-0"></button>
                </div>
            `;

            ul.appendChild(li);

            // Cria os ícones apenas dentro deste li
            if (typeof lucide !== 'undefined') lucide.createIcons(li);
        });

    } catch (error) {
        console.error('Erro ao carregar tipos de lavagem:', error);
        alert('Não foi possível carregar os tipos de serviço. Veja o console para detalhes.\n' + error.message);
    }
}

// Função auxiliar para formatar preços no padrão BR
function formatarPreco(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

let tipoSelecionadoId = null;

// 🟢 Abre o modal e carrega os dados do tipo pelo ID
async function openEditTipoModalById(id) {
    try {
        tipoSelecionadoId = id;
        let token = localStorage.getItem("token");
        if (!token) return alert("Você precisa estar logado.");
        token = token.replace(/"/g, '').trim();

        const response = await fetch(`http://localhost:3333/tipos-lavagem/${id}`, {
            headers: { "Authorization": "Bearer " + token }
        });

        if (!response.ok) throw new Error("Erro ao carregar tipo de lavagem");

        const data = await response.json();
        const tipo = data.tipoLavagem;

        document.getElementById('editTipoNome').value = tipo.nome;
        document.getElementById('editTipoPreco').value = (tipo.precoPadrao ?? 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        openModal('editTipoModal');
    } catch (err) {
        console.error("Erro ao abrir modal de edição:", err);
        alert("Não foi possível carregar os dados do tipo de lavagem.");
    }
}

// 🟡 Função de salvar alterações (envia PUT pro backend)
async function editarTipoDeLavagem(event) {
    event.preventDefault();
    if (!tipoSelecionadoId) return alert('ID do tipo de lavagem inválido!');

    const nome = document.getElementById('editTipoNome').value.trim();
    let precoRaw = document.getElementById('editTipoPreco').value.replace(/\./g, '').replace(',', '.').replace(/[^\d\.]/g, '');
    const preco = parseFloat(precoRaw);

    if (!nome || isNaN(preco)) return alert('Por favor, preencha o nome e um preço válido.');

    try {
        let token = localStorage.getItem("token");
        if (!token) return alert("Você precisa estar logado.");
        token = token.replace(/"/g, '').trim();

        const response = await fetch(`http://localhost:3333/tipos-lavagem/${tipoSelecionadoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ nome, precoPadrao: preco })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Erro ao atualizar tipo de lavagem");
        }

        alert('Tipo de serviço atualizado com sucesso!');
        closeModal('editTipoModal');
        await loadTiposDeLavagem();
    } catch (error) {
        console.error("Erro ao atualizar tipo de lavagem:", error);
        alert('Erro ao atualizar tipo de lavagem: ' + error.message);
    }
}

// 🧩 Funções utilitárias para abrir/fechar modais
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}


let tipoParaDeletarId = null; // Guarda o ID do tipo que será deletado

// 🔹 Abre o modal de confirmação
function openConfirmDeleteModal(id, nomeDoServico = "este serviço") {
    if (!id) {
        console.error("ID inválido recebido:", id);
        return alert("Erro: ID do tipo de serviço não encontrado.");
    }

    tipoParaDeletarId = id;

    const msg = document.getElementById("confirmDeleteMessage");
    msg.textContent = `Tem certeza que deseja excluir "${nomeDoServico}"? Esta ação não pode ser desfeita.`;

    openModal("confirmDeleteModal");
}

// 🔹 Fecha modal genérico
function closeModal(id) {
    document.getElementById(id).classList.add("hidden");
}

// 🔹 Abre modal genérico
function openModal(id) {
    document.getElementById(id).classList.remove("hidden");
}

// 🔹 Deleta tipo de serviço (após confirmar)
async function confirmarDelecaoTipo() {
    if (!tipoParaDeletarId) {
        return alert("Erro: ID inválido.");
    }

    try {
        let token = localStorage.getItem("token");
        if (!token) {
            return alert("Você precisa estar logado para deletar um tipo de serviço.");
        }
        token = token.replace(/"/g, "").trim();

        const response = await fetch(`http://localhost:3333/tipos-lavagem/${tipoParaDeletarId}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Erro ao deletar tipo de serviço");
        }

        alert("Tipo de serviço deletado com sucesso!");
        closeModal("confirmDeleteModal");
        await loadTiposDeLavagem(); // Atualiza a lista
    } catch (error) {
        console.error("Erro ao deletar tipo:", error);
        alert("Erro ao deletar tipo de serviço: " + error.message);
    } finally {
        tipoParaDeletarId = null;
    }
}

// 🔹 Vincula o botão "Excluir" do modal à função
document.getElementById("confirmDeleteBtn").addEventListener("click", confirmarDelecaoTipo);



 /////////////////////MODAL DE  DE LAVAGENS/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

 // Associação do formulário de adicionar lavagem
// Associação do formulário de adicionar lavagem
const formLavagem = document.querySelector("#addLavagemModal form");
if (formLavagem) {
    formLavagem.addEventListener("submit", criarLavagem);
} 

function formatarPreco(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}


// Carrega tipos de lavagem para o select
async function loadTiposParaSelect() {
    try {
        let token = localStorage.getItem("token");
        if (!token) return;
        token = token.replace(/"/g, "").trim();

        const response = await fetch("http://localhost:3333/tipos-lavagem", {
            headers: { "Authorization": "Bearer " + token }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Erro ao carregar tipos de serviço");
        }

        const data = await response.json();
        const tipos = data.tiposLavagem || [];

        const select = document.getElementById("lavagemTipo");
        if (!select) return;

        // Limpa o select
        select.innerHTML = '<option value="">Selecione um Serviço</option>';

        tipos.forEach(tipo => {
            const option = document.createElement("option");
            option.value = tipo._id;

            // Detecta automaticamente o campo de preço (sem mudar o backend)
            const preco = tipo.preco ?? tipo.precoPadrao ?? tipo.valor ?? tipo.price ?? null;

            // Texto do option: "Nome - R$ 25,00"
            option.textContent = preco
                ? `${tipo.nome} - R$ ${Number(preco).toFixed(2).replace('.', ',')}`
                : tipo.nome;

            select.appendChild(option);
        });

    } catch (error) {
        console.error("Erro ao carregar tipos para select:", error);
    }
}

// Criar nova lavagem
// Criar nova lavagem
async function criarLavagem(event) {
    event.preventDefault();

    try {
        const tipoId = document.getElementById("lavagemTipo").value;
        const nomeClienteRaw = document.getElementById("lavagemNome").value.trim();
        const telefone = document.getElementById("lavagemTelefone").value.trim() || null;
        const placa = document.getElementById("lavagemPlaca").value.trim().toUpperCase();
        const veiculoTipo = document.getElementById("lavagemVeiculoTipo").value;
        const status = document.getElementById("lavagemStatus").value === "true";
        const descricao = document.getElementById("lavagemDescription").value.trim();

        if (!tipoId || !nomeClienteRaw || !placa || !veiculoTipo) {
            alert("Preencha todos os campos obrigatórios corretamente.");
            return;
        }

        // Função para deixar a primeira letra de cada palavra maiúscula
        function capitalizeWords(str) {
            return str
                .toLowerCase() // garante que o resto fique em minúsculas
                .replace(/\b\w/g, char => char.toUpperCase());
        }

        const nomeCliente = capitalizeWords(nomeClienteRaw);

        let token = localStorage.getItem("token");
        if (!token) {
            alert("Você precisa estar logado para adicionar lavagens.");
            return;
        }
        token = token.replace(/"/g, '').trim();

        const response = await fetch("http://localhost:3333/lavagens", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                placa,
                veiculo: veiculoTipo,
                nome: nomeCliente,
                telefone,
                tipoLavagem: tipoId,
                observacao: descricao
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Erro ao criar lavagem");
        }

        alert("Lavagem criada com sucesso!");
        closeModal("addLavagemModal");

        // Limpa formulário
        document.getElementById("lavagemTipo").value = "";
        document.getElementById("lavagemNome").value = "";
        document.getElementById("lavagemTelefone").value = "";
        document.getElementById("lavagemPlaca").value = "";
        document.getElementById("lavagemVeiculoTipo").value = "";
        document.getElementById("lavagemStatus").value = "false";
        document.getElementById("lavagemDescription").value = "";

        loadLavagens();

    } catch (error) {
        console.error("Erro ao criar lavagem:", error);
        alert("Erro ao criar lavagem: " + error.message);
    }
}



// --- 1. Variável global para guardar as lavagens ---
// Variável global para guardar todas as lavagens
let todasLavagens = [];

// Função para buscar lavagens do servidor
// Função para buscar lavagens do servidor
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

        // Ordena do mais recente para o mais antigo usando dataCadastro
        lavagens.sort((a, b) => new Date(b.dataCadastro) - new Date(a.dataCadastro));

        todasLavagens = lavagens; // guarda globalmente
        renderLavagens(lavagens);

    } catch (error) {
        console.error("Erro ao carregar lavagens:", error);
        alert("Não foi possível carregar as lavagens.\n" + error.message);
    }
}



// Função para renderizar lavagens na tela
function renderLavagens(lavagens) {
    const tbody = document.getElementById("listaLavagens");
    const mobileList = document.getElementById("listaLavagensMobile");

    if (!tbody || !mobileList) return;
    tbody.innerHTML = "";
    mobileList.innerHTML = "";

    lavagens.forEach((lavagem) => {
        const valorFormatado = formatarPreco(lavagem.price || 0);
        const tipoNome = lavagem.tipoLavagem?.nome || "Sem Tipo";
        const status = lavagem.status || "Em Lavagem";

        // Define a cor do status
        const statusClasses = status.toLowerCase() === "finalizada"
            ? "bg-green-100 text-green-800"   // ✅ Finalizada: verde
            : "bg-yellow-100 text-yellow-800"; // 🟡 Outros status: amarelo

        // --- DESKTOP ---
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="px-6 py-4 text-sm text-gray-500">${lavagem.placa || "-"}</td>
            <td class="px-6 py-4 text-sm text-gray-500">
                <strong>${lavagem.nome || "-"}</strong>
                <p class="text-xs text-gray-400">${lavagem.telefone || ""}</p>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">${lavagem.veiculo || "-"}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${tipoNome}</td>
            <td class="px-6 py-4 text-sm font-bold text-green-700">${valorFormatado}</td>
            <td class="px-6 py-4">
                <span class="px-2 inline-flex text-xs font-semibold rounded-full ${statusClasses}">
                    ${status}
                </span>
            </td>
            <td class="px-6 py-4 text-sm font-medium">
                <button onclick="openEditLavagemModal('${lavagem._id}')" class="text-blue-600 hover:text-blue-900 mr-2">
                    <i data-lucide="pencil" class="h-5 w-5"></i>
                </button>
                <button onclick="openConfirmDeleteLavagem('${lavagem._id}', '${lavagem.nome}')" class="text-red-600 hover:text-red-900">
                    <i data-lucide="trash-2" class="h-5 w-5"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);

        // --- MOBILE ---
        const card = document.createElement("div");
        card.className = "bg-white p-4 rounded-lg shadow flex justify-between items-start";
        card.innerHTML = `
            <div>
                <h3 class="font-bold text-gray-900">${lavagem.placa || "Sem Placa"}</h3>
                <p class="text-sm text-gray-600">${lavagem.nome || "-"}</p>
                <p class="text-xs text-gray-400">${lavagem.veiculo || ""}</p>
                <p class="mt-1 text-sm font-semibold text-green-700">${valorFormatado}</p>
                <span class="mt-2 inline-block px-2 py-1 text-xs font-semibold rounded-full ${statusClasses}">
                    ${status}
                </span>
            </div>
            <div class="flex flex-col space-y-2">
                <button onclick="openEditLavagemModal('${lavagem._id}')" class="text-blue-600 hover:text-blue-900">
                    <i data-lucide="pencil" class="h-5 w-5"></i>
                </button>
                <button onclick="openConfirmDeleteLavagem('${lavagem._id}', '${lavagem.nome}')" class="text-red-600 hover:text-red-900">
                    <i data-lucide="trash-2" class="h-5 w-5"></i>
                </button>
            </div>
        `;
        mobileList.appendChild(card);
    });

    if (typeof lucide !== "undefined") lucide.createIcons();
}


// Função para filtrar lavagens por data
// Função de filtro também deve manter a ordem
function filtrarLavagens() {
    const inicio = document.getElementById("dataInicio").value;
    const fim = document.getElementById("dataFim").value;

    let filtradas = todasLavagens;

    if (inicio) {
        const dataInicio = new Date(inicio);
        filtradas = filtradas.filter(l => {
            const lDate = new Date(l.dataCadastro);
            return lDate.setHours(0,0,0,0) >= dataInicio.setHours(0,0,0,0);
        });
    }

    if (fim) {
        const dataFim = new Date(fim);
        filtradas = filtradas.filter(l => {
            const lDate = new Date(l.dataCadastro);
            return lDate.setHours(0,0,0,0) <= dataFim.setHours(0,0,0,0);
        });
    }

    // Ordena filtradas do mais recente para o mais antigo
    filtradas.sort((a, b) => new Date(b.dataCadastro) - new Date(a.dataCadastro));

    renderLavagens(filtradas);
}



// --- 4. Filtro de busca ---
document.querySelector("input[placeholder*='Buscar']").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const filtradas = todasLavagens.filter(l => 
        (l.placa || "").toLowerCase().includes(query) ||
        (l.nome || "").toLowerCase().includes(query) ||
        (l.status || "").toLowerCase().includes(query)
    );
    renderLavagens(filtradas);
});


// --- Abrir modal de edição ---
// --- Abrir modal de edição ---
// --- Carregar tipos de lavagem no select ---
// --- Carregar tipos de lavagem no select ---
let tiposLavagem = []; // armazenar para referência se necessário

// --- Carregar tipos de lavagem no select ---
async function carregarTiposLavagemEdit(tipoSelecionado = null) {
    try {
        const token = localStorage.getItem("token")?.replace(/"/g, '').trim();
        if (!token) throw new Error("Usuário não autenticado.");

        const response = await fetch("http://localhost:3333/tipos-lavagem", {
            headers: { "Authorization": "Bearer " + token }
        });

        if (!response.ok) throw new Error("Erro ao buscar tipos de lavagem");

        const data = await response.json();
        const tipos = data.tiposLavagem || [];
        const select = document.getElementById("editLavagemTipo");

        // Limpa select antes de popular
        select.innerHTML = '<option value="">Selecione um Serviço</option>';

        tipos.forEach(t => {
            const option = document.createElement("option");
            option.value = t._id;

            // Detecta automaticamente o campo de preço (sem precisar mudar backend)
            const preco = t.preco ?? t.precoPadrao ?? t.valor ?? t.price ?? null;

            // Formata o texto exibido
            option.textContent = preco
                ? `${t.nome} - R$ ${Number(preco).toFixed(2).replace('.', ',')}`
                : t.nome;

            select.appendChild(option);
        });

        // Seleciona tipo existente, se houver
        if (tipoSelecionado) {
            select.value = tipoSelecionado;
        }

    } catch (error) {
        console.error("Erro ao carregar tipos de lavagem:", error);
        alert("Erro ao carregar tipos de lavagem. Verifique se está logado.");
    }
}

// --- Abrir modal de edição ---
async function openEditLavagemModal(id) {
    // Garante que todas as lavagens estão carregadas
    if (!todasLavagens || todasLavagens.length === 0) {
        await loadLavagens();
    }

    const lavagem = todasLavagens.find(l => l._id.toString() === id.toString());
    if (!lavagem) return alert("Lavagem não encontrada.");

    // Preenche o form
    document.getElementById("editLavagemNome").value = lavagem.nome || "";
    document.getElementById("editLavagemTelefone").value = lavagem.telefone || "";
    document.getElementById("editLavagemPlaca").value = lavagem.placa || "";
    document.getElementById("editLavagemVeiculoTipo").value = lavagem.veiculo || "";
    document.getElementById("editLavagemStatus").value = lavagem.status || "aguardando";
    document.getElementById("editLavagemDescription").value = lavagem.observacao || "";

    // Guarda o id para submissão
    document.getElementById("editLavagemModal").dataset.id = id;

    // Carrega tipos de lavagem para select e seleciona o correto
    await carregarTiposLavagemEdit(lavagem.tipoLavagem?._id);

    // Abre modal
    openModal("editLavagemModal");
}
// --- Salvar edição ---
async function salvarEdicaoLavagem(event) {
    event.preventDefault(); // previne reload do form
    try {
        const token = localStorage.getItem("token")?.replace(/"/g, '').trim();
        if (!token) throw new Error("Usuário não autenticado.");

        const id = document.getElementById("editLavagemModal").dataset.id;
        if (!id) throw new Error("ID da lavagem não encontrado.");

        const body = {
            nome: document.getElementById("editLavagemNome").value.trim(),
            telefone: document.getElementById("editLavagemTelefone").value.trim(),
            placa: document.getElementById("editLavagemPlaca").value.trim(),
            veiculo: document.getElementById("editLavagemVeiculoTipo").value,
            tipoLavagem: document.getElementById("editLavagemTipo").value,
            status: document.getElementById("editLavagemStatus").value,
            observacao: document.getElementById("editLavagemDescription").value.trim()
        };

        const response = await fetch(`http://localhost:3333/lavagens/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Erro ao atualizar lavagem");
        }

        alert("Lavagem atualizada com sucesso!");
        closeModal('editLavagemModal');
        await loadLavagens();

    } catch (error) {
        console.error("Erro ao salvar edição:", error);
        alert("Não foi possível salvar as alterações.\n" + error.message);
    }
}

// Vincula o submit do form
document.getElementById("editLavagemForm").addEventListener("submit", salvarEdicaoLavagem);


// --- Abre modal de confirmação antes de deletar ---
function openConfirmDeleteLavagem(lavagemId, lavagemNome) {
    const confirmacao = confirm(`Tem certeza que deseja excluir a lavagem de "${lavagemNome}"?`);
    if (confirmacao) {
        deletarLavagem(lavagemId);
    }
}

// --- Deleta a lavagem ---
async function deletarLavagem(lavagemId) {
    try {
        const token = localStorage.getItem("token")?.replace(/"/g, '').trim();
        if (!token) throw new Error("Usuário não autenticado.");

        const response = await fetch(`http://localhost:3333/lavagens/${lavagemId}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Erro ao deletar lavagem");
        }

        alert("Lavagem excluída com sucesso!");
        await loadLavagens(); // atualiza a lista de lavagens na tela
    } catch (error) {
        console.error("Erro ao deletar lavagem:", error);
        alert("Não foi possível excluir a lavagem.\n" + error.message);
    }
}





  document.addEventListener('DOMContentLoaded', () => {
    showTab('dashboard');
    loadUsersFromApi(); // Comente temporariamente
    loadTiposDeLavagem(); // Rode apenas esta
    loadTiposParaSelect();
    loadLavagens();
    loadCharts();
});