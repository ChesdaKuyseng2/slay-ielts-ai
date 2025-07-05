
import React, { useState } from 'react';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import IeltsAI from '@/components/IeltsAI';
import Analytics from '@/components/Analytics';
import History from '@/components/History';

const Index = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  // Mock user data
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'JD'
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
      case 'profile':
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h1 className="text-2xl font-bold mb-4">User Profile</h1>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <div className="mt-1 text-lg">{user.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 text-lg">{user.email}</div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView}
        user={user}
      />
      <main className="pb-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
