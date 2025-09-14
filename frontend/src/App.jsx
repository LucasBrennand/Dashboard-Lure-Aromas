// frontend/src/App.jsx

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './LoginPage';
import DashboardLayout from './DashboardLayout'; // Nosso novo layout
import ProductForm from './ProductForm';       // A função de entrada de estoque
import SalesReport from './SalesReport';     // A função de relatório de vendas
import InserirVendas from './InserirVendas';

function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (username) => {
    setUser(username);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* ROTA DE LOGIN */}
        <Route
          path="/login"
          element={
            !user ? (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            ) : (
              <Navigate to="/dashboard" /> // Se já estiver logado, redireciona para o dashboard
            )
          }
        />

        {/* ROTAS DO DASHBOARD (PROTEGIDAS) */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <DashboardLayout username={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" /> // Se não estiver logado, redireciona para o login
            )
          }
        >
          {/* Rotas "filhas" que serão renderizadas dentro do <Outlet> do DashboardLayout */}
          <Route index element={<Navigate to="estoque" />} /> {/* Rota padrão do dashboard */}
          <Route path="estoque" element={<ProductForm />} />
          <Route path="relatorios" element={<SalesReport />} />
          <Route path="inserir-vendas" element={<InserirVendas />} />
        </Route>

        {/* ROTA PADRÃO - Redireciona para o login ou dashboard */}
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;