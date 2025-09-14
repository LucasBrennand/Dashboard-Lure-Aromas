import React, { createContext, useState, useEffect, useContext } from 'react';

// Cria o contexto que nossos componentes usarão
const ThemeContext = createContext();

// Cria o Provedor, que é o componente que vai gerenciar o estado do tema
export const ThemeProvider = ({ children }) => {
    // O estado 'theme' pode ser 'light' ou 'dark'
    // Ele verifica o localStorage ou a preferência do sistema do usuário
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                return savedTheme;
            }
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    });

    // Este efeito é executado sempre que o tema muda
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        // Salva a preferência no localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Hook personalizado para facilitar o uso do contexto em outros componentes
export const useTheme = () => useContext(ThemeContext);