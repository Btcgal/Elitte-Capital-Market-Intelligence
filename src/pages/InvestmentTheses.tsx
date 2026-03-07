import { useState } from 'react';
import { Plus, Search, Filter, Trash2, Edit2, Tag, TrendingUp, TrendingDown, Target, Clock, AlertCircle, Globe2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheses } from '../context/ThesisContext';
import { InvestmentThesis } from '../types';
import { cn } from '../lib/utils';

export default function InvestmentTheses() {
  const { theses, addThesis, updateThesis, deleteThesis } = useTheses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingThesis, setEditingThesis] = useState<InvestmentThesis | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Form state for validation
  const [formValues, setFormValues] = useState({
    entryPrice: '',
    targetPrice: '',
    exitPoint: '',
    currentPrice: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (values: typeof formValues) => {
    const newErrors: Record<string, string> = {};
    const entry = Number(values.entryPrice);
    const target = Number(values.targetPrice);
    const exit = Number(values.exitPoint);
    const current = Number(values.currentPrice);

    if (values.entryPrice && entry <= 0) newErrors.entryPrice = 'Must be positive';
    if (values.targetPrice && target <= 0) newErrors.targetPrice = 'Must be positive';
    if (values.exitPoint && exit <= 0) newErrors.exitPoint = 'Must be positive';
    if (values.currentPrice && current <= 0) newErrors.currentPrice = 'Must be positive';

    if (values.entryPrice && values.exitPoint && exit >= entry) {
      newErrors.exitPoint = 'Stop Loss must be less than Entry Price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newValues = { ...formValues, [name]: value };
    setFormValues(newValues);
    validate(newValues);
  };

  const filteredTheses = theses.filter(thesis => {
    const matchesSearch = thesis.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          thesis.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          thesis.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || thesis.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || thesis.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!validate(formValues)) return;

    const thesisData = {
      title: formData.get('title') as string,
      ticker: formData.get('ticker') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as InvestmentThesis['category'],
      conviction: formData.get('conviction') as InvestmentThesis['conviction'],
      status: formData.get('status') as InvestmentThesis['status'],
      targetPrice: Number(formValues.targetPrice) || undefined,
      entryPrice: Number(formValues.entryPrice) || undefined,
      exitPoint: Number(formValues.exitPoint) || undefined,
      currentPrice: Number(formValues.currentPrice) || undefined,
      horizon: formData.get('horizon') as InvestmentThesis['horizon'],
      tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean),
      macroAnalysis: formData.get('macroAnalysis') as string,
      fundamentalAnalysis: formData.get('fundamentalAnalysis') as string,
      technicalAnalysis: formData.get('technicalAnalysis') as string,
    };

    if (editingThesis) {
      updateThesis({ ...editingThesis, ...thesisData, updatedAt: new Date().toISOString() });
    } else {
      addThesis(thesisData);
    }
    setIsModalOpen(false);
    setEditingThesis(null);
  };

  const openEditModal = (thesis: InvestmentThesis) => {
    setEditingThesis(thesis);
    setFormValues({
      entryPrice: thesis.entryPrice?.toString() || '',
      targetPrice: thesis.targetPrice?.toString() || '',
      exitPoint: thesis.exitPoint?.toString() || '',
      currentPrice: thesis.currentPrice?.toString() || ''
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingThesis(null);
    setFormValues({
      entryPrice: '',
      targetPrice: '',
      exitPoint: '',
      currentPrice: ''
    });
    setErrors({});
    setIsModalOpen(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
      <div className="flex justify-between items-end mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-4xl font-serif font-semibold text-primary tracking-tight">Investment Theses</h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-[0.2em]">Map, track, and categorize your investment ideas</p>
        </div>
        <button 
          onClick={openNewModal}
          className="flex items-center px-4 py-2 bg-primary text-secondary rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Thesis
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search theses..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="px-3 py-2 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Macro">Macro</option>
            <option value="Equity">Equity</option>
            <option value="Fixed Income">Fixed Income</option>
            <option value="Crypto">Crypto</option>
            <option value="Alternative">Alternative</option>
          </select>
          <select 
            className="px-3 py-2 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredTheses.map(thesis => (
            <motion.div 
              key={thesis.id} 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className="bg-white rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="p-5 border-b border-border flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full border",
                      thesis.category === 'Macro' ? "bg-blue-50 text-blue-700 border-blue-200" :
                      thesis.category === 'Equity' ? "bg-green-50 text-green-700 border-green-200" :
                      thesis.category === 'Crypto' ? "bg-purple-50 text-purple-700 border-purple-200" :
                      "bg-gray-50 text-gray-700 border-gray-200"
                    )}>
                      {thesis.category}
                    </span>
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full border",
                      thesis.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      thesis.status === 'Draft' ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-slate-50 text-slate-700 border-slate-200"
                    )}>
                      {thesis.status}
                    </span>
                  </div>
                  <h3 className="font-serif font-semibold text-lg text-primary">{thesis.title}</h3>
                  <p className="text-sm font-mono text-muted-foreground mt-1">{thesis.ticker}</p>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => openEditModal(thesis)}
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteThesis(thesis.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-5 flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{thesis.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="w-3.5 h-3.5" />
                    <span>Target: {thesis.targetPrice ? `$${thesis.targetPrice}` : '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Entry: {thesis.entryPrice ? `$${thesis.entryPrice}` : '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Horizon: {thesis.horizon}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Conviction: {thesis.conviction}</span>
                  </div>
                  {(thesis.macroAnalysis || thesis.fundamentalAnalysis) && (
                    <div className="col-span-2 flex items-center gap-1.5 text-accent text-[10px] mt-1 font-medium">
                      <Globe2 className="w-3 h-3" />
                      <span>360° Analysis Included</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {thesis.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-secondary text-muted-foreground rounded border border-border">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="p-3 bg-secondary/30 border-t border-border text-[10px] text-muted-foreground text-center">
                Last updated: {new Date(thesis.updatedAt).toLocaleDateString()}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredTheses.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
            <Filter className="w-8 h-8 mb-3 opacity-20" />
            <p>No theses found matching your criteria.</p>
            <button onClick={openNewModal} className="mt-4 text-accent hover:underline text-sm">Create your first thesis</button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-serif font-semibold text-primary">
                {editingThesis ? 'Edit Thesis' : 'New Investment Thesis'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-primary">
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Title</label>
                  <input 
                    name="title" 
                    defaultValue={editingThesis?.title} 
                    required 
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="e.g. Long AI Infrastructure"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Ticker / Asset</label>
                  <input 
                    name="ticker" 
                    defaultValue={editingThesis?.ticker} 
                    required 
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent uppercase font-mono"
                    placeholder="e.g. NVDA"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Thesis Description</label>
                <textarea 
                  name="description" 
                  defaultValue={editingThesis?.description} 
                  required 
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Explain your rationale..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Category</label>
                  <select 
                    name="category" 
                    defaultValue={editingThesis?.category || 'Equity'} 
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="Macro">Macro</option>
                    <option value="Equity">Equity</option>
                    <option value="Fixed Income">Fixed Income</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Alternative">Alternative</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Conviction</label>
                  <select 
                    name="conviction" 
                    defaultValue={editingThesis?.conviction || 'Medium'} 
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Status</label>
                  <select 
                    name="status" 
                    defaultValue={editingThesis?.status || 'Draft'} 
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Entry Price</label>
                  <input 
                    name="entryPrice" 
                    type="number" 
                    step="0.01"
                    value={formValues.entryPrice}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent",
                      errors.entryPrice ? "border-destructive" : "border-border"
                    )}
                    placeholder="0.00"
                  />
                  {errors.entryPrice && <p className="text-[10px] text-destructive">{errors.entryPrice}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Target Price</label>
                  <input 
                    name="targetPrice" 
                    type="number" 
                    step="0.01"
                    value={formValues.targetPrice}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent",
                      errors.targetPrice ? "border-destructive" : "border-border"
                    )}
                    placeholder="0.00"
                  />
                  {errors.targetPrice && <p className="text-[10px] text-destructive">{errors.targetPrice}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Stop Loss / Exit</label>
                  <input 
                    name="exitPoint" 
                    type="number" 
                    step="0.01"
                    value={formValues.exitPoint}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent",
                      errors.exitPoint ? "border-destructive" : "border-border"
                    )}
                    placeholder="0.00"
                  />
                  {errors.exitPoint && <p className="text-[10px] text-destructive">{errors.exitPoint}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Current Price</label>
                  <input 
                    name="currentPrice" 
                    type="number" 
                    step="0.01"
                    value={formValues.currentPrice}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent",
                      errors.currentPrice ? "border-destructive" : "border-border"
                    )}
                    placeholder="0.00"
                  />
                  {errors.currentPrice && <p className="text-[10px] text-destructive">{errors.currentPrice}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Time Horizon</label>
                  <select 
                    name="horizon" 
                    defaultValue={editingThesis?.horizon || 'Medium'} 
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="Short">Short Term</option>
                    <option value="Medium">Medium Term</option>
                    <option value="Long">Long Term</option>
                  </select>
                </div>
              </div>

              {(editingThesis?.macroAnalysis || editingThesis?.fundamentalAnalysis || editingThesis?.technicalAnalysis) && (
                <div className="space-y-4 border-t border-border pt-4">
                  <h3 className="font-medium text-primary">360° Analysis Data</h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">Macro Analysis</label>
                    <textarea 
                      name="macroAnalysis" 
                      defaultValue={editingThesis?.macroAnalysis} 
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">Fundamental Analysis</label>
                    <textarea 
                      name="fundamentalAnalysis" 
                      defaultValue={editingThesis?.fundamentalAnalysis} 
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">Technical Analysis</label>
                    <textarea 
                      name="technicalAnalysis" 
                      defaultValue={editingThesis?.technicalAnalysis} 
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Tags</label>
                <input 
                  name="tags" 
                  defaultValue={editingThesis?.tags.join(', ')} 
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Separate with commas (e.g. AI, Growth, Tech)"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-primary text-secondary rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingThesis ? 'Save Changes' : 'Create Thesis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
