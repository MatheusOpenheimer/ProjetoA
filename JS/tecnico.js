/* ==========================================================================
   LÓGICA OPERACIONAL DO TÉCNICO - COM CÂMERA QR CODE E FOTOS REAIS
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    let bd = carregarBD();

    const NOME_TECNICO_ATUAL = "Carlos Mendes";
    document.getElementById("nome-tecnico-logado").textContent = NOME_TECNICO_ATUAL;

    /* --- SISTEMA DE ABAS --- */
    const botoesMenu = document.querySelectorAll(".nav-item");
    const todasSecoes = document.querySelectorAll(".secao-tecnico");

    botoesMenu.forEach((botao) => {
        botao.addEventListener("click", () => {
            botoesMenu.forEach((b) => b.classList.remove("ativo"));
            botao.classList.add("ativo");

            todasSecoes.forEach((s) => s.classList.remove("ativa"));
            const secaoAlvo = document.getElementById(botao.dataset.alvo);
            if (secaoAlvo) secaoAlvo.classList.add("ativa");

            if (botao.dataset.alvo === "tela-meus-relatorios") {
                renderizarRelatoriosTecnico();
            }
        });
    });

    carregarSelectClientes();
    renderizarRelatoriosTecnico();
    configurarCanvasAssinatura();

    /* --- PREENCHER CLIENTES NO SELECT --- */
    function carregarSelectClientes() {
        bd = carregarBD();
        const select = document.getElementById("select-empresa-tec");
        select.innerHTML = '<option value="" disabled selected>Escolha o cliente...</option>';

        bd.empresas.forEach((emp) => {
            const opt = document.createElement("option");
            opt.value = emp.id;
            opt.textContent = emp.nome;
            select.appendChild(opt);
        });
    }

    /* --- CARREGAR PONTOS DO CLIENTE SELECIONADO COM UPLOAD DE FOTOS --- */
    const selectCliente = document.getElementById("select-empresa-tec");
    const blocoChecklist = document.getElementById("bloco-pontos-checklist");
    const containerChecklist = document.getElementById("container-pontos-checklist");
    const blocoAssinatura = document.getElementById("bloco-assinatura");
    const avisoSelecione = document.getElementById("aviso-selecione");
    const btnSalvar = document.getElementById("btn-salvar-inspecao");

    selectCliente.addEventListener("change", () => {
        bd = carregarBD();
        const idCliente = Number(selectCliente.value);
        const cliente = bd.empresas.find(e => e.id === idCliente);

        if (cliente && cliente.pontos.length > 0) {
            containerChecklist.innerHTML = "";

            cliente.pontos.forEach((ponto, index) => {
                const card = document.createElement("div");
                card.className = "card-item-ponto";
                card.id = `card-ponto-${index}`;

                card.innerHTML = `
                    <h5><i class='bx bx-map-pin'></i> <span class="nome-ponto">${ponto}</span></h5>
                    
                    <label style="font-size: 12px; font-weight:600;">Status do Ponto:</label>
                    <select class="status-ponto" required>
                        <option value="Sem Atividade">✅ Sem Atividade (Isca Intacta)</option>
                        <option value="Isca Consumida">⚠️ Isca Consumida (Atividade)</option>
                        <option value="Captura Feita">🚨 Captura Registrada</option>
                        <option value="Reposição Realizada">🔄 Reposição Realizada</option>
                    </select>

                    <input type="text" class="obs-ponto" placeholder="Observações (ex: limpeza, ralo desobstruído...)">

                    <label style="font-size: 12px; font-weight:600; color: #b91c1c;">
                        <i class='bx bx-camera'></i> Foto Obrigatória da Armadilha:
                    </label>
                    <input type="file" accept="image/*" capture="environment" class="input-foto-ponto" required>
                    <img class="foto-ponto-preview" alt="Prévia">
                `;

                // Converte a foto em Base64 para visualização e gravação
                const inputFoto = card.querySelector(".input-foto-ponto");
                const previewFoto = card.querySelector(".foto-ponto-preview");

                inputFoto.addEventListener("change", () => {
                    const arquivo = inputFoto.files[0];
                    if (arquivo) {
                        const leitor = new FileReader();
                        leitor.onload = (e) => {
                            previewFoto.src = e.target.result;
                            previewFoto.style.display = "block";
                        };
                        leitor.readAsDataURL(arquivo);
                    }
                });

                containerChecklist.appendChild(card);
            });

            blocoChecklist.style.display = "block";
            blocoAssinatura.style.display = "block";
            btnSalvar.style.display = "flex";
            avisoSelecione.style.display = "none";
        } else {
            blocoChecklist.style.display = "none";
            blocoAssinatura.style.display = "none";
            btnSalvar.style.display = "none";
            avisoSelecione.style.display = "block";
        }
    });

    /* --- LEITOR REAL DE QR CODE VIA CÂMERA (Html5Qrcode) --- */
    let html5QrCode = null;
    const btnAbrirScanner = document.getElementById("btn-abrir-scanner-qr");
    const btnFecharScanner = document.getElementById("btn-fechar-scanner-qr");
    const containerCameraQr = document.getElementById("camera-qr-container");

    btnAbrirScanner.addEventListener("click", () => {
        containerCameraQr.style.display = "flex";
        html5QrCode = new Html5Qrcode("reader-qr");

        // Inicia a câmera traseira (environment)
        html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: 250 },
            (qrCodeTexto) => {
                // Sucesso ao ler o QR Code
                html5QrCode.stop().then(() => {
                    containerCameraQr.style.display = "none";
                });

                localizarPontoPeloQrCode(qrCodeTexto);
            },
            (mensagemErro) => {
                // Leitura em andamento...
            }
        ).catch((err) => {
            alert("Não foi possível acessar a câmera para ler o QR Code: " + err);
            containerCameraQr.style.display = "none";
        });
    });

    btnFecharScanner.addEventListener("click", () => {
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                containerCameraQr.style.display = "none";
            });
        } else {
            containerCameraQr.style.display = "none";
        }
    });

    function localizarPontoPeloQrCode(textoQr) {
        const idCliente = Number(selectCliente.value);
        const cliente = bd.empresas.find(e => e.id === idCliente);

        if (!cliente) return;

        // Procura se o texto lido no QR Code bate com o nome de algum ponto
        const indexPonto = cliente.pontos.findIndex(p => p.toLowerCase().includes(textoQr.toLowerCase()));

        if (indexPonto !== -1) {
            const elementoPonto = document.getElementById(`card-ponto-${indexPonto}`);
            elementoPonto.scrollIntoView({ behavior: "smooth", block: "center" });
            elementoPonto.classList.add("ponto-destacado");
            setTimeout(() => elementoPonto.classList.remove("ponto-destacado"), 3000);
            alert(`Ponto identificado com sucesso: ${cliente.pontos[indexPonto]}`);
        } else {
            alert(`QR Code "${textoQr}" lido, mas não corresponde aos pontos deste cliente.`);
        }
    }

    /* --- CANVAS DE ASSINATURA DIGITAL --- */
    let canvas, ctx, desenhando = false, assinaturaFeita = false;

    function configurarCanvasAssinatura() {
        canvas = document.getElementById("canvas-assinatura");
        if (!canvas) return;
        ctx = canvas.getContext("2d");
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#000000";

        canvas.addEventListener("mousedown", iniciarTraco);
        canvas.addEventListener("mousemove", desenhar);
        canvas.addEventListener("mouseup", pararTraco);
        canvas.addEventListener("mouseleave", pararTraco);

        canvas.addEventListener("touchstart", (e) => {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent("mousedown", { clientX: touch.clientX, clientY: touch.clientY });
            canvas.dispatchEvent(mouseEvent);
        });

        canvas.addEventListener("touchmove", (e) => {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent("mousemove", { clientX: touch.clientX, clientY: touch.clientY });
            canvas.dispatchEvent(mouseEvent);
        });

        canvas.addEventListener("touchend", () => {
            const mouseEvent = new MouseEvent("mouseup", {});
            canvas.dispatchEvent(mouseEvent);
        });

        document.getElementById("btn-limpar-assinatura").addEventListener("click", () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            assinaturaFeita = false;
        });
    }

    function obterPosicao(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function iniciarTraco(e) {
        desenhando = true;
        assinaturaFeita = true;
        const pos = obterPosicao(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }

    function desenhar(e) {
        if (!desenhando) return;
        const pos = obterPosicao(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }

    function pararTraco() {
        desenhando = false;
    }

    /* --- FINALIZAR INSPEÇÃO E VALIDAR FOTOS E ASSINATURA --- */
    const formInspecao = document.getElementById("form-inspecao-tecnico");

    formInspecao.addEventListener("submit", (e) => {
        e.preventDefault();

        if (!assinaturaFeita) {
            alert("Atenção: A assinatura digital do cliente é obrigatória!");
            return;
        }

        bd = carregarBD();
        const idCliente = Number(selectCliente.value);
        const cliente = bd.empresas.find(e => e.id === idCliente);

        const dataVisita = document.getElementById("data-inspecao-tec").value;
        const [ano, mes, dia] = dataVisita.split("-");
        const dataFormatada = `${dia}/${mes}/${ano}`;

        const dadosQuimicos = {
            produto: document.getElementById("quimico-nome").value,
            ativo: document.getElementById("quimico-ativo").value,
            lote: document.getElementById("quimico-lote").value,
            quantidade: document.getElementById("quimico-qtd").value
        };

        const cardsPontos = containerChecklist.querySelectorAll(".card-item-ponto");
        const avaliacoes = [];
        let todasFotosTiradas = true;

        cardsPontos.forEach((card) => {
            const nomePonto = card.querySelector(".nome-ponto").innerText.trim();
            const status = card.querySelector(".status-ponto").value;
            const obs = card.querySelector(".obs-ponto").value || "Sem observações";
            const previewFoto = card.querySelector(".foto-ponto-preview");

            if (!previewFoto.src || previewFoto.style.display === "none") {
                todasFotosTiradas = false;
            }

            avaliacoes.push({
                ponto: nomePonto,
                status: status,
                obs: obs,
                foto: previewFoto.src || ""
            });
        });

        if (!todasFotosTiradas) {
            alert("Atenção: Tire a foto obrigatória de cada um dos pontos inspecionados!");
            return;
        }

        const novoRelatorio = {
            id: Math.floor(1000 + Math.random() * 9000),
            empresaId: cliente.id,
            empresaNome: cliente.nome,
            tecnicoNome: NOME_TECNICO_ATUAL,
            data: dataFormatada,
            tipo: document.getElementById("tipo-aplicacao-tec").value,
            quimicos: dadosQuimicos,
            avaliacoes: avaliacoes,
            responsavelCliente: document.getElementById("nome-responsavel-cliente").value,
            assinaturaBase64: canvas.toDataURL()
        };

        bd.relatorios.unshift(novoRelatorio);
        salvarBD(bd);

        alert(`Inspeção concluída! Laudo #${novoRelatorio.id} emitido com sucesso.`);
        formInspecao.reset();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        assinaturaFeita = false;

        blocoChecklist.style.display = "none";
        blocoAssinatura.style.display = "none";
        btnSalvar.style.display = "none";
        avisoSelecione.style.display = "block";

        renderizarRelatoriosTecnico();
    });

    /* --- HISTÓRICO DE LAUDOS E VISUALIZAÇÃO NO MODAL --- */
    function renderizarRelatoriosTecnico() {
        bd = carregarBD();
        const tbody = document.getElementById("tabela-relatorios-tec");
        tbody.innerHTML = "";

        bd.relatorios.forEach((rel) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>#${rel.id}</strong></td>
                <td>${rel.empresaNome}</td>
                <td>${rel.data}</td>
                <td>${rel.quimicos ? rel.quimicos.produto : "Padrão"}</td>
                <td>${rel.tecnicoNome}</td>
                <td>
                    <button class="btn-pdf" data-id="${rel.id}">
                        <i class='bx bxs-file-find'></i> Ver Laudo
                    </button>
                </td>
            `;

            tr.querySelector(".btn-pdf").addEventListener("click", () => {
                abrirModalLaudo(rel);
            });

            tbody.appendChild(tr);
        });
    }

    function abrirModalLaudo(rel) {
        const modal = document.getElementById("modal-laudo");
        const container = document.getElementById("conteudo-laudo-renderizado");

        const fotosPontosHtml = rel.avaliacoes.map(a => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                <strong>${a.ponto}:</strong> ${a.status} <br>
                <small>Obs: ${a.obs}</small>
                ${a.foto ? `<br><img src="${a.foto}" style="max-width: 100%; height: 120px; border-radius: 4px; margin-top: 5px; object-fit: cover;">` : ''}
            </div>
        `).join("");

        container.innerHTML = `
            <h2 style="color: var(--tec-azul);">Laudo Técnico #${rel.id}</h2>
            <hr style="margin: 10px 0; border: 0; border-top: 1px solid #eee;">
            <p><strong>Cliente:</strong> ${rel.empresaNome}</p>
            <p><strong>Data:</strong> ${rel.data} | <strong>Técnico:</strong> ${rel.tecnicoNome}</p>
            <p><strong>Aplicação:</strong> ${rel.tipo}</p>
            
            <h4 style="margin-top: 15px; color: var(--tec-azul);">Registro Sanitário do Produto</h4>
            <p style="font-size: 13px;"><strong>Produto:</strong> ${rel.quimicos?.produto || "N/A"} (Lote: ${rel.quimicos?.lote || "N/A"})</p>
            <p style="font-size: 13px;"><strong>Princípio Ativo:</strong> ${rel.quimicos?.ativo || "N/A"} | <strong>Dosagem:</strong> ${rel.quimicos?.quantidade || "N/A"}</p>

            <h4 style="margin-top: 15px; color: var(--tec-azul);">Pontos & Registros Fotográficos</h4>
            ${fotosPontosHtml}

            <h4 style="margin-top: 15px; color: var(--tec-azul);">Assinatura do Responsável</h4>
            <p style="font-size: 13px;">Recebido por: <strong>${rel.responsavelCliente || "Responsável no local"}</strong></p>
            ${rel.assinaturaBase64 ? `<img src="${rel.assinaturaBase64}" style="border: 1px solid #ccc; max-width: 200px; margin-top: 5px;">` : '<em>Sem assinatura gravada</em>'}
        `;

        modal.style.display = "flex";
    }

    document.getElementById("fechar-modal").addEventListener("click", () => {
        document.getElementById("modal-laudo").style.display = "none";
    });
});