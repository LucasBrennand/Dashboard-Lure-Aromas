// frontend/src/Calculadora.jsx

import React, { useState, useEffect } from 'react';

// Componente de input reutilizável
const InputField = ({ label, name, value, onChange, placeholder = "0.00", prefix = "R$", type = "number" }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">{prefix}</span>
            </div>
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full p-2 pl-8 border border-gray-300 rounded-md"
            />
        </div>
    </div>
);

// Componente para mostrar o resultado
const ResultDisplay = ({ label, value, subtext = '' }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-200">
        <span className="text-gray-600">{label}{subtext && <span className="text-xs text-gray-400 ml-1">{subtext}</span>}</span>
        <span className="font-semibold text-gray-800">
            {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
    </div>
);


function Calculadora() {
    // Estado para os valores diários (diaria, lure, flores)
    const [valoresDiarios, setValoresDiarios] = useState({
        seg: { diaria: '', lure: '', flores: '' }, ter: { diaria: '', lure: '', flores: '' },
        qua: { diaria: '', lure: '', flores: '' }, qui: { diaria: '', lure: '', flores: '' },
        sex: { diaria: '', lure: '', flores: '' }, sab: { diaria: '', lure: '', flores: '' },
        dom: { diaria: '', lure: '', flores: '' }
    });

    // Estados para as configurações
    const [comissoes, setComissoes] = useState({ lure: '3', flores: '3' });
    const [valeTransporte, setValeTransporte] = useState('10');
    const [extra, setExtra] = useState('');

    // Estado para os resultados calculados
    const [resultados, setResultados] = useState({
        totalDiarias: 0, totalVendasLure: 0, totalVendasFlores: 0,
        comissaoLure: 0, comissaoFlores: 0,
        diasTrabalhados: 0, totalValeTransporte: 0,
        pagamentoFinal: 0
    });

    // Efeito que recalcula tudo sempre que um valor de entrada muda
    useEffect(() => {
        let totalDiariasCalc = 0;
        let totalLureCalc = 0;
        let totalFloresCalc = 0;
        let diasTrabalhadosCount = 0;

        Object.values(valoresDiarios).forEach(dia => {
            const diariaValor = parseFloat(dia.diaria) || 0;
            const vendaLure = parseFloat(dia.lure) || 0;
            const vendaFlores = parseFloat(dia.flores) || 0;

            if (diariaValor > 0 || vendaLure > 0 || vendaFlores > 0) {
                diasTrabalhadosCount++;
            }
            totalDiariasCalc += diariaValor;
            totalLureCalc += vendaLure;
            totalFloresCalc += vendaFlores;
        });
        
        const comissaoLurePerc = parseFloat(comissoes.lure) || 0;
        const comissaoFloresPerc = parseFloat(comissoes.flores) || 0;
        const valeTransporteDiario = parseFloat(valeTransporte) || 0;
        const valorExtra = parseFloat(extra) || 0;

        const comissaoLureValor = totalLureCalc * (comissaoLurePerc / 100);
        const comissaoFloresValor = totalFloresCalc * (comissaoFloresPerc / 100);
        const totalTransporteValor = diasTrabalhadosCount * valeTransporteDiario;
        
        const pagamentoFinalCalc = totalDiariasCalc + comissaoLureValor + comissaoFloresValor + totalTransporteValor + valorExtra;

        setResultados({
            totalDiarias: totalDiariasCalc,
            totalVendasLure: totalLureCalc,
            totalVendasFlores: totalFloresCalc,
            comissaoLure: comissaoLureValor,
            comissaoFlores: comissaoFloresValor,
            diasTrabalhados: diasTrabalhadosCount,
            totalValeTransporte: totalTransporteValor,
            pagamentoFinal: pagamentoFinalCalc,
        });

    }, [valoresDiarios, comissoes, valeTransporte, extra]);

    const handleValorDiarioChange = (e) => {
        const { name, value } = e.target;
        const [dia, campo] = name.split('-'); // ex: "seg-diaria"
        setValoresDiarios(prev => ({
            ...prev,
            [dia]: { ...prev[dia], [campo]: value }
        }));
    };

    const diasDaSemana = [
        { id: 'seg', nome: 'Segunda' }, { id: 'ter', nome: 'Terça' },
        { id: 'qua', nome: 'Quarta' }, { id: 'qui', nome: 'Quinta' },
        { id: 'sex', nome: 'Sexta' }, { id: 'sab', nome: 'Sábado' },
        { id: 'dom', nome: 'Domingo' }
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna da Esquerda: Inputs */}
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-[#7a5521] border-b pb-2 mb-4">Valores da Semana</h3>
                    <div className="space-y-5">
                        {diasDaSemana.map(dia => (
                            <div key={dia.id} className="p-3 border rounded-md bg-gray-50">
                                <label className="block text-md font-medium text-gray-800">{dia.nome}-feira</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                                    <InputField label="Diária Fixa" name={`${dia.id}-diaria`} value={valoresDiarios[dia.id].diaria} onChange={handleValorDiarioChange} />
                                    <InputField label="Vendas LURE" name={`${dia.id}-lure`} value={valoresDiarios[dia.id].lure} onChange={handleValorDiarioChange} />
                                    <InputField label="Vendas FLORES" name={`${dia.id}-flores`} value={valoresDiarios[dia.id].flores} onChange={handleValorDiarioChange} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-[#7a5521] border-b pb-2 mb-4">Configurações Gerais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Comissão LURE" name="comissaoLure" value={comissoes.lure} onChange={(e) => setComissoes(p => ({...p, lure: e.target.value}))} prefix="%" />
                        <InputField label="Comissão FLORES" name="comissaoFlores" value={comissoes.flores} onChange={(e) => setComissoes(p => ({...p, flores: e.target.value}))} prefix="%" />
                        <InputField label="Vale Transporte (diário)" name="valeTransporte" value={valeTransporte} onChange={(e) => setValeTransporte(e.target.value)} />
                        <InputField label="Valor Extra" name="extra" value={extra} onChange={(e) => setExtra(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Coluna da Direita: Resultados */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-[#7a5521] border-b pb-3 mb-6">
                    Resumo do Pagamento Semanal
                </h3>
                <div className="space-y-3">
                    <ResultDisplay label="Total Diárias Fixas" value={resultados.totalDiarias} />
                    <ResultDisplay label="Comissão LURE" subtext={`(${comissoes.lure}% de ${resultados.totalVendasLure.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})})`} value={resultados.comissaoLure} />
                    <ResultDisplay label="Comissão FLORES" subtext={`(${comissoes.flores}% de ${resultados.totalVendasFlores.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})})`} value={resultados.comissaoFlores} />
                    <ResultDisplay label="Vale Transporte" subtext={`(${resultados.diasTrabalhados} dias trabalhados)`} value={resultados.totalValeTransporte} />
                    <ResultDisplay label="Valor Extra" value={parseFloat(extra) || 0} />
                    
                    <div className="!mt-6 pt-4 border-t-2 border-dashed">
                        <div className="flex justify-between items-center text-xl">
                            <span className="font-bold text-gray-800">TOTAL A PAGAR:</span>
                            <span className="font-bold text-green-600">
                                {resultados.pagamentoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Calculadora;