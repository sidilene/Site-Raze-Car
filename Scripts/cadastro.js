document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const nomeLavajato = document.getElementById('nomeLavajato').value.trim();
    const nomeDono = document.getElementById('nomeDono').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;

    if (senha !== confirmarSenha) {
        alert('As senhas não coincidem.');
        return;
    }

    const dados = { nomeLavajato, nomeDono, email, senha };

    try {
        // Substitua pela URL real da sua API
        const resposta = await fetch('http://localhost:3333/cadastrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (!resposta.ok) {
            const erro = await resposta.text();
            throw new Error(erro || 'Erro no servidor');
        }

        alert('✅ Cadastro realizado com sucesso!');
        window.location.href = 'login.html'; // redireciona imediatamente

    } catch (erro) {
        console.error('❌ Erro ao cadastrar:', erro);
        alert('Falha ao cadastrar: ' + erro.message);
    }
});