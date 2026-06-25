import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PackageSearch,
  Box,
  ClipboardList,
  Tags,
  Truck,
  Bell,
  Search,
  CheckCircle2,
  AlertCircle,
  CheckCheck,
  X,
  Trash2,
  Filter,
  Receipt,
  User,
  Settings,
  ChevronDown,
  Info
} from "lucide-react";

// Mock Notifications Data
const initialNotifications = [
  { 
    id: "N001", 
    type: "stock_alert", 
    title: "Critical Low Stock", 
    message: "ErgoGrip Mechanical Keyboard (SKU-8832) is down to 20 units, below the reorder level of 30.", 
    timestamp: "10 minutes ago", 
    isRead: false 
  },
  { 
    id: "N002", 
    type: "sale", 
    title: "POS Transaction Completed", 
    message: "Receipt #10492 generated. Total: ₱12,840. Cashier: Juan (EMP-042).", 
    timestamp: "35 minutes ago", 
    isRead: false 
  },
  { 
    id: "N003", 
    type: "stock_log", 
    title: "Stock Adjustment Recorded", 
    message: "Successfully logged +15 units for TitanX Gaming Mouse. Adjusted by Admin (AD).", 
    timestamp: "2 hours ago", 
    isRead: false 
  },
  { 
    id: "N004", 
    type: "system", 
    title: "System Maintenance Complete", 
    message: "OptiStock Intelligence Layer v3.5 successfully deployed. All nodes and POS terminals are synced.", 
    timestamp: "1 day ago", 
    isRead: true 
  },
  { 
    id: "N005", 
    type: "user", 
    title: "New User Registration", 
    message: "Store Manager profile created for Maria Santos (EMP-014).", 
    timestamp: "2 days ago", 
    isRead: true 
  },
  { 
    id: "N006", 
    type: "stock_alert", 
    title: "Out of Stock Warning", 
    message: "Old Gen Phone Cases (SKU-7731) inventory has reached 0. Immediate restock required.", 
    timestamp: "3 days ago", 
    isRead: true 
  }
];

