import React, { useState, useEffect, useCallback } from 'react';
import AgentForm from './AgentForm';
import callApi from '../api';

interface Agent {
  id: number;
  agentCode: string;
  agentName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  rank: string;
  introducerCode: string | null;
  joiningDate: string;
  status: boolean;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  panNumber: string;
  createdAt: number;
  updatedAt: number;
}

type AgentView = 'list' | 'add' | 'edit';

const AgentManager: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<keyof Agent>('agentCode');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  const [currentView, setCurrentView] = useState<AgentView>('list'); 
  const [agentToEdit, setAgentToEdit] = useState<Partial<Agent> | undefined>(undefined);

  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState<boolean>(false);
  const [agentToDeleteId, setAgentToDeleteId] = useState<number | null>(null);

  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const showFlashMessage = (type: 'success' | 'error', message: string) => {
    setFlashMessage({ type, message });
  };

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedAgents = await callApi<Agent[]>('/agents.php'); 
      if (Array.isArray(fetchedAgents)) {
        setAgents(fetchedAgents.map(agent => ({
          ...agent,
          joiningDate: agent.joiningDate ? new Date(agent.joiningDate).toISOString().split('T')[0] : '',
        })));
      } else {
        setAgents([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch agents.');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    if (flashMessage) {
      const timer = setTimeout(() => setFlashMessage(null), 3000); 
      return () => clearTimeout(timer);
    }
  }, [flashMessage]);

  const filteredAndSortedAgents = (Array.isArray(agents) ? agents : [])
    .filter(agent =>
      (agent.agentName?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (agent.agentCode?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (agent.email?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (agent.phone?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (agent.panNumber?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let valA: string | number | boolean = a[sortBy] ?? '';
      let valB: string | number | boolean = b[sortBy] ?? '';
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredAndSortedAgents.length / itemsPerPage);
  const paginatedAgents = filteredAndSortedAgents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleSort = (column: keyof Agent) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  return (
    <div className="p-12 max-w-[1600px] mx-auto space-y-16 animate-fade-in bg-[#f6f7f5] min-h-screen">
      {flashMessage && (
        <div
          className={`fixed top-28 right-12 px-10 py-5 rounded-2xl shadow-2xl z-50 transition-all duration-300 ${flashMessage.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
          role="alert"
        >
          <div className="flex items-center space-x-4 text-xl font-bold">
            {flashMessage.type === 'success' ? '✅' : '⚠️'}
            <span>{flashMessage.message}</span>
          </div>
        </div>
      )}

      {currentView === 'list' ? (
        <>
          <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
            <div className="space-y-3">
               <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Distribution Partners</h2>
               <p className="text-gray-400 font-black uppercase tracking-[0.4em] text-[12px] opacity-70">Overseeing {agents.length} Professional Entities</p>
            </div>
            <div className="flex gap-6">
              <button onClick={() => showFlashMessage('success', 'Syncing metadata...')} className="px-10 py-6 border-2 border-gray-200 rounded-[32px] text-gray-500 font-black hover:bg-gray-50 transition-all uppercase tracking-widest text-[12px] shadow-sm">
                Data Sync
              </button>
              <button onClick={() => setCurrentView('add')} className="px-12 py-6 bg-[#1f4aa8] hover:bg-blue-800 text-white font-black rounded-[32px] shadow-2xl transition-all active:scale-[0.98] uppercase tracking-[0.3em] text-[12px]">
                Enroll Partner
              </button>
            </div>
          </section>

          <section className="bg-white rounded-[50px] shadow-sm border border-gray-100 p-3">
            <input
              type="text"
              placeholder="QUICK GLOBAL QUERY (NAME, PAN, ID...)"
              className="w-full p-9 bg-white border-2 border-gray-100 rounded-[45px] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-black text-2xl placeholder-gray-200 tracking-tight shadow-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </section>

          <section className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-12 py-10 border-b border-gray-50 flex justify-between items-center bg-[#fcfcfc]">
              <h2 className="text-base font-black text-gray-800 uppercase tracking-[0.3em]">Directory View</h2>
              <span className="bg-blue-50 text-[#1f4aa8] text-[12px] font-black px-6 py-3 rounded-full uppercase tracking-widest border border-blue-100 shadow-sm">
                Primary Master
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-[#fcfcfc]">
                    <th className="px-12 py-8 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Sr.</th>
                    <th className="px-12 py-8 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest cursor-pointer border-b border-gray-50" onClick={() => handleSort('agentName')}>Partner Profile</th>
                    <th className="px-12 py-8 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Intelligence</th>
                    <th className="px-12 py-8 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Compliance</th>
                    <th className="px-12 py-8 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Status</th>
                    <th className="px-12 py-8 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Ops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedAgents.map((agent, index) => (
                    <tr key={agent.id} className="hover:bg-blue-50/10 transition-colors group">
                      <td className="px-12 py-10 whitespace-nowrap text-base text-gray-400 font-black">{(currentPage-1)*itemsPerPage + index + 1}</td>
                      <td className="px-12 py-10 whitespace-nowrap">
                        <div className="text-xl font-black text-gray-900 tracking-tight">{agent.agentName}</div>
                        <div className="text-sm text-[#1f4aa8] mt-2 uppercase font-black tracking-widest opacity-80">{agent.agentCode}</div>
                      </td>
                      <td className="px-12 py-10 whitespace-nowrap">
                         <div className="text-base font-bold text-gray-600">{agent.email}</div>
                         <div className="text-[12px] text-gray-400 mt-2 uppercase font-black tracking-tighter opacity-70">{agent.phone}</div>
                      </td>
                      <td className="px-12 py-10 whitespace-nowrap">
                        <span className="text-[12px] bg-white px-6 py-2.5 rounded-2xl text-gray-700 font-black border border-gray-100 uppercase tracking-widest shadow-sm">
                          {agent.panNumber}
                        </span>
                        <div className="mt-2 text-[11px] text-indigo-500 font-black uppercase tracking-widest">{agent.rank}</div>
                      </td>
                      <td className="px-12 py-10 whitespace-nowrap">
                         <span className={`px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest ${agent.status ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                           {agent.status ? 'Verified' : 'On Hold'}
                         </span>
                      </td>
                      <td className="px-12 py-10 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setAgentToEdit(agent); setCurrentView('edit'); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-4 text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all shadow-sm"><svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                          <button onClick={() => { setAgentToDeleteId(agent.id); setShowConfirmDeleteModal(true); }} className="p-4 text-red-600 hover:bg-red-50 rounded-2xl transition-all shadow-sm"><svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="p-12 border-t border-gray-50 flex justify-center space-x-6 bg-[#fcfcfc]">
                 {Array.from({length: totalPages}).map((_, i) => (
                   <button key={i} onClick={() => handlePageChange(i+1)} className={`w-16 h-16 rounded-3xl font-black text-xl transition-all shadow-sm ${currentPage === i+1 ? 'bg-[#1f4aa8] text-white shadow-2xl scale-110' : 'bg-white text-gray-300 border border-gray-100 hover:bg-gray-50 hover:text-gray-500'}`}>
                     {i+1}
                   </button>
                 ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <AgentForm
          initialAgentData={agentToEdit}
          isEditing={currentView === 'edit'}
          onSave={async (a) => {
             setLoading(true);
             try {
               const method = currentView === 'edit' ? 'PUT' : 'POST';
               const endpoint = currentView === 'edit' ? `/agents.php?id=${a.id}` : '/agents.php';
               await callApi(endpoint, method, a);
               showFlashMessage('success', `Agent ${currentView === 'edit' ? 'updated' : 'enrolled'} successfully.`);
               setCurrentView('list');
               fetchAgents();
             } catch(e: any) {
               showFlashMessage('error', e.message);
             } finally { setLoading(false); }
          }}
          onCancel={() => setCurrentView('list')}
          showFlashMessage={showFlashMessage}
          existingAgentCodes={agents.map(a => a.agentCode)}
          existingPanNumbers={agents.map(a => a.panNumber)}
          loading={loading}
        />
      )}

      {showConfirmDeleteModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-[50px] shadow-2xl w-full max-w-sm overflow-hidden p-16 text-center border border-white/20">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-10 border border-red-100">
               <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-base font-black text-gray-900 mb-6 uppercase tracking-[0.3em]">Purge Profile?</h3>
            <p className="text-gray-400 text-xs font-bold mb-12 leading-relaxed uppercase tracking-widest opacity-80 px-4">Permanent removal from internal master directories.</p>
            <div className="flex flex-col space-y-4">
               <button onClick={async () => {
                 if(agentToDeleteId) {
                   setLoading(true);
                   try {
                     await callApi(`/agents.php?id=${agentToDeleteId}`, 'DELETE');
                     showFlashMessage('success', 'Profile purged.');
                     fetchAgents();
                   } catch(e: any) { showFlashMessage('error', e.message); }
                   finally { setLoading(false); setShowConfirmDeleteModal(false); }
                 }
               }} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-6 rounded-[28px] shadow-lg transition-all uppercase tracking-widest text-[12px]">Confirm Erasure</button>
               <button onClick={() => setShowConfirmDeleteModal(false)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-400 font-black py-6 rounded-[28px] transition-all uppercase tracking-widest text-[12px]">Abort</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentManager;