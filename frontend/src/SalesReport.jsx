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
        <p className="text-2xl font-bold text-gray-800">{value}</p>
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

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                // Agora esperamos um objeto com 'chartData' e 'kpis'
                const response = await axios.get('http://localhost:3001/api/relatorio-vendas');
                setDadosCompletos(response.data.chartData);
                setKpis(response.data.kpis);

                // Define os anos disponíveis com base nos KPIs calculados
                const anos = Object.keys(response.data.kpis).sort().reverse();
                setAnosDisponiveis(anos);
                if (anos.length > 0 && !anos.includes(anoSelecionado)) {
                    setAnoSelecionado(anos[0]);
                }

            } catch (error) {
                console.error("Erro ao buscar dados do relatório:", error);
            }
        };
        fetchReportData();
    }, []);

    useEffect(() => {
        if (!dadosCompletos) return;
        // ... (lógica para montar o gráfico, sem alterações)
        const quiosques = Object.keys(dadosCompletos);
        const todosMeses = new Set();
        quiosques.forEach(q => {
            Object.keys(dadosCompletos[q]).forEach(mesAno => {
                const [ano, ] = mesAno.split('-');
                if (ano === anoSelecionado) {
                    todosMeses.add(mesAno);
                }
            });
        });
        const labels = Array.from(todosMeses).sort();
        const cores = ['rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(75, 192, 192, 0.7)'];
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800">
                    Relatório de Faturamento
                </h3>
                <div>
                    <label htmlFor="ano" className="text-sm font-medium text-gray-700 mr-2">Ano:</label>
                    <select id="ano" value={anoSelecionado} onChange={(e) => setAnoSelecionado(e.target.value)} className="p-2 border bg-white border-gray-300 rounded-md shadow-sm">
                        {anosDisponiveis.map(ano => <option key={ano} value={ano}>{ano}</option>)}
                    </select>
                </div>
            </div>

            {/* Seção de KPIs */}
            {kpisDoAno && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard title="Faturamento Total no Ano" value={formatCurrency(kpisDoAno.faturamentoTotal)} />
                    <KpiCard title="Média Mensal" value={formatCurrency(kpisDoAno.mediaMensal)} />
                    <KpiCard title="Melhor Mês" value={kpisDoAno.melhorMes.nome} subtext={formatCurrency(kpisDoAno.melhorMes.valor)} />
                    <KpiCard title="Quiosque Destaque" value={kpisDoAno.quiosqueDestaque.nome} subtext={formatCurrency(kpisDoAno.quiosqueDestaque.valor)} />
                </div>
            )}
            
            {/* Gráfico */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                {chartData ? (
                    <Bar
                        data={chartData}
                        options={{ responsive: true, plugins: { title: { text: `Comparativo de Vendas - ${anoSelecionado}` } }, scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: (value) => `R$ ${value.toLocaleString('pt-BR')}` } } } }}
                    />
                ) : (
                    <p className="text-gray-500 text-center py-10">Carregando dados do relatório...</p>
                )}
            </div>
        </div>
    );
}

export default SalesReport;