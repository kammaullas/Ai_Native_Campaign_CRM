import React, { useState, useEffect } from 'react';
import { campaignService, customerService } from '../services/api';
import { Users, Send, CheckCircle2, MousePointerClick, MessageSquare, ShoppingCart } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalCustomers: 0, totalCampaigns: 0, totalConversions: 0 });
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, campaignsRes] = await Promise.all([
          customerService.getCustomers({ limit: 1 }),
          campaignService.getCampaigns()
        ]);
        const campaigns = campaignsRes.data;
        const totalConversions = campaigns.reduce((acc, curr) => acc + (curr.stats.conversions || 0), 0);

        setStats({
          totalCustomers: customersRes.data.total,
          totalCampaigns: campaigns.length,
          totalConversions
        });
        
        setRecentCampaigns(campaigns.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="animate-pulse flex space-x-4">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-slate-400 font-medium">Total Customers</h3>
            <Users className="text-indigo-400" size={20} />
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalCustomers.toLocaleString()}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-slate-400 font-medium">Campaigns Sent</h3>
            <MessageSquare className="text-blue-400" size={20} />
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalCampaigns}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-slate-400 font-medium">Total Conversions</h3>
            <ShoppingCart className="text-amber-400" size={20} />
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalConversions}</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Recent Campaigns</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 text-slate-400 text-sm">
              <tr>
                <th className="px-6 py-3 font-medium">Campaign Name</th>
                <th className="px-6 py-3 font-medium">Segment</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Sent</th>
                <th className="px-6 py-3 font-medium">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recentCampaigns.map((camp) => (
                <tr key={camp._id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-indigo-300">{camp.name}</td>
                  <td className="px-6 py-4 text-slate-300">{camp.segmentId?.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      camp.status === 'RUNNING' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {camp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{camp.stats.sent}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-emerald-400 cursor-help" title="Delivered"><CheckCircle2 size={14}/> {camp.stats.delivered}</span>
                      <span className="flex items-center gap-1 text-blue-400 cursor-help" title="Opened"><MessageSquare size={14}/> {camp.stats.opened}</span>
                      <span className="flex items-center gap-1 text-purple-400 cursor-help" title="Clicked"><MousePointerClick size={14}/> {camp.stats.clicked}</span>
                      <span className="flex items-center gap-1 text-amber-400 cursor-help" title="Conversions (simulated order attribution)"><ShoppingCart size={14}/> {camp.stats.conversions || 0}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {recentCampaigns.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No campaigns found. Launch one from the AI Chat!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
