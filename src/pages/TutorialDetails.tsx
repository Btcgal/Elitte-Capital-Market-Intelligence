import { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ChevronLeft, Printer, Edit, Save, X, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTutorials, TutorialStep, Tutorial } from '../context/TutorialContext';

export default function TutorialDetails() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { getTutorial, updateTutorial } = useTutorials();
  const tutorial = getTutorial(id || '') || (location.state as { tutorial: Tutorial })?.tutorial;
  const [isEditing, setIsEditing] = useState(false);
  const [editedTutorial, setEditedTutorial] = useState<Tutorial | undefined>(tutorial);

  if (!tutorial) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold text-primary">Tutorial não encontrado</h2>
        <Link to="/tutorials" className="text-accent hover:underline mt-4 inline-block">
          Voltar para Tutoriais
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    if (editedTutorial) {
      updateTutorial({
        ...editedTutorial,
        updatedAt: new Date().toISOString()
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedTutorial(tutorial);
    setIsEditing(false);
  };

  const handleStepChange = (index: number, field: keyof TutorialStep, value: string) => {
    if (!editedTutorial) return;
    const newSteps = [...editedTutorial.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setEditedTutorial({ ...editedTutorial, steps: newSteps });
  };

  return (
    <div className="max-w-4xl mx-auto p-8 print:p-0 print:max-w-none">
      {/* Header Actions - Hidden on Print */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <Link 
          to="/tutorials" 
          className="flex items-center text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Voltar
        </Link>
        <div className="flex space-x-3">
          {!isEditing ? (
            <>
              <button 
                onClick={() => {
                  setEditedTutorial(tutorial);
                  setIsEditing(true);
                }}
                className="flex items-center px-4 py-2 bg-secondary text-primary border border-border rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-primary text-secondary rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir / Salvar PDF
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleCancel}
                className="flex items-center px-4 py-2 bg-secondary text-primary border border-border rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center px-4 py-2 bg-primary text-secondary rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tutorial Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-border p-8 print:shadow-none print:border-none print:p-0">
        {/* Print Header with Logo */}
        <div className="hidden print:flex justify-between items-center mb-8 border-b border-border pb-6">
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-semibold tracking-widest text-primary">ELITTE</span>
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">Capital · Private</span>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-semibold text-primary">{tutorial.title}</h1>
            <p className="text-sm text-muted-foreground">{tutorial.category}</p>
          </div>
        </div>

        {/* Screen Header */}
        <div className="mb-8 print:hidden">
          {isEditing ? (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Categoria</label>
                <input
                  type="text"
                  value={editedTutorial?.category}
                  onChange={(e) => setEditedTutorial(prev => prev ? ({ ...prev, category: e.target.value }) : prev)}
                  className="w-full border border-border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Título</label>
                <input
                  type="text"
                  value={editedTutorial?.title}
                  onChange={(e) => setEditedTutorial(prev => prev ? ({ ...prev, title: e.target.value }) : prev)}
                  className="w-full text-2xl font-serif font-semibold border border-border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Descrição</label>
                <textarea
                  value={editedTutorial?.description}
                  onChange={(e) => setEditedTutorial(prev => prev ? ({ ...prev, description: e.target.value }) : prev)}
                  className="w-full border border-border rounded p-2 h-20"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                  {tutorial.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  Atualizado em {new Date(tutorial.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-3xl font-serif font-semibold text-primary mb-2">{tutorial.title}</h1>
              <p className="text-lg text-muted-foreground">{tutorial.description}</p>
            </>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-12">
          {(isEditing ? editedTutorial?.steps : tutorial.steps).map((step, index) => (
            <div key={step.id} className="relative pl-8 border-l-2 border-secondary print:border-l-0 print:pl-0 group">
              {/* Step Number */}
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-accent border-2 border-white print:hidden"></div>
              
              <div className="mb-4">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-semibold text-accent uppercase tracking-wider mb-1 block">
                    Passo {index + 1}
                  </span>
                  {isEditing && (
                    <button
                      onClick={() => {
                        if (!editedTutorial) return;
                        const newSteps = editedTutorial.steps.filter((_, i) => i !== index);
                        setEditedTutorial({ ...editedTutorial, steps: newSteps });
                      }}
                      className="text-destructive hover:bg-destructive/10 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remover passo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {isEditing ? (
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                    className="w-full text-xl font-semibold text-primary border border-border rounded p-2 mb-2"
                    placeholder="Título do passo"
                  />
                ) : (
                  <h2 className="text-xl font-semibold text-primary">{step.title}</h2>
                )}
              </div>

              <div className="prose prose-slate max-w-none text-muted-foreground print:text-black">
                {isEditing ? (
                  <textarea
                    value={step.content}
                    onChange={(e) => handleStepChange(index, 'content', e.target.value)}
                    className="w-full h-40 border border-border rounded p-2 font-mono text-sm"
                    placeholder="Conteúdo em Markdown"
                  />
                ) : (
                  <ReactMarkdown>{step.content}</ReactMarkdown>
                )}
              </div>

              {step.image && !isEditing && (
                <div className="mt-6 rounded-lg overflow-hidden border border-border bg-secondary/30 p-2 print:border-gray-200">
                  <img src={step.image} alt={step.title} className="w-full h-auto rounded" />
                </div>
              )}
            </div>
          ))}

          {isEditing && (
            <button
              onClick={() => {
                if (!editedTutorial) return;
                const newStep: TutorialStep = {
                  id: `step-${Date.now()}`,
                  title: 'Novo Passo',
                  content: 'Conteúdo do novo passo.'
                };
                setEditedTutorial({
                  ...editedTutorial,
                  steps: [...editedTutorial.steps, newStep]
                });
              }}
              className="w-full py-4 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Passo
            </button>
          )}
        </div>

        {/* Footer for Print */}
        <div className="hidden print:block mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          <p>Este documento é confidencial e destinado apenas ao uso do cliente da Elitte Capital.</p>
          <p className="mt-1">Gerado em {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
