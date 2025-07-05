
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Home,
  Brain, 
  BarChart3, 
  History, 
  User, 
  Settings,
  LogOut,
  Bell
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, user }) => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleNotifications = () => {
    toast({
      title: "Notifications",
      description: "No new notifications at this time."
    });
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'ielts-ai', label: 'IELTS AI', icon: Brain },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
          >
            <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">IS</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">IELTSSlay</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? 'default' : 'ghost'}
                  onClick={() => onViewChange(item.id)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleNotifications}
            >
              <Bell className="h-4 w-4" />
            </Button>

            {/* User Badge */}
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {profile?.subscription_type || 'Normal'} User
            </Badge>

            {/* User Avatar */}
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-sky-100 text-sky-600">
                  {user.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
            </div>

            {/* Settings & Logout */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onViewChange('settings')}
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
