import React, { useState, useEffect } from 'react';
import { campaignService } from '../services/api';
import { Link } from 'react-router-dom';
import { CheckCircle2, MessageSquare, MousePointerClick } from 'lucide-react';
import { computeHealth } from './CampaignDetail';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    campaignService.getCampaigns().then(res => {
      setCampaigns(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Campaigns</h1>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50 text-slate-400 text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Segment</th>
              <th className="px-6 py-4 font-medium">Channel</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Performance</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            {loading ? (
              <tr><td colSpan="6" className="p-6 text-center text-slate-500">Loading...</td></tr>
            ) : campaigns.map(camp => {
              const health = computeHealth(camp.stats, camp.status);
              return (
              <tr key={camp._id} className="hover:bg-slate-800/20">
                <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                  {camp.name}
                  {health.label !== 'N/A' && (
                    <span 
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold cursor-help ${health.bgClass} ${health.colorClass}`}
                      title="Computed from delivery rate (40%), open rate (35%), and conversion rate (25%)"
                    >
                      {health.score > 0 ? health.score : ''} {health.label}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-300">{camp.segmentId?.name}</td>
                <td className="px-6 py-4 text-slate-400 font-medium">{camp.channel}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    camp.status === 'RUNNING' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {camp.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-3 text-xs font-medium">
                    <span className="text-slate-400" title="Sent">{camp.stats.sent}</span>
                    <span className="text-emerald-400" title="Delivered">{camp.stats.delivered}</span>
                    <span className="text-blue-400" title="Opened">{camp.stats.opened}</span>
                    <span className="text-purple-400" title="Clicked">{camp.stats.clicked}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Link to={`/campaigns/${camp._id}`} className="text-indigo-400 hover:text-indigo-300 font-medium">
                    View Report &rarr;
                  </Link>
                </td>
              </tr>
              );
            })}
            {!loading && campaigns.length === 0 && (
              <tr>
                <td colSpan="6" className="p-12 text-center text-slate-500">No campaigns launched yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
