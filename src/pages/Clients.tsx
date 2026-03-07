import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, User, ChevronRight } from 'lucide-react';
import { NewClientModal } from '../components/NewClientModal';
import { useClients } from '../context/ClientContext';

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { clients, addClient } = useClients();

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveClient = (newClient: any) => {
    addClient(newClient);
    setIsModalOpen(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-4xl font-serif font-semibold text-primary tracking-tight">Clientes & Carteiras</h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-[0.2em]">Gerencie seus clientes e consolide portfólios</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-secondary px-5 py-2.5 rounded-xl font-medium flex items-center transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center bg-secondary/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar cliente por nome ou email..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="divide-y divide-border">
          {filteredClients.map((client) => (
            <Link 
              key={client.id} 
              to={`/clients/${client.id}`}
              className="flex items-center p-6 hover:bg-secondary/50 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center text-primary mr-5 group-hover:bg-primary group-hover:text-secondary transition-colors">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-primary">{client.name}</h3>
                <p className="text-sm text-muted-foreground">{client.email}</p>
              </div>
              <div className="text-right mr-8">
                <p className="text-lg font-serif font-semibold text-primary">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.aum)}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">AUM</p>
              </div>
              <div className="text-right mr-6 w-28">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary text-primary border border-border">
                  {client.riskProfile}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
            </Link>
          ))}
          
          {filteredClients.length === 0 && (
            <div className="p-12 text-center text-muted-foreground text-sm">
              Nenhum cliente encontrado.
            </div>
          )}
        </div>
      </div>

      <NewClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveClient} 
      />
    </div>
  );
}
