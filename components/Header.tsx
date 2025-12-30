import React, { useState } from 'react';

interface HeaderProps {
  pageTitle: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ pageTitle, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="flex justify-between items-center h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 sticky top-0 z-10 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)]">
      <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{pageTitle}</h1>
      
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="flex items-center space-x-3 p-1.5 pr-4 rounded-2xl hover:bg-slate-50 transition-all focus:outline-none group border border-transparent hover:border-slate-100"
        >
          <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-sm border border-primary/10 shadow-sm transition-transform group-hover:scale-105">
            AU
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-bold text-slate-900 leading-none mb-1">Admin User</p>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Manager</p>
          </div>
          <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl py-2 z-50 ring-1 ring-slate-200 border border-slate-50 animate-fade-in origin-top-right">
            <div className="px-4 py-3 border-b border-slate-100 mb-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Profile</p>
              <p className="text-sm font-bold text-slate-800 truncate">admin@simplyfinsure.com</p>
            </div>
            <button onClick={() => {}} className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors gap-3">
              <span>👤</span> View Profile
            </button>
            <button onClick={() => {}} className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors gap-3">
              <span>⚙️</span> Settings
            </button>
            <div className="h-px bg-slate-100 my-1 mx-2"></div>
            <button onClick={onLogout} className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors gap-3">
              <span>🚀</span> Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;