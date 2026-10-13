document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menu-toggle");
    const navLinks = document.getElementById("nav-links");
    const iconeMenu = document.getElementById("icone-menu");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            // Alterna a classe 'aberto' no container de links
            navLinks.classList.toggle("aberto");

            // Alterna o ícone entre hambúrguer e 'X'
            if (navLinks.classList.contains("aberto")) {
                iconeMenu.classList.replace("bx-menu", "bx-x");
            } else {
                iconeMenu.classList.replace("bx-x", "bx-menu");
            }
        });

        // Fecha o menu automaticamente se o usuário clicar em algum link interno
        const links = navLinks.querySelectorAll("a");
        links.forEach((link) => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("aberto");
                iconeMenu.classList.replace("bx-x", "bx-menu");
            });
        });
    }
});