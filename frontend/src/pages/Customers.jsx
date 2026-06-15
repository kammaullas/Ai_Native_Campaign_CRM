import React, { useState, useEffect } from 'react';
import { customerService } from '../services/api';
import { format } from 'date-fns';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    customerService.getCustomers({ limit: 100 }).then(res => {
      setCustomers(res.data.customers || []);
      setLoading(false);
    });
  }, []);

  const filteredCustomers = customers.filter(c => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || 
           c.city.toLowerCase().includes(q) || 
           (c.tags && c.tags.some(t => t.toLowerCase().includes(q)));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Customers</h1>
        <input 
          type="text"
          placeholder="Search by name, city, or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg text-sm w-full md:w-72 focus:outline-none focus:border-indigo-500"
        />
      </div>
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 text-slate-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">City</th>
                <th className="px-6 py-4 font-medium">Total Spend</th>
                <th className="px-6 py-4 font-medium">Orders</th>
                <th className="px-6 py-4 font-medium">Last Order</th>
                <th className="px-6 py-4 font-medium">Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {loading ? (
                <tr><td colSpan="7" className="p-6 text-center text-slate-500">Loading...</td></tr>
              ) : filteredCustomers.map(c => (
                <tr key={c._id} className="hover:bg-slate-800/20">
                  <td className="px-6 py-4 font-medium text-white">{c.name}</td>
                  <td className="px-6 py-4 text-slate-400">
                    <div>{c.email}</div>
                    <div className="text-xs">{c.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{c.city}</td>
                  <td className="px-6 py-4 text-emerald-400 font-medium">₹{c.totalSpend.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-300">{c.orderCount}</td>
                  <td className="px-6 py-4 text-slate-400 min-w-[90px] whitespace-nowrap">
                    {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-[4px] flex-wrap items-center">
                      {(c.tags || []).slice(0, 2).map(t => {
                        let colorClass = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
                        if (t === 'VIP' || t === 'Loyal') colorClass = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                        if (t === 'At-Risk' || t === 'Churn Risk') colorClass = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
                        if (t === 'Win-back') colorClass = 'bg-teal-500/10 text-teal-400 border-teal-500/20';
                        
                        return (
                          <span key={t} className={`px-2 py-1 rounded text-xs border whitespace-nowrap ${colorClass}`}>
                            {t}
                          </span>
                        );
                      })}
                      {(c.tags || []).length > 2 && (
                        <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs border border-slate-700 whitespace-nowrap">
                          +{(c.tags || []).length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-500">No customers found matching "{search}".</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
