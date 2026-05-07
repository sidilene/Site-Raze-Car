// logout.js
async function logout() {
  try {
    const res = await fetch("http://localhost:3333/logout", {
      method: "POST",
      credentials: "include" // essencial para enviar cookies
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      window.location.href = "login.html"; // redireciona para login
    } else {
      alert(data.error || "Erro ao deslogar");
    }
  } catch (error) {
    console.error(error);
    alert("Erro ao deslogar");
  }
}

// chamar logout ao carregar a página ou botão
document.getElementById("logoutBtn")?.addEventListener("click", logout);