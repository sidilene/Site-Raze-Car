document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const bubblesContainer = document.querySelector(".bubbles");

    // --- Função para criar bolhas animadas ---
    function createBubbles() {
        if (!bubblesContainer) return;

        bubblesContainer.innerHTML = "";
        const bubbleCount = 30;

        for (let i = 0; i < bubbleCount; i++) {
            const bubble = document.createElement("div");
            bubble.classList.add("bubble");

            const size = Math.random() * 60 + 50; // 50 a 110px
            const duration = Math.random() * 5 + 5; // 5 a 10s
            const delay = Math.random() * 5; // 0 a 5s
            const left = Math.random() * 100; // 0% a 100%

            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            bubble.style.left = `${left}%`;
            bubble.style.animationDuration = `${duration}s`;
            bubble.style.animationDelay = `${delay}s`;

            bubblesContainer.appendChild(bubble);
        }
    }

    createBubbles();

    // --- Função para lidar com o envio do formulário ---
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("password").value;

        if (!email || !senha) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        try {
            const resposta = await fetch("http://localhost:3333/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // necessário para cookies
                body: JSON.stringify({ email, senha })
            });

            const dados = await resposta.json().catch(() => ({}));

            if (resposta.ok) {
                const funcaoNum = Number(dados.user.funcao);
                alert("✅ Login realizado com sucesso!");

                // --- Redirecionamento correto com base na sua estrutura ---
                if (funcaoNum === 0) {
                    window.location.href = "home.html"; // home.html está na raiz
                } else if (funcaoNum === 1) {
                    window.location.href = "../Admin/admUsuario.html"; // admUsuario.html dentro de Pages/Admin
                } else {
                    alert("Função de usuário desconhecida.");
                }
            } else {
                alert("Falha no login: " + (dados.error || "Erro desconhecido"));
            }

        } catch (erro) {
            alert("Erro ao tentar fazer login: " + erro.message);
        }
    });

});