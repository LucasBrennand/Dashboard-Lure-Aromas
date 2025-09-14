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