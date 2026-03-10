import { useState, useRef } from 'react';
import { Plus, Search, Filter, Trash2, Edit2, Tag, TrendingUp, TrendingDown, Target, Clock, AlertCircle, Globe2, FileUp, Loader2, Building2, User, LayoutGrid, KanbanSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheses } from '../context/ThesisContext';
import { InvestmentThesis } from '../types';
import { cn } from '../lib/utils';
import { ThesisCard } from '../components/ThesisCard';
import { extractThesisFromPdf } from '../services/gemini';

export default function InvestmentTheses() {
  const { theses, addThesis, updateThesis, deleteThesis } = useTheses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingThesis, setEditingThesis] = useState<InvestmentThesis | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for validation
  const [formValues, setFormValues] = useState({
    entryPrice: '',
    targetPrice: '',
    exitPoint: '',
    currentPrice: '',
    source: 'Personal' as InvestmentThesis['source']
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (values: typeof formValues) => {
    const newErrors: Record<string, string> = {};
    const entry = Number(values.entryPrice);
    const target = Number(values.targetPrice);
    const exit = Number(values.exitPoint);
    const current = Number(values.currentPrice);

    if (values.entryPrice && entry <= 0) newErrors.entryPrice = 'Deve ser positivo';
    if (values.targetPrice && target <= 0) newErrors.targetPrice = 'Deve ser positivo';
    if (values.exitPoint && exit <= 0) newErrors.exitPoint = 'Deve ser positivo';
    if (values.currentPrice && current <= 0) newErrors.currentPrice = 'Deve ser positivo';

    if (values.entryPrice && values.exitPoint && exit >= entry) {
      newErrors.exitPoint = 'Stop Loss deve ser menor que Preço de Entrada';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newValues = { ...formValues, [name]: value };
    setFormValues(newValues as any);
    validate(newValues as any);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const data = await extractThesisFromPdf(file);
      if (data) {
        // Auto-fill form
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) {
          const title = data.title || data.name || '';
          if (title) (form.elements.namedItem('title') as HTMLInputElement).value = title;
          if (data.ticker) (form.elements.namedItem('ticker') as HTMLInputElement).value = data.ticker;
          if (data.thesisSummary) (form.elements.namedItem('description') as HTMLTextAreaElement).value = data.thesisSummary;
          if (data.macroAnalysis) (form.elements.namedItem('macroAnalysis') as HTMLTextAreaElement).value = data.macroAnalysis;
          if (data.fundamentalAnalysis) (form.elements.namedItem('fundamentalAnalysis') as HTMLTextAreaElement).value = data.fundamentalAnalysis;
          if (data.technicalAnalysis) (form.elements.namedItem('technicalAnalysis') as HTMLTextAreaElement).value = data.technicalAnalysis;
          
          setFormValues(prev => ({
            ...prev,
            entryPrice: data.entryPoint?.toString() || '',
            targetPrice: data.targetPrice?.toString() || '',
            exitPoint: data.exitPoint?.toString() || '',
            source: 'BTG' // Default to BTG if uploaded
          }));
        }
      }
    } catch (error) {
      console.error('Failed to extract PDF data', error);
    } finally {
      setIsExtracting(false);
    }
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
      source: formData.get('source') as InvestmentThesis['source'],
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
      currentPrice: thesis.currentPrice?.toString() || '',
      source: thesis.source || 'Personal'
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
      currentPrice: '',
      source: 'Personal'
    });
    setErrors({});
    setIsModalOpen(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
      <div className="flex justify-between items-end mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-4xl font-serif font-semibold text-primary tracking-tight">Teses de Investimento</h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-[0.2em]">Mapeie, acompanhe e categorize suas ideias de investimento</p>
        </div>
        <button 
          onClick={openNewModal}
          className="flex items-center px-4 py-2 bg-primary text-secondary rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Tese
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar teses..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex bg-white border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === 'grid' ? "bg-secondary text-primary" : "text-muted-foreground hover:text-primary"
              )}
              title="Visualização em Grade"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === 'kanban' ? "bg-secondary text-primary" : "text-muted-foreground hover:text-primary"
              )}
              title="Visualização em Mapa (Kanban)"
            >
              <KanbanSquare className="w-4 h-4" />
            </button>
          </div>
          <select 
            className="px-3 py-2 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">Todas Categorias</option>
            <option value="Macro">Macro</option>
            <option value="Equity">Ações</option>
            <option value="Fixed Income">Renda Fixa</option>
            <option value="Crypto">Cripto</option>
            <option value="Alternative">Alternativos</option>
          </select>
          <select 
            className="px-3 py-2 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">Todos Status</option>
            <option value="Draft">Rascunho</option>
            <option value="Active">Ativo</option>
            <option value="Closed">Encerrado</option>
          </select>
        </div>
      </div>

      {/* Content View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredTheses.map(thesis => (
              <motion.div 
                key={thesis.id} 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              >
                <ThesisCard 
                  thesis={thesis} 
                  showActions 
                  onEdit={openEditModal} 
                  onDelete={deleteThesis} 
                />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredTheses.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <Filter className="w-8 h-8 mb-3 opacity-20" />
              <p>Nenhuma tese encontrada com seus critérios.</p>
              <button onClick={openNewModal} className="mt-4 text-accent hover:underline text-sm">Crie sua primeira tese</button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max h-full">
            {[
              { id: 'draft', title: 'Ideias / Rascunho', statuses: ['Draft'] },
              { id: 'waiting', title: 'Aguardando Ponto', statuses: ['aguardando_ponto'] },
              { id: 'active', title: 'Em Execução', statuses: ['Active', 'compra_gradual', 'posicao_cheia', 'venda_programada', 'venda'] },
              { id: 'closed', title: 'Encerradas', statuses: ['Closed', 'encerrada'] }
            ].map(column => {
              const columnTheses = filteredTheses.filter(t => column.statuses.includes(t.status || 'Active'));
              
              return (
                <div key={column.id} className="w-80 flex flex-col bg-secondary/30 rounded-2xl border border-border/50 overflow-hidden">
                  <div className="p-4 border-b border-border/50 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                    <h3 className="font-serif font-bold text-primary">{column.title}</h3>
                    <span className="text-xs font-bold px-2 py-1 bg-secondary text-muted-foreground rounded-full">
                      {columnTheses.length}
                    </span>
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto space-y-4">
                    {columnTheses.map(thesis => (
                      <div key={thesis.id} className="bg-white rounded-xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEditModal(thesis)}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#dcfce7] bg-[#f0fdf4] text-[#15803d] uppercase">
                            {thesis.category || 'Equity'}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{thesis.ticker}</span>
                        </div>
                        <h4 className="font-serif font-semibold text-primary text-sm mb-2 line-clamp-2">{thesis.title || thesis.ticker}</h4>
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-4 pt-3 border-t border-border">
                          <span>Alvo: {thesis.ticker?.includes('.') || thesis.ticker?.length > 5 ? 'R$' : 'US$'} {thesis.targetPrice?.toFixed(2) || '0.00'}</span>
                          <span>{new Date(thesis.updatedAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    ))}
                    {columnTheses.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-xl">
                        Nenhuma tese
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-white z-10">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-serif font-semibold text-primary">
                  {editingThesis ? 'Editar Tese' : 'Nova Tese de Investimento'}
                </h2>
                {!editingThesis && (
                  <>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handlePdfUpload} 
                      accept="application/pdf" 
                      className="hidden" 
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isExtracting}
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
                    >
                      {isExtracting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileUp className="w-3.5 h-3.5" />
                      )}
                      {isExtracting ? 'Extraindo...' : 'Importar PDF'}
                    </button>
                  </>
                )}
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-primary">
                <span className="sr-only">Fechar</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Título</label>
                  <input 
                    name="title" 
                    defaultValue={editingThesis?.title} 
                    required 
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="ex: Long em Infraestrutura de IA"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Ticker / Ativo</label>
                  <input 
                    name="ticker" 
                    defaultValue={editingThesis?.ticker} 
                    required 
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent uppercase font-mono"
                    placeholder="ex: NVDA"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Descrição da Tese</label>
                <textarea 
                  name="description" 
                  defaultValue={editingThesis?.description} 
                  required 
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Explique seu racional..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Categoria</label>
                  <select 
                    name="category" 
                    defaultValue={editingThesis?.category || 'Equity'} 
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="Macro">Macro</option>
                    <option value="Equity">Ações</option>
                    <option value="Fixed Income">Renda Fixa</option>
                    <option value="Crypto">Cripto</option>
                    <option value="Alternative">Alternativos</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Fonte / Origem</label>
                  <select 
                    name="source" 
                    value={formValues.source}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="Personal">Minha Tese (Pessoal)</option>
                    <option value="BTG">BTG Pactual</option>
                    <option value="Bank">Outro Banco / Instituição</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Convicção</label>
                  <select 
                    name="conviction" 
                    defaultValue={editingThesis?.conviction || 'Medium'} 
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="High">Alta</option>
                    <option value="Medium">Média</option>
                    <option value="Low">Baixa</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Status</label>
                  <select 
                    name="status" 
                    defaultValue={editingThesis?.status || 'Draft'} 
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="Draft">Rascunho</option>
                    <option value="Active">Ativo</option>
                    <option value="Closed">Encerrado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Preço de Entrada</label>
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
                  <label className="text-sm font-medium text-primary">Preço Alvo</label>
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
                  <label className="text-sm font-medium text-primary">Stop Loss / Saída</label>
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
                  <label className="text-sm font-medium text-primary">Preço Atual</label>
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
                  <label className="text-sm font-medium text-primary">Horizonte de Tempo</label>
                  <select 
                    name="horizon" 
                    defaultValue={editingThesis?.horizon || 'Medium'} 
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="Short">Curto Prazo</option>
                    <option value="Medium">Médio Prazo</option>
                    <option value="Long">Longo Prazo</option>
                  </select>
                </div>
              </div>

              {(editingThesis?.macroAnalysis || editingThesis?.fundamentalAnalysis || editingThesis?.technicalAnalysis) && (
                <div className="space-y-4 border-t border-border pt-4">
                  <h3 className="font-medium text-primary">Dados da Análise 360°</h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">Análise Macro</label>
                    <textarea 
                      name="macroAnalysis" 
                      defaultValue={editingThesis?.macroAnalysis} 
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">Análise Fundamentalista</label>
                    <textarea 
                      name="fundamentalAnalysis" 
                      defaultValue={editingThesis?.fundamentalAnalysis} 
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">Análise Técnica</label>
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
                  placeholder="Separe com vírgulas (ex: IA, Crescimento, Tech)"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-primary text-secondary rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingThesis ? 'Salvar Alterações' : 'Criar Tese'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
