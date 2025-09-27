// frontend/src/SalesReport.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Componente para um cartão de KPI
const KpiCard = ({ title, value, subtext }) => (
    <div className="bg-white p-4 rounded-lg shadow">
        <h4 className="text-sm font-medium text-gray-500">{title}</h4>
        <p className="text-2xl font-bold text-[#7a5521]">{value}</p>
        {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
    </div>
);

function SalesReport() {
    // Estados
    const [dadosCompletos, setDadosCompletos] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [anosDisponiveis, setAnosDisponiveis] = useState([]);
    const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear().toString());
    const [isLoading, setIsLoading] = useState(true); // Adicionado estado de loading

    useEffect(() => {
        const fetchReportData = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/relatorio-vendas`);

                // ##### CORREÇÃO APLICADA AQUI #####
                // Verificamos se a resposta e os dados essenciais existem
                if (response.data && response.data.chartData && response.data.kpis) {
                    setDadosCompletos(response.data.chartData);
                    setKpis(response.data.kpis);

                    const anos = Object.keys(response.data.kpis).sort().reverse();
                    setAnosDisponiveis(anos);

                    // Se houver anos disponíveis, seleciona o primeiro
                    if (anos.length > 0) {
                        setAnoSelecionado(anos[0]);
                    }
                } else {
                    // Se não houver dados, define os estados como vazios para evitar erros
                    setDadosCompletos({});
                    setKpis({});
                    setAnosDisponiveis([]);
                }
            } catch (error) {
                console.error("Erro ao buscar dados do relatório:", error);
                setDadosCompletos({}); // Define como vazio em caso de erro também
                setKpis({});
            } finally {
                setIsLoading(false); // Para o loading no final
            }
        };
        fetchReportData();
    }, []);

    useEffect(() => {
        if (!dadosCompletos) return;

        const quiosques = Object.keys(dadosCompletos);
        const todosMeses = new Set();
        quiosques.forEach(q => {
            Object.keys(dadosCompletos[q]).forEach(mesAno => {
                const [ano] = mesAno.split('-');
                if (ano === anoSelecionado) {
                    todosMeses.add(mesAno);
                }
            });
        });
        const labels = Array.from(todosMeses).sort();
        const cores = ['#ab2816', '#49d6d1', '#0e9107', '#ab2816'];

        setChartData({
            labels: labels.map(l => new Date(l + '-02').toLocaleString('pt-BR', { month: 'long' })),
            datasets: quiosques.map((quiosque, index) => ({
                label: quiosque,
                data: labels.map(label => dadosCompletos[quiosque][label] || 0),
                backgroundColor: cores[index % cores.length],
            })),
        });
    }, [dadosCompletos, anoSelecionado]);

    const kpisDoAno = kpis ? kpis[anoSelecionado] : null;
    const formatCurrency = (value) => value ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'R$ 0,00';

    if (isLoading) {
        return <p className="text-center text-gray-500">Carregando dados do relatório...</p>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <h3 className="text-xl font-semibold text-[#7a5521] mb-4 md:mb-0">
                    Relatório de Faturamento
                </h3>
                {anosDisponiveis.length > 0 && (
                    <div>
                        <label htmlFor="ano" className="text-sm font-medium text-gray-700 mr-2">Ano:</label>
                        <select id="ano" value={anoSelecionado} onChange={(e) => setAnoSelecionado(e.target.value)} className="p-2 border bg-white border-gray-300 rounded-md shadow-sm">
                            {anosDisponiveis.map(ano => <option key={ano} value={ano}>{ano}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {kpisDoAno ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard title="Faturamento Total no Ano" value={formatCurrency(kpisDoAno.faturamentoTotal)} />
                    <KpiCard title="Média Mensal" value={formatCurrency(kpisDoAno.mediaMensal)} />
                    <KpiCard title="Melhor Mês" value={kpisDoAno.melhorMes.nome} subtext={formatCurrency(kpisDoAno.melhorMes.valor)} />
                    <KpiCard title="Quiosque Destaque" value={kpisDoAno.quiosqueDestaque.nome} subtext={formatCurrency(kpisDoAno.quiosqueDestaque.valor)} />
                </div>
            ) : (
                 <div className="text-center bg-white p-6 rounded-lg shadow-md">
                    <p className="text-gray-500">Nenhum dado de venda encontrado para este ano.</p>
                    <p className="text-sm text-gray-400 mt-2">Comece inserindo as vendas na página "Inserir Vendas Mensais".</p>
                </div>
            )}
            
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                {chartData && chartData.labels.length > 0 ? (
                    <div className="relative min-h-[400px]">
                        <Bar
                            data={chartData}
                            options={{
                                maintainAspectRatio: false,
                                responsive: true,
                                plugins: { title: { display: true, text: `Comparativo de Vendas - ${anoSelecionado}` } },
                                scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: (value) => `R$ ${value.toLocaleString('pt-BR')}` } } }
                            }}
                        />
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-10">Nenhum dado para exibir no gráfico.</p>
                )}
            </div>
        </div>
    );
}

export default SalesReport;