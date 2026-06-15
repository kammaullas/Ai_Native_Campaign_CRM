import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, PieChart, MessageSquare, Menu, X } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Segments from './pages/Segments';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import AIChatPanel from './components/AIChatPanel';

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/customers', icon: <Users size={20} />, label: 'Customers' },
    { path: '/segments', icon: <PieChart size={20} />, label: 'Segments' },
    { path: '/campaigns', icon: <MessageSquare size={20} />, label: 'Campaigns' },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 hidden md:block">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          CampaignIQ
        </h1>
      </div>
      <nav className="mt-6 px-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              location.pathname === item.path
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <Router>
      <div className="flex h-screen bg-slate-950 overflow-hidden font-sans text-slate-200">
        <Sidebar />
        
        <main className="flex-1 flex flex-col relative">
          <div className="md:hidden p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
            <h1 className="font-bold text-lg">CampaignIQ</h1>
            <button><Menu /></button>
          </div>
          
          <div className="flex-1 overflow-auto p-6 md:p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/segments" element={<Segments onOpenChat={() => setIsChatOpen(true)} />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/campaigns/:id" element={<CampaignDetail />} />
            </Routes>
          </div>

          {/* Floating AI Action Button */}
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="fixed bottom-6 right-6 p-4 bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-transform hover:scale-105 z-50 flex items-center justify-center group"
          >
            {isChatOpen ? <X size={24} /> : (
              <div className="flex items-center gap-2">
                <span className="sparkles-icon">✨</span>
                <span className="font-semibold hidden group-hover:inline-block w-0 overflow-hidden group-hover:w-auto ml-1 transition-all">AI Assist</span>
              </div>
            )}
          </button>

          {/* AI Chat Panel */}
          {isChatOpen && (
            <div className="fixed bottom-24 right-6 w-96 h-[600px] max-h-[80vh] z-40 bg-slate-900 border border-indigo-500/30 shadow-2xl shadow-indigo-500/10 rounded-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                    ✨
                  </div>
                  <div>
                    <h3 className="font-bold text-white">CampaignIQ AI</h3>
                    <p className="text-xs text-indigo-300">Online & ready</p>
                  </div>
                </div>
              </div>
              <AIChatPanel onClose={() => setIsChatOpen(false)} />
            </div>
          )}
        </main>
      </div>
    </Router>
  );
}

export default App;
