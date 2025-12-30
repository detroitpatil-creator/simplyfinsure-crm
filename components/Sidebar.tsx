import React, { useState } from 'react';

const logoUrl = 'https://raw.githubusercontent.com/detroitpatil-creator/simply-finsure-assets/refs/heads/main/simply-finsure-logo.png';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  onNavigate: (itemName: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleCollapse, onNavigate }) => {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [isMastersOpen, setIsMastersOpen] = useState(false);
  const [isPayoutsOpen, setIsPayoutsOpen] = useState(false);
  const [isRenewalsOpen, setIsRenewalsOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);

  const handleItemClick = (itemName: string) => {
    setActiveItem(itemName);
    onNavigate(itemName);
  };

  const menuItems = [
    { name: 'Dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
    )},
    { 
      name: 'Masters', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>,
      subItems: ['Insurance Companies', 'Policy Type']
    },
    { name: 'Policies', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
    )},
    { name: 'Documents', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
    )},
    { 
      name: 'Renewals', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
      subItems: ['Upcoming', 'Overdue']
    },
    { name: 'Clients', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2h2m0 0l4 4m-4-4l-4 4m0 0l9-9m-9 9V8.5M17 20v-7a2 2 0 00-2-2H9a2 2 0 00-2 2v7m-8 0h14"></path></svg>
    )},
    { name: 'Agents', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
    )},
    { 
      name: 'Payouts', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
      subItems: ['Commissions', 'Statements']
    },
    { 
      name: 'Reports', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>,
      subItems: ['Policy to Excel']
    },
  ];

  const isDropdownOpen = (name: string) => {
    if (name === 'Masters') return isMastersOpen;
    if (name === 'Renewals') return isRenewalsOpen;
    if (name === 'Payouts') return isPayoutsOpen;
    if (name === 'Reports') return isReportsOpen;
    return false;
  };

  const toggleDropdown = (name: string) => {
    if (isCollapsed) {
       toggleCollapse(); // Expand sidebar if someone clicks a dropdown icon while collapsed
    }
    if (name === 'Masters') setIsMastersOpen(!isMastersOpen);
    else if (name === 'Renewals') setIsRenewalsOpen(!isRenewalsOpen);
    else if (name === 'Payouts') setIsPayoutsOpen(!isPayoutsOpen);
    else if (name === 'Reports') setIsReportsOpen(!isReportsOpen);
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200 p-5 flex flex-col z-20 shadow-sm transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'}`}
    >
      <div className={`mb-10 px-2 flex justify-center ${isCollapsed ? 'px-0' : ''}`}>
        <img
          src={logoUrl}
          alt="Simply Finsure"
          className={`h-[68px] object-contain transition-all duration-300 ${isCollapsed ? 'scale-75' : 'w-full'}`}
        />
      </div>

      <nav className="flex-grow space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = activeItem === item.name || (item.subItems && item.subItems.includes(activeItem));
          const hasDropdown = !!item.subItems;
          const isOpen = isDropdownOpen(item.name);

          return (
            <div key={item.name} className="relative group">
              <button
                className={`flex items-center w-full py-3 px-4 rounded-xl text-left transition-all duration-200
                  ${isActive ? 'bg-primary/5 text-primary font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                  ${isCollapsed ? 'justify-center' : 'gap-3'}
                `}
                onClick={() => {
                  if (hasDropdown) toggleDropdown(item.name);
                  else handleItemClick(item.name);
                }}
              >
                <span className={`${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`}>{item.icon}</span>
                {!isCollapsed && (
                  <>
                    <span className="flex-grow text-sm tracking-tight font-semibold">{item.name}</span>
                    {hasDropdown && (
                      <svg className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                    )}
                  </>
                )}
              </button>

              {/* Dropdown Content */}
              {!isCollapsed && hasDropdown && isOpen && (
                <div className="mt-1 ml-9 space-y-1 animate-fade-in origin-top">
                  {item.subItems?.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => handleItemClick(sub)}
                      className={`flex items-center w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-all
                        ${activeItem === sub ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}
                      `}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full mr-3 transition-all ${activeItem === sub ? 'bg-primary scale-125' : 'bg-slate-200'}`}></div>
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-100 pt-5">
        <button
          className="flex items-center justify-center w-full h-12 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100 shadow-sm"
          onClick={toggleCollapse}
        >
          <svg className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;