import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const nomesMeses = Array.from({ length: 12 }, (_, index) =>
    new Date(2000, index, 1).toLocaleString('pt-BR', { month: 'long' }));
const formatCurrency = (value) => `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const KpiCard = ({ title, value, subtext }) => (
    <div className="bg-white p-4 rounded-lg shadow">
        <h4 className="text-sm font-medium text-gray-500">{title}</h4>
        <p className="text-2xl font-bold text-[#7a5521]">{value}</p>
        {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
    </div>
);

function SalesReport() {
    const [dados, setDados] = useState({});
    const [anosDisponiveis, setAnosDisponiveis] = useState([]);
    const [anoSelecionado, setAnoSelecionado] = useState('');
    const [mesSelecionado, setMesSelecionado] = useState('todos');
    const [isLoading, setIsLoading] = useState(true);
    const [erro, setErro] = useState('');
    const [mensagemCopia, setMensagemCopia] = useState('');

    useEffect(() => {
        const carregarRelatorio = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/relatorio-vendas`, { timeout: 30000 });
                const chartData = response.data?.chartData || {};
                const anos = [...new Set(Object.values(chartData).flatMap((porMes) =>
                    Object.keys(porMes).map((mesAno) => mesAno.slice(0, 4))))].sort().reverse();
                setDados(chartData);
                setAnosDisponiveis(anos);
                setAnoSelecionado(anos[0] || '');
            } catch (error) {
                console.error('Erro ao buscar dados do relatório:', error);
                setErro('Não foi possível carregar o relatório. Se o servidor estava inativo, tente novamente em alguns instantes.');
            } finally {
                setIsLoading(false);
            }
        };
        carregarRelatorio();
    }, []);

    const quiosques = Object.keys(dados).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const mesesDoAno = useMemo(() => [...new Set(quiosques.flatMap((quiosque) =>
        Object.keys(dados[quiosque]).filter((mesAno) => mesAno.startsWith(`${anoSelecionado}-`))))].sort(), [dados, anoSelecionado, quiosques]);
    const mesesFiltrados = mesSelecionado === 'todos'
        ? mesesDoAno
        : mesesDoAno.filter((mesAno) => mesAno.endsWith(`-${mesSelecionado}`));

    const totaisPorQuiosque = quiosques.map((quiosque) => ({
        nome: quiosque,
        valor: mesesFiltrados.reduce((total, mesAno) => total + Number(dados[quiosque][mesAno] || 0), 0),
    }));
    const total = totaisPorQuiosque.reduce((sum, quiosque) => sum + quiosque.valor, 0);
    const melhorMes = mesesFiltrados.reduce((melhor, mesAno) => {
        const valor = quiosques.reduce((sum, quiosque) => sum + Number(dados[quiosque][mesAno] || 0), 0);
        return valor > melhor.valor ? { mesAno, valor } : melhor;
    }, { mesAno: '', valor: -1 });
    const quiosqueDestaque = totaisPorQuiosque.reduce((melhor, atual) => atual.valor > melhor.valor ? atual : melhor, { nome: '—', valor: -1 });

    const chartData = {
        labels: mesesFiltrados.map((mesAno) => nomesMeses[Number(mesAno.slice(5, 7)) - 1]),
        datasets: quiosques.map((quiosque, index) => ({
            label: quiosque,
            data: mesesFiltrados.map((mesAno) => dados[quiosque][mesAno] || 0),
            backgroundColor: ['#ab2816', '#49d6d1', '#0e9107', '#8f6628', '#7355aa'][index % 5],
        })),
    };

    const copiarRelatorio = async () => {
        const linhas = [
            ['Quiosque', ...mesesFiltrados.map((mesAno) => `${nomesMeses[Number(mesAno.slice(5, 7)) - 1]} ${anoSelecionado}`), 'Total'],
            ...quiosques.map((quiosque) => [
                quiosque,
                ...mesesFiltrados.map((mesAno) => Number(dados[quiosque][mesAno] || 0).toFixed(2).replace('.', ',')),
                totaisPorQuiosque.find((item) => item.nome === quiosque).valor.toFixed(2).replace('.', ','),
            ]),
        ];
        try {
            await navigator.clipboard.writeText(linhas.map((linha) => linha.join('\t')).join('\n'));
            setMensagemCopia('Relatório copiado. Você pode colar no Excel ou Sheets.');
        } catch {
            setMensagemCopia('Não foi possível copiar. Verifique a permissão da área de transferência no navegador.');
        }
    };

    if (isLoading) return <p className="text-center text-gray-500">Carregando dados do relatório…</p>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-xl font-semibold text-[#7a5521]">Relatório de Faturamento</h3>
                <div className="flex flex-wrap gap-3">
                    <label className="text-sm font-medium text-gray-700">Ano:
                        <select value={anoSelecionado} onChange={(e) => setAnoSelecionado(e.target.value)} className="ml-2 p-2 border bg-white border-gray-300 rounded-md" disabled={!anosDisponiveis.length}>
                            {anosDisponiveis.map((ano) => <option key={ano} value={ano}>{ano}</option>)}
                        </select>
                    </label>
                    <label className="text-sm font-medium text-gray-700">Mês:
                        <select value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)} className="ml-2 p-2 border bg-white border-gray-300 rounded-md">
                            <option value="todos">Todos os meses</option>
                            {mesesDoAno.map((mesAno) => {
                                const mes = Number(mesAno.slice(5, 7));
                                return <option key={mesAno} value={String(mes).padStart(2, '0')}>{nomesMeses[mes - 1]}</option>;
                            })}
                        </select>
                    </label>
                </div>
            </div>

            {erro && <div role="alert" className="bg-red-100 text-red-800 p-4 rounded-md">{erro}</div>}
            {mesesFiltrados.length > 0 ? <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard title={mesSelecionado === 'todos' ? 'Faturamento no período' : 'Faturamento no mês'} value={formatCurrency(total)} />
                    <KpiCard title="Média mensal no período" value={formatCurrency(total / mesesFiltrados.length)} />
                    <KpiCard title="Melhor mês" value={mesSelecionado === 'todos' && melhorMes.mesAno ? nomesMeses[Number(melhorMes.mesAno.slice(5, 7)) - 1] : nomesMeses[Number(mesSelecionado) - 1]} subtext={formatCurrency(melhorMes.valor)} />
                    <KpiCard title="Quiosque destaque" value={quiosqueDestaque.nome} subtext={formatCurrency(quiosqueDestaque.valor)} />
                </div>
                <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                    <div className="relative min-h-[400px]">
                        <Bar data={chartData} options={{
                            maintainAspectRatio: false,
                            responsive: true,
                            plugins: { title: { display: true, text: `Comparativo de Vendas - ${anoSelecionado}` } },
                            scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: (value) => `R$ ${Number(value).toLocaleString('pt-BR')}` } } },
                        }} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                    <div className="flex justify-between items-center gap-4 mb-3">
                        <h4 className="font-semibold text-[#7a5521]">Valores do período</h4>
                        <button type="button" onClick={copiarRelatorio} className="px-3 py-2 rounded-md text-white bg-[#8f6628] hover:bg-[#7a5521]">Copiar para Excel/Sheets</button>
                    </div>
                    {mensagemCopia && <p role="status" className="text-sm text-gray-600 mb-2">{mensagemCopia}</p>}
                    <table className="w-full text-sm text-left border-collapse">
                        <thead><tr><th className="p-2 border">Quiosque</th>{mesesFiltrados.map((mesAno) => <th key={mesAno} className="p-2 border capitalize">{nomesMeses[Number(mesAno.slice(5, 7)) - 1]}</th>)}<th className="p-2 border">Total</th></tr></thead>
                        <tbody>{quiosques.map((quiosque) => <tr key={quiosque}><th className="p-2 border">{quiosque}</th>{mesesFiltrados.map((mesAno) => <td key={mesAno} className="p-2 border">{formatCurrency(dados[quiosque][mesAno])}</td>)}<td className="p-2 border font-semibold">{formatCurrency(totaisPorQuiosque.find((item) => item.nome === quiosque).valor)}</td></tr>)}</tbody>
                    </table>
                </div>
            </> : <div className="text-center bg-white p-6 rounded-lg shadow-md text-gray-500">Nenhum dado de venda encontrado para esse filtro.</div>}
        </div>
    );
}

export default SalesReport;
