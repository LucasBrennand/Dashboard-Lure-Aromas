// backend/index.js

// --- IMPORTAÇÕES DE BIBLIOTECAS ---
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const xlsx = require('xlsx'); // <-- A linha que estava faltando foi adicionada aqui
const multer = require('multer');
const Papa = require('papaparse');

// --- CONFIGURAÇÃO INICIAL ---
// Suas credenciais do Supabase. Lembre-se que a chave 'supabaseKey' é secreta.
const supabaseUrl = 'https://zyqnfpehqjegblfutrdb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5cW5mcGVocWplZ2JsZnV0cmRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzg2OTIwNywiZXhwIjoyMDczNDQ1MjA3fQ.YT3rZdNNSWY8h7FRiZYkJ_XDSoWGaQCHum8y0tnoBjM';
const supabase = createClient(supabaseUrl, supabaseKey);

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
            .order('nome', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error("Erro ao buscar quiosques:", error);
        res.status(500).json({ message: "Erro ao buscar quiosques." });
    }
});

/**
 * ROTA PARA INSERIR OU ATUALIZAR UMA VENDA MENSAL
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
        res.status(500).json({ message: "Erro ao salvar os dados no banco.", error });
    }
});

/**
 * ROTA PARA BUSCAR E CONSOLIDAR OS DADOS DE VENDAS MENSAIS PARA O GRÁFICO
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

        // Lógica para calcular KPIs
        const faturamentoPorAno = {};
        const faturamentoPorQuiosqueAno = {};
        const faturamentoPorMesAno = {};

        data.forEach(venda => {
            const ano = venda.ano.toString();
            const nomeQuiosque = venda.quiosques.nome;

            if (!faturamentoPorAno[ano]) faturamentoPorAno[ano] = 0;
            if (!faturamentoPorQuiosqueAno[ano]) faturamentoPorQuiosqueAno[ano] = {};
            if (!faturamentoPorQuiosqueAno[ano][nomeQuiosque]) faturamentoPorQuiosqueAno[ano][nomeQuiosque] = 0;
            if (!faturamentoPorMesAno[ano]) faturamentoPorMesAno[ano] = {};
            
            const mesNome = new Date(ano, venda.mes - 1).toLocaleString('pt-BR', { month: 'long' });
            if (!faturamentoPorMesAno[ano][mesNome]) faturamentoPorMesAno[ano][mesNome] = 0;

            faturamentoPorAno[ano] += venda.valor_total;
            faturamentoPorQuiosqueAno[ano][nomeQuiosque] += venda.valor_total;
            faturamentoPorMesAno[ano][mesNome] += venda.valor_total;
        });

        const kpis = {};
        for (const ano in faturamentoPorAno) {
            const quiosquesDoAno = faturamentoPorQuiosqueAno[ano];
            const quiosqueDestaque = Object.keys(quiosquesDoAno).length > 0 ? Object.keys(quiosquesDoAno).reduce((a, b) => quiosquesDoAno[a] > quiosquesDoAno[b] ? a : b) : "N/A";
            
            const mesesDoAno = faturamentoPorMesAno[ano];
            const melhorMes = Object.keys(mesesDoAno).length > 0 ? Object.keys(mesesDoAno).reduce((a, b) => mesesDoAno[a] > mesesDoAno[b] ? a : b) : "N/A";

            kpis[ano] = {
                faturamentoTotal: faturamentoPorAno[ano],
                mediaMensal: faturamentoPorAno[ano] / Object.keys(mesesDoAno).length,
                melhorMes: { nome: melhorMes, valor: mesesDoAno[melhorMes] || 0 },
                quiosqueDestaque: { nome: quiosqueDestaque, valor: quiosquesDoAno[quiosqueDestaque] || 0 }
            };
        }

        // Lógica para formatar dados para o gráfico
        const dadosProcessados = {};
        data.forEach(venda => {
            const nomeQuiosque = venda.quiosques.nome;
            const mesAno = `${venda.ano}-${String(venda.mes).padStart(2, '0')}`;
            if (!dadosProcessados[nomeQuiosque]) dadosProcessados[nomeQuiosque] = {};
            dadosProcessados[nomeQuiosque][mesAno] = venda.valor_total;
        });

        res.json({ chartData: dadosProcessados, kpis });

    } catch (error) {
        console.error("Erro ao gerar relatório de vendas:", error);
        res.status(500).json({ message: "Erro ao buscar dados para o relatório." });
    }
});


/**
 * ROTA PARA LISTAR E PESQUISAR PRODUTOS DIRETAMENTE DO BANCO DE DADOS
 */
app.get('/api/produtos', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const startIndex = (page - 1) * limit;

    try {
        let query = supabase
            .from('produtos')
            .select('*', { count: 'exact' })
            .order('descricao', { ascending: true })
            .range(startIndex, startIndex + limit - 1);

        if (search) {
            query = query.or(`descricao.ilike.%${search}%,codigo_sku.ilike.%${search}%`);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            products: data
        });

    } catch (error) {
        console.error("Erro ao listar produtos:", error);
        res.status(500).json({ message: "Erro ao buscar produtos no banco de dados." });
    }
});

/**
 * ROTA PARA EXPORTAR TODOS OS PRODUTOS PARA UMA PLANILHA XLSX
 * URL: /api/produtos/exportar
 */
