// frontend/src/components/ProductPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- ÍCONES ---
const PlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg> );
const DownloadIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> );
const EditIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg> );
const TrashIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> );


// --- MODAL PARA ADICIONAR E EDITAR PRODUTO ---
const AddEditProductModal = ({ isOpen, onClose, onSave, product }) => {
    const isEditMode = !!product;
    const [formData, setFormData] = useState({
        codigo_sku: isEditMode ? product.codigo_sku : '',
        descricao: isEditMode ? product.descricao : '',
        preco_padrao: isEditMode ? product.preco_padrao : ''
    });
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const productData = { ...formData, preco_padrao: parseFloat(formData.preco_padrao) };
            if (isEditMode) {
                await axios.put(`http://localhost:3001/api/produtos/${product.id}`, productData);
            } else {
                await axios.post('http://localhost:3001/api/produtos', productData);
            }
            onSave();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Ocorreu um erro.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-semibold text-[#7a5521] mb-4">{isEditMode ? 'Editar Produto' : 'Adicionar Novo Produto'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="codigo_sku" value={formData.codigo_sku} onChange={handleChange} placeholder="Código SKU" className="w-full p-2 border border-gray-300 rounded-md" required />
                    <input name="descricao" value={formData.descricao} onChange={handleChange} placeholder="Descrição do Produto" className="w-full p-2 border border-gray-300 rounded-md" required />
                    <input name="preco_padrao" type="number" step="0.01" value={formData.preco_padrao} onChange={handleChange} placeholder="Preço Padrão (Ex: 89.00)" className="w-full p-2 border border-gray-300 rounded-md" required />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-[#8f6628] text-white rounded-md hover:bg-[#7a5521]">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


function ProductPage() {
    // Estados
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchProducts = async (page = currentPage, search = searchTerm) => {
        setIsLoading(true);
        try {
            const response = await axios.get('http://localhost:3001/api/produtos', { params: { page, search } });
            setProducts(response.data.products);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => { fetchProducts(currentPage, searchTerm); }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [currentPage, searchTerm]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleExport = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/produtos/exportar', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'catalogo_produtos.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Erro ao exportar planilha:", error);
            alert("Não foi possível gerar a planilha.");
        }
    };
    
    // Funções de Ação (CRUD)
    const handleOpenAddModal = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };
    
    const handleSave = () => {
        fetchProducts(); // Recarrega a lista da página atual após salvar
    };

    const handleDelete = async (productId) => {
        if (window.confirm("Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.")) {
            try {
                await axios.delete(`http://localhost:3001/api/produtos/${productId}`);
                fetchProducts(); // Recarrega a lista após excluir
            } catch (error) {
                alert("Falha ao excluir o produto.");
                console.error("Erro ao excluir produto:", error);
            }
        }
    };

    return (
        <>
            <AddEditProductModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSave} product={editingProduct} />

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-semibold text-[#7a5521]">
                        Catálogo de Produtos
                    </h3>
                    <div className="flex space-x-2 mt-4 md:mt-0">
                        <button onClick={handleOpenAddModal} className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700">
                            <PlusIcon /> Adicionar Produto
                        </button>
                        <button onClick={handleExport} className="inline-flex items-center px-4 py-2 bg-[#8f6628] text-white text-sm font-medium rounded-md hover:bg-[#7a5521]">
                            <DownloadIcon /> Exportar
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <input type="text" value={searchTerm} onChange={handleSearchChange} placeholder="Buscar por nome ou código..." className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md" />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Padrão</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {products.map(product => (
                                <tr key={product.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.codigo_sku}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.descricao}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {(product.preco_padrao || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-3">
                                            <button onClick={() => handleOpenEditModal(product)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><EditIcon /></button>
                                            <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900" title="Excluir"><TrashIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {isLoading && <p className="text-center mt-4">Carregando...</p>}
                {!isLoading && products.length === 0 && <p className="text-center mt-4">Nenhum produto encontrado.</p>}

                <div className="mt-4 flex justify-between items-center">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-700">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md disabled:opacity-50"
                    >
                        Próxima
                    </button>
                </div>
            </div>
        </>
    );
}

export default ProductPage;