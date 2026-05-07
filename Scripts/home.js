

        // --- ELEMENTOS DO DOM ---
        const addWashForm = document.getElementById('addWashForm');
        const servicoSelect = document.getElementById('servico');
        const precoInput = document.getElementById('preco');
        const loader = document.getElementById('loader');
        const columnsContainer = document.getElementById('columnsContainer');
        const aguardandoContainer = document.getElementById('aguardandoContainer');
        const emLavagemContainer = document.getElementById('emLavagemContainer');
        const finalizadoContainer = document.getElementById('finalizadoContainer');
        const historicoContainer = document.getElementById('historicoContainer');
        const aguardandoCount = document.getElementById('aguardandoCount');
        const emLavagemCount = document.getElementById('emLavagemCount');
        const finalizadoCount = document.getElementById('finalizadoCount');
        const totalDiarioEl = document.getElementById('totalDiario');
        
        // Modal elements
        const modal = document.getElementById('confirmationModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalConfirm = document.getElementById('modalConfirm');
        const modalCancel = document.getElementById('modalCancel');

        // Variável para armazenar a ação atual do modal
        document.addEventListener("DOMContentLoaded", () => {
        const servicoSelect = document.getElementById('servico');
        const precoInput = document.getElementById('preco');


        

        // Função para carregar os serviços da API
   async function carregarServicos() {
    try {
        const servicoSelect = document.getElementById('servico');
        if (!servicoSelect) {
            console.error("Elemento select 'servicoSelect' não encontrado!");
            return;
        }

        const response = await fetch("http://localhost:3333/tipos-lavagem");
        if (!response.ok) throw new Error(`Erro ${response.status}: ${response.statusText}`);

        const data = await response.json();
        const servicos = Array.isArray(data) ? data : data.tiposLavagem;

        if (!Array.isArray(servicos)) {
            console.error("Formato inesperado:", data);
            alert("O backend não retornou um array válido de tipos de lavagem.");
            return;
        }

        servicoSelect.innerHTML = '<option value="" disabled selected>Selecione o Serviço</option>';

        servicos.forEach(servico => {
            const preco = servico.precoPadrao ?? 0;
            const option = document.createElement("option");
            option.value = servico._id; // 🔹 Use o ID para identificar melhor o serviço
            option.textContent = `${servico.nome} - R$ ${preco.toFixed(2).replace('.', ',')}`;
            option.setAttribute("data-price", preco);
            servicoSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Erro ao carregar os serviços:", error);
        alert("Não foi possível carregar os serviços. Veja o console para mais detalhes.");
    }
}

document.addEventListener('DOMContentLoaded', carregarServicos);

        // Atualiza o preço automaticamente ao selecionar um serviço
        servicoSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.selectedOptions[0];
            const price = selectedOption.getAttribute('data-price');
            if (price) {
                precoInput.value = parseFloat(price).toFixed(2);
            }
        });

        carregarServicos(); // Chama a função para carregar os serviços ao carregar a página
        
        });


        // --- FUNÇÕES DO MODAL ---
        function showModal(title, message, onConfirm) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            currentAction = onConfirm;
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.querySelector('.modal-backdrop').classList.remove('opacity-0');
                modal.querySelector('.modal-content').classList.remove('scale-95');
            }, 10);
        }

        function hideModal() {
            modal.querySelector('.modal-backdrop').classList.add('opacity-0');
            modal.querySelector('.modal-content').classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }

        modalConfirm.addEventListener('click', () => {
            if (currentAction) {
                currentAction();
            }
            hideModal();
        });
        modalCancel.addEventListener('click', hideModal);

        // --- LÓGICA DA APLICAÇÃO ---

        // Atualiza o preço automaticamente ao selecionar um serviço
        servicoSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.selectedOptions[0];
            const price = selectedOption.getAttribute('data-price');
            if (price) {
                precoInput.value = parseFloat(price).toFixed(2);
            }
        });

        // Adicionar nova lavagem
        addWashForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!userId) {
                alert("Erro: Usuário não autenticado. Tente recarregar a página.");
                return;
            }

            const newWash = {
                placa: document.getElementById('placa').value.toUpperCase(),
                modelo: document.getElementById('modelo').value,
                clienteNome: document.getElementById('clienteNome').value,
                clienteTelefone: document.getElementById('clienteTelefone').value,
                servico: document.getElementById('servico').value,
                preco: Number(document.getElementById('preco').value),
                status: 'Aguardando',
                dataEntrada: Timestamp.now(),
                userId: userId,
            };

            try {
                const collectionRef = collection(db, `artifacts/${appId}/public/data/lavagens`);
                await addDoc(collectionRef, newWash);
                addWashForm.reset();
            } catch (error) {
                console.error("Erro ao adicionar lavagem: ", error);
                alert("Falha ao adicionar lavagem. Verifique o console para mais detalhes.");
            }
        });

        // Configurar listeners em tempo real
        function setupRealtimeListeners() {
            if (!userId) return;

            const collectionRef = collection(db, `artifacts/${appId}/public/data/lavagens`);
            
            // Listener para lavagens ativas
            const qActive = query(collectionRef, where('status', 'in', ['Aguardando', 'Em Lavagem', 'Finalizado']));
            onSnapshot(qActive, (snapshot) => {
                loader.style.display = 'none';
                columnsContainer.classList.remove('hidden');

                aguardandoContainer.innerHTML = '';
                emLavagemContainer.innerHTML = '';
                finalizadoContainer.innerHTML = '';
                let aguardando = 0, emLavagem = 0, finalizado = 0;

                snapshot.docs.forEach(doc => {
                    const wash = { id: doc.id, ...doc.data() };
                    const card = createWashCard(wash);
                    
                    switch (wash.status) {
                        case 'Aguardando':
                            aguardandoContainer.appendChild(card);
                            aguardando++;
                            break;
                        case 'Em Lavagem':
                            emLavagemContainer.appendChild(card);
                            emLavagem++;
                            break;
                        case 'Finalizado':
                            finalizadoContainer.appendChild(card);
                            finalizado++;
                            break;
                    }
                });
                
                aguardandoCount.textContent = aguardando;
                emLavagemCount.textContent = emLavagem;
                finalizadoCount.textContent = finalizado;
                
                lucide.createIcons(); // Recria os ícones após adicionar elementos
            });

            // Listener para histórico do dia
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const qHistory = query(collectionRef, where('status', '==', 'Pago'), where('dataEntrada', '>=', Timestamp.fromDate(startOfDay)));

            onSnapshot(qHistory, (snapshot) => {
                if (snapshot.empty) {
                    historicoContainer.innerHTML = '<p class="text-gray-500">Nenhuma lavagem paga hoje.</p>';
                    totalDiarioEl.textContent = 'Total do Dia: R$ 0,00';
                    return;
                }

                historicoContainer.innerHTML = '';
                let totalDiario = 0;
                
                snapshot.docs.sort((a, b) => b.data().dataEntrada.toMillis() - a.data().dataEntrada.toMillis()).forEach(doc => {
                    const wash = { id: doc.id, ...doc.data() };
                    const historyItem = createHistoryItem(wash);
                    historicoContainer.appendChild(historyItem);
                    totalDiario += wash.preco;
                });

                totalDiarioEl.textContent = `Total do Dia: ${formatCurrency(totalDiario)}`;
                lucide.createIcons();
            });
        }

        // Criar card de lavagem
        function createWashCard(wash) {
            const div = document.createElement('div');
            div.className = 'bg-white p-4 rounded-lg shadow-md border-l-4 card-animate';
            div.dataset.id = wash.id;

            let borderColor, actionsHtml;

            switch (wash.status) {
                case 'Aguardando':
                    borderColor = 'border-gray-400';
                    actionsHtml = `<button data-action="start" class="action-btn bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-3 rounded-md text-sm flex items-center space-x-1.5"><i data-lucide="play" class="h-4 w-4"></i><span>Iniciar</span></button>`;
                    break;
                case 'Em Lavagem':
                    borderColor = 'border-yellow-500';
                    actionsHtml = `<button data-action="finish" class="action-btn bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 rounded-md text-sm flex items-center space-x-1.5"><i data-lucide="check" class="h-4 w-4"></i><span>Finalizar</span></button>`;
                    break;
                case 'Finalizado':
                    borderColor = 'border-green-500';
                    actionsHtml = `<button data-action="pay" class="action-btn bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md text-sm flex items-center space-x-1.5"><i data-lucide="dollar-sign" class="h-4 w-4"></i><span>Pagar</span></button>`;
                    break;
            }

            div.classList.add(borderColor);
            div.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold text-lg">${wash.placa}</p>
                        <p class="text-gray-600 text-sm">${wash.modelo}</p>
                    </div>
                    <p class="font-bold text-lg text-green-600">${formatCurrency(wash.preco)}</p>
                </div>
                <div class="mt-3 pt-3 border-t border-gray-200">
                    <p class="text-sm"><strong class="font-medium">Cliente:</strong> ${wash.clienteNome || 'Não informado'}</p>
                    <p class="text-sm"><strong class="font-medium">Serviço:</strong> ${wash.servico}</p>
                </div>
                <div class="mt-4 flex justify-end">
                    ${actionsHtml}
                </div>
            `;
            return div;
        }

        function createHistoryItem(wash) {
            const div = document.createElement('div');
            div.className = 'bg-gray-50 p-3 rounded-md flex justify-between items-center';
            div.innerHTML = `
                <div>
                    <p class="font-semibold">${wash.placa} - ${wash.servico}</p>
                    <p class="text-xs text-gray-500">${wash.dataEntrada.toDate().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                <p class="font-bold text-green-700">${formatCurrency(wash.preco)}</p>
            `;
            return div;
        }

        // Delegação de eventos para os botões de ação
        columnsContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.action-btn');
            if (!button) return;

            const card = button.closest('.card-animate');
            const washId = card.dataset.id;
            const action = button.dataset.action;

            const actions = {
                start: { 
                    title: "Iniciar Lavagem", 
                    message: `Tem certeza que deseja iniciar a lavagem do veículo?`, 
                    confirm: () => updateWashStatus(washId, 'Em Lavagem') 
                },
                finish: { 
                    title: "Finalizar Lavagem", 
                    message: `Confirmar a finalização da lavagem? O veículo ficará pronto para retirada.`, 
                    confirm: () => updateWashStatus(washId, 'Finalizado') 
                },
                pay: { 
                    title: "Registrar Pagamento", 
                    message: `Confirmar o pagamento e mover para o histórico?`, 
                    confirm: () => updateWashStatus(washId, 'Pago') 
                },
            };
            
            if (actions[action]) {
                showModal(actions[action].title, actions[action].message, actions[action].confirm);
            }
        });

        // Atualizar status da lavagem no Firestore
        async function updateWashStatus(id, newStatus) {
            if (!userId) {
                alert("Erro de autenticação.");
                return;
            }
            const docRef = doc(db, `artifacts/${appId}/public/data/lavagens`, id);
            try {
                await updateDoc(docRef, { status: newStatus });
            } catch (error) {
                console.error("Erro ao atualizar status: ", error);
                alert("Falha ao atualizar status.");
            }
        }

        // Função para formatar moeda
        function formatCurrency(value) {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        }

        // Inicializar ícones
        lucide.createIcons();
