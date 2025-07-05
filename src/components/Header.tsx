
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User } from 'lucide-react';
import { cleanupAuthState } from '@/utils/authCleanup';

interface HeaderProps {
  onViewChange: (view: string) => void;
  currentView: string;
}

const Header: React.FC<HeaderProps> = ({ onViewChange, currentView }) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      cleanupAuthState();
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign out error",
        description: "There was an issue signing you out. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-8">
          <button 
            onClick={() => onViewChange('dashboard')}
            className="text-2xl font-bold text-sky-600 hover:text-sky-700 transition-colors"
          >
            IELTSSlay
          </button>
          
          <nav className="hidden md:flex space-x-6">
            {[
              { key: 'dashboard', label: 'Dashboard' },
              { key: 'practice', label: 'Practice' },
              { key: 'ielts-ai', label: 'IELTS AI' },
              { key: 'history', label: 'History' },
              { key: 'analytics', label: 'Analytics' },
              { key: 'settings', label: 'Settings' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onViewChange(key)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === key
                    ? 'bg-sky-100 text-sky-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <User className="h-4 w-4" />
            <span>{user?.email}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSignOut}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
