import React, { useState, useEffect, useCallback } from 'react';
import callApi from '../api';

interface Company {
  id: number;
  name: string;
  short_name: string | null;
  do_number: string | null;
  location: string | null;
}

const InsuranceCompaniesMaster: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const [shortName, setShortName] = useState<string>('');
  const [doNumber, setDoNumber] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState<boolean>(false);
  const [companyToDeleteId, setCompanyToDeleteId] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const showFlashMessage = (type: 'success' | 'error', message: string) => {
    setFlashMessage({ type, message });
  };

  useEffect(() => {
    if (flashMessage) {
      const timer = setTimeout(() => setFlashMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [flashMessage]);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await callApi<any>('/master/insurance-companies.php');
      let rawData: Company[] = [];
      if (response && response.success && Array.isArray(response.data)) {
        rawData = response.data;
      } else if (Array.isArray(response)) {
        rawData = response;
      }
      setCompanies(rawData);
    } catch (err: any) {
      showFlashMessage('error', 'Failed to fetch directory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showFlashMessage('error', 'Company Name is mandatory.');
      return;
    }

    setLoading(true);
    const payload = {
      name: companyName.trim(),
      short_name: shortName.trim(),
      doNumber: doNumber.trim(),
      location: location.trim()
    };

    try {
      if (editingCompanyId !== null) {
        await callApi(`/master/insurance-companies.php?id=${editingCompanyId}`, 'PUT', payload);
        showFlashMessage('success', 'Update successful.');
      } else {
        await callApi('/master/insurance-companies.php', 'POST', payload);
        showFlashMessage('success', 'New record added.');
      }
      setCompanyName('');
      setShortName('');
      setDoNumber('');
      setLocation('');
      setEditingCompanyId(null);
      fetchCompanies();
    } catch (err: any) {
      showFlashMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (company: Company) => {
    setCompanyName(company.name);
    setShortName(company.short_name || '');
    setDoNumber(company.do_number || '');
    setLocation(company.location || '');
    setEditingCompanyId(company.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inputClasses = "w-full bg-white border border-slate-300 rounded-xl py-4 px-5 text-lg font-semibold text-slate-950 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder-slate-400";

  return (
    <div className="p-10 space-y-10 animate-fade-in">
      {flashMessage && (
        <div className={`fixed top-24 right-10 px-8 py-4 rounded-2xl shadow-2xl z-50 text-base font-bold animate-fade-in ${flashMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`} role="alert">
          {flashMessage.message}
        </div>
      )}

      {/* Form Section */}
      <section className="bg-white p-10 rounded-[32px] shadow-card border border-slate-100">
        <h2 className="text-2xl font-black text-slate-900 mb-8 border-b border-slate-50 pb-6 tracking-tight">
          {editingCompanyId !== null ? 'Modify Partner Details' : 'Enroll Insurance Partner'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-slate-700 text-sm font-bold mb-3 ml-1">Company Full Name *</label>
            <input
              type="text"
              className={inputClasses}
              placeholder="Ex: HDFC ERGO General Insurance"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-slate-700 text-sm font-bold mb-3 ml-1">Short Alias</label>
            <input
              type="text"
              className={inputClasses}
              placeholder="e.g. HDFC"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-slate-700 text-sm font-bold mb-3 ml-1">Divisional Office (DO) No.</label>
            <input
              type="text"
              className={inputClasses}
              placeholder="Office Code"
              value={doNumber}
              onChange={(e) => setDoNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-slate-700 text-sm font-bold mb-3 ml-1">Primary Location</label>
            <input
              type="text"
              className={inputClasses}
              placeholder="City Name"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="md:col-span-2 pt-4">
            <button
              type="submit"
              className="bg-primary hover:bg-primary-dark text-white font-black py-4 px-10 rounded-2xl text-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] w-full md:w-auto"
              disabled={loading}
            >
              {editingCompanyId !== null ? 'Update Partner' : 'Confirm Registration'}
            </button>
            {editingCompanyId !== null && (
              <button 
                type="button" 
                onClick={() => { setEditingCompanyId(null); setCompanyName(''); setShortName(''); setDoNumber(''); setLocation(''); }}
                className="ml-6 text-slate-400 font-bold hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Directory Section */}
      <section className="bg-white rounded-[32px] shadow-card border border-slate-100 overflow-hidden">
        <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Partner Directory</h2>
          <span className="bg-white px-4 py-2 rounded-full border border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-400">{companies.length} Records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50/30">
                <th className="px-10 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Sr.</th>
                <th className="px-10 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Entity Name</th>
                <th className="px-10 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Short Name</th>
                <th className="px-10 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">DO Number</th>
                <th className="px-10 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Ops</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {companies.map((company, index) => (
                <tr key={company.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-10 py-6 text-sm text-slate-400 font-black">{index + 1}</td>
                  <td className="px-10 py-6 text-base font-extrabold text-slate-900">{company.name}</td>
                  <td className="px-10 py-6 text-sm text-slate-500 font-bold">{company.short_name || '-'}</td>
                  <td className="px-10 py-6 text-sm text-primary font-black tracking-wider uppercase">{company.do_number || '-'}</td>
                  <td className="px-10 py-6 text-right space-x-6">
                    <button onClick={() => handleEdit(company)} className="text-primary font-black hover:underline text-xs uppercase tracking-widest">Edit</button>
                    <button onClick={() => { setCompanyToDeleteId(company.id); setShowConfirmDeleteModal(true); }} className="text-rose-600 font-black hover:underline text-xs uppercase tracking-widest">Delete</button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-10 py-20 text-center text-slate-400 font-bold">No insurance partners found in directory.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Delete Modal */}
      {showConfirmDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white p-12 rounded-[40px] max-w-md w-full text-center shadow-2xl border border-white/20">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 text-rose-500 text-3xl">🗑️</div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Purge Record?</h3>
            <p className="text-slate-500 font-medium mb-10">This will permanently remove the entity from all master files and distribution charts.</p>
            <div className="flex flex-col gap-4">
              <button onClick={async () => {
                if(companyToDeleteId) {
                  await callApi(`/master/insurance-companies.php?id=${companyToDeleteId}`, 'DELETE');
                  fetchCompanies();
                  setShowConfirmDeleteModal(false);
                }
              }} className="bg-rose-600 text-white px-8 py-4 rounded-2xl font-black text-base shadow-lg shadow-rose-200 transition-all active:scale-95 uppercase tracking-widest">Confirm Erasure</button>
              <button onClick={() => setShowConfirmDeleteModal(false)} className="text-slate-400 font-bold py-4 hover:text-slate-600 transition-colors uppercase tracking-widest text-xs">Abort Operation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceCompaniesMaster;