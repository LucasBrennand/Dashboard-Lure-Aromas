// frontend/src/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Ícone de Lixeira para a lista de produtos
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);

function ProductForm() {
    // --- LÓGICA DE ESTADOS ---
    const [products, setProducts] = useState([]); // Lista de produtos a serem adicionados na planilha
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // Feedback de "carregando" na busca

    // --- FUNÇÃO DE BUSCA NO BANCO DE DADOS ---
    const handleSearchChange = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsLoading(true);
        try {
            // A rota para busca agora é a mesma da página de produtos
            const response = await axios.get('http://localhost:3001/api/produtos', {
                params: {
                    search: query,
                    limit: 10 // Apenas os 10 primeiros resultados
                }
            });
            setSearchResults(response.data.products); // Usamos a lista de produtos da resposta
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleAddProduct = (e) => {
        e.preventDefault();
        if (!selectedProduct) {
            alert('Por favor, selecione um produto da busca primeiro!');
            return;
        }

        const newProduct = {
            id: selectedProduct.id,
            code: selectedProduct.codigo_sku,
            name: selectedProduct.descricao,
            quantity,
            price: parseFloat(price) || selectedProduct.preco_padrao
        };
        setProducts([...products, newProduct]);
        setSelectedProduct(null);
        setQuantity(1);
        setPrice('');
    };
    
    const handleRemoveProduct = (productId) => {
        setProducts(products.filter(p => p.id !== productId));
    };

    const handleGenerateSheet = async () => {
        if (products.length === 0) {
            alert('Adicione pelo menos um produto antes de gerar a planilha.');
            return;
        }
        try {
            const response = await axios.post('http://localhost:3001/api/gerar-planilha',
                { products }, { responseType: 'blob' }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'entrada_bling.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Erro ao gerar a planilha!", error);
            alert("Ocorreu um erro ao gerar a planilha.");
        }
    };

    return (
        <div className="space-y-6">
            {/* Card 1: Busca e Seleção do Produto */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                    Passo 1: Selecionar Produto
                </h3>
                
                {!selectedProduct ? (
                    <div className="relative">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                            Pesquisar Produto (por nome ou código)
                        </label>
                        <input
                            id="search"
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Digite para buscar no banco de dados..."
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300"
                        />
                        {isLoading && <p className="text-sm text-gray-500 mt-1">Buscando...</p>}
                        {searchResults.length > 0 && (
                            <ul className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                                {searchResults.map(p => (
                                    <li key={p.id} onClick={() => handleSelectProduct(p)} className="px-4 py-2 cursor-pointer hover:bg-green-50">
                                        <span className="font-bold text-gray-700">{p.codigo_sku}</span> - <span className="text-gray-600">{p.descricao}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ) : (
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">
                            Produto Selecionado
                        </label>
                        <div className="bg-green-50 border border-green-200 p-3 rounded-md flex justify-between items-center">
                           <div>
                             <p className="font-bold text-green-800">{selectedProduct.descricao}</p>
                             <p className="text-sm text-gray-600">Código: {selectedProduct.codigo_sku}</p>
                           </div>
                            <button
                                type="button"
                                onClick={() => setSelectedProduct(null)}
                                className="bg-red-500 text-white text-xs font-bold px-2 py-1 cursor-pointer rounded-full hover:bg-red-600"
                                title="Limpar Seleção"
                            >
                                X
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Card 2: Adicionar Detalhes (só aparece se um produto foi selecionado) */}
            {selectedProduct && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                        Passo 2: Definir Quantidade e Preço
                    </h3>
                    <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                           <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                            <input id="quantity" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                             <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Preço Unitário (R$)</label>
                            <input id="price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Padrão do produto" className="w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                        <button type="submit" className="bg-green-500 cursor-pointer text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 transition-colors h-10">
                            Adicionar à Lista
                        </button>
                    </form>
                </div>
            )}

            {/* Card 3: Lista para Geração da Planilha */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                    Lista de Produtos para Entrada
                </h3>
                {products.length > 0 ? (
                    <div className="space-y-3">
                        {products.map((p) => (
                            <div key={p.id} className="bg-gray-50 p-3 rounded-md flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-semibold text-gray-900">{p.name}</p>
                                    <p className="text-gray-600">
                                        {p.quantity} un. x R$ {p.price.toFixed(2)}
                                    </p>
                                </div>
                                <button onClick={() => handleRemoveProduct(p.id)} className="text-red-500 cursor-pointer hover:text-red-700" title="Remover Item">
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                         <button
                            onClick={handleGenerateSheet}
                            className="w-full bg-green-600 text-white font-bold py-3 rounded-md hover:bg-green-700 transition-colors mt-6"
                        >
                            Gerar Planilha para o Bling
                        </button>
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">A lista está vazia. Adicione produtos acima.</p>
                )}
            </div>
        </div>
    );
}

export default ProductForm;