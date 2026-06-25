import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PackageSearch,
  Box,
  ClipboardList,
  Tags,
  Search,
  Bell,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  X,
  Truck,
  CheckCircle2,
  ChevronDown,
  ArrowDownAZ,
  Info
} from "lucide-react";

// Mock Categories Data
const initialCategories = [
  { id: "C001", name: "Electronics", description: "Devices, gadgets, and powered equipment", productCount: 42 },
  { id: "C002", name: "Accessories", description: "Cables, cases, and add-ons", productCount: 15 },
  { id: "C003", name: "Hardware", description: "Tools and physical building materials", productCount: 0 }, 
  { id: "C004", name: "Beverages", description: "Liquid refreshments and drinks", productCount: 8 },
  { id: "C005", name: "Packaging", description: "Boxes, tape, and bubble wrap", productCount: 0 }, 
];

// Mock Notifications Data for Preview
const mockNotifications = [
  { id: 1, title: "Low Stock Alert", desc: "ErgoGrip Mechanical Keyboard is running low (20 left).", time: "10m ago", read: false, type: "warning" },
  { id: 2, title: "New Supplier Added", desc: "EcoPack Solutions has been registered.", time: "1h ago", read: false, type: "info" },
  { id: 3, title: "Stock Adjustment", desc: "Stock In for Legacy USB 2.0 Hub (+10).", time: "2h ago", read: true, type: "success" },
  { id: 4, title: "Category Updated", desc: "Electronics category was modified.", time: "1d ago", read: true, type: "info" },
  { id: 5, title: "System Update", desc: "OptiStock v3.5 has been deployed.", time: "2d ago", read: true, type: "info" },
];

