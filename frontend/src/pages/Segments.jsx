import React, { useState, useEffect } from 'react';
import { segmentService } from '../services/api';
import { Users } from 'lucide-react';

export default function Segments({ onOpenChat }) {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    segmentService.getSegments().then(res => {
      setSegments(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Segments</h1>
        <button 
          onClick={onOpenChat}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
        >
          Create via AI Chat
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="text-slate-500">Loading segments...</div>
        ) : segments.map(seg => (
          <div key={seg._id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col h-full hover:border-indigo-500/50 transition-colors">
            <h3 className="text-xl font-bold text-white mb-2">{seg.name}</h3>
            <p className="text-slate-400 text-sm mb-6 flex-1">{seg.description}</p>
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800/50">
              <div className="flex items-center gap-2 text-indigo-400">
                <Users size={18} />
                <span className="font-semibold">{seg.audienceSize.toLocaleString()} matches</span>
              </div>
            </div>
          </div>
        ))}
        {!loading && segments.length === 0 && (
          <div className="col-span-full p-12 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800 border-dashed">
            No segments created yet. Open the AI Chat to build your first audience.
          </div>
        )}
      </div>
    </div>
  );
}
