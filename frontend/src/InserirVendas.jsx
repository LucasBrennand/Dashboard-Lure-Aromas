// frontend/src/InserirVendas.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function InserirVendas() {
    // Estados para o formulário
    const [quiosques, setQuiosques] = useState([]);
    const [selectedQuiosque, setSelectedQuiosque] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [totalValue, setTotalValue] = useState('');
    const [message, setMessage] = useState('');

    // Busca a lista de quiosques do backend quando a página carrega
    useEffect(() => {
        const fetchQuiosques = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/quiosques');
                setQuiosques(response.data);
                if (response.data.length > 0) {
                    setSelectedQuiosque(response.data[0].id);
                }
            } catch (error) {
                console.error("Erro ao buscar quiosques", error);
                setMessage({ type: 'error', text: 'Não foi possível carregar a lista de quiosques.' });
            }
        };
        fetchQuiosques();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (totalValue === '' || parseFloat(totalValue) < 0) {
            setMessage({ type: 'error', text: 'Por favor, insira um valor total válido.' });
            return;
        }

        try {
            const response = await axios.post('http://localhost:3001/api/vendas-mensais', {
                quiosque_id: selectedQuiosque,
                ano: selectedYear,
                mes: selectedMonth,
                valor_total: parseFloat(totalValue)
            });

            setMessage({ type: 'success', text: response.data.message });
            setTotalValue(''); // Limpa o campo de valor após o sucesso

        } catch (error) {
            console.error("Erro ao salvar venda mensal:", error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Falha ao salvar os dados.' });
        }
    };

    // Opções para os selects de mês e ano
    const meses = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, name: new Date(0, i).toLocaleString('pt-BR', { month: 'long' }) }));
    const anos = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-6">
                Lançar Faturamento Mensal por Quiosque
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Seleção do Quiosque */}
                <div>
                    <label htmlFor="quiosque" className="block text-sm font-medium text-gray-700">Quiosque</label>
                    <select
                        id="quiosque"
                        value={selectedQuiosque}
                        onChange={(e) => setSelectedQuiosque(e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    >
                        {quiosques.map(q => (
                            <option key={q.id} value={q.id}>{q.nome}</option>
                        ))}
                    </select>
                </div>

                {/* Seleção de Ano e Mês */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="ano" className="block text-sm font-medium text-gray-700">Ano</label>
                        <select
                            id="ano"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        >
                            {anos.map(ano => <option key={ano} value={ano}>{ano}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="mes" className="block text-sm font-medium text-gray-700">Mês</label>
                        <select
                            id="mes"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        >
                            {meses.map(mes => <option key={mes.value} value={mes.value}>{mes.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Campo de Valor Total */}
                <div>
                    <label htmlFor="valor_total" className="block text-sm font-medium text-gray-700">Valor Total Vendido (R$)</label>
                    <input
                        type="number"
                        id="valor_total"
                        step="0.01"
                        value={totalValue}
                        onChange={(e) => setTotalValue(e.target.value)}
                        placeholder="Ex: 25912.50"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        required
                    />
                </div>

                {/* Botão de Envio */}
                <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Salvar Lançamento
                    </button>
                </div>
            </form>

            {/* Mensagem de Feedback */}
            {message && (
                <div className={`mt-4 p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}
        </div>
    );
}

export default InserirVendas;