import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  LineChart, 
  MessageSquare, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Landmark,
  Scale,
  FileText,
  Lightbulb
} from 'lucide-react';
import { cn } from '../lib/utils';

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Clientes & Carteiras', path: '/clients' },
    { icon: Briefcase, label: 'Ativos & Oportunidades', path: '/assets' },
    { icon: Landmark, label: 'Crédito Estruturado', path: '/credit' },
    { icon: Scale, label: 'Planejamento Tributário', path: '/tax' },
    { icon: LineChart, label: 'Research & Reports', path: '/research' },
    { icon: Lightbulb, label: 'Teses de Investimento', path: '/theses' },
    { icon: FileText, label: 'Tutoriais & Guias', path: '/tutorials' },
    { icon: MessageSquare, label: 'Assistente AI', path: '/chat' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/auth');
  };

  return (
    <aside className={cn(
      "bg-white border-r border-border flex flex-col transition-all duration-300 print:hidden",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Logo */}
      <div className="h-20 flex items-center justify-center border-b border-border px-4">
        {!collapsed ? (
          <div className="flex flex-col items-center">
            <span className="font-serif text-xl font-semibold tracking-widest text-primary">
              ELITTE
            </span>
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
              Capital · Private
            </span>
          </div>
        ) : (
          <span className="font-serif text-2xl font-semibold text-primary">
            E
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-8 px-3 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-3 py-3 rounded-md text-sm transition-colors group",
                isActive 
                  ? "bg-secondary text-primary font-medium" 
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-primary",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn("w-5 h-5", !collapsed && "mr-3", isActive ? "text-accent" : "text-muted-foreground group-hover:text-accent")} />
              {!collapsed && <span className="tracking-wide">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-border space-y-2">
        <button 
          onClick={handleLogout}
          className={cn(
            "flex items-center px-3 py-3 rounded-md text-sm text-muted-foreground hover:bg-secondary/50 hover:text-primary transition-colors w-full group",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className={cn("w-5 h-5", !collapsed && "mr-3", "group-hover:text-destructive")} />
          {!collapsed && <span className="tracking-wide">Sair</span>}
        </button>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center w-full"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
