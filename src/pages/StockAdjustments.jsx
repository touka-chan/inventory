import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PackageSearch,
  Box,
  Search,
  Bell,
  Plus,
  AlertCircle,
  X,
  ArrowDownRight,
  ArrowUpRight,
  ClipboardList,
  Filter,
  Tags,
  Truck,
  CheckCircle2,
  ChevronDown,
  Info
} from "lucide-react";

// Mock Product Data
const initialProducts = [
  { id: "P001", sku: "SKU-1029", name: "AlphaTech Pro Wireless Earbuds", stock: 145 },
  { id: "P002", sku: "SKU-8832", name: "ErgoGrip Mechanical Keyboard", stock: 20 },
  { id: "P003", sku: "SKU-3321", name: "Legacy USB 2.0 Hub", stock: 12 },
  { id: "P004", sku: "SKU-4110", name: "Lumina 4K Monitor", stock: 32 },
];

// Mock Audit Logs
const initialLogs = [
  {
    id: "LOG-0001",
    timestamp: new Date(Date.now() - 86400000).toLocaleString(),
    productId: "P002",
    productName: "ErgoGrip Mechanical Keyboard",
    type: "Stock In",
    quantity: 10,
    reason: "Received delivery from Supplier X",
  },
  {
    id: "LOG-0002",
    timestamp: new Date(Date.now() - 172800000).toLocaleString(),
    productId: "P003",
    productName: "Legacy USB 2.0 Hub",
    type: "Stock Out",
    quantity: 2,
    reason: "Damaged during warehouse transfer",
  }
];

// Mock Notifications
const mockNotifications = [
  { id: 1, title: "Low Stock Alert", desc: "ErgoGrip Mechanical Keyboard is running low (20 left).", time: "10m ago", read: false, type: "warning" },
  { id: 2, title: "New Supplier Added", desc: "EcoPack Solutions has been registered.", time: "1h ago", read: false, type: "info" },
  { id: 3, title: "Stock Adjustment", desc: "Stock In for Legacy USB 2.0 Hub (+10).", time: "2h ago", read: true, type: "success" },
  { id: 4, title: "Category Updated", desc: "Electronics category was modified.", time: "1d ago", read: true, type: "info" },
  { id: 5, title: "System Update", desc: "OptiStock v3.5 has been deployed.", time: "2d ago", read: true, type: "info" },
];

