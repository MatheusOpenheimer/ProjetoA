/* ==========================================================================
   BANCO DE DADOS LOCAL (STORAGE)
   Permite compartilhar dados entre as telas de Admin e Técnico
   ========================================================================== */
const BD_PADRAO = {
    empresas: [
        {
            id: 1,
            nome: "Supermercado Central",
            doc: "01.888.999/0001-11",
            endereco: "Av. Paulista, 1000",
            contato: "(11) 3222-1111",
            pontos: ["P01 - Depósito Principal", "P02 - Área de Hortifrúti", "P03 - Ralo Cozinha"]
        },
        {
            id: 2,
            nome: "Padaria Trigo de Ouro",
            doc: "22.333.444/0001-55",
            endereco: "Rua das Flores, 45",
            contato: "(11) 98888-7777",
            pontos: ["P01 - Área de Fornos", "P02 - Depósito de Farinha"]
        }
    ],
    tecnicos: [
        { id: 1, nome: "Carlos Mendes", cpf: "111.222.333-44", especialidade: "Descupinização" },
        { id: 2, nome: "Ana Paula Lima", cpf: "222.333.444-55", especialidade: "Dedetização Geral" }
    ],
    relatorios: [
        {
            id: 1081,
            empresaId: 1,
            empresaNome: "Supermercado Central",
            tecnicoNome: "Carlos Mendes",
            data: "10/08/2026",
            tipo: "Monitoramento Preventivo",
            avaliacoes: [
                { ponto: "P01 - Depósito Principal", status: "Sem Atividade", obs: "Isca intacta" },
                { ponto: "P02 - Área de Hortifrúti", status: "Isca Consumida", obs: "Reposição feita" },
                { ponto: "P03 - Ralo Cozinha", status: "Sem Atividade", obs: "Ok" }
            ]
        },
        {
            id: 1082,
            empresaId: 2,
            empresaNome: "Padaria Trigo de Ouro",
            tecnicoNome: "Ana Paula Lima",
            data: "12/08/2026",
            tipo: "Aplicação Química",
            avaliacoes: [
                { ponto: "P01 - Área de Fornos", status: "Sem Atividade", obs: "Sem pragas" },
                { ponto: "P02 - Depósito de Farinha", status: "Sem Atividade", obs: "Limpo" }
            ]
        }
    ]
};

// Carrega dados existentes ou inicializa com os dados padrão
function carregarBD() {
    const dadosSalvos = localStorage.getItem("sistema_dedetizacao_bd");
    if (!dadosSalvos) {
        localStorage.setItem("sistema_dedetizacao_bd", JSON.stringify(BD_PADRAO));
        return BD_PADRAO;
    }
    return JSON.parse(dadosSalvos);
}

function salvarBD(dados) {
    localStorage.setItem("sistema_dedetizacao_bd", JSON.stringify(dados));
}