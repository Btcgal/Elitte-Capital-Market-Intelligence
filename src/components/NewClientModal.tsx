import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileText, Check, Loader2 } from 'lucide-react';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: any) => void;
}

export function NewClientModal({ isOpen, onClose, onSave }: NewClientModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [riskProfile, setRiskProfile] = useState('Moderado');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length > 0) {
      setIsUploading(true);
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsUploading(false);
    }

    const newClient = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      riskProfile,
      aum: files.length > 0 ? Math.floor(Math.random() * 1000000) + 500000 : 0, // Simulate AUM from file
      portfolioFiles: files.map(f => f.name)
    };

    onSave(newClient);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setRiskProfile('Moderado');
    setFiles([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/30">
              <h2 className="text-xl font-serif font-semibold text-primary">Novo Cliente</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Ex: Ana Souza"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="ana@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Perfil de Risco</label>
                  <select
                    value={riskProfile}
                    onChange={(e) => setRiskProfile(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white"
                  >
                    <option value="Conservador">Conservador</option>
                    <option value="Moderado">Moderado</option>
                    <option value="Agressivo">Agressivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Carteira Consolidada (Opcional)</label>
                  <div 
                    className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center transition-colors group relative"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf"
                      multiple
                    />
                    
                    {files.length > 0 && (
                      <div className="w-full space-y-2 mb-4">
                        {files.map((f, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border/50">
                            <div className="flex items-center text-primary overflow-hidden">
                              <FileText className="w-5 h-5 mr-3 flex-shrink-0 text-accent" />
                              <span className="text-sm font-medium truncate">{f.name}</span>
                            </div>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                              }}
                              className="ml-2 p-1.5 hover:bg-destructive/10 rounded-full text-destructive transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer flex flex-col items-center justify-center w-full"
                    >
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3 group-hover:bg-white transition-colors">
                          <Upload className="w-5 h-5 text-muted-foreground group-hover:text-accent" />
                        </div>
                        <p className="text-sm text-center text-muted-foreground">
                          {files.length > 0 ? 'Clique para adicionar mais arquivos' : 'Clique para fazer upload ou arraste os arquivos aqui'}
                        </p>
                        <p className="text-xs text-center text-muted-foreground/70 mt-1">
                          Apenas PDF (Max 10MB)
                        </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !name || !email}
                  className="px-6 py-2 bg-primary text-secondary rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Salvar Cliente
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
