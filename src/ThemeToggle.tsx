import { useContext } from 'react';
import { ThemeContext } from './App';
import { Button } from './components/Button';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);

    return (
        <Button variant="ghost" size="sm" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </Button>
    );
};
