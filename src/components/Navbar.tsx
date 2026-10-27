import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  LogOut,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  Wrench,
  Users,
  Laptop,
  FileText,
  Receipt,
  BarChart3,
  Settings,
  Shield,
  Briefcase,
  Layers,
  Sun,
  Moon
} from 'lucide-react';
import { User as UserType } from '../types';
import { FozLogo } from './FozLogo';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onNewOrder: () => void;
  currentUser: UserType;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onNewOrder,
  currentUser,
  onOpenSettings,
  onLogout,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary navigation items (always visible on desktop)
  const primaryNavItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'orders', label: 'Assistências', icon: Wrench },
    { id: 'workshop', label: 'Bancada Técnica', icon: Laptop },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'equipment', label: 'Equipamentos', icon: Layers },
  ];

  // Secondary/Management navigation items (grouped in dropdown on desktop, full list on mobile)
  const managementNavItems = [
    { id: 'technicians', label: 'Técnicos', description: 'Gestão da equipa e acessos', icon: Users },
    { id: 'quotes', label: 'Orçamentos', description: 'Propostas e aprovações', icon: FileText },
    { id: 'billing', label: 'Faturação', description: 'Integração de documentos', icon: Receipt },
    { id: 'reports', label: 'Relatórios', description: 'KPIs e histórico de auditoria', icon: BarChart3 },
    { id: 'settings', label: 'Definições', description: 'Dados da empresa e cópia de segurança', icon: Settings },
  ];

  // Check if current view is in management dropdown
  const isManagementActive = managementNavItems.some(item => item.id === currentView);

  const handleNavClick = (viewId: string) => {
    onNavigate(viewId);
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-2xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">
          {/* Left: Brand Logo & User Role Badge */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <button
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center hover:opacity-95 transition-opacity"
              title="FSYS360 Service — Gestão de Assistências Técnicas (FozSistemas)"
            >
              <FozLogo className="h-7 sm:h-9" />
            </button>

            {/* Quick Active Role indicator badge */}
            <button
              onClick={onOpenSettings}
              title="Clique para alternar utilizador ou ver permissões"
              className="hidden 2xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="capitalize">{currentUser.name}</span>
              <span className="text-slate-400 dark:text-slate-500">({currentUser.role})</span>
            </button>
          </div>

          {/* Center: Desktop Navigation Bar (Adaptive & Never Cuts Off) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {primaryNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold border border-sky-200/80 dark:border-sky-800/60 shadow-2xs'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Management Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  isManagementActive
                    ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold border border-sky-200/80 dark:border-sky-800/60 shadow-2xs'
                    : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <Briefcase className={`w-3.5 h-3.5 ${isManagementActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-400'}`} />
                <span>Gestão</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Content */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    Módulos Administrativos
                  </div>
                  {managementNavItems.map(item => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors ${
                          isActive
                            ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 font-semibold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className={`p-1.5 rounded-md mt-0.5 ${isActive ? 'bg-sky-200/60 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{item.label}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{item.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right: Actions (Nova Assistência, Theme Toggle, Sair / Mobile Menu Toggle) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
              aria-label="Alternar tema claro/escuro"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 animate-in spin-in-180 duration-300" />
              )}
            </button>

            <button
              onClick={onNewOrder}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Assistência</span>
              <span className="sm:hidden">Nova</span>
            </button>

            <button
              onClick={onLogout}
              title="Terminar Sessão"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors text-xs border border-slate-200 dark:border-slate-700"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Sair</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
              aria-label="Abrir menu de navegação"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Full Screen / Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-4 space-y-4 max-h-[calc(100vh-4.5rem)] overflow-y-auto">
            {/* User Quick Info on Mobile */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{currentUser.role} • FozSistemas</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200"
                  title="Alternar tema"
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  onClick={onLogout}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 px-2 py-1 bg-rose-50 dark:bg-rose-950/40 rounded border border-rose-200 dark:border-rose-900/60"
                >
                  Sair
                </button>
              </div>
            </div>

            {/* Primary Navigation Section */}
            <div className="space-y-1">
              <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Operação Principal
              </div>
              {primaryNavItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Management Section */}
            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Gestão & Administração
              </div>
              {managementNavItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
