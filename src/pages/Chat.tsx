import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { chatWithAssistant } from '../services/gemini';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou seu assistente de Wealth Management. Como posso ajudar com suas teses de investimento, análise macroeconômica ou clientes hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n');
      const response = await chatWithAssistant(userMessage.content, context);
      
      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error(error);
      let errorMsg = 'Desculpe, ocorreu um erro ao processar sua solicitação.';
      
      if (error.message?.includes('Limite de requisições') || error.message?.includes('429') || error.message?.includes('quota')) {
        errorMsg = 'Limite de requisições da IA excedido. Por favor, aguarde um momento e tente novamente.';
      }
      
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: errorMsg };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-end border-b border-border pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-serif font-semibold text-primary tracking-tight">Assistente AI</h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-[0.2em]">Tire dúvidas sobre mercado, ativos e carteiras com o Gemini 3.1 Pro</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={cn(
                "flex items-start max-w-[80%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                msg.role === 'user' ? "bg-secondary text-primary ml-3 border border-border" : "bg-primary text-secondary mr-3"
              )}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              
              <div className={cn(
                "p-4 rounded-2xl text-sm shadow-sm",
                msg.role === 'user' 
                  ? "bg-primary text-secondary rounded-tr-none" 
                  : "bg-secondary/50 text-primary border border-border rounded-tl-none prose prose-sm max-w-none prose-p:leading-relaxed prose-a:text-accent prose-headings:font-serif"
              )}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-primary text-secondary mr-3 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-muted-foreground rounded-tl-none flex items-center space-x-2 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span className="text-sm tracking-wide">Pensando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-5 border-t border-border bg-secondary/30">
          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder="Pergunte sobre o cenário macro, um ativo específico ou estratégia..." 
              className="w-full pl-5 pr-12 py-3.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent shadow-sm transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 bg-primary text-secondary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
