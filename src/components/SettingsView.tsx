import React, { useState, useRef } from 'react';
import {
  Building2,
  Users,
  Shield,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  FileText,
  Save,
  AlertCircle,
  Sun,
  Moon,
  Monitor,
  Palette,
  Server,
  Database,
  Terminal,
  Copy,
  Check
} from 'lucide-react';
import { AppSettings, User } from '../types';
import { DataStore } from '../services/storage';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { FozLogo } from './FozLogo';

interface SettingsViewProps {
  onRefreshUser: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefreshUser }) => {
  const { theme, setTheme, isDark } = useTheme();
  const currentUser = DataStore.getCurrentUser();
  const users = DataStore.getUsers();
  const [settings, setSettings] = useState<AppSettings>(DataStore.getSettings());
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [importStatusMsg, setImportStatusMsg] = useState<string>('');
  const [copiedInstallCmd, setCopiedInstallCmd] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyInstallCmd = () => {
    navigator.clipboard.writeText('cd deploy && sudo bash install.sh');
    setCopiedInstallCmd(true);
    setTimeout(() => setCopiedInstallCmd(false), 2500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    DataStore.saveSettings(settings, currentUser.id, currentUser.name);
    setSaveSuccessMsg('Definições do FSYS360 Service / FozSistemas guardadas com sucesso!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleSwitchUser = (user: User) => {
    DataStore.setCurrentUser(user);
    onRefreshUser();
  };

  const handleExportBackup = () => {
    const json = DataStore.exportFullBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FSYS360_Service_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      const ok = DataStore.importFullBackup(content, currentUser.id, currentUser.name);
      if (ok) {
        setImportStatusMsg('Cópia de segurança restaurada com sucesso! A recarregar definições...');
        setSettings(DataStore.getSettings());
        onRefreshUser();
        setTimeout(() => setImportStatusMsg(''), 4000);
      } else {
        setImportStatusMsg('Erro: Ficheiro de cópia de segurança inválido ou corrompido.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (window.confirm('Tem a certeza que deseja repor os dados de demonstração do FSYS360 Service (FozSistemas)?')) {
      DataStore.resetToDemo(currentUser.id, currentUser.name);
      setSettings(DataStore.getSettings());
      onRefreshUser();
      setSaveSuccessMsg('Dados de demonstração do FSYS360 Service repostos com sucesso!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Definições da Entidade & Plataforma</h2>
          <p className="text-xs text-slate-500">
            Identidade corporativa FSYS360 Service, empresa FozSistemas e parâmetros da folha A5
          </p>
        </div>

        <a
          href="https://fozsistemas.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-semibold transition-colors"
        >
          Visitar fozsistemas.com
        </a>
      </div>

      {/* Brand Identity Showcase Box */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white rounded-xl p-5 shadow-sm border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-white rounded-xl border border-white/20 shadow-md">
            <img
              src="/assets/aistudio/logo-fozsistemas_73ab3b0a.png"
              alt="FozSistemas"
              className="h-11 w-auto object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-black tracking-tight text-white font-sans">
                FSYS<span className="text-red-500">360</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded shadow-2xs">
                Service
              </span>
              <span className="text-xs text-slate-400 font-medium">| Gestão de Assistências Técnicas</span>
            </div>
            <h3 className="text-xs font-semibold text-slate-200 tracking-wide">
              Empresa: FozSistemas — Equipamentos e Sistemas de Informação, Lda.
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Rua Manuel Fernandes Tomaz, 132 • 3080-051 Figueira da Foz • NIF: 504 180 118
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-xs bg-red-500/20 text-red-200 border border-red-400/30 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium">
            Logotipo & Identidade Ativa
          </span>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {saveSuccessMsg}
        </div>
      )}

      {importStatusMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
          {importStatusMsg}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Company & A5 Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Data Form */}
          <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-600" />
                Dados Oficiais da Empresa (Folha A5)
              </h3>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Guardar Alterações
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Marca *</label>
                <input
                  type="text"
                  required
                  value={settings.brandName || 'FSYS360'}
                  onChange={e => setSettings({ ...settings, brandName: e.target.value })}
                  placeholder="Ex: FSYS360"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Nome Comercial do Software *</label>
                <input
                  type="text"
                  required
                  value={settings.companyName || 'FSYS360 Service'}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      companyName: e.target.value,
                      commercialName: e.target.value,
                    })
                  }
                  placeholder="Ex: FSYS360 Service"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-semibold text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">Descrição / Slogan *</label>
                <input
                  type="text"
                  required
                  value={settings.brandDescription || 'Gestão de Assistências Técnicas'}
                  onChange={e => setSettings({ ...settings, brandDescription: e.target.value })}
                  placeholder="Ex: Gestão de Assistências Técnicas"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">Empresa / Denominação Social *</label>
                <input
                  type="text"
                  required
                  value={settings.legalName}
                  onChange={e => setSettings({ ...settings, legalName: e.target.value })}
                  placeholder="Ex: FozSistemas - Equipamentos e Sistemas de Informação, Lda."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">NIF da Empresa *</label>
                <input
                  type="text"
                  required
                  value={settings.taxNumber}
                  onChange={e => setSettings({ ...settings, taxNumber: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Telefone Principal</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={e => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Email de Suporte</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={e => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Website</label>
                <input
                  type="text"
                  value={settings.website}
                  onChange={e => setSettings({ ...settings, website: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">Morada Completa</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={e => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Código Postal</label>
                <input
                  type="text"
                  value={settings.postalCode}
                  onChange={e => setSettings({ ...settings, postalCode: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={e => setSettings({ ...settings, city: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>
            </div>

            {/* A5 Print Parameters */}
            <div className="border-t border-slate-100 pt-3 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Parâmetros Físicos de Impressão A5 (148 × 210 mm)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Margens Seguras (mm)</label>
                  <input
                    type="number"
                    min="4"
                    max="15"
                    value={settings.a5MarginsMm}
                    onChange={e => setSettings({ ...settings, a5MarginsMm: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                  <span className="text-[10px] text-slate-400">Padrão: 8 mm</span>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Taxa IVA Padrão (%)</label>
                  <input
                    type="number"
                    value={settings.defaultVatRate}
                    onChange={e => setSettings({ ...settings, defaultVatRate: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                  <span className="text-[10px] text-slate-400">Normal em Portugal: 23%</span>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Dias de Garantia SAT</label>
                  <input
                    type="number"
                    value={settings.defaultWarrantyDays}
                    onChange={e => setSettings({ ...settings, defaultWarrantyDays: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                  <span className="text-[10px] text-slate-400">Padrão oficina: 90 dias</span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Termos e Condições Impressos no Rodapé da Folha A5
                </label>
                <textarea
                  rows={3}
                  value={settings.termsAndConditions}
                  onChange={e => setSettings({ ...settings, termsAndConditions: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Roles Switcher, Theme & Database Management */}
        <div className="space-y-6">
          {/* Appearance & Dark Theme Configuration */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Aparência & Tema Visual
                </h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {isDark ? 'Escuro Ativo' : 'Claro Ativo'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalize o esquema cromático da aplicação FSYS360 Service:
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Light Mode Button */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  theme === 'light'
                    ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-900 dark:text-sky-300 ring-2 ring-sky-400/30 font-semibold shadow-xs'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mb-1.5 shadow-2xs">
                  <Sun className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Claro</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Clássico</span>
              </button>

              {/* Dark Mode Button */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  theme === 'dark'
                    ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-900 dark:text-sky-300 ring-2 ring-sky-400/30 font-semibold shadow-xs'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 text-sky-400 flex items-center justify-center mb-1.5 shadow-2xs">
                  <Moon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Escuro</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Bancada</span>
              </button>

              {/* Auto / System Mode Button */}
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  theme === 'system'
                    ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-900 dark:text-sky-300 ring-2 ring-sky-400/30 font-semibold shadow-xs'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 flex items-center justify-center mb-1.5 shadow-2xs">
                  <Monitor className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Sistema</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Auto (SO)</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>
                {theme === 'system'
                  ? `Sincronizado com o sistema operativo (atualmente ${isDark ? 'Escuro' : 'Claro'})`
                  : theme === 'dark'
                  ? 'Modo Escuro ativado com fundo de alto contraste e descanso ocular.'
                  : 'Modo Claro ativado com luminosidade padrão de escritório.'}
              </span>
            </div>
          </div>

          {/* Active User Switcher & Super Admin Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Users className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Perfis & Contas de Acesso
              </h3>
            </div>

            {/* Super Admin Notice Card */}
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs space-y-1">
              <span className="font-bold text-sky-950 block">★ Acesso Super Administrador:</span>
              <p className="text-[11px] text-sky-900">
                Utilizador: <strong className="font-bold text-slate-900">admin</strong>
              </p>
              <p className="text-[10px] text-sky-700 pt-0.5">
                Consulte o ficheiro <code className="bg-sky-100/80 px-1 py-0.5 rounded font-mono font-bold text-sky-900">CREDENCIAIS.md</code> na raiz para as palavras-passe iniciais de acesso.
              </p>
            </div>

            <p className="text-xs text-slate-500">
              Colaboradores registados no sistema:
            </p>

            <div className="space-y-2">
              {users.map(u => {
                const isActive = currentUser.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSwitchUser(u)}
                    className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between text-xs ${
                      isActive
                        ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        {u.name}
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 capitalize">
                        Perfil: <strong className="text-slate-800">{u.role}</strong>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-blue-600">
                      {isActive ? 'Ativo' : 'Ativar'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Database Backup & Restore */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Cópias de Segurança & Restauro
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Exportação integral de todas as tabelas (clientes, equipamentos, ordens, intervenções, auditoria) em formato JSON seguro:
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleExportBackup}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Descarregar Cópia de Segurança (JSON)
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Restaurar a partir de Ficheiro
              </button>

              <button
                onClick={handleResetDemo}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium transition-colors pt-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Repor Dados de Demonstração
              </button>
            </div>
          </div>

          {/* Local Server & On-Premise Installation Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Instalação em Servidor Local (On-Premise)
                </h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                PostgreSQL + Caddy HTTPS
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Instale o FSYS360 Service diretamente num servidor físico ou máquina virtual local (Ubuntu 22.04/24.04 ou Debian 11/12) com suporte HTTPS automático e base de dados relacional dedicada:
            </p>

            {/* Quick Command Box */}
            <div className="p-3 bg-slate-900 text-slate-100 rounded-lg space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase tracking-wider">
                <span className="flex items-center gap-1 font-semibold">
                  <Terminal className="w-3 h-3 text-sky-400" /> Comando de Instalação (Bash)
                </span>
                <button
                  type="button"
                  onClick={handleCopyInstallCmd}
                  className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                  title="Copiar comando"
                >
                  {copiedInstallCmd ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-sans font-bold">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="font-sans">Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <code className="text-sky-300 font-bold block overflow-x-auto whitespace-nowrap">
                cd deploy && sudo bash install.sh
              </code>
            </div>

            {/* Key Stack Points */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Database className="w-3 h-3 text-blue-500" /> PostgreSQL 16
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-[10px]">
                  Schema relacional estruturado com <code className="font-mono">schema.sql</code>
                </p>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-500" /> HTTPS Automático
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-[10px]">
                  Caddy Server (Let's Encrypt ou TLS local)
                </p>
              </div>
            </div>

            {/* Included Scripts List */}
            <div className="space-y-1.5 pt-1 text-[11px] text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Ficheiros e utilitários criados na pasta <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">/deploy</code>:
              </span>
              <ul className="space-y-1 pl-1">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span><strong className="text-slate-800 dark:text-slate-200 font-mono">install.sh</strong> — Assistente interativo de instalação global</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span><strong className="text-slate-800 dark:text-slate-200 font-mono">schema.sql</strong> — DDL relacional de tabelas e catálogo inicial</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span><strong className="text-slate-800 dark:text-slate-200 font-mono">Caddyfile.template</strong> — Configuração do proxy reverso HTTPS</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span><strong className="text-slate-800 dark:text-slate-200 font-mono">manage.sh</strong> — Menu terminal interativo (<code className="font-mono">fsys360-manage</code>)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  <span><strong className="text-slate-800 dark:text-slate-200 font-mono">backup.sh</strong> — Cópia de segurança com retenção de 30 dias</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
