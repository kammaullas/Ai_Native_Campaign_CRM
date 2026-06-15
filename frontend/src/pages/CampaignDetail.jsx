import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { campaignService } from '../services/api';
import { ArrowLeft, Send, CheckCircle2, MessageSquare, MousePointerClick, AlertCircle, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';

export const computeHealth = (stats, status) => {
  const { sent, delivered, opened, conversions } = stats;
  if (!sent || sent === 0) return { score: 0, label: 'N/A', colorClass: 'text-slate-500', strokeClass: 'stroke-slate-500', bgClass: 'bg-slate-500/10' };
  
  const deliveryScore = delivered ? (delivered / sent) * 40 : 0;
  const engagementScore = opened ? (opened / delivered) * 35 : 0;
  const conversionScore = conversions ? (conversions / opened) * 25 : 0;
  
  const score = Math.round(deliveryScore + engagementScore + conversionScore);
  
  if (status === 'RUNNING') return { score, label: 'Live', colorClass: 'text-blue-400', strokeClass: 'stroke-blue-400', bgClass: 'bg-blue-400/10' };
  
  if (score >= 80) return { score, label: 'Excellent', colorClass: 'text-emerald-400', strokeClass: 'stroke-emerald-400', bgClass: 'bg-emerald-400/10' };
  if (score >= 60) return { score, label: 'Good', colorClass: 'text-amber-400', strokeClass: 'stroke-amber-400', bgClass: 'bg-amber-400/10' };
  if (score >= 40) return { score, label: 'Needs Work', colorClass: 'text-orange-400', strokeClass: 'stroke-orange-400', bgClass: 'bg-orange-400/10' };
  return { score, label: 'Poor', colorClass: 'text-red-400', strokeClass: 'stroke-red-400', bgClass: 'bg-red-400/10' };
};

const HealthDonut = ({ health }) => {
  if (health.label === 'N/A') return null;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (health.score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 mb-2">
      <div className="relative group cursor-help mb-4">
        <svg className="w-[120px] h-[120px] transform -rotate-90">
          <circle cx="60" cy="60" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-700" />
          <circle cx="60" cy="60" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${health.strokeClass} transition-all duration-1000 ease-out`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-[2rem] font-bold ${health.colorClass}`}>{health.score}</span>
        </div>
        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity w-48 bg-slate-800 text-xs text-slate-300 p-2 rounded-lg border border-slate-700 bottom-full left-1/2 -translate-x-1/2 mb-2 text-center pointer-events-none z-10">
          Computed from delivery rate (40%), open rate (35%), and conversion rate (25%)
        </div>
      </div>
      <div className="text-center">
        <h4 className="text-slate-400 text-sm font-medium mb-2">Campaign Health Score</h4>
        <div className={`inline-flex px-4 py-1.5 rounded-full text-sm font-bold ${health.bgClass} ${health.colorClass}`}>
          {health.label}
        </div>
      </div>
    </div>
  );
};

export default function CampaignDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCampaign = async () => {
    try {
      const res = await campaignService.getCampaign(id);
      setData(res.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
    
    // Polling logic
    const interval = setInterval(async () => {
      // Only poll if we have data and it's RUNNING
      if (data && data.campaign.status === 'RUNNING') {
        try {
          const statsRes = await campaignService.getCampaignStats(id);
          setData(prev => ({
            ...prev,
            campaign: { ...prev.campaign, stats: statsRes.data.stats, status: statsRes.data.status }
          }));
        } catch (e) {
          console.error('Polling failed', e);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, data?.campaign?.status]);

  if (loading) return <div className="text-slate-500">Loading campaign report...</div>;
  if (!data) return <div className="text-red-500">Campaign not found</div>;

  const { campaign, logs } = data;
  const { total, sent, delivered, opened, clicked, failed, conversions } = campaign.stats;
  const health = computeHealth(campaign.stats, campaign.status);

  const StatBox = ({ label, value, icon, colorClass, percentOf, subLabel, borderLeftClass = '', valueSizeClass = 'text-2xl' }) => (
    <div className={`bg-slate-800/50 p-4 rounded-xl border border-slate-700 ${borderLeftClass}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={colorClass}>{icon}</span>
          <span className="text-slate-400 font-medium text-sm">{label}</span>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className={`${valueSizeClass} font-bold text-white`}>{value}</span>
        {percentOf > 0 && (
          <span className="text-xs text-slate-500 font-medium">
            {Math.round((value / percentOf) * 100)}%
          </span>
        )}
      </div>
      {subLabel && <div className="text-[10px] text-slate-500 mt-1">{subLabel}</div>}
    </div>
  );

  return (
    <div className="space-y-6">
      <Link to="/campaigns" className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors w-fit">
        <ArrowLeft size={16} /> Back to Campaigns
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{campaign.name}</h1>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            campaign.status === 'RUNNING' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            {campaign.status}
          </span>
          <span className="text-slate-400 text-sm">Target: <span className="text-slate-300 font-medium">{campaign.segmentId?.name}</span> ({total} audience)</span>
          <span className="text-slate-400 text-sm">Channel: <span className="text-slate-300 font-medium">{campaign.channel}</span></span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        {campaign.status === 'COMPLETED' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl mb-6 flex items-center gap-3">
            <CheckCircle2 size={20} />
            <span className="font-medium">Campaign Completed. All messages have reached their final delivery state.</span>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Delivery Performance
            {campaign.status === 'RUNNING' && <span className="text-blue-400 animate-pulse text-sm font-medium px-2 py-0.5 bg-blue-500/10 rounded-full">Live</span>}
          </h3>
        </div>
        
        <HealthDonut health={health} />
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatBox label="Sent" value={sent} icon={<Send size={16}/>} colorClass="text-slate-300" percentOf={total} />
          <StatBox label="Delivered" value={delivered} icon={<CheckCircle2 size={16}/>} colorClass="text-emerald-400" percentOf={sent} borderLeftClass="border-l-[3px] border-l-emerald-500" valueSizeClass="text-4xl" />
          <StatBox label="Opened" value={opened} icon={<MessageSquare size={16}/>} colorClass="text-blue-400" percentOf={delivered} />
          <StatBox label="Clicked" value={clicked} icon={<MousePointerClick size={16}/>} colorClass="text-purple-400" percentOf={opened} />
          <StatBox label="Conversions" value={conversions || 0} icon={<ShoppingCart size={16}/>} colorClass="text-amber-400" percentOf={sent} subLabel="Simulated order attribution" />
          <StatBox label="Failed" value={failed} icon={<AlertCircle size={16}/>} colorClass="text-red-400" percentOf={sent} borderLeftClass="border-l-[3px] border-l-red-500" />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Communication Log</h2>
          <p className="text-sm text-slate-400">Showing {logs.length} of {sent} recipients</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 text-slate-400 text-sm">
              <tr>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Contact</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-800/20">
                  <td className="px-6 py-4 font-medium text-white">{log.customerId?.name}</td>
                  <td className="px-6 py-4 text-slate-400">{log.customerId?.phone}</td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-indigo-300">{log.status}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {format(new Date(log.statusHistory[log.statusHistory.length - 1]?.timestamp || log.updatedAt), 'MMM d, h:mm:ss a')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
