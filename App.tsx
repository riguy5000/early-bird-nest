import { useState, useEffect } from 'react';
import { AuthenticationFlow } from './components/AuthenticationFlow';
import { RootAdminConsole } from './components/RootAdminConsole';
import { JewelryPawnApp } from './components/JewelryPawnApp';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already authenticated (from localStorage or session)
  useEffect(() => {
    const checkAuthState = () => {
      try {
        const savedUser = localStorage.getItem('user');
        const rememberMe = localStorage.getItem('rememberMe');
        const sessionUser = sessionStorage.getItem('user');
        
        if (savedUser && rememberMe === 'true') {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setIsAuthenticated(true);
        } else if (sessionUser) {
          const userData = JSON.parse(sessionUser);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        sessionStorage.removeItem('user');
      }
      
      setIsLoading(false);
    };

    checkAuthState();
  }, []);

  const handleLogin = (userData: any, remember: boolean) => {
    setUser(userData);
    setIsAuthenticated(true);
    
    try {
      if (remember) {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('rememberMe', 'true');
      } else {
        sessionStorage.setItem('user', JSON.stringify(userData));
        localStorage.removeItem('rememberMe');
      }
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      sessionStorage.removeItem('user');
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  };

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  // Show authentication flow if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <AuthenticationFlow onLogin={handleLogin} />
        <Toaster position="top-right" />
      </div>
    );
  }

  // Check if user is root admin
  const isRootAdmin = user?.email === 'admin@bravojewellers.com' && user?.role === 'root_admin';

  // Show Root Admin Console for root admin users
  if (isRootAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <RootAdminConsole user={user} onLogout={handleLogout} />
        <Toaster position="top-right" />
      </div>
    );
  }

  // Show main application for regular users
  return (
    <div className="min-h-screen bg-background">
      <JewelryPawnApp user={user} onLogout={handleLogout} />
      <Toaster position="top-right" />
    </div>
  );
}