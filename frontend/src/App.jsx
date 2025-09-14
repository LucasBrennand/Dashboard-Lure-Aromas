// frontend/src/App.jsx

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ##### CORREÇÃO APLICADA AQUI #####
// Adicionamos 'components/' ao caminho de cada importação de componente.
import LoginPage from './components/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import ProductForm from './components/ProductForm';
import SalesReport from './components/SalesReport';
import InserirVendas from './components/InserirVendas';
import Calculadora from './components/Calculadora';
import ProductPage from './components/ProductPage';

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
              <Navigate to="/dashboard" />
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
              <Navigate to="/login" />
            )
          }
        >
          {/* Rota padrão do dashboard, redireciona para relatórios */}
          <Route index element={<Navigate to="relatorios" />} />
          
          {/* As rotas aqui não mudam, pois elas apenas definem a URL */}
          <Route path="produtos" element={<ProductPage />} /> 
          <Route path="estoque" element={<ProductForm />} />
          <Route path="inserir-vendas" element={<InserirVendas />} />
          <Route path="relatorios" element={<SalesReport />} />
          <Route path="calculadora" element={<Calculadora />} />
        </Route>

        {/* Rota Padrão do App */}
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;