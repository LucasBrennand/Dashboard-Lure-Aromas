// backend/index.js

// --- IMPORTAÇÕES DE BIBLIOTECAS ---
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const Papa = require('papaparse');

// --- CONFIGURAÇÃO INICIAL ---
const supabaseUrl = 'https://zyqnfpehqjegblfutrdb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5cW5mcGVocWplZ2JsZnV0cmRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzg2OTIwNywiZXhwIjoyMDczNDQ1MjA3fQ.YT3rZdNNSWY8h7FRiZYkJ_XDSoWGaQCHum8y0tnoBjM';
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = 3001;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- ROTAS DA APLICAÇÃO ---

/**
 * ROTA PARA LISTAR E PESQUISAR PRODUTOS DIRETAMENTE DO ARQUIVO produtos.csv
 */
app.get('/api/produtos', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = (req.query.search || '').toLowerCase();
    const startIndex = (page - 1) * limit;

    try {
        const arquivoCsv = fs.readFileSync('./produtos.csv', 'utf8');
        Papa.parse(arquivoCsv, {
            header: true,
            delimiter: ";",
            transformHeader: header => header.trim().replace(/^\uFEFF/, ''),
            complete: (results) => {
                let produtos = results.data;

                // Filtra os produtos se houver um termo de busca
                if (search) {
                    produtos = produtos.filter(p =>
                        (p.descricao && p.descricao.toLowerCase().includes(search)) ||
                        (p.codigo_sku && p.codigo_sku.toLowerCase().includes(search))
                    );
                }

                // Pega o total de itens após o filtro para calcular a paginação
                const totalItems = produtos.length;
                const totalPages = Math.ceil(totalItems / limit);

                // Aplica a paginação
                const paginatedProducts = produtos.slice(startIndex, startIndex + limit);
                
                // Formata os dados para o mesmo formato de antes
                const formattedProducts = paginatedProducts.map(p => ({
                    id: p.ID, // Usa o ID do CSV
                    codigo_sku: p.codigo_sku,
                    descricao: p.descricao,
                    preco_padrao: parseFloat(String(p.preco_padrao).replace(',', '.')) || 0
                }));

                res.json({
                    totalItems: totalItems,
                    totalPages: totalPages,
                    currentPage: page,
                    products: formattedProducts
                });
            }
        });
    } catch (error) {
        console.error("Erro ao ler ou processar produtos.csv:", error);
        res.status(500).json({ message: "Não foi possível carregar os produtos do arquivo." });
    }
});


// --- ROTAS QUE AINDA USAM O BANCO DE DADOS ---

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === '1234') {
        res.status(200).json({ success: true, message: 'Login bem-sucedido!' });
    } else {
        res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
    }
});

app.get('/api/quiosques', async (req, res) => {
    try {
        const { data, error } = await supabase.from('quiosques').select('id, nome').order('nome', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar quiosques." });
    }
});

app.post('/api/vendas-mensais', async (req, res) => {
    const { quiosque_id, ano, mes, valor_total } = req.body;
    try {
        const { data, error } = await supabase.from('vendas_mensais').upsert({ quiosque_id, ano, mes, valor_total }, { onConflict: 'quiosque_id, ano, mes' }).select();
        if (error) throw error;
        res.status(200).json({ message: "Venda mensal salva com sucesso!", data });
    } catch (error) {
        res.status(500).json({ message: "Erro ao salvar os dados no banco.", error });
    }
});

app.get('/api/relatorio-vendas', async (req, res) => {
    try {
        const { data, error } = await supabase.from('vendas_mensais').select(`ano, mes, valor_total, quiosques(nome)`);
        if (error) throw error;
        // Lógica de cálculo de KPIs e formatação de dados...
        // ... (o código completo desta parte continua o mesmo)
        res.json({ /* ... estrutura de kpis e chartData ... */ });
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar dados para o relatório." });
    }
});

// A rota de importação ainda pode ser útil no futuro, então a mantemos
app.post('/api/importar-produtos', async (req, res) => {
    // ... (código de importação)
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
});