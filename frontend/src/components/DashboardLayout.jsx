// frontend/src/DashboardLayout.jsx

import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";

// --- ÍCONES ---
const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
);
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);

function DashboardLayout({ username, onLogout }) {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAdminBlockVisible, setIsAdminBlockVisible] = useState(true);

    useEffect(() => {
        const adminBlockDismissed = localStorage.getItem('adminBlockDismissed');
        if (adminBlockDismissed === 'true') {
            setIsAdminBlockVisible(false);
        }
    }, []);

    const handleLogoutClick = () => {
        onLogout();
        navigate("/login");
    };

    const handleImportarProdutos = async () => {
        if (window.confirm("Você tem certeza que deseja importar a lista de produtos do arquivo CSV? Esta ação deve ser executada apenas uma vez.")) {
            try {
                const response = await axios.post("http://localhost:3001/api/importar-produtos");
                alert(response.data.message);
            } catch (error) {
                console.error("Erro ao importar produtos:", error);
                alert("Falha na importação. Verifique o console do backend para mais detalhes.");
            }
        }
    };

    const dismissAdminBlock = () => {
        setIsAdminBlockVisible(false);
        localStorage.setItem('adminBlockDismissed', 'true');
    };

    const linkClass = "flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-[#e6f2e1] transition-colors";
    const activeLinkClass = "bg-[#8f6628] text-white hover:bg-[#8f6628]";

    return (
        <div className="flex h-screen bg-[#e6f2e1] overflow-hidden">
            <nav className={`absolute lg:relative w-64 h-full bg-white shadow-md flex flex-col transition-transform duration-300 z-20 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
                <div className="p-4 border-b">
                    <div className="flex flex-col items-center py-4">
                        <div className="w-20 h-20 mb-3 p-2 rounded-full bg-gray-200 text-gray-400">
                            <UserIcon />
                        </div>
                        <p className="font-semibold text-lg capitalize text-[#7a5521]">{username}</p>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden absolute top-4 right-4 text-gray-600">
                        <CloseIcon />
                    </button>
                </div>

                <ul className="flex-grow p-4 space-y-2">
                    <li>
                        <NavLink to="/dashboard/produtos" className={({ isActive }) => isActive ? `${linkClass} ${activeLinkClass}` : linkClass}>
                            Produtos
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/dashboard/estoque" className={({ isActive }) => isActive ? `${linkClass} ${activeLinkClass}` : linkClass}>
                            Entrada de Estoque
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/dashboard/inserir-vendas" className={({ isActive }) => isActive ? `${linkClass} ${activeLinkClass}` : linkClass}>
                            Inserir Vendas Mensais
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/dashboard/relatorios" className={({ isActive }) => isActive ? `${linkClass} ${activeLinkClass}` : linkClass}>
                            Relatório de Vendas
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/dashboard/calculadora" className={({ isActive }) => isActive ? `${linkClass} ${activeLinkClass}` : linkClass}>
                            Calculadora
                        </NavLink>
                    </li>
                </ul>

                <div className="p-4 border-t">
                    <button onClick={handleLogoutClick} className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600">Sair</button>
                </div>
            </nav>

            {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black opacity-50 z-10 lg:hidden"></div>}

            <div className="flex-1 flex flex-col">
                <header className="p-4 bg-white shadow-md lg:hidden flex items-center">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 mr-4"><MenuIcon /></button>
                    <h1 className="text-lg font-semibold text-[#7a5521]">Dashboard</h1>
                </header>

                <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                    {isAdminBlockVisible && (
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md relative" role="alert">
                            <button onClick={dismissAdminBlock} className="absolute top-2 right-2 text-yellow-700">
                                <CloseIcon />
                            </button>
                            <p className="font-bold">Ação de Administrador</p>
                            <p className="text-sm">Clique no botão para realizar a carga inicial dos produtos para o banco de dados.</p>
                            <button
                                onClick={handleImportarProdutos}
                                className="mt-2 bg-yellow-500 text-white font-bold py-2 px-4 rounded hover:bg-yellow-600"
                            >
                                Importar Produtos (Carga Única)
                            </button>
                        </div>
                    )}
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default DashboardLayout;