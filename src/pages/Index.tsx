
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import IeltsAI from '@/components/IeltsAI';
import Analytics from '@/components/Analytics';
import History from '@/components/History';
import Settings from '@/components/Settings';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const userData = {
    name: user?.user_metadata?.full_name || 'User',
    email: user?.email || '',
    avatar: user?.user_metadata?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={setCurrentView} />;
      case 'ielts-ai':
        return <IeltsAI onViewChange={setCurrentView} />;
      case 'analytics':
        return <Analytics />;
      case 'history':
        return <History />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h1 className="text-2xl font-bold mb-4">User Profile</h1>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <div className="mt-1 text-lg">{userData.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 text-lg">{userData.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current IELTS Score</label>
                  <div className="mt-1 text-lg font-semibold text-sky-600">7.5</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Score</label>
                  <div className="mt-1 text-lg font-semibold text-green-600">8.0</div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard onViewChange={setCurrentView} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView}
        user={userData}
      />
      <main className="pb-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