app.get('/api/produtos/exportar', async (req, res) => {
    try {
        // Busca TODOS os produtos no banco, sem limite de paginação
        const { data, error } = await supabase
            .from('produtos')
            .select('codigo_sku, descricao, preco_padrao')
            .order('descricao', { ascending: true });

        if (error) throw error;

        // Prepara os dados para a planilha
        const cabecalho = ['Código', 'Descrição', 'Preço Padrão'];
        const dadosParaPlanilha = data.map(p => ({
            'Código': p.codigo_sku,
            'Descrição': p.descricao,
            'Preço Padrão': p.preco_padrao
        }));

        // Cria a planilha em memória
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(dadosParaPlanilha, { header: cabecalho });
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Produtos');
        
        const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        // Envia o arquivo para download
        res.setHeader('Content-Disposition', 'attachment; filename="catalogo_produtos.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        console.error("Erro ao exportar produtos:", error);
        res.status(500).json({ message: "Ocorreu um erro ao gerar a planilha de produtos." });
    }
});


// --- ROTAS DE ADMINISTRAÇÃO / CARGA INICIAL ---

/**
 * ROTA PARA IMPORTAÇÃO INICIAL DE PRODUTOS DO CSV
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
                console.log('Cabeçalhos detectados:', results.meta.fields);
                
                const produtosParaInserir = results.data
                    .filter(p => p.codigo_sku && p.descricao && p.preco_padrao)
                    .map(produto => ({
                        codigo_sku: produto.codigo_sku.trim(),
                        descricao: produto.descricao.trim(),
                        preco_padrao: parseFloat(String(produto.preco_padrao).replace(',', '.')) || 0
                    }));
                
                if (produtosParaInserir.length === 0) {
                    return res.status(400).json({ message: "Nenhum produto válido foi encontrado no arquivo CSV." });
                }

                console.log(`Encontrados ${produtosParaInserir.length} produtos para inserir.`);
                try {
                    const { data, error } = await supabase.from('produtos').insert(produtosParaInserir).select();
                    if (error) throw error;
                    res.status(200).json({ message: `${data.length} produtos foram importados com sucesso!` });
                } catch (dbError) {
                    console.error("Erro do Supabase:", dbError);
                    res.status(500).json({ message: "Erro ao inserir produtos no banco.", error: dbError.message });
                }
            }
        });
    } catch (fileError) {
        console.error("Erro ao ler arquivo:", fileError);
        res.status(500).json({ message: "Não foi possível ler o arquivo produtos.csv no backend." });
    }
});

/**
 * ROTA PARA ADICIONAR UM NOVO PRODUTO
 * URL: /api/produtos
 * Método: POST
 */
app.post('/api/produtos', async (req, res) => {
    const { codigo_sku, descricao, preco_padrao } = req.body;

    // Validação básica dos dados recebidos
    if (!codigo_sku || !descricao || preco_padrao === undefined) {
        return res.status(400).json({ message: "Dados do produto incompletos. Código, descrição e preço são obrigatórios." });
    }

    try {
        // Usa o cliente Supabase para inserir a nova linha na tabela 'produtos'
        const { data, error } = await supabase
            .from('produtos')
            .insert([
                {
                    codigo_sku: codigo_sku,
                    descricao: descricao,
                    preco_padrao: preco_padrao
                }
            ])
            .select() // Retorna o produto que foi criado
            .single(); // Garante que o resultado seja um único objeto, não um array

        if (error) {
            // Verifica se o erro é de duplicata (baseado na regra UNIQUE que criamos)
            if (error.code === '23505') { // Código de erro padrão para violação de unicidade
                return res.status(409).json({ message: `O código SKU '${codigo_sku}' já existe. Por favor, use um código diferente.` });
            }
            throw error;
        }

        res.status(201).json({ message: "Produto adicionado com sucesso!", product: data });

    } catch (error) {
        console.error("Erro ao adicionar produto:", error);
        res.status(500).json({ message: "Erro ao salvar o produto no banco de dados.", error: error.message });
    }
});

/**
 * ROTA PARA ATUALIZAR UM PRODUTO EXISTENTE
 * URL: /api/produtos/:id
 * Método: PUT
 */
app.put('/api/produtos/:id', async (req, res) => {
    const { id } = req.params; // Pega o ID do produto da URL
    const { codigo_sku, descricao, preco_padrao } = req.body;

    // Validação
    if (!codigo_sku || !descricao || preco_padrao === undefined) {
        return res.status(400).json({ message: "Dados do produto incompletos." });
    }

    try {
        const { data, error } = await supabase
            .from('produtos')
            .update({
                codigo_sku: codigo_sku,
                descricao: descricao,
                preco_padrao: preco_padrao
            })
            .eq('id', id) // A condição: atualize ONDE o id for igual ao recebido
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: "Produto não encontrado." });

        res.status(200).json({ message: "Produto atualizado com sucesso!", product: data });

    } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        res.status(500).json({ message: "Erro ao atualizar o produto.", error: error.message });
    }
});

/**
 * ROTA PARA EXCLUIR UM PRODUTO
 * URL: /api/produtos/:id
 * Método: DELETE
 */
app.delete('/api/produtos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('produtos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.status(200).json({ message: "Produto excluído com sucesso!" });

    } catch (error) {
        console.error("Erro ao excluir produto:", error);
        res.status(500).json({ message: "Erro ao excluir o produto.", error: error.message });
    }
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
});