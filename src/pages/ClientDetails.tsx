import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  UploadCloud, 
  FileText, 
  Loader2, 
  PieChart, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Mail,
  Download,
  ExternalLink,
  Users,
  Plus,
  Trash2
} from 'lucide-react';
import { extractPortfolioFromImages, Asset, analyzePortfolio360, PortfolioAnalysis360 } from '../services/gemini';
import { useClients } from '../context/ClientContext';
import { cn } from '../lib/utils';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { PortfolioRebalancing } from '../components/PortfolioRebalancing';

export default function ClientDetails() {
  const { id } = useParams();
  const { clients, updateClient } = useClients();
  const client = clients.find(c => c.id === id);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'rebalancing' | 'history' | 'mailing'>('overview');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [portfolio, setPortfolio] = useState<Asset[]>(client?.portfolio || []);
  const [files, setFiles] = useState<File[]>([]);
  const [analysis360, setAnalysis360] = useState<PortfolioAnalysis360 | null>(client?.lastAnalysis360 || null);
  const [history, setHistory] = useState<any[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mailing List State
  const [mailingLists, setMailingLists] = useState<any[]>([]);
  const [newListName, setNewListName] = useState('');
  const [newListType, setNewListType] = useState('custom');
  const [isLoadingLists, setIsLoadingLists] = useState(false);

  if (!client) return <div className="p-8">Cliente não encontrado.</div>;

  // Sync state with client data if it changes (e.g. from other tabs or initial load)
  useEffect(() => {
    if (client.portfolio && JSON.stringify(client.portfolio) !== JSON.stringify(portfolio)) {
      setPortfolio(client.portfolio);
    }
    if (client.lastAnalysis360 && JSON.stringify(client.lastAnalysis360) !== JSON.stringify(analysis360)) {
      setAnalysis360(client.lastAnalysis360);
    }
  }, [client]);

  useEffect(() => {
    if (client) {
      fetch(`/api/clients/${client.id}/history`)
        .then(res => res.json())
        .then(data => setHistory(data))
        .catch(err => console.error('Failed to fetch history', err));
    }
  }, [client, activeTab]);

  useEffect(() => {
    if (activeTab === 'mailing') {
      fetchMailingLists();
    }
  }, [activeTab]);

  const fetchMailingLists = async () => {
    setIsLoadingLists(true);
    try {
      const res = await fetch('/api/mailing-lists?userId=demo-user');
      const data = await res.json();
      setMailingLists(data);
    } catch (error) {
      console.error('Failed to fetch mailing lists', error);
    } finally {
      setIsLoadingLists(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName) return;
    try {
      await fetch('/api/mailing-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          name: newListName,
          type: newListType
        })
      });
      setNewListName('');
      fetchMailingLists();
    } catch (error) {
      console.error('Failed to create list', error);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta lista?')) return;
    try {
      await fetch(`/api/mailing-lists/${listId}`, {
        method: 'DELETE'
      });
      fetchMailingLists();
    } catch (error) {
      console.error('Failed to delete list', error);
    }
  };

  const handleAddContact = async (listId: string) => {
    try {
      await fetch(`/api/mailing-lists/${listId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: client.name,
          email: client.email,
          phone: client.phone
        })
      });
      fetchMailingLists();
    } catch (error) {
      console.error('Failed to add contact', error);
      alert('Erro ao adicionar contato.');
    }
  };

  const handleRemoveContact = async (listId: string, contactId: string) => {
    try {
      await fetch(`/api/mailing-lists/${listId}/contacts/${contactId}`, {
        method: 'DELETE'
      });
      fetchMailingLists();
    } catch (error) {
      console.error('Failed to remove contact', error);
      alert('Erro ao remover contato.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const handleSendEmail = async () => {
    if (!client || !analysis360) {
      alert('É necessário gerar o relatório 360° antes de enviar.');
      return;
    }
    
    setIsSendingEmail(true);
    try {
      const htmlContent = decodeURIComponent(generateEmailHtml());
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: client.email,
          subject: 'Relatório 360° - Elitte Capital',
          content: htmlContent,
          type: 'report',
          clientId: client.id,
          title: 'Relatório Consolidado 360°',
          description: 'Enviado via Painel do Cliente'
        })
      });

      if (response.ok) {
        alert('Email enviado com sucesso!');
        const res = await fetch(`/api/clients/${client.id}/history`);
        const data = await res.json();
        setHistory(data);
      } else {
        alert('Erro ao enviar email.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    let newPortfolioState: Asset[] = [];
    try {
      const extractedAssets = await extractPortfolioFromImages(files);
      
      // Consolidate with existing portfolio
      setPortfolio(prev => {
        const newPortfolio = [...prev];
        extractedAssets.forEach(newAsset => {
          const existing = newPortfolio.find(a => a.ticker === newAsset.ticker);
          if (existing) {
            // Simple consolidation logic for demo
            const totalQty = existing.quantity + newAsset.quantity;
            const avgPrice = ((existing.quantity * existing.averagePrice) + (newAsset.quantity * newAsset.averagePrice)) / totalQty;
            existing.quantity = totalQty;
            existing.averagePrice = avgPrice;
            // Update current price if the new one has it
            if (newAsset.currentPrice > 0) existing.currentPrice = newAsset.currentPrice;
          } else {
            newPortfolio.push(newAsset);
          }
        });
        newPortfolioState = newPortfolio;
        return newPortfolio;
      });
      setFiles([]); // Clear files after processing
      
      // Persist portfolio
      updateClient(client.id, { portfolio: newPortfolioState });
      
      // Save portfolio update to history
      await fetch(`/api/clients/${client.id}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PORTFOLIO_UPDATE',
          title: 'Carteira Atualizada',
          description: `Consolidação de ${files.length} arquivos.`,
          content: JSON.stringify(newPortfolioState)
        })
      });
      
      // Refresh history
      const res = await fetch(`/api/clients/${client.id}/history`);
      const data = await res.json();
      setHistory(data);
      
    } catch (error: any) {
      console.error("Error processing files", error);
      if (error.message?.includes('Limite de requisições') || error.message?.includes('429') || error.message?.includes('quota')) {
        alert("Limite de requisições da IA excedido. Por favor, aguarde um momento e tente novamente.");
      } else {
        alert("Erro ao processar os arquivos. Tente novamente.");
      }
      setIsUploading(false);
      return;
    }
    
    setIsUploading(false);
    
    if (newPortfolioState.length > 0) {
      setIsAnalyzing(true);
      try {
        const analysis = await analyzePortfolio360(newPortfolioState);
        if (analysis) {
          setAnalysis360(analysis);
          
          // Persist analysis
          updateClient(client.id, { lastAnalysis360: analysis });
          
          // Save report generation to history
          await fetch(`/api/clients/${client.id}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'REPORT_GENERATED',
              title: 'Relatório 360° Gerado',
              description: 'Análise de portfólio consolidada gerada com sucesso.',
              content: JSON.stringify(analysis)
            })
          });
          
          // Refresh history
          const res = await fetch(`/api/clients/${client.id}/history`);
          const data = await res.json();
          setHistory(data);
        }
      } catch (error) {
        console.error("Error analyzing portfolio", error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    try {
      // Dynamic import to ensure it loads correctly
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Add a temporary class to ensure backgrounds print correctly
      element.classList.add('print-mode');
      
      const opt = {
        margin:       [10, 10, 10, 10] as [number, number, number, number],
        filename:     `Relatorio_360_${client.name.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };
      
      await html2pdf().set(opt).from(element).save();
      
      element.classList.remove('print-mode');
        
      // Save PDF export action to history
      await fetch(`/api/clients/${client.id}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PDF_EXPORT',
          title: 'Relatório PDF Exportado',
          description: 'Relatório 360° exportado como PDF.',
          content: ''
        })
      });
      
      // Refresh history
      const res = await fetch(`/api/clients/${client.id}/history`);
      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Erro ao exportar PDF. Tente novamente.');
      element.classList.remove('print-mode');
    }
  };

  const generateEmailHtml = () => {
    if (!analysis360) return '';
    
    const html = `
      <div style="font-family: 'Georgia', serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f2ed;">
        <div style="text-align: center; border-bottom: 1px solid #d1d1d1; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="font-size: 24px; margin: 0; color: #1a1a1a; letter-spacing: 2px;">ELITTE <span style="font-family: sans-serif; font-size: 10px; vertical-align: middle;">CAPITAL · PRIVATE</span></h1>
          <p style="font-family: sans-serif; font-size: 12px; color: #666; margin-top: 5px;">Relatório 360° Consolidado</p>
        </div>
        
        <p style="font-family: sans-serif; font-size: 14px;">Olá <strong>${client.name}</strong>,</p>
        <p style="font-family: sans-serif; font-size: 14px; line-height: 1.6;">Abaixo está o resumo da análise macroeconômica e de risco da sua carteira consolidada atualizada.</p>
        
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <h2 style="font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 0;">Contexto Macroeconômico</h2>
          <p style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #444;">${analysis360.macroContext}</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <h2 style="font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 0;">Conclusão da Carteira</h2>
          <p style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #444;">${analysis360.overallConclusion}</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://elittecapital.com.br/reports/${client.id}" style="display: inline-block; padding: 12px 24px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-family: sans-serif; font-size: 14px; border-radius: 4px; font-weight: bold;">Acessar Relatório Completo Online</a>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #d1d1d1; text-align: center; font-family: sans-serif; font-size: 10px; color: #888;">
          <p>A Elitte Capital é uma empresa de assessoria de investimento devidamente registrada na CVM. Atuamos através da Necton Investimentos.</p>
          <p>Este material tem propósito exclusivamente informativo.</p>
        </div>
      </div>
    `;
    return encodeURIComponent(html);
  };

  // Calculate totals
  const totalValue = portfolio.reduce((acc, asset) => acc + (asset.quantity * (asset.currentPrice || asset.averagePrice)), 0);
  
  // Group by type for chart
  const typeData = portfolio.reduce((acc, asset) => {
    const value = asset.quantity * (asset.currentPrice || asset.averagePrice);
    const existing = acc.find(item => item.name === asset.type);
    if (existing) {
      existing.value += value;
    } else {
      acc.push({ name: asset.type, value });
    }
    return acc;
  }, [] as { name: string, value: number }[]);

  const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center space-x-4">
          <Link to="/clients" className="p-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-4xl font-serif font-semibold text-primary tracking-tight">{client.name}</h1>
            <p className="text-muted-foreground text-sm mt-2 uppercase tracking-[0.2em]">{client.email} • Perfil: {client.riskProfile}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleExportPDF}
            className="flex items-center px-5 py-2.5 bg-white border border-border rounded-xl text-sm font-medium text-primary hover:bg-secondary/50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </button>
          <button 
            onClick={handleSendEmail}
            disabled={isSendingEmail || !analysis360}
            className="flex items-center px-5 py-2.5 bg-white border border-border rounded-xl text-sm font-medium text-primary hover:bg-secondary/50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSendingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
            Enviar Email
          </button>
          <button 
            onClick={() => {
              setActiveTab('rebalancing');
              setTimeout(() => document.getElementById('tabs-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
            }}
            className={cn(
              "flex items-center px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm",
              activeTab === 'rebalancing' ? "bg-primary text-secondary" : "bg-white border border-border text-primary hover:bg-secondary/50"
            )}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Rebalancear
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div id="tabs-section" className="flex space-x-4 border-b border-border pb-px scroll-mt-24">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "pb-3 text-sm font-medium transition-colors border-b-2",
            activeTab === 'overview' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"
          )}
        >
          Visão Geral 360°
        </button>
        <button
          onClick={() => setActiveTab('rebalancing')}
          className={cn(
            "pb-3 text-sm font-medium transition-colors border-b-2",
            activeTab === 'rebalancing' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"
          )}
        >
          Análise de Rebalanceamento
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "pb-3 text-sm font-medium transition-colors border-b-2",
            activeTab === 'history' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"
          )}
        >
          Histórico de Atividades
        </button>
        <button
          onClick={() => setActiveTab('mailing')}
          className={cn(
            "pb-3 text-sm font-medium transition-colors border-b-2",
            activeTab === 'mailing' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"
          )}
        >
          Listas de Transmissão
        </button>
      </div>

      {activeTab === 'mailing' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
            <h3 className="text-lg font-serif font-semibold text-primary mb-4">Gerenciar Listas de Transmissão</h3>
            
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                placeholder="Nome da nova lista"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="flex-1 px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <select
                value={newListType}
                onChange={(e) => setNewListType(e.target.value)}
                className="px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="custom">Personalizada</option>
                <option value="clients">Clientes</option>
                <option value="prospects">Prospects</option>
              </select>
              <button
                onClick={handleCreateList}
                disabled={!newListName}
                className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Lista
              </button>
            </div>

            {isLoadingLists ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mailingLists.map((list) => (
                  <div key={list.id} className="border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-primary">{list.name}</h4>
                        <span className="text-xs text-muted-foreground capitalize">{list.type}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteList(list.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {list.contacts?.length || 0} contatos
                      </span>
                      {list.contacts?.some((c: any) => c.email === client.email) ? (
                        <button
                          onClick={() => {
                            const contact = list.contacts.find((c: any) => c.email === client.email);
                            if (contact) handleRemoveContact(list.id, contact.id);
                          }}
                          className="text-sm text-destructive hover:underline flex items-center"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Remover
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddContact(list.id)}
                          className="text-sm text-primary hover:underline flex items-center"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Adicionar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'history' ? (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-serif font-semibold text-primary">Histórico de Relatórios e Envios</h3>
          </div>
          <div className="p-0">
            {history.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhuma atividade registrada para este cliente.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {history.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-secondary/20 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <span className={cn(
                          "inline-flex items-center justify-center w-8 h-8 rounded-full mr-3",
                          item.type === 'EMAIL_SENT' ? "bg-blue-100 text-blue-600" : 
                          item.type === 'REPORT_GENERATED' ? "bg-green-100 text-green-600" :
                          item.type === 'PDF_EXPORT' ? "bg-orange-100 text-orange-600" :
                          item.type === 'PORTFOLIO_UPDATE' ? "bg-purple-100 text-purple-600" :
                          "bg-gray-100 text-gray-600"
                        )}>
                          {item.type === 'EMAIL_SENT' ? <Mail className="w-4 h-4" /> : 
                           item.type === 'REPORT_GENERATED' ? <FileText className="w-4 h-4" /> :
                           item.type === 'PDF_EXPORT' ? <Download className="w-4 h-4" /> :
                           item.type === 'PORTFOLIO_UPDATE' ? <UploadCloud className="w-4 h-4" /> :
                           <AlertCircle className="w-4 h-4" />}
                        </span>
                        <div>
                          <h4 className="text-sm font-semibold text-primary">{item.title}</h4>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString()} às {new Date(item.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    {item.content && item.type !== 'PDF_EXPORT' && (
                      <div className="mt-3 pl-11">
                        <details className="text-xs text-muted-foreground cursor-pointer group">
                          <summary className="hover:text-primary transition-colors focus:outline-none">Ver detalhes do conteúdo</summary>
                          <div className="mt-2 p-3 bg-secondary/30 rounded-lg border border-border overflow-x-auto">
                            <pre className="whitespace-pre-wrap font-mono text-[10px]">{item.content.substring(0, 500)}...</pre>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'rebalancing' ? (
        <PortfolioRebalancing 
          portfolio={portfolio} 
          riskProfile={client.riskProfile} 
          initialContribution={client.lastRebalancingContribution || 0}
          onContributionChange={(val) => updateClient(client.id, { lastRebalancingContribution: val })}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Upload & Consolidation */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-serif font-semibold text-primary mb-4">Consolidar Carteira</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Faça upload de extratos (PDF, Imagens) de diferentes bancos/corretoras. A IA irá extrair e consolidar os ativos automaticamente.
            </p>
            
            <div 
              className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-primary">Clique para anexar arquivos</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, PDF até 10MB</p>
              <input 
                type="file" 
                multiple 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
              />
            </div>

            {files.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-medium text-primary">Arquivos selecionados:</h3>
                <ul className="space-y-2">
                  {files.map((file, idx) => (
                    <li key={idx} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border">
                      <div className="flex items-center overflow-hidden">
                        <FileText className="w-4 h-4 text-accent mr-3 flex-shrink-0" />
                        <span className="text-sm text-primary truncate">{file.name}</span>
                      </div>
                      <button 
                        onClick={() => removeFile(idx)}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        &times;
                      </button>
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={processFiles}
                  disabled={isUploading}
                  className="w-full mt-4 flex items-center justify-center px-4 py-2.5 bg-primary text-secondary rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando com IA...
                    </>
                  ) : (
                    'Extrair e Consolidar'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* AI Insights Widget */}
          {isAnalyzing ? (
            <div className="bg-secondary p-6 rounded-2xl border border-border flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
              <p className="text-sm text-muted-foreground tracking-wide">Gerando Análise 360° do Portfólio...</p>
            </div>
          ) : analysis360 ? (
            <div className="bg-secondary p-6 rounded-2xl border border-border space-y-4">
              <div className="flex items-center mb-3">
                <CheckCircle2 className="w-5 h-5 text-accent mr-2" />
                <h3 className="text-sm font-semibold text-primary">Conclusão da Carteira</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis360.overallConclusion}
              </p>
            </div>
          ) : portfolio.length > 0 && (
            <div className="bg-secondary p-6 rounded-2xl border border-border">
              <div className="flex items-center mb-3">
                <CheckCircle2 className="w-5 h-5 text-accent mr-2" />
                <h3 className="text-sm font-semibold text-primary">Insight da Carteira</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Carteira consolidada com sucesso. A exposição atual em renda variável está em {((typeData.find(d => d.name === 'Stock')?.value || 0) / totalValue * 100).toFixed(1)}%. 
                Recomenda-se revisar a tese macroeconômica global para os ativos internacionais identificados.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Portfolio View */}
        <div className="lg:col-span-2 space-y-6" id="report-content">
          {portfolio.length === 0 ? (
            <div className="bg-white border border-border rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center">
              <PieChart className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-serif font-medium text-primary mb-2">Nenhum ativo consolidado</h3>
              <p className="text-muted-foreground max-w-sm">
                Faça o upload dos extratos do cliente para visualizar a carteira consolidada, alocação por classe e análise de risco.
              </p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Patrimônio Consolidado</p>
                  <p className="text-2xl font-serif font-semibold text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total de Ativos</p>
                  <p className="text-2xl font-serif font-semibold text-primary">{portfolio.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Instituições</p>
                  <p className="text-2xl font-serif font-semibold text-primary">
                    {new Set(portfolio.map(a => a.institution)).size}
                  </p>
                </div>
              </div>

              {/* Chart & Table */}
              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center">
                  <h3 className="text-xl font-serif font-semibold text-primary">Alocação Atual</h3>
                </div>
                
                <div className="p-6 flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-full md:w-1/3 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={typeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {typeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                        />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="w-full md:w-2/3 max-h-[400px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-sm text-left relative">
                      <thead className="text-xs text-[#737373] uppercase tracking-wider bg-[rgba(245,242,237,0.5)] sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-4 font-medium">Ativo</th>
                          <th className="px-4 py-4 font-medium">Tipo</th>
                          <th className="px-4 py-4 font-medium text-right">Qtd</th>
                          <th className="px-4 py-4 font-medium text-right">Preço Médio</th>
                          <th className="px-4 py-4 font-medium text-right">Total</th>
                          <th className="px-4 py-4 font-medium">Origem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e5e5]">
                        {portfolio.map((asset, idx) => (
                          <tr key={idx} className="hover:bg-[rgba(245,242,237,0.3)] transition-colors">
                            <td className="px-4 py-4">
                              <div className="font-medium text-[#1a1a1a]">{asset.ticker}</div>
                              <div className="text-xs text-[#737373] truncate max-w-[150px]">{asset.name}</div>
                            </td>
                            <td className="px-4 py-4 text-[#737373]">{asset.type}</td>
                            <td className="px-4 py-4 text-right text-[#1a1a1a]">{asset.quantity}</td>
                            <td className="px-4 py-4 text-right text-[#737373]">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: asset.currency }).format(asset.averagePrice)}
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-[#1a1a1a]">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: asset.currency }).format(asset.quantity * (asset.currentPrice || asset.averagePrice))}
                            </td>
                            <td className="px-4 py-4 text-[#737373] text-xs">{asset.institution}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 360 Analysis Report */}
              {analysis360 && (
                <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-sm overflow-hidden mt-8">
                  <div className="p-8 border-b border-[#e5e5e5] bg-[rgba(245,242,237,0.3)]">
                    <h3 className="text-2xl font-serif font-semibold text-[#1a1a1a] tracking-tight">Relatório 360° Consolidado</h3>
                    <p className="text-sm text-[#737373] mt-2 uppercase tracking-widest">Análise Macroeconômica e Risco</p>
                  </div>
                  <div className="p-8 space-y-8 prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-[#1a1a1a] prose-a:text-[#8c7b65] prose-p:text-[#737373] prose-li:text-[#737373]">
                    <div>
                      <h4 className="text-lg font-semibold border-b border-[#e5e5e5] pb-2 mb-4">Contexto Macroeconômico</h4>
                      <p>{analysis360.macroContext}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-lg font-semibold border-b border-[#e5e5e5] pb-2 mb-4">Avaliação de Risco</h4>
                        <p>{analysis360.riskAssessment}</p>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold border-b border-[#e5e5e5] pb-2 mb-4">Recomendações de Hedge</h4>
                        <p>{analysis360.hedgeRecommendations}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold border-b border-[#e5e5e5] pb-2 mb-4">Atualizações Oficiais dos Ativos</h4>
                      <ul className="space-y-3">
                        {analysis360.assetNewsAndUpdates.map((update, idx) => (
                          <li key={idx} className="bg-[rgba(245,242,237,0.3)] p-4 rounded-xl border border-[rgba(229,229,229,0.5)]">
                            <span className="font-semibold text-[#1a1a1a] block mb-1">{update.ticker}</span>
                            <span className="text-sm text-[#737373]">{update.update}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {/* PDF Footer Only visible in PDF */}
                  <div className="hidden print:block p-8 border-t border-[#e5e5e5] mt-8 text-center">
                    <div className="flex justify-center items-center space-x-6 mb-3">
                      <div className="flex flex-col items-center">
                        <span className="font-serif text-lg font-semibold tracking-widest text-[#1a1a1a] leading-none">ELITTE</span>
                        <span className="font-sans text-[8px] uppercase tracking-[0.2em] text-[#737373] mt-1">Capital · Private</span>
                      </div>
                      <span className="text-[#e5e5e5] h-6 w-px bg-[#e5e5e5]"></span>
                      <span className="font-bold text-[#1a1a1a] text-lg tracking-tight">necton</span>
                    </div>
                    <p className="text-[10px] text-[#737373] max-w-4xl leading-relaxed text-justify mx-auto">
                      A Elitte Capital é uma empresa de assessoria de investimento devidamente registrada na Comissão de Valores Mobiliários (CVM), na forma da Resolução CVM 16/2021. Atuamos no mercado financeiro através da Necton Investimentos, instituição financeira autorizada a funcionar pelo Banco Central do Brasil. As informações contidas neste relatório são de caráter exclusivamente informativo e não constituem oferta, recomendação ou sugestão de investimento. Rentabilidade passada não é garantia de rentabilidade futura.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