function StockAdjustments() {
  const [products, setProducts] = useState(initialProducts);
  const [logs, setLogs] = useState(initialLogs);
  
  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  
  // Dropdown States
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  // Refs for Click Outside
  const filterRef = useRef(null);
  const productSelectRef = useRef(null);
  const notifRef = useRef(null);
  
  // Modal & Animation States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [formError, setFormError] = useState("");

  // Toast Notification State & Refs for Timers
  const [toast, setToast] = useState({ show: false, message: "", isClosing: false });
  const toastTimeout = useRef(null);
  const toastExitTimeout = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    productId: "",
    type: "Stock In",
    quantity: "",
    reason: ""
  });

  const unreadNotifCount = mockNotifications.filter(n => !n.read).length;

  // Handle click outside for custom dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) setIsFilterDropdownOpen(false);
      if (productSelectRef.current && !productSelectRef.current.contains(event.target)) setIsProductDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            log.reason.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "All" || log.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [logs, searchQuery, typeFilter]);

  // Handlers
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError(""); 
  };

  const openModal = () => {
    setFormData({ productId: "", type: "Stock In", quantity: "", reason: "" });
    setFormError("");
    setIsProductDropdownOpen(false);
    setIsModalOpen(true);
    setIsClosing(false);
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
    }, 300); 
  };

  const showToast = (message) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    if (toastExitTimeout.current) clearTimeout(toastExitTimeout.current);
    
    setToast({ show: false, message: "", isClosing: false });
    
    setTimeout(() => {
      setToast({ show: true, message, isClosing: false });
      toastTimeout.current = setTimeout(() => {
        setToast(prev => ({ ...prev, isClosing: true }));
        toastExitTimeout.current = setTimeout(() => {
          setToast({ show: false, message: "", isClosing: false });
        }, 300);
      }, 4700);
    }, 50);
  };

  const manuallyCloseToast = () => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    if (toastExitTimeout.current) clearTimeout(toastExitTimeout.current);

    setToast(prev => ({ ...prev, isClosing: true }));
    toastExitTimeout.current = setTimeout(() => {
      setToast({ show: false, message: "", isClosing: false });
    }, 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.productId) {
      setFormError("Please select a valid product from the dropdown.");
      return;
    }

    const targetProduct = products.find(p => p.id === formData.productId);
    if (!targetProduct) {
      setFormError("Please select a valid product.");
      return;
    }

    const qtyChange = parseInt(formData.quantity);
    if (isNaN(qtyChange) || qtyChange <= 0) {
      setFormError("Quantity must be a number greater than 0.");
      return;
    }

    if (formData.type === "Stock Out" && qtyChange > targetProduct.stock) {
      setFormError(`Cannot stock out ${qtyChange} units. Current stock is only ${targetProduct.stock}.`);
      return;
    }

    const updatedProducts = products.map(p => {
      if (p.id === formData.productId) {
        return {
          ...p,
          stock: formData.type === "Stock In" ? p.stock + qtyChange : p.stock - qtyChange
        };
      }
      return p;
    });

    const newLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      productId: targetProduct.id,
      productName: targetProduct.name,
      type: formData.type,
      quantity: qtyChange,
      reason: formData.reason
    };

    setProducts(updatedProducts);
    setLogs([newLog, ...logs]); 
    closeModal();
    showToast(`Successfully recorded ${formData.type} for ${targetProduct.name}.`);
  };

  return (
    <div className="min-h-screen bg-[#EFE9DF] font-sans flex text-[#1A1A1A] overflow-hidden">
      
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
          
          <Link to="/stock-adjustments" className="flex items-center gap-3 px-4 py-3 bg-[#1A1A1A] text-[#FFFFFF] rounded-xl font-bold shadow-md cursor-pointer">
            <ClipboardList size={18} className="text-[#FCD59E]" /> Stock Adjustments
          </Link>

          <Link to="/categories" className="flex items-center gap-3 px-4 py-3 text-[#57534E] hover:bg-[#EFE9DF] rounded-xl font-bold transition-colors cursor-pointer">
            <Tags size={18} /> Categories
          </Link>

          <Link to="/suppliers" className="flex items-center gap-3 px-4 py-3 text-[#57534E] hover:bg-[#EFE9DF] rounded-xl font-bold transition-colors cursor-pointer">
            <Truck size={18} /> Suppliers
          </Link>
        </nav>
        
        <div className="p-6 border-t border-[#E7E5E4]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#57534E]">System v3.5</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10">
        
        {/* HEADER */}
        <header className="flex items-center justify-between p-6 lg:px-10 border-b border-[#E7E5E4] bg-[#FAF7F2]/80 backdrop-blur-md sticky top-0 z-40">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#57534E]">Audit Trail</p>
            <h1 className="text-2xl font-black tracking-tight text-[#1A1A1A]">Stock Adjustments</h1>
          </div>

          <div className="flex items-center gap-4">
            
            {/* --- NOTIFICATION DROPDOWN --- */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className={`relative p-2.5 border rounded-full transition-all shadow-sm cursor-pointer flex items-center justify-center ${
                  isNotifDropdownOpen 
                    ? 'bg-[#1A1A1A] border-[#1A1A1A] text-[#FFFFFF]' 
                    : 'bg-[#FFFFFF] border-[#E7E5E4] text-[#1A1A1A] hover:bg-[#FAF7F2]'
                }`}
              >
                <Bell size={20} />
                {unreadNotifCount > 0 && (
                  <span className={`absolute top-0 right-0 w-3 h-3 rounded-full border-2 ${isNotifDropdownOpen ? 'bg-[#D96B5E] border-[#1A1A1A]' : 'bg-[#D96B5E] border-[#FFFFFF]'}`}></span>
                )}
              </button>

              <div className={`absolute top-full right-0 mt-3 w-80 sm:w-[340px] bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-200 origin-top-right ${isNotifDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                
                {/* Header */}
                <div className="p-4 border-b border-[#E7E5E4] bg-[#FAF7F2] flex items-center justify-between shrink-0">
                  <h3 className="font-black text-[#1A1A1A] text-sm">Notifications</h3>
                  {unreadNotifCount > 0 && (
                    <span className="text-[10px] font-black bg-[#D96B5E]/10 text-[#D96B5E] px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {unreadNotifCount} New
                    </span>
                  )}
                </div>

                {/* Previews List - WITH overscroll-contain */}
                <div className="flex-1 overflow-y-auto max-h-[50vh] custom-scrollbar overscroll-contain">
                  {mockNotifications.slice(0, 8).map(notif => (
                    <div 
                      key={notif.id} 
                      className={`p-4 border-b border-[#E7E5E4] last:border-b-0 hover:bg-[#FAF7F2] transition-colors cursor-pointer flex items-start gap-3 ${notif.read ? 'opacity-70 bg-[#FAF7F2]/50' : 'bg-[#FFFFFF]'}`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        notif.type === 'warning' ? 'bg-[#FAD2CB]/40 text-[#D96B5E]' : 
                        notif.type === 'success' ? 'bg-[#C3ECE3]/40 text-[#7BB8A7]' : 
                        'bg-[#EFE9DF] text-[#57534E]'
                      }`}>
                        {notif.type === 'warning' ? <AlertCircle size={16} strokeWidth={2.5} /> : 
                         notif.type === 'success' ? <CheckCircle2 size={16} strokeWidth={2.5} /> : 
                         <Info size={16} strokeWidth={2.5} />}
                      </div>
                      
                      <div className="flex flex-col flex-1 pr-2">
                        <span className="text-sm font-bold text-[#1A1A1A] leading-tight">{notif.title}</span>
                        <span className="text-xs text-[#57534E] leading-snug mt-1">{notif.desc}</span>
                        <span className="text-[10px] text-[#A8A29E] font-black mt-2 uppercase tracking-wider">{notif.time}</span>
                      </div>
                      
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-[#D96B5E] shrink-0 mt-2"></div>
                      )}
                    </div>
                  ))}
                  {mockNotifications.length === 0 && (
                    <div className="p-8 text-center text-[#57534E] text-sm font-medium">
                      You're all caught up!
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="p-3 border-t border-[#E7E5E4] bg-[#FFFFFF] shrink-0">
                  <Link 
                    to="/notifications" 
                    className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-widest text-[#1A1A1A] bg-[#FAF7F2] hover:bg-[#EFE9DF] rounded-xl transition-colors cursor-pointer"
                  >
                    View All Notifications
                  </Link>
                </div>

              </div>
            </div>
            {/* ----------------------------- */}

            <div className="flex items-center gap-3 pl-4 border-l border-[#E7E5E4]">
              <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center font-black text-[#FFFFFF] text-sm shadow-sm">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">

          <div className="bg-[#FFFFFF] rounded-3xl shadow-sm border border-[#E7E5E4] flex flex-col relative z-10 overflow-hidden">
            
            <div className="p-5 sm:p-6 border-b border-[#E7E5E4] flex flex-col lg:flex-row gap-4 justify-between items-center bg-[#FAF7F2] relative z-30">
              
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57534E]" />
                <input 
                  type="text" 
                  placeholder="Search item or reason..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] transition-all text-sm font-medium text-[#1A1A1A] shadow-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                
                {/* --- CUSTOM TYPE FILTER DROPDOWN --- */}
                <div className="relative w-full sm:w-auto min-w-[170px]" ref={filterRef}>
                  <div 
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[#E7E5E4] hover:border-[#1A1A1A] rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-between"
                  >
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57534E]" />
                    <span className="text-sm font-bold text-[#1A1A1A] truncate mr-2">
                      {typeFilter === "All" ? "All Types" : typeFilter}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#57534E] shrink-0 transition-transform duration-300 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  <div className={`absolute top-full left-0 right-0 mt-2 py-2 bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl shadow-lg z-50 overflow-hidden transition-all duration-200 origin-top w-full min-w-[170px] ${isFilterDropdownOpen ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-95 invisible'}`}>
                    {['All', 'Stock In', 'Stock Out'].map((option) => (
                      <div 
                        key={option}
                        onClick={() => {
                          setTypeFilter(option);
                          setIsFilterDropdownOpen(false);
                        }}
                        className={`mx-2 my-1 px-4 py-2.5 text-sm font-bold cursor-pointer transition-all rounded-full flex items-center justify-start text-left ${
                          typeFilter === option 
                            ? 'bg-[#7BB8A7]/20 text-[#1A1A1A]' 
                            : 'text-[#57534E] hover:bg-[#EFE9DF] hover:text-[#1A1A1A]'
                        }`}
                      >
                        {option === 'All' ? 'All Types' : option}
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={openModal}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1A1A1A] hover:bg-[#57534E] text-[#FFFFFF] rounded-xl font-black uppercase tracking-widest text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Plus size={16} strokeWidth={3} /> Record Adjustment
                </button>

              </div>
            </div>
            
            <div className="w-full overflow-x-auto custom-scrollbar">
              <div className="min-w-[900px]">
                
                <div className="bg-[#FAF7F2] border-b border-[#E7E5E4] relative z-20">
                  <table className="w-full text-left border-collapse table-fixed">
                    <colgroup>
                      <col className="w-[15%]" />
                      <col className="w-[30%]" />
                      <col className="w-[15%]" />
                      <col className="w-[15%]" />
                      <col className="w-[25%]" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#57534E]">Date & Time</th>
                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#57534E]">Product</th>
                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#57534E]">Type</th>
                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#57534E]">Qty Changed</th>
                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#57534E]">Reason / Remarks</th>
                      </tr>
                    </thead>
                  </table>
                </div>

                <div className="overflow-y-auto h-[500px] w-full custom-scrollbar relative z-10 bg-[#FFFFFF]">
                  <table className="w-full text-left border-collapse table-fixed">
                    <colgroup>
                      <col className="w-[15%]" />
                      <col className="w-[30%]" />
                      <col className="w-[15%]" />
                      <col className="w-[15%]" />
                      <col className="w-[25%]" />
                    </colgroup>
                    <tbody className="divide-y divide-[#E7E5E4]">
                      {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#FAF7F2]/50 transition-colors bg-[#FFFFFF]">
                          <td className="py-4 px-6 text-sm text-[#57534E] font-medium whitespace-nowrap">
                            {log.timestamp}
                          </td>
                          <td className="py-4 px-6 font-bold text-[#1A1A1A]">{log.productName}</td>
                          <td className="py-4 px-6">
                            {log.type === "Stock In" ? (
                              <span className="flex items-center gap-1.5 w-fit text-[10px] font-black uppercase tracking-wider text-[#7BB8A7] bg-[#C3ECE3]/40 px-2.5 py-1 rounded-md border border-[#C3ECE3]">
                                <ArrowUpRight size={14} strokeWidth={3} /> {log.type}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 w-fit text-[10px] font-black uppercase tracking-wider text-[#D96B5E] bg-[#FAD2CB]/40 px-2.5 py-1 rounded-md border border-[#FAD2CB]">
                                <ArrowDownRight size={14} strokeWidth={3} /> {log.type}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`text-base font-black ${log.type === "Stock In" ? "text-[#7BB8A7]" : "text-[#D96B5E]"}`}>
                              {log.type === "Stock In" ? "+" : "-"}{log.quantity}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-[#57534E] italic">"{log.reason}"</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-[#57534E] font-medium">
                            No adjustment records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

      {/* --- ADJUSTMENT MODAL --- */}
      {isModalOpen && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1A1A1A]/40 backdrop-blur-sm ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}>
          <div className={`bg-[#FFFFFF] w-full max-w-lg rounded-3xl shadow-2xl flex flex-col relative ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
            
            <div className="p-6 border-b border-[#E7E5E4] bg-[#FAF7F2] rounded-t-3xl flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-[#1A1A1A]">Record Stock Adjustment</h2>
              <button 
                onClick={closeModal}
                className="text-[#57534E] hover:text-[#1A1A1A] p-2 bg-transparent rounded-full hover:bg-[#EFE9DF] transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1">
              {formError && (
                <div className="bg-[#FAD2CB]/40 border border-[#FAD2CB] text-[#9A2E22] px-4 py-3 rounded-xl mb-6 text-sm font-bold flex items-start gap-2 shadow-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form id="adjustmentForm" onSubmit={handleSubmit} className="space-y-5">
                
                {/* --- CUSTOM PRODUCT DROPDOWN --- */}
                <div className="relative" ref={productSelectRef}>
                  <label className="block text-xs font-black uppercase tracking-widest text-[#1A1A1A] mb-2">Select Product</label>
                  <div 
                    onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                    className={`w-full px-4 py-3 bg-[#FAF7F2] border rounded-xl flex items-center justify-between cursor-pointer transition-all ${isProductDropdownOpen ? 'border-[#1A1A1A] ring-2 ring-[#1A1A1A]/20' : 'border-[#E7E5E4] hover:border-[#1A1A1A]'}`}
                  >
                    <span className={`text-sm font-bold truncate ${formData.productId ? 'text-[#1A1A1A]' : 'text-[#A8A29E]'}`}>
                      {formData.productId 
                        ? `${products.find(p => p.id === formData.productId)?.name} (Current Stock: ${products.find(p => p.id === formData.productId)?.stock})`
                        : "-- Choose an item --"}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-[#57534E] shrink-0 transition-transform duration-300 ${isProductDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  <div className={`absolute top-full left-0 right-0 mt-2 py-2 bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar overscroll-contain transition-all duration-200 origin-top ${isProductDropdownOpen ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-95 invisible'}`}>
                    {products.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => {
                          setFormData({ ...formData, productId: p.id });
                          setIsProductDropdownOpen(false);
                          setFormError("");
                        }}
                        className={`mx-2 my-1 px-4 py-3 text-sm font-bold cursor-pointer transition-all rounded-full flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-left ${
                          formData.productId === p.id 
                            ? 'bg-[#7BB8A7]/20 text-[#1A1A1A]' 
                            : 'text-[#57534E] hover:bg-[#EFE9DF] hover:text-[#1A1A1A]'
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        <span className={`text-[10px] uppercase tracking-wider font-black px-2.5 py-1 rounded-full transition-colors ${
                          formData.productId === p.id 
                            ? 'bg-[#FFFFFF] text-[#7BB8A7] shadow-sm' 
                            : (p.stock > 0 ? 'bg-[#C3ECE3]/50 text-[#7BB8A7]' : 'bg-[#FAD2CB]/50 text-[#D96B5E]')
                        }`}>
                          Stock: {p.stock}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#1A1A1A] mb-2">Type</label>
                    <div className="flex bg-[#FAF7F2] p-1 rounded-xl border border-[#E7E5E4]">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: "Stock In" })}
                        className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                          formData.type === "Stock In" ? "bg-[#1A1A1A] text-[#FFFFFF] shadow-sm" : "text-[#57534E] hover:text-[#1A1A1A]"
                        }`}
                      >
                        Stock In
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: "Stock Out" })}
                        className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                          formData.type === "Stock Out" ? "bg-[#D96B5E] text-[#FFFFFF] shadow-sm" : "text-[#57534E] hover:text-[#D96B5E]"
                        }`}
                      >
                        Stock Out
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#1A1A1A] mb-2">Quantity Change</label>
                    <input 
                      type="number" required name="quantity" value={formData.quantity} onChange={handleInputChange} min="1"
                      className="w-full px-4 py-2.5 bg-[#FFFFFF] border-2 border-[#1A1A1A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7BB8A7] transition-all text-base font-black text-[#1A1A1A]"
                      placeholder="e.g., 5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[#1A1A1A] mb-2">Reason / Remarks</label>
                  <textarea 
                    required name="reason" value={formData.reason} onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] transition-all text-sm font-medium text-[#1A1A1A] min-h-[100px] resize-none"
                    placeholder="e.g., Damaged item disposed, found extra inventory..."
                  />
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-[#E7E5E4] bg-[#FAF7F2] rounded-b-3xl flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={closeModal}
                className="px-6 py-3 bg-[#FFFFFF] border border-[#E7E5E4] text-[#1A1A1A] rounded-xl font-black uppercase text-xs tracking-widest shadow-sm hover:bg-[#EFE9DF] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" form="adjustmentForm"
                className="px-6 py-3 bg-[#1A1A1A] text-[#FFFFFF] rounded-xl font-black uppercase text-xs tracking-widest shadow-md hover:bg-[#57534E] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                Submit Adjustment
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- TOAST NOTIFICATION --- */}
      {toast.show && (
        <div 
          className={`fixed bottom-6 right-6 z-[110] bg-[#1A1A1A] text-white rounded-2xl shadow-2xl flex flex-col overflow-hidden min-w-[320px] ${
            toast.isClosing ? "animate-toast-out" : "animate-toast-in"
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-[#7BB8A7]" />
              <span className="text-sm font-bold tracking-wide">{toast.message}</span>
            </div>
            <button 
              onClick={manuallyCloseToast} 
              className="text-[#A8A29E] hover:text-[#FFFFFF] transition-colors cursor-pointer p-1 rounded-full hover:bg-white/10"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
          <div className="h-1 bg-[#333333] w-full">
            <div className="h-full bg-[#7BB8A7] animate-progress-bar"></div>
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

export default StockAdjustments;