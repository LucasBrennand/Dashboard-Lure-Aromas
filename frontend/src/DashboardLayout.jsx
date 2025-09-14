// frontend/src/DashboardLayout.jsx

import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import axios from "axios"; // Importamos o axios para fazer a chamada da API de importação

function DashboardLayout({ username, onLogout }) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate("/login"); // Redireciona para o login após o logout
  };

  // Função para acionar a rota de importação de produtos no backend
  const handleImportarProdutos = async () => {
    // Uma confirmação para evitar cliques acidentais
    if (
      window.confirm(
        "Você tem certeza que deseja importar a lista de produtos do arquivo CSV? Esta ação deve ser executada apenas uma vez."
      )
    ) {
      try {
        // Faz a chamada POST para a nossa rota de importação
        const response = await axios.post(
          "http://localhost:3001/api/importar-produtos"
        );
        alert(response.data.message); // Mostra a mensagem de sucesso do backend
      } catch (error) {
        console.error("Erro ao importar produtos:", error);
        alert(
          "Falha na importação. Verifique o console do backend para mais detalhes."
        );
      }
    }
  };

  // --- Classes do Tailwind para estilização dos links de navegação ---
  // Classe base para todos os links
  const linkClass =
    "flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors";
  // Classe extra que é aplicada apenas ao link que está ATIVO
  const activeLinkClass = "bg-blue-500 text-white hover:bg-blue-500";

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Barra de Navegação Lateral */}
      <nav className="w-64 bg-white shadow-md flex flex-col flex-shrink-0">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Olá, {username}!</h2>
        </div>
        <ul className="flex-grow p-4 space-y-2">
          <li>
            {/* NavLink é um componente do React Router que sabe quando a rota está ativa */}
            <NavLink
              to="/dashboard/estoque"
              // A classe muda dinamicamente se o link estiver ativo
              className={({ isActive }) =>
                isActive ? `${linkClass} ${activeLinkClass}` : linkClass
              }
            >
              Entrada de Estoque
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/dashboard/registrar-venda" // Nova rota
              className={({ isActive }) =>
                isActive ? `${linkClass} ${activeLinkClass}` : linkClass
              }
            >
              Registrar Venda
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/dashboard/inserir-vendas" // Nova rota
              className={({ isActive }) =>
                isActive ? `${linkClass} ${activeLinkClass}` : linkClass
              }
            >
              Inserir Vendas Mensais
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/dashboard/relatorios"
              className={({ isActive }) =>
                isActive ? `${linkClass} ${activeLinkClass}` : linkClass
              }
            >
              Relatório de Vendas
            </NavLink>
          </li>
        </ul>
        <div className="p-4 border-t">
          <button
            onClick={handleLogoutClick}
            className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
          >
            Sair
          </button>
        </div>
      </nav>

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Bloco temporário para a ação de importar produtos */}
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md"
          role="alert"
        >
          <p className="font-bold">Ação de Administrador</p>
          <p className="text-sm">
            Clique no botão abaixo para realizar a carga inicial dos produtos do
            arquivo .csv para o banco de dados.
          </p>
          <button
            onClick={handleImportarProdutos}
            className="mt-2 bg-yellow-500 text-white font-bold py-2 px-4 rounded hover:bg-yellow-600"
          >
            Importar Produtos (Carga Única)
          </button>
        </div>

        {/* O <Outlet> é o espaço reservado onde o React Router renderizará a página selecionada */}
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
