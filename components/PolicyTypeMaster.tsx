import React, { useState, useEffect, useCallback } from 'react';
import callApi from '../api';

interface PolicyType {
  id: number;
  category_name: string;
}

const PolicyTypeMaster: React.FC = () => {
  const [policyTypes, setPolicyTypes] = useState<PolicyType[]>([]);
  const [categoryNameInput, setCategoryNameInput] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const triggerFlash = (type: 'success' | 'error', message: string) => {
    setFlash({ type, message });
  };

  useEffect(() => {
    if (flash) {
      const timer = setTimeout(() => setFlash(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  const fetchPolicyTypes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await callApi<any>('/master/policy-types.php');
      let data: PolicyType[] = [];
      
      if (response && response.success && Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response)) {
        data = response;
      }
      
      // Sort by ID to ensure sequence (Sr.) remains stable based on creation order
      const sortedData = [...data].sort((a, b) => a.id - b.id);
      setPolicyTypes(sortedData);
    } catch (err: any) {
      console.error('Fetch error:', err);
      triggerFlash('error', 'Database connection error or table missing.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicyTypes();
  }, [fetchPolicyTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryNameInput.trim()) return;

    setLoading(true);
    try {
      const payload = { category_name: categoryNameInput.trim() };
      
      if (editingId !== null) {
        await callApi(`/master/policy-types.php?id=${editingId}`, 'PUT', payload);
        triggerFlash('success', 'Category updated successfully.');
      } else {
        await callApi('/master/policy-types.php', 'POST', payload);
        triggerFlash('success', 'New category added to the series.');
      }
      
      setCategoryNameInput('');
      setEditingId(null);
      await fetchPolicyTypes();
    } catch (err: any) {
      triggerFlash('error', err.message || 'The server encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 space-y-10 animate-fade-in">
      {flash && (
        <div className={`fixed top-24 right-10 px-8 py-4 rounded-2xl shadow-2xl z-50 text-base font-bold animate-fade-in ${flash.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`} role="alert">
          {flash.message}
        </div>
      )}

      {/* Input Form */}
      <section className="bg-white p-10 rounded-[32px] shadow-card border border-slate-100">
        <h2 className="text-2xl font-black text-slate-900 mb-8 border-b border-slate-50 pb-6 tracking-tight">
          {editingId !== null ? 'Modify Category' : 'Register New Policy Category'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-slate-700 text-sm font-bold mb-3 ml-1">Category Name *</label>
            <input
              type="text"
              className="w-full bg-white border border-slate-300 rounded-xl py-4 px-5 text-lg font-semibold text-slate-950 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder-slate-400 disabled:opacity-50"
              placeholder="e.g. Health, Life, Marine"
              value={categoryNameInput}
              onChange={(e) => setCategoryNameInput(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="bg-primary hover:bg-primary-dark text-white font-black py-4 px-10 rounded-2xl text-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] h-[64px] flex items-center justify-center gap-3 min-w-[180px] disabled:opacity-50"
              disabled={loading}
            >
              {loading && <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {editingId !== null ? 'Update' : 'Add to Master'}
            </button>
          </div>
        </form>
      </section>

      {/* Table Section */}
      <section className="bg-white rounded-[32px] shadow-card border border-slate-100 overflow-hidden">
        <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Policy Category Series</h2>
          <span className="bg-white px-4 py-2 rounded-full border border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-400">{policyTypes.length} Total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50/30">
                <th className="px-10 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest w-24">Sr.</th>
                <th className="px-10 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Category Name</th>
                <th className="px-10 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {policyTypes.map((pt, index) => (
                <tr key={pt.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-10 py-6 text-sm text-slate-400 font-black">{index + 1}</td>
                  <td className="px-10 py-6 text-lg font-extrabold text-slate-900">{pt.category_name}</td>
                  <td className="px-10 py-6 text-right space-x-6">
                    <button 
                      onClick={() => { 
                        setCategoryNameInput(pt.category_name); 
                        setEditingId(pt.id); 
                        window.scrollTo({ top: 0, behavior: 'smooth' }); 
                      }} 
                      className="text-primary font-black hover:underline text-xs uppercase tracking-widest disabled:opacity-30" 
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => { 
                        setDeleteTargetId(pt.id); 
                        setShowDeleteModal(true); 
                      }} 
                      className="text-rose-600 font-black hover:underline text-xs uppercase tracking-widest disabled:opacity-30" 
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {policyTypes.length === 0 && !loading && (
                <tr>
                   <td colSpan={3} className="px-10 py-24 text-center">
                     <div className="flex flex-col items-center gap-4">
                       <span className="text-4xl grayscale opacity-20">📁</span>
                       <div>
                         <p className="text-slate-400 font-black text-sm uppercase tracking-widest">Master list is empty</p>
                         <p className="text-slate-300 text-xs font-bold mt-1">Please ensure the database tables are migrated.</p>
                       </div>
                     </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white p-12 rounded-[40px] max-w-md w-full text-center shadow-2xl border border-white/20">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 text-rose-500 text-3xl">🗑️</div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Remove from Series?</h3>
            <p className="text-slate-500 font-medium mb-10">This will remove category #{policyTypes.findIndex(p => p.id === deleteTargetId) + 1} from the directory.</p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={async () => {
                  if(deleteTargetId) {
                    setLoading(true);
                    try {
                      await callApi(`/master/policy-types.php?id=${deleteTargetId}`, 'DELETE');
                      await fetchPolicyTypes();
                      setShowDeleteModal(false);
                      triggerFlash('success', 'Category removed successfully.');
                    } catch (e: any) {
                      triggerFlash('error', e.message);
                    } finally {
                      setLoading(false);
                    }
                  }
                }} 
                className="bg-rose-600 text-white px-8 py-4 rounded-2xl font-black text-base shadow-lg shadow-rose-200 transition-all active:scale-95 uppercase tracking-widest"
              >
                Delete Record
              </button>
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="text-slate-400 font-bold py-4 hover:text-slate-600 transition-colors uppercase tracking-widest text-xs"
              >
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyTypeMaster;