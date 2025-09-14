// frontend/src/LoginPage.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage('Verificando...');
    try {
      const response = await axios.post('http://localhost:3001/api/login', {
        username,
        password,
      });
      if (response.data.success) {
        onLoginSuccess(username);
        navigate('/dashboard');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erro ao conectar com o servidor.');
    }
  };

  return (
    // bg-gray-100: Fundo cinza claro
    // min-h-screen: Altura mínima igual à tela inteira
    // flex items-center justify-center: Centraliza o conteúdo vertical e horizontalmente
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Login do Sistema
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Usuário (use: admin)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              // w-full: Largura total
              // p-3: Padding
              // border rounded-md: Borda arredondada
              // focus:*: Classes que se aplicam quando o campo está em foco
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Senha (use: 1234)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            // bg-blue-500: Fundo azul
            // text-white: Texto branco
            // font-bold: Fonte em negrito
            // py-3: Padding vertical
            // hover:bg-blue-600: Muda a cor do fundo ao passar o mouse
            // transition-colors: Anima a mudança de cor
            className="w-full bg-blue-500 text-white font-bold py-3 rounded-md hover:bg-blue-600 transition-colors"
          >
            Entrar
          </button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-red-600">{message}</p>}
      </div>
    </div>
  );
}

export default LoginPage;