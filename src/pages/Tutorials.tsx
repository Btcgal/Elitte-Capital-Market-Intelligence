import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, FileText, ChevronRight, Upload } from 'lucide-react';
import { useTutorials } from '../context/TutorialContext';
import PDFImporter from '../components/PDFImporter';

export default function Tutorials() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const { tutorials, addTutorial } = useTutorials();
  const navigate = useNavigate();

  const filteredTutorials = tutorials.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewTutorial = () => {
    const newId = Date.now().toString();
    const newTutorial = {
      id: newId,
      title: 'Novo Tutorial',
      description: 'Clique em editar para alterar o título e descrição.',
      category: 'Geral',
      updatedAt: new Date().toISOString(),
      steps: [
        {
          id: 'step-1',
          title: 'Primeiro Passo',
          content: 'Descreva o primeiro passo do tutorial aqui.'
        }
      ]
    };
    addTutorial(newTutorial);
    navigate(`/tutorials/${newId}`, { state: { tutorial: newTutorial } });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-4xl font-serif font-semibold text-primary tracking-tight">Tutoriais & Guias</h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-[0.2em]">Documentos de onboarding e procedimentos operacionais</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsImporterOpen(true)}
            className="bg-secondary hover:bg-secondary/80 text-primary border border-border px-5 py-2.5 rounded-xl font-medium flex items-center transition-colors shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar PDF
          </button>
          <button 
            onClick={handleNewTutorial}
            className="bg-primary hover:bg-primary/90 text-secondary px-5 py-2.5 rounded-xl font-medium flex items-center transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Tutorial
          </button>
        </div>
      </div>

      {isImporterOpen && (
        <PDFImporter onClose={() => setIsImporterOpen(false)} />
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center bg-secondary/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar tutorial..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="divide-y divide-border">
          {filteredTutorials.map((tutorial) => (
            <div 
              key={tutorial.id} 
              className="flex items-center p-6 hover:bg-secondary/50 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center text-primary mr-5 group-hover:bg-primary group-hover:text-secondary transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-primary">{tutorial.title}</h3>
                <p className="text-sm text-muted-foreground">{tutorial.description}</p>
                <div className="flex items-center mt-2 space-x-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                    {tutorial.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Atualizado em {new Date(tutorial.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Link 
                  to={`/tutorials/${tutorial.id}`}
                  className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                  title="Visualizar"
                >
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ))}
          
          {filteredTutorials.length === 0 && (
            <div className="p-12 text-center text-muted-foreground text-sm">
              Nenhum tutorial encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
