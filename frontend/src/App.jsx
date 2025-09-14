// frontend/src/App.jsx

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importação de todos os componentes de página
import LoginPage from './LoginPage';
import DashboardLayout from './DashboardLayout';
import ProductForm from './ProductForm';
import SalesReport from './SalesReport';
import InserirVendas from './InserirVendas';
import Calculadora from './Calculadora';
import ProductPage from './ProductPage';

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
        {/* Rota de Login */}
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

        {/* Rotas Protegidas do Dashboard */}
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
          {/* Rota padrão do dashboard, redireciona para relatórios */}
          <Route index element={<Navigate to="relatorios" />} />
          
          {/* Rotas filhas que serão renderizadas dentro do DashboardLayout */}
          <Route path="produtos" element={<ProductPage />} /> 
          <Route path="estoque" element={<ProductForm />} />
          <Route path="inserir-vendas" element={<InserirVendas />} />
          <Route path="relatorios" element={<SalesReport />} />
          <Route path="calculadora" element={<Calculadora />} />
        </Route>

        {/* Rota Padrão do App - Redireciona para o login ou dashboard */}
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;