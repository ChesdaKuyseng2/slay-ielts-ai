
import React, { useState } from 'react';
import { Bell, ChevronDown, User, BarChart3, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, user }) => {
  const [notifications] = useState(3); // Mock notification count

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'ielts-ai', label: 'IELTS AI' },
  ];

  return (
    <header className="bg-white border-b border-sky-100 px-6 py-4 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left - Logo */}
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-sky-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IS</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">IELTSSlay</h1>
          </div>

          {/* Center - Navigation */}
          <nav className="flex space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right - Notifications & Profile */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5 text-gray-600" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.25rem] h-5 bg-sky-500 text-white text-xs">
                  {notifications}
                </Badge>
              )}
            </Button>
          </div>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 px-3">
                <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-sky-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.name || 'User'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-medium">{user?.name || 'John Doe'}</p>
                <p className="text-xs text-gray-500">{user?.email || 'john@example.com'}</p>
              </div>
              <DropdownMenuItem onClick={() => onViewChange('analytics')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>Analytics</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewChange('profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>View Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
