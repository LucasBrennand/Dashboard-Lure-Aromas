import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;
const meses = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    name: new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' }),
}));

function InserirVendas() {
    const [quiosques, setQuiosques] = useState([]);
    const [vendas, setVendas] = useState([]);
    const [selectedQuiosque, setSelectedQuiosque] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [totalValue, setTotalValue] = useState('');
    const [pasteValues, setPasteValues] = useState('');
    const [editingKey, setEditingKey] = useState('');
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);

    const carregarDados = async () => {
        setLoading(true);
        try {
            const [quiosquesResponse, vendasResponse] = await Promise.all([
                axios.get(`${apiUrl}/api/quiosques`),
                axios.get(`${apiUrl}/api/vendas-mensais`),
            ]);
            setQuiosques(quiosquesResponse.data);
            setVendas(vendasResponse.data);
            setSelectedQuiosque((current) => current || String(quiosquesResponse.data[0]?.id || ''));
        } catch (error) {
            console.error('Erro ao carregar lançamentos:', error);
            setMessage({ type: 'error', text: 'Falha ao carregar os dados. Tente novamente em alguns instantes.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarDados(); }, []);

    const anos = useMemo(() => Array.from(new Set([
        ...vendas.map((venda) => Number(venda.ano)),
        ...Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i),
    ])).sort((a, b) => b - a), [vendas]);

    const lancamentosDoQuiosque = vendas.filter((venda) => String(venda.quiosque_id) === selectedQuiosque);
    const selecionarLancamento = (value) => {
        setEditingKey(value);
        if (!value) return;
        const venda = vendas.find((item) => `${item.ano}-${item.mes}` === value && String(item.quiosque_id) === selectedQuiosque);
        if (venda) {
            setSelectedYear(Number(venda.ano));
            setSelectedMonth(Number(venda.mes));
            setTotalValue(String(venda.valor_total));
            setMessage({ type: 'success', text: 'Lançamento carregado. Altere o valor e salve para atualizar.' });
        }
    };

    const salvarVenda = async (ano, mes, valor) => axios.post(`${apiUrl}/api/vendas-mensais`, {
        quiosque_id: selectedQuiosque,
        ano,
        mes,
        valor_total: valor,
    });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage(null);
        const valor = Number(String(totalValue).replace(',', '.'));
        if (!selectedQuiosque || !Number.isFinite(valor) || valor < 0) {
            setMessage({ type: 'error', text: 'Selecione um quiosque e informe um valor válido.' });
            return;
        }
        try {
            await salvarVenda(selectedYear, selectedMonth, valor);
            setMessage({ type: 'success', text: 'Lançamento salvo com sucesso. Se o mês já existia, o valor foi atualizado.' });
            await carregarDados();
        } catch (error) {
            console.error('Erro ao salvar venda mensal:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Falha ao salvar os dados.' });
        }
    };

    const importarColagem = async (event) => {
        event.preventDefault();
        setMessage(null);
        const linhas = pasteValues.split(/\r?\n/).map((linha) => linha.trim()).filter(Boolean);
        const registros = linhas.map((linha) => {
            const delimitador = linha.includes('\t') ? '\t' : linha.includes(';') ? ';' : ',';
            const colunas = linha.split(delimitador).map((coluna) => coluna.trim());
            const [ano, mes, valorBruto] = colunas;
            const normalizado = valorBruto?.includes(',')
                ? valorBruto.replace(/\./g, '').replace(',', '.')
                : valorBruto?.replace(/^R\$\s*/i, '').replace(/\s/g, '');
            return { ano: Number(ano), mes: Number(mes), valor: Number(normalizado), colunas: colunas.length };
        });
        if (!selectedQuiosque || !registros.length || registros.some(({ ano, mes, valor }) =>
            !Number.isInteger(ano) || !Number.isInteger(mes) || mes < 1 || mes > 12 || !Number.isFinite(valor) || valor < 0) || registros.some(({ colunas }) => colunas !== 3)) {
            setMessage({ type: 'error', text: 'Confira os dados. Use uma linha por mês no formato: ano, mês, valor (ex.: 2025;3;1250,50).' });
            return;
        }
        try {
            for (const registro of registros) await salvarVenda(registro.ano, registro.mes, registro.valor);
            setPasteValues('');
            setMessage({ type: 'success', text: `${registros.length} lançamento(s) salvo(s) com sucesso.` });
            await carregarDados();
        } catch (error) {
            console.error('Erro ao importar lançamentos colados:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Falha ao salvar os valores colados.' });
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <section className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-6">Lançar ou editar faturamento mensal</h3>
                {loading && <p className="text-sm text-gray-500 mb-4">Carregando quiosques e lançamentos…</p>}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="quiosque" className="block text-sm font-medium text-gray-700">Quiosque</label>
                        <select id="quiosque" value={selectedQuiosque} onChange={(e) => { setSelectedQuiosque(e.target.value); setEditingKey(''); setTotalValue(''); }} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required>
                            <option value="">Selecione um quiosque</option>
                            {quiosques.map((q) => <option key={q.id} value={q.id}>{q.nome}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="editar-lancamento" className="block text-sm font-medium text-gray-700">Carregar mês existente para editar</label>
                        <select id="editar-lancamento" value={editingKey} onChange={(e) => selecionarLancamento(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                            <option value="">Novo lançamento</option>
                            {lancamentosDoQuiosque.map((venda) => <option key={`${venda.ano}-${venda.mes}`} value={`${venda.ano}-${venda.mes}`}>{meses[venda.mes - 1]?.name} de {venda.ano} — R$ {Number(venda.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</option>)}
                        </select>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="ano" className="block text-sm font-medium text-gray-700">Ano</label>
                                <select id="ano" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                    {anos.map((ano) => <option key={ano} value={ano}>{ano}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="mes" className="block text-sm font-medium text-gray-700">Mês</label>
                                <select id="mes" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                    {meses.map((mes) => <option key={mes.value} value={mes.value}>{mes.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="valor_total" className="block text-sm font-medium text-gray-700">Valor total vendido (R$)</label>
                            <input type="number" id="valor_total" min="0" step="0.01" value={totalValue} onChange={(e) => setTotalValue(e.target.value)} placeholder="Ex.: 25912,50" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <button type="submit" disabled={loading || !selectedQuiosque} className="w-full py-3 px-4 rounded-md text-white font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50">Salvar lançamento</button>
                    </form>
                </div>
                {message && <div role="status" className={`mt-4 p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}
            </section>

            <section className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Colar vários valores</h3>
                <p className="text-sm text-gray-600 mb-3">Copie do Excel ou Sheets e cole uma linha por mês com as colunas <strong>ano, mês e valor</strong>. Pode separar por tabulação, ponto e vírgula ou vírgula. Com vírgula decimal, use tabulação ou ponto e vírgula entre as colunas.</p>
                <form onSubmit={importarColagem} className="space-y-3">
                    <textarea value={pasteValues} onChange={(e) => setPasteValues(e.target.value)} rows={5} placeholder={'2025\t1\t1250,50\n2025\t2\t1780,00'} className="w-full p-3 border border-gray-300 rounded-md font-mono text-sm" />
                    <button type="submit" disabled={loading || !selectedQuiosque || !pasteValues.trim()} className="py-2 px-4 rounded-md text-white font-medium bg-[#8f6628] hover:bg-[#7a5521] disabled:opacity-50">Importar valores colados</button>
                </form>
            </section>
        </div>
    );
}

export default InserirVendas;
