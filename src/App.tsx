
import { TrackerProvider, useTracker } from './context/TrackerContext';
import { OnboardingFlow } from './features/onboarding/OnboardingFlow';
import { WeeklyView } from './features/tracker/WeeklyView';
import { DashboardOverview } from './features/dashboard/DashboardOverview';
import { LoginView } from './features/auth/LoginView';
import { Button } from './components/Button';
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
      <header style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
        <Button variant="ghost" onClick={handleLogout} size="sm">Logout</Button>
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
  return (
    <TrackerProvider>
      <MainContent />
    </TrackerProvider>
  )
}

export default App;
