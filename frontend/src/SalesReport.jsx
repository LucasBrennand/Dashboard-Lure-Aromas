// frontend/src/SalesReport.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Ícone de Link para o novo campo
const LinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);

function SalesReport() {
    const [chartData, setChartData] = useState(null);
    const [message, setMessage] = useState('Insira o link da planilha publicada do Google Sheets.');
    const [sheetUrl, setSheetUrl] = useState(''); // Estado para guardar a URL

    const handleUrlSubmit = async (event) => {
        event.preventDefault(); // Previne o recarregamento da página pelo formulário
        if (!sheetUrl) {
            setMessage('Por favor, insira uma URL.');
            return;
        }

        setMessage('Buscando e processando dados da URL...');
        
        try {
            // Envia a URL para a nova rota do backend
            const response = await axios.post('http://localhost:3001/api/relatorio-url', {
                url: sheetUrl
            });

            // O resto da lógica para montar o gráfico é a mesma de antes
            const dadosProcessados = response.data;
            const quiosques = Object.keys(dadosProcessados);

            const todosMeses = new Set();
            quiosques.forEach(q => {
                Object.keys(dadosProcessados[q]).forEach(mesAno => todosMeses.add(mesAno));
            });
            const labels = Array.from(todosMeses).sort();

            const cores = ['rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(75, 192, 192, 0.7)'];

            setChartData({
                labels: labels,
                datasets: quiosques.map((quiosque, index) => ({
                    label: quiosque,
                    data: labels.map(label => dadosProcessados[quiosque][label] || 0),
                    backgroundColor: cores[index % cores.length],
                })),
            });

            setMessage('Relatório gerado com sucesso a partir do link!');

        } catch (error) {
            console.error("Erro ao buscar dados da URL:", error);
            setMessage('Falha ao processar o relatório. Verifique o link e se a planilha está publicada como CSV.');
            setChartData(null);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                Dashboard de Vendas por Link
            </h3>
            <p className="text-sm text-gray-600 mb-4">
                Cole o link da sua planilha publicada como CSV do Google Sheets para gerar o relatório.
            </p>

            <form onSubmit={handleUrlSubmit} className="flex items-center space-x-2">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LinkIcon />
                    </div>
                    <input
                        type="url"
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                        className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <button
                    type="submit"
                    className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                >
                    Gerar Relatório
                </button>
            </form>

            <p className="text-sm font-medium text-gray-700 mt-4">{message}</p>
            
            {chartData && (
                <div className="mt-6">
                    <Bar data={chartData} options={{ /* ...opções do gráfico... */ }} />
                </div>
            )}
        </div>
    );
}

export default SalesReport;