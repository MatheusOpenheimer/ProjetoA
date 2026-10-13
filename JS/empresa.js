/* ==========================================================================
   LÓGICA DO PAINEL DA EMPRESA (ADMINISTRADOR)
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    let bd = carregarBD();

    /* --- CONTROLE DE ABAS --- */
    const botoesMenu = document.querySelectorAll(".nav-item");
    const todasSecoes = document.querySelectorAll(".secao-painel");

    botoesMenu.forEach((botao) => {
        botao.addEventListener("click", () => {
            botoesMenu.forEach((b) => b.classList.remove("ativo"));
            botao.classList.add("ativo");

            todasSecoes.forEach((s) => s.classList.remove("ativa"));
            const secaoAlvo = document.getElementById(botao.dataset.alvo);
            if (secaoAlvo) secaoAlvo.classList.add("ativa");

            if (botao.dataset.alvo === "tela-relatorios") {
                renderizarCardsClientesRelatorios();
            }
        });
    });

    renderizarTabelaClientes();
    renderizarTabelaTecnicos();
    renderizarCardsClientesRelatorios();

    /* --- ADICIONAR CAMPOS DE PONTOS DINAMICAMENTE --- */
    const btnAddPonto = document.getElementById("btn-adicionar-ponto-form");
    const containerPontos = document.getElementById("container-inputs-pontos");

    btnAddPonto.addEventListener("click", () => {
        const div = document.createElement("div");
        div.className = "item-input-ponto";
        div.innerHTML = `
            <input type="text" class="input-ponto" placeholder="Ex: P0${containerPontos.children.length + 1} - Novo Ponto" required>
            <button type="button" class="btn-remover-ponto"><i class='bx bx-trash'></i></button>
        `;
        div.querySelector(".btn-remover-ponto").addEventListener("click", () => div.remove());
        containerPontos.appendChild(div);
    });

    /* --- CADASTRAR CLIENTE E SEUS PONTOS --- */
    const formCliente = document.getElementById("form-cliente");
    formCliente.addEventListener("submit", (e) => {
        e.preventDefault();

        const listaPontos = [];
        document.querySelectorAll(".input-ponto").forEach((inp) => {
            if (inp.value.trim() !== "") listaPontos.push(inp.value.trim());
        });

        const novoCliente = {
            id: Date.now(),
            nome: document.getElementById("cliente-nome").value,
            doc: document.getElementById("cliente-doc").value,
            endereco: document.getElementById("cliente-endereco").value,
            contato: document.getElementById("cliente-contato").value,
            pontos: listaPontos
        };

        bd.empresas.push(novoCliente);
        salvarBD(bd);

        renderizarTabelaClientes();
        renderizarCardsClientesRelatorios();

        alert(`Cliente "${novoCliente.nome}" cadastrado com ${listaPontos.length} ponto(s)!`);
        formCliente.reset();
        containerPontos.innerHTML = `
            <div class="item-input-ponto">
                <input type="text" class="input-ponto" placeholder="Ex: P01 - Depósito de Insumos" required>
            </div>
        `;
    });

    /* --- CADASTRAR NOVO TÉCNICO --- */
    const formTecnico = document.getElementById("form-tecnico");
    formTecnico.addEventListener("submit", (e) => {
        e.preventDefault();

        const novoTec = {
            id: Date.now(),
            nome: document.getElementById("tec-nome").value,
            cpf: document.getElementById("tec-cpf").value,
            especialidade: document.getElementById("tec-especialidade").value
        };

        bd.tecnicos.push(novoTec);
        salvarBD(bd);

        renderizarTabelaTecnicos();
        alert(`Técnico "${novoTec.nome}" cadastrado com sucesso!`);
        formTecnico.reset();
    });

    /* --- FUNÇÕES DE RENDERIZAÇÃO --- */
    function renderizarTabelaClientes() {
        const tbody = document.getElementById("lista-clientes");
        tbody.innerHTML = "";
        bd.empresas.forEach((cli) => {
            const tr = document.createElement("tr");
            const pontosHtml = cli.pontos.map(p => `<span class="badge-ponto">${p}</span>`).join(" ");
            tr.innerHTML = `
                <td><strong>${cli.nome}</strong></td>
                <td>${cli.doc}</td>
                <td>${cli.endereco}</td>
                <td>${pontosHtml || "<em>Nenhum ponto</em>"}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderizarTabelaTecnicos() {
        const tbody = document.getElementById("lista-tecnicos");
        tbody.innerHTML = "";
        bd.tecnicos.forEach((tec) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${tec.nome}</td>
                <td>${tec.cpf}</td>
                <td>${tec.especialidade}</td>
                <td><span class="tag-status ativo">Ativo</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    /* --- RELATÓRIOS ORGANIZADOS POR CLIENTE --- */
    function renderizarCardsClientesRelatorios() {
        bd = carregarBD();
        const grade = document.getElementById("grade-empresas-relatorios");
        grade.innerHTML = "";

        bd.empresas.forEach((cli) => {
            const totalRelatorios = bd.relatorios.filter(r => r.empresaId === cli.id).length;

            const card = document.createElement("div");
            card.className = "card-empresa-relatorio";
            card.innerHTML = `
                <i class='bx bx-building'></i>
                <h4>${cli.nome}</h4>
                <p>${cli.pontos.length} Ponto(s) Mapeado(s)</p>
                <span class="badge-qtd-relatorios">${totalRelatorios} Relatório(s)</span>
                <button class="btn-abrir-relatorios" data-id="${cli.id}">Ver Histórico</button>
            `;

            card.querySelector(".btn-abrir-relatorios").addEventListener("click", () => {
                abrirDetalhesCliente(cli);
            });

            grade.appendChild(card);
        });
    }

    function abrirDetalhesCliente(cliente) {
        document.getElementById("grade-empresas-relatorios").style.display = "none";
        const painelDetalhe = document.getElementById("painel-detalhe-relatorios");
        painelDetalhe.style.display = "block";

        document.querySelector("#titulo-empresa-selecionada span").textContent = cliente.nome;

        const tbody = document.getElementById("lista-relatorios-empresa");
        tbody.innerHTML = "";

        const relatoriosDoCliente = bd.relatorios.filter(r => r.empresaId === cliente.id);

        if (relatoriosDoCliente.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #888;">Nenhum laudo gerado para este cliente até o momento.</td></tr>`;
            return;
        }

        relatoriosDoCliente.forEach((rel) => {
            const tr = document.createElement("tr");
            const resumoPontos = rel.avaliacoes.map(a => `<div>• <strong>${a.ponto}:</strong> ${a.status} (${a.obs})</div>`).join("");

            tr.innerHTML = `
                <td><strong>#${rel.id}</strong></td>
                <td>${rel.data}</td>
                <td>${rel.tecnicoNome}</td>
                <td>${rel.tipo}</td>
                <td><small>${resumoPontos}</small></td>
                <td><button class="btn-pdf"><i class='bx bxs-file-pdf'></i> Laudo</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById("btn-fechar-detalhes").addEventListener("click", () => {
        document.getElementById("painel-detalhe-relatorios").style.display = "none";
        document.getElementById("grade-empresas-relatorios").style.display = "grid";
    });
});