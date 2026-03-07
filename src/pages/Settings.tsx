export default function Settings() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-border pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-serif font-semibold text-primary tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-[0.2em]">Gerencie suas preferências e integrações</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-8 border-b border-border bg-secondary/30">
          <h2 className="text-xl font-serif font-semibold text-primary">Perfil Profissional</h2>
          <p className="text-sm text-muted-foreground mt-2">Atualize suas informações de contato e credenciais.</p>
        </div>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Nome Completo</label>
              <input type="text" defaultValue="Assessora CEO" className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Email Profissional</label>
              <input type="email" defaultValue="ceo@elittecapital.com.br" className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Registro CVM/Ancord</label>
              <input type="text" defaultValue="123456" className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-sm" />
            </div>
          </div>
          <div className="pt-6 border-t border-border">
            <button className="px-6 py-3 bg-primary text-secondary rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
