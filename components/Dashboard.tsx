import React, { useState, useEffect, useCallback } from 'react';
import callApi from '../api';

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  count: number | string;
  helperText: string;
  accent: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, title, count, helperText, accent }) => (
  <div className="bg-white rounded-3xl p-7 flex flex-col justify-between h-48 border border-slate-200/60 shadow-card hover:shadow-lg transition-all hover:-translate-y-1">
    <div className="flex justify-between items-start">
      <div className={`p-3.5 rounded-2xl ${accent} shadow-inner`}>
        {icon}
      </div>
      <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{helperText}</span>
      </div>
    </div>
    <div>
      <p className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{count}</p>
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide opacity-80">{title}</h3>
    </div>
  </div>
);

interface Policy {
  id: number;
  clientName: string;
  policyId: string;
  expiration: string;
  policySource: string;
  assigneeName: string;
  status: 'Paid' | 'Awaiting' | 'Failed';
}

interface AgentPerformance {
  avatar: string;
  name: string;
  policies: number;
  role: string;
  status: string;
}

interface DashboardMetrics {
  activePolicies: number;
  expiringSoon: number;
  needValidation: number;
  recentlyExpired: number;
}

const Dashboard: React.FC = () => {
  const [activePolicyTab, setActivePolicyTab] = useState('Last policies');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('expiration');

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activePolicies: 0,
    expiringSoon: 0,
    needValidation: 0,
    recentlyExpired: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedPolicies, fetchedAgentPerformance, fetchedMetrics] = await Promise.all([
        callApi<Policy[]>('/dashboard/latest-policies.php'),
        callApi<AgentPerformance[]>('/dashboard/agent-performance.php'),
        callApi<DashboardMetrics>('/dashboard/metrics.php'),
      ]);

      if (Array.isArray(fetchedPolicies)) {
        setPolicies(fetchedPolicies.map(policy => ({
          ...policy,
          expiration: policy.expiration ? new Date(policy.expiration).toISOString().split('T')[0] : '',
        })));
      }
      setAgentPerformance(Array.isArray(fetchedAgentPerformance) ? fetchedAgentPerformance : []);
      if (fetchedMetrics && typeof fetchedMetrics === 'object' && !Array.isArray(fetchedMetrics)) {
        setMetrics(fetchedMetrics);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPolicies = (Array.isArray(policies) ? policies : [])
    .filter(policy =>
      (policy.clientName?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (policy.policyId?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
    );

  return (
    <div className="p-10 space-y-10 animate-fade-in">
      <section>
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-2xl font-black text-slate-900 tracking-tight">Executive Summary</h2>
           <button onClick={fetchData} className="text-sm font-bold text-primary hover:underline">Refresh Data</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <MetricCard
            icon={<svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
            title="Active Policies"
            count={metrics.activePolicies}
            helperText="Live"
            accent="bg-emerald-50 border border-emerald-100"
          />
          <MetricCard
            icon={<svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
            title="Expiring Soon"
            count={metrics.expiringSoon}
            helperText="30 Days"
            accent="bg-orange-50 border border-orange-100"
          />
          <MetricCard
            icon={<svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>}
            title="Validation Required"
            count={metrics.needValidation}
            helperText="Review"
            accent="bg-indigo-50 border border-indigo-100"
          />
          <MetricCard
            icon={<svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
            title="Recently Expired"
            count={metrics.recentlyExpired}
            helperText="7 Days"
            accent="bg-rose-50 border border-rose-100"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white rounded-[32px] shadow-card border border-slate-200/60 p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Recent Activity</h2>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              {['Last policies', 'Renew', 'Complete'].map(tab => (
                <button
                  key={tab}
                  className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activePolicyTab === tab ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActivePolicyTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4 mb-8">
            <div className="relative flex-grow">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
               <input
                 type="text"
                 placeholder="Search policies or clients..."
                 className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Client Name</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Policy ID</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Expiration</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {filteredPolicies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-slate-900">{policy.clientName}</td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-slate-500">{policy.policyId}</td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-slate-600 font-mono">{policy.expiration}</td>
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                      <span className={`px-4 py-1.5 inline-flex text-[10px] font-black rounded-full uppercase tracking-widest border ${
                        policy.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                        policy.status === 'Awaiting' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                        'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {policy.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-[32px] shadow-card border border-slate-200/60 p-8">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-8">Agent Leaderboard</h2>
          <div className="space-y-6">
            {agentPerformance.map((agent, index) => (
              <div key={index} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={agent.avatar} alt={agent.name} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 group-hover:ring-primary/20 transition-all" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900 leading-tight">{agent.name}</p>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest opacity-70">{agent.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-primary leading-none">{agent.policies}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Policies</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 h-12 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl transition-all text-sm uppercase tracking-widest border border-slate-200/50">
            View All Partners
          </button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;