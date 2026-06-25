import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PackageSearch,
  Box,
  Search,
  Bell,
  Filter,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  TrendingUp,
  ClipboardList,
  Tags,
  Truck,
  Upload,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  ChevronDown,
  Info
} from "lucide-react";

// Mock Data for Main Tables
const mockSuppliers = [
  { id: "S001", name: "TechSource Distributors" },
  { id: "S002", name: "Prime Accessories Wholesale" },
  { id: "S003", name: "Global Hardware Co." }
];

const initialProducts = [
  { id: "P001", sku: "SKU-1029", name: "AlphaTech Pro Wireless Earbuds", category: "Electronics", supplierId: "S001", costPrice: 1500, sellingPrice: 2500, stock: 145, reorderLevel: 50, status: "active" },
  { id: "P002", sku: "SKU-8832", name: "ErgoGrip Mechanical Keyboard", category: "Electronics", supplierId: "S001", costPrice: 1800, sellingPrice: 2500, stock: 20, reorderLevel: 30, status: "active" },
  { id: "P003", sku: "SKU-3321", name: "Legacy USB 2.0 Hub", category: "Accessories", supplierId: "S002", costPrice: 200, sellingPrice: 450, stock: 12, reorderLevel: 15, status: "active" },
  { id: "P004", sku: "SKU-4110", name: "Lumina 4K Monitor", category: "Electronics", supplierId: "S001", costPrice: 10000, sellingPrice: 12840, stock: 32, reorderLevel: 10, status: "active" },
  { id: "P005", sku: "SKU-1190", name: "Wired Earphones", category: "Accessories", supplierId: "S002", costPrice: 150, sellingPrice: 350, stock: 8, reorderLevel: 20, status: "active" },
  { id: "P006", sku: "SKU-9021", name: "TitanX Gaming Mouse", category: "Electronics", supplierId: "S001", costPrice: 1200, sellingPrice: 1850, stock: 65, reorderLevel: 15, status: "active" },
  { id: "P007", sku: "SKU-7731", name: "Old Gen Phone Cases", category: "Accessories", supplierId: "S002", costPrice: 50, sellingPrice: 150, stock: 0, reorderLevel: 10, status: "active" },
  { id: "P008", sku: "SKU-5542", name: "Tablet Stand", category: "Accessories", supplierId: "S002", costPrice: 60, sellingPrice: 120, stock: 215, reorderLevel: 50, status: "active" },
  { id: "P009", sku: "SKU-0000", name: "Deleted Item Example", category: "Electronics", supplierId: "S001", costPrice: 100, sellingPrice: 200, stock: 5, reorderLevel: 10, status: "archived" }
];

// Mock Data for Notifications Preview
const mockNotifications = [
  { id: 1, title: "Low Stock Alert", desc: "ErgoGrip Mechanical Keyboard is running low (20 left).", time: "10m ago", read: false, type: "warning" },
  { id: 2, title: "New Supplier Added", desc: "EcoPack Solutions has been registered.", time: "1h ago", read: false, type: "info" },
  { id: 3, title: "Stock Adjustment", desc: "Stock In for Legacy USB 2.0 Hub (+10).", time: "2h ago", read: true, type: "success" },
  { id: 4, title: "Category Updated", desc: "Electronics category was modified.", time: "1d ago", read: true, type: "info" },
  { id: 5, title: "System Update", desc: "OptiStock v3.5 has been deployed.", time: "2d ago", read: true, type: "info" },
];

