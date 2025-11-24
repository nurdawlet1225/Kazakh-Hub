import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // localStorage-дан немесе браузердің баптауынан теманы алу
  const getInitialTheme = (): Theme => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      return savedTheme;
    }
    // Браузердің баптауына сүйену
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    // Теманы localStorage-та сақтау
    localStorage.setItem('theme', theme);
    
    // HTML элементіне класс қосу/алу
    const root = document.documentElement;
    const body = document.body;
    
    // Fade эффектісі үшін класс қосу
    body.style.opacity = '0.7';
    body.style.transition = 'opacity 0.3s ease';
    
    // Теманы өзгерту
    if (theme === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    }
    
    // Fade in эффектісі
    requestAnimationFrame(() => {
      body.style.opacity = '1';
    });
    
    // Transition-ды қайта қалпына келтіру
    setTimeout(() => {
      body.style.transition = '';
    }, 300);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};


