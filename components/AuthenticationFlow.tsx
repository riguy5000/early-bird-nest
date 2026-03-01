import { useState } from 'react';
import { LoginScreen } from './auth/LoginScreen';
import { ForgotPasswordFlow } from './auth/ForgotPasswordFlow';
import { RegistrationWizard } from './auth/RegistrationWizard';

export type AuthFlow = 'login' | 'register' | 'forgot-password' | 'reset-password';

interface AuthenticationFlowProps {
  onLogin: (userData: any, remember: boolean) => void;
}

export function AuthenticationFlow({ onLogin }: AuthenticationFlowProps) {
  const [currentFlow, setCurrentFlow] = useState<AuthFlow>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleFlowChange = (flow: AuthFlow, token?: string) => {
    setCurrentFlow(flow);
    if (token) {
      setResetToken(token);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[380px]">
        {currentFlow === 'login' && (
          <LoginScreen 
            onLogin={onLogin}
            onNavigate={handleFlowChange}
          />
        )}
        
        {currentFlow === 'register' && (
          <RegistrationWizard 
            onComplete={onLogin}
            onNavigate={handleFlowChange}
          />
        )}
        
        {(currentFlow === 'forgot-password' || currentFlow === 'reset-password') && (
          <ForgotPasswordFlow 
            mode={currentFlow}
            resetToken={resetToken}
            onNavigate={handleFlowChange}
          />
        )}
      </div>
    </div>
  );
}