function Categories() {
  const [categories, setCategories] = useState(initialCategories);
  
  // UI & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Name (A-Z)");
  
  // Dropdown States
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  
  // Refs
  const sortRef = useRef(null);
  const notifRef = useRef(null);

  // Modal & Animation States
  const [isClosing, setIsClosing] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deleteModalConfig, setDeleteModalConfig] = useState({ isOpen: false, category: null });
  
  const [editingCategory, setEditingCategory] = useState(null);
  const [formError, setFormError] = useState("");

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: "", type: "success", isClosing: false });
  const toastTimeout = useRef(null);
  const toastExitTimeout = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });

  const unreadNotifCount = mockNotifications.filter(n => !n.read).length;

  // Handle click outside for custom dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) setIsSortDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered & Sorted Categories
  const filteredAndSortedCategories = useMemo(() => {
    let filtered = categories.filter(cat => 
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      cat.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === "Name (A-Z)") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "Name (Z-A)") {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "Items (High-Low)") {
      filtered.sort((a, b) => b.productCount - a.productCount);
    }

    return filtered;
  }, [categories, searchQuery, sortBy]);

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

  // Modal Handlers
  const closeAllModals = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsFormModalOpen(false);
      setDeleteModalConfig({ isOpen: false, category: null });
      setIsClosing(false);
    }, 300);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError("");
  };

  const openAddModal = () => {
    setFormData({ name: "", description: "" });
    setEditingCategory(null);
    setFormError("");
    setIsFormModalOpen(true);
    setIsClosing(false);
  };

  const openEditModal = (category) => {
    setFormData({ name: category.name, description: category.description });
    setEditingCategory(category);
    setFormError("");
    setIsFormModalOpen(true);
    setIsClosing(false);
  };

  const openDeleteModal = (category) => {
    // Check constraint before opening delete modal, trigger error toast if violated
    if (category.productCount > 0) {
      showToast(`Cannot delete "${category.name}". There are ${category.productCount} products currently assigned to this category.`, "error");
      return;
    }
    setDeleteModalConfig({ isOpen: true, category });
    setIsClosing(false);
  };

  // Submit Form Action
  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    const cleanName = formData.name.trim();
    if (!cleanName) {
      setFormError("Category name cannot be empty.");
      return;
    }

    const isDuplicate = categories.some(
      c => c.name.toLowerCase() === cleanName.toLowerCase() && c.id !== editingCategory?.id
    );
    
    if (isDuplicate) {
      setFormError(`The category "${cleanName}" already exists. To prevent duplicates, please use the existing one.`);
      return;
    }

    if (editingCategory) {
      const updatedCategories = categories.map(c => 
        c.id === editingCategory.id ? { ...c, name: cleanName, description: formData.description } : c
      );
      setCategories(updatedCategories);
      closeAllModals();
      showToast(`Category "${cleanName}" successfully updated.`, "success");
    } else {
      const newCategory = {
        id: `C${Date.now()}`,
        name: cleanName,
        description: formData.description,
        productCount: 0
      };
      setCategories([newCategory, ...categories]);
      closeAllModals();
      showToast(`Category "${cleanName}" successfully created.`, "success");
    }
  };

  // Confirm Delete Action
  const confirmDelete = () => {
    if (deleteModalConfig.category) {
      setCategories(categories.filter(c => c.id !== deleteModalConfig.category.id));
      const deletedName = deleteModalConfig.category.name;
      closeAllModals();
      showToast(`Category "${deletedName}" has been permanently deleted.`, "success");
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
          <Link to="/categories" className="flex items-center gap-3 px-4 py-3 bg-[#1A1A1A] text-[#FFFFFF] rounded-xl font-bold shadow-md cursor-pointer">
            <Tags size={18} className="text-[#FCD59E]" /> Categories
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
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#57534E]">Data Standardization</p>
            <h1 className="text-2xl font-black tracking-tight text-[#1A1A1A]">Categories</h1>
          </div>

          <div className="flex items-center gap-4">
            
            {/* --- NOTIFICATION DROPDOWN PREVIEW --- */}
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
                  placeholder="Search categories..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] transition-all text-sm font-medium text-[#1A1A1A] shadow-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                
                {/* --- CUSTOM SORT DROPDOWN --- */}
                <div className="relative w-full sm:w-auto min-w-[170px]" ref={sortRef}>
                  <div 
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[#E7E5E4] hover:border-[#1A1A1A] rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-between"
                  >
                    <ArrowDownAZ className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57534E]" />
                    <span className="text-sm font-bold text-[#1A1A1A] truncate mr-2">
                      {sortBy}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#57534E] shrink-0 transition-transform duration-300 ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  <div className={`absolute top-full right-0 mt-2 py-2 bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl shadow-lg z-50 overflow-hidden transition-all duration-200 origin-top w-full min-w-[180px] ${isSortDropdownOpen ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-95 invisible'}`}>
                    {['Name (A-Z)', 'Name (Z-A)', 'Items (High-Low)'].map((option) => (
                      <div 
                        key={option}
                        onClick={() => {
                          setSortBy(option);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`mx-2 my-1 px-4 py-2.5 text-sm font-bold cursor-pointer transition-all rounded-full flex items-center justify-start text-left ${
                          sortBy === option 
                            ? 'bg-[#7BB8A7]/20 text-[#1A1A1A]' 
                            : 'text-[#57534E] hover:bg-[#EFE9DF] hover:text-[#1A1A1A]'
                        }`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={openAddModal}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1A1A1A] hover:bg-[#57534E] text-[#FFFFFF] rounded-xl font-black uppercase tracking-widest text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Plus size={16} strokeWidth={3} /> Add Category
                </button>
              </div>
            </div>
            
            <div className="w-full overflow-x-auto custom-scrollbar">
              <div className="min-w-[900px]">
                
                <div className="bg-[#FAF7F2] border-b border-[#E7E5E4] relative z-20">
                  <table className="w-full text-left border-collapse table-fixed">
                    <colgroup>
                      <col className="w-[30%]" />
                      <col className="w-[45%]" />
                      <col className="w-[15%]" />
                      <col className="w-[10%]" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#57534E]">Category Name</th>
                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#57534E]">Description</th>
                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#57534E] text-center">Assigned Products</th>
                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#57534E] text-right">Actions</th>
                      </tr>
                    </thead>
                  </table>
                </div>

                <div className="overflow-y-auto h-[500px] w-full custom-scrollbar relative z-10 bg-[#FFFFFF]">
                  <table className="w-full text-left border-collapse table-fixed">
                    <colgroup>
                      <col className="w-[30%]" />
                      <col className="w-[45%]" />
                      <col className="w-[15%]" />
                      <col className="w-[10%]" />
                    </colgroup>
                    <tbody className="divide-y divide-[#E7E5E4]">
                      {filteredAndSortedCategories.length > 0 ? filteredAndSortedCategories.map((category) => (
                        <tr key={category.id} className="hover:bg-[#FAF7F2]/50 transition-colors bg-[#FFFFFF] group">
                          <td className="py-4 px-6">
                            <span className="font-bold text-[#1A1A1A] flex items-center gap-2">
                              <Tags size={14} className="text-[#A8A29E]" />
                              {category.name}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-[#57534E] truncate">
                            {category.description || <span className="italic opacity-50">No description provided</span>}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="inline-flex items-center justify-center min-w-[2.5rem] h-6 px-2 bg-[#EFE9DF] rounded-full text-xs font-black text-[#1A1A1A] border border-[#E7E5E4]">
                              {category.productCount}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => openEditModal(category)}
                                className="p-2 text-[#57534E] hover:bg-[#EFE9DF] hover:text-[#1A1A1A] rounded-lg transition-colors border border-transparent hover:border-[#E7E5E4] cursor-pointer"
                                title="Edit Category"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => openDeleteModal(category)}
                                className={`p-2 rounded-lg transition-colors border border-transparent cursor-pointer ${
                                  category.productCount > 0 
                                    ? "text-[#A8A29E] cursor-not-allowed opacity-50" 
                                    : "text-[#D96B5E] hover:bg-[#FAD2CB]/50 hover:border-[#FAD2CB]"
                                }`}
                                title={category.productCount > 0 ? "Cannot delete category in use" : "Delete Category"}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" className="py-12 text-center text-[#57534E] font-medium">
                            No categories found matching your criteria.
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

      {/* --- ADD / EDIT MODAL --- */}
      {isFormModalOpen && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1A1A1A]/40 backdrop-blur-sm ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}>
          <div className={`bg-[#FFFFFF] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
            
            <div className="p-6 border-b border-[#E7E5E4] bg-[#FAF7F2] flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-[#1A1A1A]">
                {editingCategory ? "Edit Category" : "New Category"}
              </h2>
              <button 
                onClick={closeAllModals}
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

              <form id="categoryForm" onSubmit={handleSubmit} className="space-y-5">
                
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[#1A1A1A] mb-2">Category Name</label>
                  <input 
                    type="text" required name="name" value={formData.name} onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#FFFFFF] border-2 border-[#1A1A1A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7BB8A7] transition-all text-base font-black text-[#1A1A1A]"
                    placeholder="e.g., Electronics, Beverages"
                  />
                  <p className="text-[10px] font-bold text-[#A8A29E] mt-1.5 uppercase tracking-wider">Must be unique across the system</p>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[#1A1A1A] mb-2">Description <span className="opacity-50">(Optional)</span></label>
                  <textarea 
                    name="description" value={formData.description} onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] transition-all text-sm font-medium text-[#1A1A1A] min-h-[100px] resize-none"
                    placeholder="Briefly describe what items fall under this category..."
                  />
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-[#E7E5E4] bg-[#FAF7F2] flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={closeAllModals}
                className="px-6 py-3 bg-[#FFFFFF] border border-[#E7E5E4] text-[#1A1A1A] rounded-xl font-black uppercase text-xs tracking-widest shadow-sm hover:bg-[#EFE9DF] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" form="categoryForm"
                className="px-6 py-3 bg-[#1A1A1A] text-[#FFFFFF] rounded-xl font-black uppercase text-xs tracking-widest shadow-md hover:bg-[#57534E] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                {editingCategory ? "Save Changes" : "Create Category"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- NEW CUSTOM DELETE CONFIRMATION MODAL --- */}
      {deleteModalConfig.isOpen && (
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
                Confirm Delete
              </h2>
              <p className="text-sm font-medium text-[#57534E] mb-8 leading-relaxed">
                Are you sure you want to permanently delete the <span className="font-bold text-[#1A1A1A]">"{deleteModalConfig.category?.name}"</span> category? This action cannot be undone.
              </p>

              {/* Buttons */}
              <div className="w-full flex gap-3">
                <button 
                  type="button"
                  onClick={closeAllModals}
                  className="w-full px-4 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-sm transition-all hover:bg-[#EFE9DF] bg-[#FAF7F2] border border-[#E7E5E4] text-[#1A1A1A] cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={confirmDelete}
                  className="w-full flex justify-center items-center gap-1.5 px-4 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-md transition-all hover:scale-[1.02] active:scale-95 bg-[#D96B5E] hover:bg-[#C45A4D] text-[#FFFFFF] cursor-pointer"
                >
                  <Trash2 size={16} /> Delete
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

export default Categories;