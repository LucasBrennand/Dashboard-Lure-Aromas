// frontend/src/DashboardPage.jsx

import React from 'react';
import ProductForm from './ProductForm';
import SalesReport from './SalesReport'; // 1. Importe o novo componente

function DashboardPage({ username, onLogout }) {
  return (
    <div>
      {/* ...código do header do dashboard... */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '80vw' }}>
        <div>
          <h1>Painel Principal</h1>
          <h2>Bem-vindo, {username}!</h2>
        </div>
        <button onClick={onLogout} style={{ padding: '10px', height: 'fit-content' }}>
          Sair (Logout)
        </button>
      </div>

      {/* Componente de Geração de Planilha */}
      <ProductForm />

      {/* Componente de Visualização de Relatório */}
      <SalesReport />
    </div>
  );
}

export default DashboardPage;