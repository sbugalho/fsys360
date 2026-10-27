import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Sun, Moon } from 'lucide-react';
import { User as UserType } from '../types';
import { DataStore } from '../services/storage';
import { FozLogo } from './FozLogo';
import { useTheme } from '../context/ThemeContext';

interface LoginPageProps {
  onLoginSuccess: (user: UserType) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    setTimeout(() => {
      const result = DataStore.authenticate(identifier, password);
      setLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Credenciais inválidas. Verifique o utilizador e a palavra-passe.');
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 relative">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex justify-center p-3.5 bg-white rounded-2xl border border-white/20 shadow-2xl mb-1">
            <img
              src="/assets/aistudio/logo-fozsistemas_73ab3b0a.png"
              alt="FozSistemas"
              className="h-12 w-auto object-contain"
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-black tracking-tight text-white font-sans">
              FSYS<span className="text-red-500">360</span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded shadow-sm">
              Service
            </span>
          </div>
          <h1 className="text-sm font-semibold tracking-wide text-slate-200">
            Gestão de Assistências Técnicas
          </h1>
          <p className="text-xs text-slate-400">
            Acesso reservado • FozSistemas (fozsistemas.com)
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 transition-colors">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Iniciar Sessão</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Introduza as suas credenciais de acesso</p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-lg text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Utilizador ou Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="Nome de utilizador ou email"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-sky-600 font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Palavra-passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Palavra-passe"
                  className="w-full pl-9 pr-10 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-sky-600 font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-md mt-2"
            >
              {loading ? (
                'A validar credenciais...'
              ) : (
                <>
                  Entrar no FSYS360 Service
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-400 space-y-1">
          <p className="flex items-center justify-center gap-1.5 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Ambiente Seguro • FozSistemas (Figueira da Foz)
          </p>
          <p className="text-slate-500">Rua Manuel Fernandes Tomaz, 132 • Tel: (+351) 233 094 320 • fozsistemas.com</p>
        </div>
      </div>
    </div>
  );
};
