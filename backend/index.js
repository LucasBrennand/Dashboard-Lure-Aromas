// backend/index.js

// --- IMPORTAÇÕES DE BIBLIOTECAS ---
const express = require('express');
const cors = require('cors');
const xlsx = require('xlsx');
const multer = require('multer');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const Papa = require('papaparse');

// --- CONFIGURAÇÃO INICIAL ---
// Suas credenciais do Supabase.
const supabaseUrl = 'https://zyqnfpehqjegblfutrdb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5cW5mcGVocWplZ2JsZnV0cmRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzg2OTIwNywiZXhwIjoyMDczNDQ1MjA3fQ.YT3rZdNNSWY8h7FRiZYkJ_XDSoWGaQCHum8y0tnoBjM';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configura o multer para lidar com uploads de arquivos
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const PORT = 3001;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- ROTAS DA APLICAÇÃO (BASEADAS NO BANCO DE DADOS) ---

/**
 * ROTA DE LOGIN
 */
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    console.log(`Tentativa de login com usuário: ${username}`);
    if (username === 'admin' && password === '1234') {
        res.status(200).json({ success: true, message: 'Login bem-sucedido!' });
    } else {
        res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
    }
});

/**
 * ROTA PARA BUSCAR TODOS OS QUIOSQUES CADASTRADOS
 */
app.get('/api/quiosques', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('quiosques')
            .select('id, nome')
            .order('nome', { ascending: true }); // Ordena por nome

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error("Erro ao buscar quiosques:", error);
        res.status(500).json({ message: "Erro ao buscar quiosques." });
    }
});

/**
 * ROTA PARA INSERIR OU ATUALIZAR UMA VENDA MENSAL (UPSERT)
 */
app.post('/api/vendas-mensais', async (req, res) => {
    const { quiosque_id, ano, mes, valor_total } = req.body;

    if (!quiosque_id || !ano || !mes || valor_total === undefined) {
        return res.status(400).json({ message: "Dados incompletos. Todos os campos são obrigatórios." });
    }

    try {
        const { data, error } = await supabase
            .from('vendas_mensais')
            .upsert({
                quiosque_id: quiosque_id,
                ano: ano,
                mes: mes,
                valor_total: valor_total
            }, {
                onConflict: 'quiosque_id, ano, mes'
            })
            .select();

        if (error) throw error;

        res.status(200).json({ message: "Venda mensal salva com sucesso!", data });
    } catch (error) {
        console.error("Erro ao salvar venda mensal:", error);
        res.status(500).json({ message: "Erro ao salvar os dados no banco.", error: error.message });
    }
});


/**
 * ROTA PARA PESQUISAR PRODUTOS DIRETAMENTE NO BANCO DE DADOS
 */
app.get('/api/produtos/pesquisar', async (req, res) => {
    const { query } = req.query;
    if (!query || query.length < 2) {
        return res.json([]);
    }
    try {
        const { data, error } = await supabase
            .from('produtos')
            .select('id, codigo_sku, descricao, preco_padrao')
            .or(`descricao.ilike.%${query}%,codigo_sku.ilike.%${query}%`)
            .limit(10);
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error("Erro ao pesquisar produtos:", error);
        res.status(500).json({ message: "Erro ao buscar produtos no banco de dados.", error: error.message });
    }
});

/**
 * ROTA PARA BUSCAR E CONSOLIDAR DADOS DE VENDAS, INCLUINDO KPIs
 * URL: /api/relatorio-vendas
 */