function Notifications() {
  const [notifications, setNotifications] = useState(initialNotifications);
  
  // UI & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All"); 

  // Custom Dropdown States
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  const filterRef = useRef(null);
  const notifRef = useRef(null);

  // Modal & Animation States
  const [isClosing, setIsClosing] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({ isOpen: false, action: null });

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: "", type: "success", isClosing: false });
  const toastTimeout = useRef(null);
  const toastExitTimeout = useRef(null);

  // Derived Stats
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Handle click outside for custom dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) setIsFilterDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter Logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            notification.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesFilter = true;
      if (filterType === "Unread") matchesFilter = !notification.isRead;
      else if (filterType === "Sales") matchesFilter = notification.type === "sale";
      else if (filterType === "Stock Alerts") matchesFilter = notification.type === "stock_alert";
      else if (filterType === "Stock Logs") matchesFilter = notification.type === "stock_log";
      else if (filterType === "System") matchesFilter = ["system", "user"].includes(notification.type);

      return matchesSearch && matchesFilter;
    });
  }, [notifications, searchQuery, filterType]);

  // Toast Handlers
  const showToast = (message, type = "success") => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    if (toastExitTimeout.current) clearTimeout(toastExitTimeout.current);
    
    setToast({ show: false, message: "", type, isClosing: false });
    
    setTimeout(() => {
      setToast({ show: true, message, type, isClosing: false });
      toastTimeout.current = setTimeout(() => {
        setToast(prev => ({ ...prev, isClosing: true }));
        toastExitTimeout.current = setTimeout(() => {
          setToast({ show: false, message: "", type: "success", isClosing: false });
        }, 300);
      }, 4700);
    }, 50);
  };

  const manuallyCloseToast = () => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    if (toastExitTimeout.current) clearTimeout(toastExitTimeout.current);

    setToast(prev => ({ ...prev, isClosing: true }));
    toastExitTimeout.current = setTimeout(() => {
      setToast({ show: false, message: "", type: "success", isClosing: false });
    }, 300);
  };

  // Action Handlers
  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    showToast("All notifications marked as read.", "success");
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
    showToast("Notification deleted.", "success");
  };

  const openClearAllModal = () => {
    if (notifications.length === 0) return;
    setConfirmModalConfig({ isOpen: true, action: 'clearAll' });
    setIsClosing(false);
  };

  const closeConfirmModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setConfirmModalConfig({ isOpen: false, action: null });
      setIsClosing(false);
    }, 300);
  };

  const executeConfirmAction = () => {
    if (confirmModalConfig.action === 'clearAll') {
      setNotifications([]);
      showToast("All notifications have been cleared.", "success");
    }
    closeConfirmModal();
  };

  // Dedicated Styling per Type
  const getTypeStyles = (type) => {
    switch(type) {
      case 'stock_alert':
        return { icon: <AlertCircle size={20} className="text-[#D96B5E]" />, bg: "bg-[#FAD2CB]/40 border-[#FAD2CB]" };
      case 'sale':
        return { icon: <Receipt size={20} className="text-[#7BB8A7]" />, bg: "bg-[#C3ECE3]/40 border-[#C3ECE3]" };
      case 'stock_log':
        return { icon: <ClipboardList size={20} className="text-[#1A1A1A]" />, bg: "bg-[#EFE9DF] border-[#E7E5E4]" };
      case 'user':
        return { icon: <User size={20} className="text-[#57534E]" />, bg: "bg-[#FAF7F2] border-[#E7E5E4]" };
      case 'system':
      default:
        return { icon: <Settings size={20} className="text-[#57534E]" />, bg: "bg-[#FAF7F2] border-[#E7E5E4]" };
    }
  };

  return (
    <div className="min-h-screen bg-[#EFE9DF] font-sans flex text-[#1A1A1A] overflow-hidden">
      
      {/* Background Subtle Overlays */}
      <div className="absolute inset-0 z-0 opacity-[0.03] bg-[radial-gradient(#1A1A1A_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

      {/* SIDEBAR */}
      <aside className="w-64 bg-[#FAF7F2] border-r border-[#E7E5E4] hidden lg:flex flex-col relative z-20 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-6 flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#D96B5E] rounded-xl flex items-center justify-center shadow-sm">
            <PackageSearch size={20} className="text-[#FFFFFF]" />
          </div>
          <span className="text-[#1A1A1A] font-black text-xl tracking-tight">OptiStock</span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link to="/inventory-hub" className="flex items-center gap-3 px-4 py-3 text-[#57534E] hover:bg-[#EFE9DF] rounded-xl font-bold transition-colors cursor-pointer">
            <Box size={18} /> Inventory Hub
          </Link>
          <Link to="/stock-adjustments" className="flex items-center gap-3 px-4 py-3 text-[#57534E] hover:bg-[#EFE9DF] rounded-xl font-bold transition-colors cursor-pointer">
            <ClipboardList size={18} /> Stock Adjustments
          </Link>
          <Link to="/categories" className="flex items-center gap-3 px-4 py-3 text-[#57534E] hover:bg-[#EFE9DF] rounded-xl font-bold transition-colors cursor-pointer">
            <Tags size={18} /> Categories
          </Link>
          <Link to="/suppliers" className="flex items-center gap-3 px-4 py-3 text-[#57534E] hover:bg-[#EFE9DF] rounded-xl font-bold transition-colors cursor-pointer">
            <Truck size={18} /> Suppliers
          </Link>
          
          {/* Active Notifications Tab */}
          <div className="pt-4 pb-2">
            <div className="h-px w-full bg-[#E7E5E4] mb-4"></div>
            <Link to="/notifications" className="flex items-center justify-between px-4 py-3 bg-[#1A1A1A] text-[#FFFFFF] rounded-xl font-bold shadow-md cursor-pointer">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-[#FCD59E]" /> Notifications
              </div>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-[#D96B5E] text-[#FFFFFF] text-[10px] font-black rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </nav>
        
        <div className="p-6 border-t border-[#E7E5E4]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#57534E]">System v3.5</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10">
        
        {/* --- FIXED STICKY WRAPPER (Header + Controls Pinagsama) --- */}
        <div className="sticky top-0 z-40 flex flex-col">
          
          {/* 1. Header Portion */}
          <header className="flex items-center justify-between p-6 lg:px-10 border-b border-[#E7E5E4] bg-[#FAF7F2]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#57534E]">System Alerts</p>
              <h1 className="text-2xl font-black tracking-tight text-[#1A1A1A]">Notifications</h1>
            </div>

            <div className="flex items-center gap-4">
              
              {/* --- NOTIFICATION DROPDOWN PREVIEW --- */}
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                  className={`relative p-2.5 border rounded-full transition-all shadow-sm cursor-pointer flex items-center justify-center ${
                    isNotifDropdownOpen 
                      ? 'bg-[#1A1A1A] border-[#1A1A1A] text-[#FFFFFF]' 
                      : 'bg-[#1A1A1A] border-[#1A1A1A] text-[#FFFFFF]' // Since we're ON the notifications page, make it look permanently active initially or stick to standard dark
                  }`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-[#D96B5E] rounded-full border-2 border-[#1A1A1A]"></span>
                  )}
                </button>

                <div className={`absolute top-full right-0 mt-3 w-80 sm:w-[340px] bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-200 origin-top-right ${isNotifDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                  
                  {/* Header */}
                  <div className="p-4 border-b border-[#E7E5E4] bg-[#FAF7F2] flex items-center justify-between shrink-0">
                    <h3 className="font-black text-[#1A1A1A] text-sm">Notifications Preview</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-black bg-[#D96B5E]/10 text-[#D96B5E] px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {unreadCount} New
                      </span>
                    )}
                  </div>

                  {/* Previews List - WITH overscroll-contain */}
                  <div className="flex-1 overflow-y-auto max-h-[50vh] custom-scrollbar overscroll-contain">
                    {notifications.slice(0, 8).map(notif => {
                      const prevStyles = getTypeStyles(notif.type);
                      return (
                        <div 
                          key={notif.id} 
                          className={`p-4 border-b border-[#E7E5E4] last:border-b-0 hover:bg-[#FAF7F2] transition-colors cursor-pointer flex items-start gap-3 ${notif.isRead ? 'opacity-70 bg-[#FAF7F2]/50' : 'bg-[#FFFFFF]'}`}
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${prevStyles.bg}`}>
                            {prevStyles.icon}
                          </div>
                          
                          <div className="flex flex-col flex-1 pr-2">
                            <span className="text-sm font-bold text-[#1A1A1A] leading-tight">{notif.title}</span>
                            <span className="text-[10px] text-[#A8A29E] font-black mt-1.5 uppercase tracking-wider">{notif.timestamp}</span>
                          </div>
                          
                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full bg-[#D96B5E] shrink-0 mt-2"></div>
                          )}
                        </div>
                      )
                    })}
                    {notifications.length === 0 && (
                      <div className="p-8 text-center text-[#57534E] text-sm font-medium">
                        You're all caught up!
                      </div>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="p-3 border-t border-[#E7E5E4] bg-[#FFFFFF] shrink-0">
                    <button 
                      onClick={() => setIsNotifDropdownOpen(false)}
                      className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-widest text-[#1A1A1A] bg-[#FAF7F2] hover:bg-[#EFE9DF] rounded-xl transition-colors cursor-pointer"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pl-4 border-l border-[#E7E5E4]">
                <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center font-black text-[#FFFFFF] text-sm shadow-sm">
                  AD
                </div>
              </div>
            </div>
          </header>

          {/* 2. Controls Bar Portion (Solid Background para hindi aninag) */}
          <div className="bg-[#EFE9DF] px-6 lg:px-10 py-4 relative">
            <div className="max-w-5xl mx-auto w-full bg-[#FFFFFF] p-4 sm:p-5 rounded-3xl shadow-sm border border-[#E7E5E4] flex flex-col lg:flex-row gap-4 justify-between items-center relative z-20">
              
              {/* Search */}
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57534E]" />
                <input 
                  type="text" 
                  placeholder="Search alerts or messages..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] transition-all text-sm font-medium text-[#1A1A1A]"
                />
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                
                {/* --- CUSTOM TYPE FILTER DROPDOWN --- */}
                <div className="relative w-full sm:w-auto min-w-[170px]" ref={filterRef}>
                  <div 
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E7E5E4] hover:border-[#1A1A1A] rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-between"
                  >
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57534E]" />
                    <span className="text-sm font-bold text-[#1A1A1A] truncate mr-2">
                      {filterType === "All" ? "All Notifications" : filterType}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#57534E] shrink-0 transition-transform duration-300 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  <div className={`absolute top-full right-0 mt-2 py-2 bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl shadow-lg z-50 overflow-hidden transition-all duration-200 origin-top w-full min-w-[180px] ${isFilterDropdownOpen ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-95 invisible'}`}>
                    {['All', 'Unread', 'Sales', 'Stock Alerts', 'Stock Logs', 'System'].map((option) => (
                      <div 
                        key={option}
                        onClick={() => {
                          setFilterType(option);
                          setIsFilterDropdownOpen(false);
                        }}
                        className={`mx-2 my-1 px-4 py-2.5 text-sm font-bold cursor-pointer transition-all rounded-full flex items-center justify-start text-left ${
                          filterType === option 
                            ? 'bg-[#7BB8A7]/20 text-[#1A1A1A]' 
                            : 'text-[#57534E] hover:bg-[#EFE9DF] hover:text-[#1A1A1A]'
                        }`}
                      >
                        {option === 'All' ? 'All Notifications' : option}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#EFE9DF] hover:bg-[#E7E5E4] text-[#1A1A1A] rounded-xl font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-[#E7E5E4]"
                  >
                    <CheckCheck size={16} /> Mark All Read
                  </button>
                  <button 
                    onClick={openClearAllModal}
                    disabled={notifications.length === 0}
                    className="flex-none p-2.5 bg-[#FFFFFF] border border-[#E7E5E4] rounded-xl text-[#D96B5E] hover:bg-[#FAD2CB]/40 hover:border-[#FAD2CB] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title="Clear All"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Solid Fade/Gradient effect pointing downwards para smooth yung pagpasok ng cards */}
            <div className="absolute left-0 right-0 -bottom-8 h-8 bg-gradient-to-b from-[#EFE9DF] to-transparent pointer-events-none z-10"></div>
          </div>
        </div>

        {/* --- SCROLLABLE CONTENT AREA --- */}
        <div className="px-6 lg:px-10 pb-10 max-w-5xl mx-auto w-full relative z-10 pt-2">
          
          <div className="space-y-3 relative z-10">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => {
                const styles = getTypeStyles(notification.type);
                
                return (
                  <div 
                    key={notification.id} 
                    className={`group relative flex gap-4 p-5 rounded-2xl border transition-all duration-200 ${
                      notification.isRead 
                        ? "bg-[#FFFFFF] border-[#E7E5E4] opacity-80 hover:opacity-100" 
                        : "bg-[#FFFFFF] border-[#1A1A1A] shadow-md"
                    }`}
                  >
                    {/* Unread Indicator Dot */}
                    {!notification.isRead && (
                      <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#D96B5E] rounded-full border-2 border-[#FAF7F2]"></div>
                    )}

                    {/* Icon Base */}
                    <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border ${styles.bg}`}>
                      {styles.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <h3 className={`font-black truncate ${notification.isRead ? "text-[#57534E]" : "text-[#1A1A1A]"}`}>
                          {notification.title}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29E] shrink-0">
                          {notification.timestamp}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#57534E] leading-relaxed">
                        {notification.message}
                      </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      {!notification.isRead && (
                        <button 
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 text-[#7BB8A7] bg-[#C3ECE3]/20 hover:bg-[#C3ECE3]/50 rounded-lg transition-colors border border-transparent hover:border-[#C3ECE3] cursor-pointer"
                          title="Mark as Read"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2 text-[#A8A29E] hover:text-[#D96B5E] hover:bg-[#FAD2CB]/40 rounded-lg transition-colors border border-transparent hover:border-[#FAD2CB] cursor-pointer"
                        title="Delete Alert"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-3xl py-20 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-16 h-16 bg-[#FAF7F2] rounded-2xl flex items-center justify-center border border-[#E7E5E4] mb-4">
                  <Bell size={24} className="text-[#A8A29E]" />
                </div>
                <h3 className="text-lg font-black text-[#1A1A1A] mb-1">You're all caught up!</h3>
                <p className="text-sm font-medium text-[#57534E]">No new notifications or alerts for this filter.</p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* --- NEW CUSTOM DELETE CONFIRMATION MODAL (For Clear All) --- */}
      {confirmModalConfig.isOpen && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1A1A1A]/40 backdrop-blur-sm ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}>
          <div className={`bg-[#FFFFFF] rounded-[2rem] w-full max-w-sm p-8 pt-16 shadow-2xl flex flex-col items-center text-center relative overflow-hidden ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
            
            {/* Background Header */}
            <div className="absolute top-0 left-0 w-full h-24 z-0 bg-[#D96B5E]" />
            <div className="absolute -top-12 -right-8 w-36 h-36 rounded-full bg-[#FFFFFF]/20 z-10 pointer-events-none" />

            <div className="relative z-20 flex flex-col items-center mt-2 w-full">
              {/* Icon */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-6 border-[6px] shadow-sm bg-[#FFFFFF] border-[#FAD2CB] text-[#D96B5E]">
                <AlertCircle size={44} strokeWidth={2.5} />
              </div>

              {/* Text */}
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] uppercase tracking-tight mb-3 leading-none">
                Confirm Action
              </h2>
              <p className="text-sm font-medium text-[#57534E] mb-8 leading-relaxed">
                Are you sure you want to clear <span className="font-bold text-[#1A1A1A]">all notifications</span>? This action cannot be undone.
              </p>

              {/* Buttons */}
              <div className="w-full flex gap-3">
                <button 
                  type="button"
                  onClick={closeConfirmModal}
                  className="w-full px-4 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-sm transition-all hover:bg-[#EFE9DF] bg-[#FAF7F2] border border-[#E7E5E4] text-[#1A1A1A] cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={executeConfirmAction}
                  className="w-full flex justify-center items-center gap-1.5 px-4 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-md transition-all hover:scale-[1.02] active:scale-95 bg-[#D96B5E] hover:bg-[#C45A4D] text-[#FFFFFF] cursor-pointer"
                >
                  <Trash2 size={16} /> Clear All
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- TOAST NOTIFICATION (Supports Error and Success) --- */}
      {toast.show && (
        <div 
          className={`fixed bottom-6 right-6 z-[110] bg-[#1A1A1A] text-white rounded-2xl shadow-2xl flex flex-col overflow-hidden min-w-[320px] max-w-md ${
            toast.isClosing ? "animate-toast-out" : "animate-toast-in"
          }`}
        >
          <div className="flex items-start justify-between px-5 py-4 gap-4">
            <div className="flex items-start gap-3">
              {toast.type === "error" ? (
                <AlertCircle size={20} className="text-[#D96B5E] shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 size={20} className="text-[#7BB8A7] shrink-0 mt-0.5" />
              )}
              <div className="flex flex-col">
                {toast.type === "error" && (
                  <span className="text-[10px] uppercase tracking-widest text-[#D96B5E] font-black mb-0.5">Constraint Violation</span>
                )}
                <span className="text-sm font-bold tracking-wide leading-snug">{toast.message}</span>
              </div>
            </div>
            <button 
              onClick={manuallyCloseToast} 
              className="text-[#A8A29E] hover:text-[#FFFFFF] transition-colors cursor-pointer p-1 rounded-full hover:bg-white/10 shrink-0 mt-0.5"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
          <div className="h-1 bg-[#333333] w-full">
            <div className={`h-full animate-progress-bar ${toast.type === "error" ? "bg-[#D96B5E]" : "bg-[#7BB8A7]"}`}></div>
          </div>
        </div>
      )}

      <style>{`
        /* EXACT Scrollbar styles */
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: transparent transparent; transition: scrollbar-color 0.3s ease; }
        .custom-scrollbar:hover { scrollbar-color: #D6D3D1 transparent; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: transparent; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #D6D3D1; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #A8A29E; }

        /* Modal animations */
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalZoomIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes modalFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes modalZoomOut { from { opacity: 1; transform: scale(1) translateY(0); } to { opacity: 0; transform: scale(0.95) translateY(10px); } }
        .animate-backdrop-in { animation: modalFadeIn 0.3s ease-out forwards; }
        .animate-modal-in { animation: modalZoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-backdrop-out { animation: modalFadeOut 0.3s ease-in forwards; }
        .animate-modal-out { animation: modalZoomOut 0.3s ease-in forwards; }

        /* Toast entry and exit animations */
        @keyframes toastIn {
          0% { opacity: 0; transform: translateY(30px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastOut {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(20px) scale(0.95); }
        }
        @keyframes progressBarShrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-toast-in { animation: toastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-toast-out { animation: toastOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-progress-bar { animation: progressBarShrink 4.7s linear forwards; }
      `}</style>
    </div>
  );
}

export default Notifications;