function InventoryHub() {
  const [products, setProducts] = useState(initialProducts);
  
  // Filtering & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");

  // Custom Dropdown States
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isStockDropdownOpen, setIsStockDropdownOpen] = useState(false);
  const [isFormCategoryDropdownOpen, setIsFormCategoryDropdownOpen] = useState(false);
  const [isFormSupplierDropdownOpen, setIsFormSupplierDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  // Refs for Click-Outside
  const categoryRef = useRef(null);
  const stockRef = useRef(null);
  const formCategoryRef = useRef(null);
  const formSupplierRef = useRef(null);
  const notifRef = useRef(null);

  // Bulk Actions State
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Modal & Animation States
  const [isClosing, setIsClosing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Delete Confirmation Modal State
  const [deleteModalConfig, setDeleteModalConfig] = useState({ isOpen: false, type: null, id: null });

  const [editingProduct, setEditingProduct] = useState(null);
  const [formError, setFormError] = useState("");

  // Toast Notification State & Refs
  const [toast, setToast] = useState({ show: false, message: "", isClosing: false });
  const toastTimeout = useRef(null);
  const toastExitTimeout = useRef(null);

  const [formData, setFormData] = useState({
    sku: "", name: "", category: "Electronics", supplierId: "", costPrice: "", sellingPrice: "", reorderLevel: ""
  });

  const activeProducts = useMemo(() => products.filter(p => p.status === 'active'), [products]);
  const totalItems = activeProducts.length;
  const lowStockCount = activeProducts.filter(p => p.stock <= p.reorderLevel).length;
  const totalInventoryValue = activeProducts.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);

  const unreadNotifCount = mockNotifications.filter(n => !n.read).length;

  // Handle click outside for ALL custom dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) setIsCategoryDropdownOpen(false);
      if (stockRef.current && !stockRef.current.contains(event.target)) setIsStockDropdownOpen(false);
      if (formCategoryRef.current && !formCategoryRef.current.contains(event.target)) setIsFormCategoryDropdownOpen(false);
      if (formSupplierRef.current && !formSupplierRef.current.contains(event.target)) setIsFormSupplierDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter Logic
  const filteredProducts = useMemo(() => {
    let result = activeProducts.filter(product => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query);
      if (!matchesSearch) return false;
      if (categoryFilter !== "All" && product.category !== categoryFilter) return false;
      if (stockFilter === "Low Stock" && product.stock > product.reorderLevel) return false;
      return true;
    });
    return result;
  }, [activeProducts, searchQuery, categoryFilter, stockFilter]);

  // Toast Handlers
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

  // Modal Handlers
  const closeAllModals = () => {
    setIsClosing(true);
    // Close dropdowns inside modal just in case
    setIsFormCategoryDropdownOpen(false);
    setIsFormSupplierDropdownOpen(false);
    
    setTimeout(() => {
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setDeleteModalConfig({ isOpen: false, type: null, id: null });
      setIsClosing(false);
    }, 300);
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const resetForm = () => {
    setFormData({ sku: "", name: "", category: "Electronics", supplierId: "", costPrice: "", sellingPrice: "", reorderLevel: "" });
    setFormError("");
  };

  const openAddModal = () => { 
    resetForm(); 
    setIsAddModalOpen(true); 
    setIsClosing(false); 
  };

  const openEditModal = (product) => {
    resetForm();
    setEditingProduct(product);
    setFormData({
      sku: product.sku, name: product.name, category: product.category, supplierId: product.supplierId || "",
      costPrice: product.costPrice, sellingPrice: product.sellingPrice, reorderLevel: product.reorderLevel,
    });
    setIsEditModalOpen(true);
    setIsClosing(false);
  };

  const openDeleteModal = (type, id = null) => {
    setDeleteModalConfig({ isOpen: true, type, id });
    setIsClosing(false);
  };

  // Submit Handlers
  const handleAddProduct = (e) => {
    e.preventDefault();
    setFormError("");
    const isDuplicate = products.some(p => p.sku.toLowerCase() === formData.sku.toLowerCase() && p.status === 'active');
    if (isDuplicate) return setFormError("Barcode/SKU already assigned to another active product.");
    if (parseFloat(formData.sellingPrice) <= parseFloat(formData.costPrice)) return setFormError("Selling price must be strictly greater than cost price.");
    if (!formData.supplierId) return setFormError("Please select a supplier.");

    const newProduct = {
      id: `P${Date.now()}`,
      sku: formData.sku, name: formData.name, category: formData.category, supplierId: formData.supplierId,
      costPrice: parseFloat(formData.costPrice), sellingPrice: parseFloat(formData.sellingPrice),
      reorderLevel: parseInt(formData.reorderLevel) || 0, stock: 0, status: "active"
    };
    setProducts([newProduct, ...products]);
    closeAllModals();
    showToast(`${formData.name} successfully added to inventory.`);
  };

  const handleEditProduct = (e) => {
    e.preventDefault();
    setFormError("");
    const isDuplicate = products.some(p => p.sku.toLowerCase() === formData.sku.toLowerCase() && p.id !== editingProduct.id && p.status === 'active');
    if (isDuplicate) return setFormError("Barcode/SKU already assigned to another active product.");
    if (parseFloat(formData.sellingPrice) <= parseFloat(formData.costPrice)) return setFormError("Selling price must be strictly greater than cost price.");
    if (!formData.supplierId) return setFormError("Please select a supplier.");

    const updatedProducts = products.map(p => {
      if (p.id === editingProduct.id) {
        return {
          ...p, sku: formData.sku, name: formData.name, category: formData.category, supplierId: formData.supplierId,
          costPrice: parseFloat(formData.costPrice), sellingPrice: parseFloat(formData.sellingPrice),
          reorderLevel: parseInt(formData.reorderLevel) || 0,
        };
      }
      return p;
    });
    setProducts(updatedProducts);
    closeAllModals();
    showToast(`${formData.name} successfully updated.`);
  };

  // Delete Action Executer
  const confirmDelete = () => {
    if (deleteModalConfig.type === 'single') {
      const target = products.find(p => p.id === deleteModalConfig.id);
      setProducts(products.map(p => p.id === deleteModalConfig.id ? { ...p, status: "archived" } : p));
      setSelectedProducts(selectedProducts.filter(selectedId => selectedId !== deleteModalConfig.id));
      showToast(`${target?.name || "Product"} successfully archived.`);
    } else if (deleteModalConfig.type === 'bulk') {
      setProducts(products.map(p => selectedProducts.includes(p.id) ? { ...p, status: "archived" } : p));
      const count = selectedProducts.length;
      setSelectedProducts([]);
      showToast(`${count} products successfully archived.`);
    }
    closeAllModals();
  };

  // Bulk Actions Handlers
  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(pId => pId !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
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
          <Link to="/inventory-hub" className="flex items-center gap-3 px-4 py-3 bg-[#1A1A1A] text-[#FFFFFF] rounded-xl font-bold shadow-md cursor-pointer">
            <Box size={18} className="text-[#7BB8A7]" /> Inventory Hub
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
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#57534E]">Core Database</p>
            <h1 className="text-2xl font-black tracking-tight text-[#1A1A1A]">Inventory Hub</h1>
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

                {/* Previews List - ADDED overscroll-contain HERE */}
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
                    className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-widest text-[#1A1A1A] bg-[#FAF7F2] hover:bg-[#EFE9DF] rounded-xl transition-colors"
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

        <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
            <div className="bg-[#FFFFFF] p-6 rounded-3xl border border-[#E7E5E4] shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#57534E] mb-1">Total Active Items</p>
                <h3 className="text-3xl font-black text-[#1A1A1A]">{totalItems}</h3>
              </div>
              <div className="w-14 h-14 bg-[#FAF7F2] rounded-2xl flex items-center justify-center border border-[#E7E5E4]">
                <PackageSearch className="text-[#1A1A1A]" size={24} />
              </div>
            </div>

            <div className="bg-[#FFFFFF] p-6 rounded-3xl border border-[#FAD2CB] shadow-sm flex items-center justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FAD2CB]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#D96B5E] mb-1">Low Stock Alerts</p>
                <h3 className="text-3xl font-black text-[#1A1A1A]">{lowStockCount}</h3>
              </div>
              <div className="w-14 h-14 bg-[#FAD2CB]/40 rounded-2xl flex items-center justify-center border border-[#FAD2CB] relative z-10">
                <AlertCircle className="text-[#D96B5E]" size={24} />
              </div>
            </div>

            <div className="bg-[#FFFFFF] p-6 rounded-3xl border border-[#C3ECE3] shadow-sm flex items-center justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#C3ECE3]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#7BB8A7] mb-1">Total Stock Value</p>
                <h3 className="text-3xl font-black text-[#1A1A1A]">₱{totalInventoryValue.toLocaleString()}</h3>
              </div>
              <div className="w-14 h-14 bg-[#C3ECE3]/40 rounded-2xl flex items-center justify-center border border-[#C3ECE3] relative z-10">
                <TrendingUp className="text-[#7BB8A7]" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] rounded-3xl shadow-sm border border-[#E7E5E4] flex flex-col relative z-10 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-[#E7E5E4] flex flex-col lg:flex-row gap-4 justify-between items-center bg-[#FAF7F2] relative z-30">
              <div className="flex items-center gap-4 w-full lg:w-auto">
                {selectedProducts.length > 0 ? (
                  <div className="flex items-center gap-3 bg-[#FAD2CB]/40 border border-[#FAD2CB] px-4 py-2.5 rounded-xl">
                    <span className="text-sm font-bold text-[#9A2E22]">{selectedProducts.length} selected</span>
                    <div className="w-px h-4 bg-[#D96B5E]/30"></div>
                    <button onClick={() => openDeleteModal('bulk')} className="text-xs font-black uppercase tracking-widest text-[#9A2E22] hover:text-[#7A241A] transition-colors flex items-center gap-1 cursor-pointer">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                ) : (
                  <div className="relative w-full lg:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57534E]" />
                    <input 
                      type="text" placeholder="Search SKU or Name..." 
                      value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] transition-all text-sm font-medium text-[#1A1A1A] shadow-sm"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <div className="flex gap-2">
                  <button title="Import Data" className="p-2.5 bg-[#FFFFFF] border border-[#E7E5E4] rounded-xl text-[#57534E] hover:bg-[#EFE9DF] hover:text-[#1A1A1A] transition-all shadow-sm cursor-pointer">
                    <Upload size={18} />
                  </button>
                </div>
                
                {/* --- CUSTOM CATEGORY FILTER DROPDOWN --- */}
                <div className="relative w-full sm:w-auto min-w-[170px]" ref={categoryRef}>
                  <div 
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[#E7E5E4] hover:border-[#1A1A1A] rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-between"
                  >
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57534E]" />
                    <span className="text-sm font-bold text-[#1A1A1A] truncate mr-2">
                      {categoryFilter === "All" ? "All Categories" : categoryFilter}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#57534E] shrink-0 transition-transform duration-300 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  <div className={`absolute top-full right-0 mt-2 py-2 bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl shadow-lg z-50 overflow-hidden transition-all duration-200 origin-top w-full min-w-[180px] ${isCategoryDropdownOpen ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-95 invisible'}`}>
                    {['All', 'Electronics', 'Accessories'].map((option) => (
                      <div 
                        key={option}
                        onClick={() => {
                          setCategoryFilter(option);
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`mx-2 my-1 px-4 py-2.5 text-sm font-bold cursor-pointer transition-all rounded-full flex items-center justify-start text-left ${
                          categoryFilter === option 
                            ? 'bg-[#7BB8A7]/20 text-[#1A1A1A]' 
                            : 'text-[#57534E] hover:bg-[#EFE9DF] hover:text-[#1A1A1A]'
                        }`}
                      >
                        {option === 'All' ? 'All Categories' : option}
                      </div>
                    ))}
                  </div>
                </div>

                {/* --- CUSTOM STOCK LEVEL FILTER DROPDOWN --- */}
                <div className="relative w-full sm:w-auto min-w-[160px]" ref={stockRef}>
                  <div 
                    onClick={() => setIsStockDropdownOpen(!isStockDropdownOpen)}
                    className="w-full px-4 py-2.5 bg-[#FFFFFF] border border-[#E7E5E4] hover:border-[#1A1A1A] rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-between"
                  >
                    <span className="text-sm font-bold text-[#1A1A1A] truncate mr-2">
                      {stockFilter === "All" ? "All Stock Levels" : "Low Stock Only"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#57534E] shrink-0 transition-transform duration-300 ${isStockDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  <div className={`absolute top-full right-0 mt-2 py-2 bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl shadow-lg z-50 overflow-hidden transition-all duration-200 origin-top w-full min-w-[180px] ${isStockDropdownOpen ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-95 invisible'}`}>
                    {['All', 'Low Stock'].map((option) => (
                      <div 
                        key={option}
                        onClick={() => {
                          setStockFilter(option);
                          setIsStockDropdownOpen(false);
                        }}
                        className={`mx-2 my-1 px-4 py-2.5 text-sm font-bold cursor-pointer transition-all rounded-full flex items-center justify-start text-left ${
                          stockFilter === option 
                            ? 'bg-[#7BB8A7]/20 text-[#1A1A1A]' 
                            : 'text-[#57534E] hover:bg-[#EFE9DF] hover:text-[#1A1A1A]'
                        }`}
                      >
                        {option === 'All' ? 'All Stock Levels' : 'Low Stock Only'}
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={openAddModal}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1A1A1A] hover:bg-[#57534E] text-[#FFFFFF] rounded-xl font-black uppercase tracking-widest text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Plus size={16} strokeWidth={3} /> Add Product
                </button>
              </div>
            </div>

            <div className="bg-[#FAF7F2] border-b border-[#E7E5E4] relative z-20">
              <table className="w-full text-left border-collapse table-fixed">
                <colgroup>
                  <col className="w-[4%]" />
                  <col className="w-[13%]" />
                  <col className="w-[32%]" />
                  <col className="w-[15%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="py-4 px-4 w-10 text-center">
                      <button onClick={toggleSelectAll} className="text-[#57534E] hover:text-[#1A1A1A] transition-colors cursor-pointer">
                        {filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </th>
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#57534E]">SKU / Barcode</th>
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#57534E]">Product Info</th>
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#57534E]">Supplier</th>
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#57534E]">Pricing</th>
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#57534E]">Stock Status</th>
                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#57534E] text-right">Actions</th>
                  </tr>
                </thead>
              </table>
            </div>

            <div className="overflow-auto h-[500px] w-full custom-scrollbar rounded-b-3xl relative z-10 bg-[#FFFFFF]">
              <table className="w-full text-left border-collapse table-fixed">
                <colgroup>
                  <col className="w-[4%]" />
                  <col className="w-[13%]" />
                  <col className="w-[32%]" />
                  <col className="w-[15%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <tbody className="divide-y divide-[#E7E5E4]">
                  {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                    <tr key={product.id} className={`transition-colors ${selectedProducts.includes(product.id) ? "bg-[#FAD2CB]/10" : "hover:bg-[#FAF7F2]/50 bg-[#FFFFFF]"}`}>
                      <td className="py-4 px-4 text-center">
                        <button onClick={() => toggleSelectProduct(product.id)} className="text-[#A8A29E] hover:text-[#1A1A1A] transition-colors cursor-pointer">
                          {selectedProducts.includes(product.id) ? <CheckSquare size={18} className="text-[#1A1A1A]" /> : <Square size={18} />}
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-xs font-bold text-[#57534E] bg-[#EFE9DF] px-2 py-1 rounded border border-[#E7E5E4]">
                          {product.sku}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#1A1A1A]">{product.name}</span>
                          <span className="text-xs text-[#57534E]">{product.category}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-[#57534E] font-medium">
                        {mockSuppliers.find(s => s.id === product.supplierId)?.name || "-"}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-[#57534E]">Cost: ₱{product.costPrice}</span>
                          <span className="font-bold text-[#1A1A1A]">Sell: ₱{product.sellingPrice}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-[#1A1A1A]">{product.stock}</span>
                          {product.stock <= product.reorderLevel ? (
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#D96B5E] bg-[#FAD2CB]/40 px-2 py-1 rounded border border-[#FAD2CB]">
                              <AlertCircle size={12} /> Low
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#7BB8A7] bg-[#C3ECE3]/40 px-2 py-1 rounded border border-[#C3ECE3]">
                              <CheckCircle2 size={12} /> OK
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#57534E]">Reorder at: {product.reorderLevel}</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(product)}
                            className="p-2 text-[#57534E] hover:bg-[#EFE9DF] hover:text-[#1A1A1A] rounded-lg transition-colors border border-transparent hover:border-[#E7E5E4]"
                            title="Edit Product"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => openDeleteModal('single', product.id)}
                            className="p-2 text-[#D96B5E] hover:bg-[#FAD2CB]/50 rounded-lg transition-colors border border-transparent hover:border-[#FAD2CB]"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-[#57534E] font-medium">
                        No products found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>
      </main>

      {/* --- ADD/EDIT MODAL --- */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1A1A1A]/40 backdrop-blur-sm ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}>
          <div className={`bg-[#FFFFFF] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
            <div className="p-6 border-b border-[#E7E5E4] bg-[#FAF7F2] flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-[#1A1A1A]">
                {isAddModalOpen ? "Register New Product" : "Edit Product Details"}
              </h2>
              <button 
                onClick={closeAllModals}
                className="text-[#57534E] hover:text-[#1A1A1A] p-2 bg-transparent rounded-full hover:bg-[#EFE9DF] transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* ADDED overscroll-contain HERE FOR MODAL BODY */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar overscroll-contain">
              {formError && (
                <div className="bg-[#FAD2CB]/40 border border-[#FAD2CB] text-[#9A2E22] px-4 py-3 rounded-xl mb-6 text-sm font-bold flex items-start gap-2 shadow-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form id="productForm" onSubmit={isAddModalOpen ? handleAddProduct : handleEditProduct} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#1A1A1A] mb-2">Barcode / SKU</label>
                    <input 
                      type="text" required name="sku" value={formData.sku} onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] transition-all font-mono text-sm font-bold text-[#1A1A1A]"
                    />
                  </div>
                  
                  {/* --- CUSTOM FORM CATEGORY DROPDOWN --- */}
                  <div className="relative" ref={formCategoryRef}>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#1A1A1A] mb-2">Category</label>
                    <div 
                      onClick={() => setIsFormCategoryDropdownOpen(!isFormCategoryDropdownOpen)}
                      className={`w-full px-4 py-3 bg-[#FAF7F2] border rounded-xl flex items-center justify-between cursor-pointer transition-all ${isFormCategoryDropdownOpen ? 'border-[#1A1A1A] ring-2 ring-[#1A1A1A]/20' : 'border-[#E7E5E4] hover:border-[#1A1A1A]'}`}
                    >
                      <span className="text-sm font-bold text-[#1A1A1A] truncate">{formData.category}</span>
                      <ChevronDown className={`w-5 h-5 text-[#57534E] shrink-0 transition-transform duration-300 ${isFormCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    {/* ADDED overscroll-contain HERE FOR DROPDOWN LIST */}
                    <div className={`absolute top-full left-0 right-0 mt-2 py-2 bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar overscroll-contain transition-all duration-200 origin-top ${isFormCategoryDropdownOpen ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-95 invisible'}`}>
                      {['Electronics', 'Accessories', 'Hardware'].map((option) => (
                        <div 
                          key={option}
                          onClick={() => {
                            setFormData({ ...formData, category: option });
                            setIsFormCategoryDropdownOpen(false);
                          }}
                          className={`mx-2 my-1 px-4 py-3 text-sm font-bold cursor-pointer transition-all rounded-full flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-left ${
                            formData.category === option 
                              ? 'bg-[#7BB8A7]/20 text-[#1A1A1A]' 
                              : 'text-[#57534E] hover:bg-[#EFE9DF] hover:text-[#1A1A1A]'
                          }`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-black uppercase tracking-widest text-[#1A1A1A] mb-2">Product Name</label>
                    <input 
                      type="text" required name="name" value={formData.name} onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] transition-all text-sm font-bold text-[#1A1A1A]"
                    />
                  </div>
                  
                  {/* --- CUSTOM FORM SUPPLIER DROPDOWN --- */}
                  <div className="md:col-span-1 relative" ref={formSupplierRef}>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#1A1A1A] mb-2">Supplier</label>
                    <div 
                      onClick={() => setIsFormSupplierDropdownOpen(!isFormSupplierDropdownOpen)}
                      className={`w-full px-4 py-3 bg-[#FAF7F2] border rounded-xl flex items-center justify-between cursor-pointer transition-all ${isFormSupplierDropdownOpen ? 'border-[#1A1A1A] ring-2 ring-[#1A1A1A]/20' : 'border-[#E7E5E4] hover:border-[#1A1A1A]'}`}
                    >
                      <span className={`text-sm font-bold truncate ${formData.supplierId ? 'text-[#1A1A1A]' : 'text-[#A8A29E]'}`}>
                        {formData.supplierId 
                          ? mockSuppliers.find(s => s.id === formData.supplierId)?.name 
                          : "Select a supplier"}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-[#57534E] shrink-0 transition-transform duration-300 ${isFormSupplierDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    {/* ADDED overscroll-contain HERE FOR DROPDOWN LIST */}
                    <div className={`absolute top-full left-0 right-0 mt-2 py-2 bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar overscroll-contain transition-all duration-200 origin-top ${isFormSupplierDropdownOpen ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-95 invisible'}`}>
                      {mockSuppliers.map((supplier) => (
                        <div 
                          key={supplier.id}
                          onClick={() => {
                            setFormData({ ...formData, supplierId: supplier.id });
                            setIsFormSupplierDropdownOpen(false);
                          }}
                          className={`mx-2 my-1 px-4 py-3 text-sm font-bold cursor-pointer transition-all rounded-full flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-left ${
                            formData.supplierId === supplier.id 
                              ? 'bg-[#7BB8A7]/20 text-[#1A1A1A]' 
                              : 'text-[#57534E] hover:bg-[#EFE9DF] hover:text-[#1A1A1A]'
                          }`}
                        >
                          {supplier.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#57534E] mb-2">Cost Price (₱)</label>
                    <input 
                      type="number" step="0.01" required name="costPrice" value={formData.costPrice} onChange={handleInputChange} min="0"
                      className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] transition-all text-sm font-bold text-[#1A1A1A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#1A1A1A] mb-2">Selling Price (₱)</label>
                    <input 
                      type="number" step="0.01" required name="sellingPrice" value={formData.sellingPrice} onChange={handleInputChange} min="0"
                      className="w-full px-4 py-3 bg-[#FFFFFF] border-2 border-[#1A1A1A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7BB8A7] transition-all text-sm font-black text-[#1A1A1A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#1A1A1A] mb-2">Low Stock Reorder Level</label>
                    <input 
                      type="number" required name="reorderLevel" value={formData.reorderLevel} onChange={handleInputChange} min="0"
                      className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E7E5E4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] transition-all text-sm font-bold text-[#1A1A1A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#57534E] mb-2">Current Stock</label>
                    <div className="w-full px-4 py-3 bg-[#EFE9DF] border border-[#E7E5E4] rounded-xl text-sm font-black text-[#57534E] flex items-center gap-2 cursor-not-allowed">
                      <Box size={16} /> 
                      {isAddModalOpen ? "0 (Default)" : editingProduct?.stock}
                    </div>
                    <p className="text-[10px] font-bold text-[#D96B5E] mt-1 italic">*Stock levels are strictly updated via Receiving or POS.</p>
                  </div>
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
                type="submit" form="productForm"
                className="px-6 py-3 bg-[#1A1A1A] text-[#FFFFFF] rounded-xl font-black uppercase text-xs tracking-widest shadow-md hover:bg-[#57534E] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                {isAddModalOpen ? "Save New Product" : "Update Details"}
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
                Confirm Action
              </h2>
              <p className="text-sm font-medium text-[#57534E] mb-8 leading-relaxed">
                {deleteModalConfig.type === 'bulk'
                  ? `Are you sure you want to archive the ${selectedProducts.length} selected item(s)? They will be moved to the archives to preserve transaction history.`
                  : `Are you sure you want to remove this item? It will be archived to preserve transaction history.`
                }
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
                  <Trash2 size={16} /> Archive
                </button>
              </div>
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

export default InventoryHub;