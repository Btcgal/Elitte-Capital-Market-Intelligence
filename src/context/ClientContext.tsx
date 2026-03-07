import React, { createContext, useContext, useState, useEffect } from 'react';
import { Asset, PortfolioAnalysis360 } from '../services/gemini';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  aum: number;
  riskProfile: string;
  portfolio?: Asset[];
  lastAnalysis360?: PortfolioAnalysis360;
  lastRebalancingContribution?: number;
}

const defaultClients: Client[] = [
  { id: '1', name: 'João Silva', email: 'joao@example.com', phone: '+55 11 99999-9999', aum: 1500000, riskProfile: 'Moderado' },
  { id: '2', name: 'Maria Oliveira', email: 'maria@example.com', phone: '+55 11 98888-8888', aum: 3200000, riskProfile: 'Agressivo' },
  { id: '3', name: 'Carlos Santos', email: 'carlos@example.com', phone: '+55 11 97777-7777', aum: 850000, riskProfile: 'Conservador' },
];

interface ClientContextType {
  clients: Client[];
  addClient: (client: Client) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  getClient: (id: string) => Client | undefined;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('clients');
    return saved ? JSON.parse(saved) : defaultClients;
  });

  useEffect(() => {
    localStorage.setItem('clients', JSON.stringify(clients));
  }, [clients]);

  const addClient = (client: Client) => {
    setClients(prev => [...prev, client]);
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(client => 
      client.id === id ? { ...client, ...data } : client
    ));
  };

  const getClient = (id: string) => {
    return clients.find(c => c.id === id);
  };

  return (
    <ClientContext.Provider value={{ clients, addClient, updateClient, getClient }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClients() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClients must be used within a ClientProvider');
  }
  return context;
}
