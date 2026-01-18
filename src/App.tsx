
import React from 'react';
import { TrackerProvider, useTracker } from './context/TrackerContext';
import { OnboardingFlow } from './features/onboarding/OnboardingFlow';
import { WeeklyView } from './features/tracker/WeeklyView';
import { DashboardOverview } from './features/dashboard/DashboardOverview';
import { LoginView } from './features/auth/LoginView';
import { Button } from './components/Button';
import { ThemeToggle } from './ThemeToggle';
import './styles/global.css';

const MainContent = () => {
  const { state, session, loading, handleLogout } = useTracker();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!session) {
    return <LoginView />;
  }

  if (!state.isSetupComplete) {
    return <OnboardingFlow />;
  }

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem', gap: '1rem', alignItems: 'center' }}>
        <ThemeToggle />
        <Button variant="ghost" onClick={handleLogout} size="sm">로그아웃</Button>
      </header>
      <div style={{ padding: '0 2rem 2rem 2rem' }}>
        <DashboardOverview />
        <div style={{ margin: '2rem 0' }} />
        <WeeklyView />
      </div>
    </div>
  );
};

function App() {
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <TrackerProvider>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <MainContent />
      </ThemeContext.Provider>
    </TrackerProvider>
  )
}

// Simple internal Context just for the Header button
export const ThemeContext = React.createContext<{ theme: 'dark' | 'light', toggleTheme: () => void }>({ theme: 'dark', toggleTheme: () => { } });

export default App;