app.get('/api/relatorio-vendas', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('vendas_mensais')
            .select(`
                ano,
                mes,
                valor_total,
                quiosques ( nome )
            `);

        if (error) throw error;

        // --- Lógica para calcular os KPIs ---
        const faturamentoPorAno = {};
        const faturamentoPorQuiosqueAno = {};
        const faturamentoPorMesAno = {};

        data.forEach(venda => {
            const ano = venda.ano.toString();
            const nomeQuiosque = venda.quiosques.nome;

            // Inicializa estruturas se não existirem
            if (!faturamentoPorAno[ano]) faturamentoPorAno[ano] = 0;
            if (!faturamentoPorQuiosqueAno[ano]) faturamentoPorQuiosqueAno[ano] = {};
            if (!faturamentoPorQuiosqueAno[ano][nomeQuiosque]) faturamentoPorQuiosqueAno[ano][nomeQuiosque] = 0;
            if (!faturamentoPorMesAno[ano]) faturamentoPorMesAno[ano] = {};
            
            const mesNome = new Date(ano, venda.mes - 1).toLocaleString('pt-BR', { month: 'long' });
            if (!faturamentoPorMesAno[ano][mesNome]) faturamentoPorMesAno[ano][mesNome] = 0;

            // Soma os valores
            faturamentoPorAno[ano] += venda.valor_total;
            faturamentoPorQuiosqueAno[ano][nomeQuiosque] += venda.valor_total;
            faturamentoPorMesAno[ano][mesNome] += venda.valor_total;
        });

        const kpis = {};
        for (const ano in faturamentoPorAno) {
            // Quiosque destaque do ano
            const quiosquesDoAno = faturamentoPorQuiosqueAno[ano];
            const quiosqueDestaque = Object.keys(quiosquesDoAno).reduce((a, b) => quiosquesDoAno[a] > quiosquesDoAno[b] ? a : b);
            
            // Melhor mês do ano
            const mesesDoAno = faturamentoPorMesAno[ano];
            const melhorMes = Object.keys(mesesDoAno).reduce((a, b) => mesesDoAno[a] > mesesDoAno[b] ? a : b);

            kpis[ano] = {
                faturamentoTotal: faturamentoPorAno[ano],
                mediaMensal: faturamentoPorAno[ano] / Object.keys(mesesDoAno).length,
                melhorMes: { nome: melhorMes, valor: mesesDoAno[melhorMes] },
                quiosqueDestaque: { nome: quiosqueDestaque, valor: quiosquesDoAno[quiosqueDestaque] }
            };
        }

        // --- Lógica para formatar dados para o gráfico (a mesma de antes) ---
        const dadosProcessados = {};
        data.forEach(venda => {
            const nomeQuiosque = venda.quiosques.nome;
            const mesAno = `${venda.ano}-${String(venda.mes).padStart(2, '0')}`;
            if (!dadosProcessados[nomeQuiosque]) dadosProcessados[nomeQuiosque] = {};
            dadosProcessados[nomeQuiosque][mesAno] = venda.valor_total;
        });

        // Retorna tanto os dados para o gráfico quanto os KPIs calculados
        res.json({ chartData: dadosProcessados, kpis });

    } catch (error) {
        console.error("Erro ao gerar relatório de vendas:", error);
        res.status(500).json({ message: "Erro ao buscar dados para o relatório." });
    }
});


// --- ROTAS DE ADMINISTRAÇÃO / CARGA INICIAL ---

/**
 * ROTA PARA IMPORTAÇÃO INICIAL DE PRODUTOS DO CSV PARA O BANCO DE DADOS
 */
app.post('/api/importar-produtos', async (req, res) => {
    console.log("Iniciando importação de produtos...");
    try {
        const arquivoCsv = fs.readFileSync('./produtos.csv', 'utf8');
        Papa.parse(arquivoCsv, {
            header: true,
            delimiter: ";",
            transformHeader: header => header.trim().replace(/^\uFEFF/, ''),
            complete: async (results) => {
                const produtosParaInserir = results.data
                    .filter(p => p.Código && p.Descrição && p.Preço)
                    .map(produto => ({
                        codigo_sku: produto.Código.trim(),
                        descricao: produto.Descrição.trim(),
                        preco_padrao: parseFloat(String(produto.Preço).replace(',', '.')) || 0
                    }));
                
                if (produtosParaInserir.length === 0) {
                    return res.status(400).json({ message: "Nenhum produto válido foi encontrado no arquivo CSV." });
                }

                try {
                    const { data, error } = await supabase.from('produtos').insert(produtosParaInserir).select();
                    if (error) throw error;
                    res.status(200).json({ message: `${data.length} produtos foram importados com sucesso!` });
                } catch (dbError) {
                    res.status(500).json({ message: "Erro ao inserir produtos no banco.", error: dbError.message });
                }
            }
        });
    } catch (fileError) {
        res.status(500).json({ message: "Não foi possível ler o arquivo produtos.csv no backend." });
    }
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
});