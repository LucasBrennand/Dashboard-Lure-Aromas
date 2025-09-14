// frontend/src/ProductPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ProductPage() {
    // Estados para controlar a página
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Efeito para buscar os produtos do backend sempre que a página ou o termo de busca mudar
    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get('http://localhost:3001/api/produtos', {
                    params: {
                        page: currentPage,
                        search: searchTerm
                    }
                });
                setProducts(response.data.products);
                setTotalPages(response.data.totalPages);
            } catch (error) {
                console.error("Erro ao buscar produtos:", error);
            } finally {
                setIsLoading(false);
            }
        };

        // Adiciona um pequeno delay na busca para não sobrecarregar o servidor enquanto o usuário digita
        const delayDebounceFn = setTimeout(() => {
            fetchProducts();
        }, 500); // 500ms de espera

        return () => clearTimeout(delayDebounceFn);
    }, [currentPage, searchTerm]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Volta para a primeira página ao fazer uma nova busca
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-[#7a5521] border-b pb-3 mb-4">
                Catálogo de Produtos
            </h3>

            {/* Barra de Busca */}
            <div className="mb-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Buscar por nome ou código..."
                    className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md"
                />
            </div>

            {/* Tabela de Produtos */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Padrão</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map(product => (
                            <tr key={product.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.codigo_sku}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.descricao}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {product.preco_padrao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isLoading && <p className="text-center mt-4">Carregando...</p>}
            {!isLoading && products.length === 0 && <p className="text-center mt-4">Nenhum produto encontrado.</p>}

            {/* Controles de Paginação */}
            <div className="mt-4 flex justify-between items-center">
                <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md disabled:opacity-50"
                >
                    Anterior
                </button>
                <span className="text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md disabled:opacity-50"
                >
                    Próxima
                </button>
            </div>
        </div>
    );
}

export default ProductPage;