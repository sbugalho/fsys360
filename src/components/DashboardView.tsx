import React from 'react';
import {
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Laptop,
  Users,
  FileText,
  Printer,
  TrendingUp,
  Tag,
  Phone,
  Truck,
  ArrowRight,
  ShieldCheck,
  Building,
  Sparkles,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Customer, Equipment, ServiceOrder, User } from '../types';
import { DataStore } from '../services/storage';
import { StatusBadge, PriorityBadge } from './StatusBadge';

interface DashboardViewProps {
  onOpenOrder: (order: ServiceOrder) => void;
  onNewOrder: () => void;
  onOpenPdf: (order: ServiceOrder, type?: 'folha_a5' | 'etiqueta' | 'folha_entrega') => void;
  onNavigateToOrders?: (statusFilter?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenOrder,
  onNewOrder,
  onOpenPdf,
  onNavigateToOrders,
}) => {
  const orders = DataStore.getServiceOrders();
  const customers = DataStore.getCustomers();
  const equipment = DataStore.getEquipment();
  const technicians = DataStore.getTechnicians(false);
  const quotes = DataStore.getQuotes();
  const auditLogs = DataStore.getAuditLogs();

  // Active orders (not closed)
  const activeOrders = orders.filter(
    o => o.status !== 'entregue_fechado' && o.status !== 'sem_reparacao' && o.status !== 'devolvido_sem_reparar'
  );

  // Urgent or delayed orders
  const criticalOrders = orders.filter(
    o => (o.priority === 'urgente' || o.priority === 'alta') &&
         o.status !== 'entregue_fechado' &&
         o.status !== 'pronto_levantamento'
  );

  // Ready for pickup
  const readyOrders = orders.filter(o => o.status === 'pronto_levantamento');

  // Pending quotes awaiting client approval
  const pendingQuotes = quotes.filter(q => q.status === 'enviado' || q.status === 'rascunho');
  const pendingQuotesTotal = pendingQuotes.reduce((acc, q) => acc + q.total, 0);

  // Orders in diagnostic or bench repair
  const inBenchCount = orders.filter(
    o => o.status === 'em_diagnostico' || o.status === 'aprovado_em_reparacao' || o.status === 'em_testes'
  ).length;

  // Pipeline counts
  const pipeline = [
    {
      key: 'recebido',
      name: 'Triagem & Entrada',
      count: orders.filter(o => o.status === 'recebido').length,
      color: 'bg-blue-500',
      textColor: 'text-blue-700 dark:text-blue-300',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      borderColor: 'border-blue-200 dark:border-blue-900/60',
    },
    {
      key: 'em_diagnostico',
      name: 'Diagnóstico Técnico',
      count: orders.filter(o => o.status === 'em_diagnostico').length,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-700 dark:text-indigo-300',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
      borderColor: 'border-indigo-200 dark:border-indigo-900/60',
    },
    {
      key: 'aguarda_aprovacao',
      name: 'Aprovação de Orçamento',
      count: orders.filter(o => o.status === 'aguarda_aprovacao' || o.status === 'aguarda_cliente').length,
      color: 'bg-amber-500',
      textColor: 'text-amber-700 dark:text-amber-300',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      borderColor: 'border-amber-200 dark:border-amber-900/60',
    },
    {
      key: 'aprovado_em_reparacao',
      name: 'Em Reparação / Peças',
      count: orders.filter(o => o.status === 'aprovado_em_reparacao' || o.status === 'aguarda_pecas').length,
      color: 'bg-orange-500',
      textColor: 'text-orange-700 dark:text-orange-300',
      bgColor: 'bg-orange-50 dark:bg-orange-950/40',
      borderColor: 'border-orange-200 dark:border-orange-900/60',
    },
    {
      key: 'em_testes',
      name: 'Testes de Qualidade',
      count: orders.filter(o => o.status === 'em_testes').length,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-700 dark:text-cyan-300',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/40',
      borderColor: 'border-cyan-200 dark:border-cyan-900/60',
    },
    {
      key: 'pronto_levantamento',
      name: 'Pronto p/ Levantamento',
      count: orders.filter(o => o.status === 'pronto_levantamento').length,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderColor: 'border-emerald-200 dark:border-emerald-900/60',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Cockpit Executive Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] sm:text-xs font-semibold max-w-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">Centro Operacional FSYS360 Service • FozSistemas</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              Painel de Controlo & Visão Geral
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Atualmente existem <strong className="text-white font-bold">{activeOrders.length} assistências ativas</strong> em curso no laboratório,{' '}
              <strong className="text-emerald-400 font-bold">{readyOrders.length} prontas a entregar</strong> ao balcão e{' '}
              <strong className="text-amber-300 font-bold">{criticalOrders.length} intervenções prioritárias</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
            <button
              onClick={onNewOrder}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Nova Assistência</span>
            </button>
            {onNavigateToOrders && (
              <button
                onClick={() => onNavigateToOrders('all')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 active:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all w-full sm:w-auto"
              >
                <span>Ver Lista Completa</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active orders */}
        <div
          onClick={() => onNavigateToOrders ? onNavigateToOrders('all') : null}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-sky-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Assistências Ativas</span>
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono-numbers">
              {activeOrders.length}
            </span>
            <span className="text-xs text-slate-400">em laboratório</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>{orders.length} ordens registadas total</span>
            <span className="text-sky-600 font-semibold group-hover:underline">Gerir &rarr;</span>
          </div>
        </div>

        {/* KPI 2: Critical / Urgent */}
        <div
          onClick={() => onNavigateToOrders ? onNavigateToOrders('urgente') : null}
          className={`border rounded-xl p-5 shadow-xs transition-all cursor-pointer group ${
            criticalOrders.length > 0
              ? 'bg-amber-50/40 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-700'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Atenção Crítica & Urgente</span>
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-950 dark:text-amber-200 font-mono-numbers">
              {criticalOrders.length}
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">prioritárias</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
            <span>SLA urgente ou cliente a aguardar</span>
            <span className="text-amber-700 dark:text-amber-400 font-semibold group-hover:underline">Inspecionar &rarr;</span>
          </div>
        </div>

        {/* KPI 3: Ready for pickup */}
        <div
          onClick={() => onNavigateToOrders ? onNavigateToOrders('pronto_levantamento') : null}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pronto p/ Levantamento</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono-numbers">
              {readyOrders.length}
            </span>
            <span className="text-xs text-slate-400">equipamentos prontos</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Prontos para entrega ao balcão</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold group-hover:underline">Entregar &rarr;</span>
          </div>
        </div>

        {/* KPI 4: Pending quotes */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Orçamentos Pendentes</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono-numbers">
              {pendingQuotesTotal.toFixed(2)}€
            </span>
            <span className="text-xs text-slate-400">({pendingQuotes.length} orçamentos)</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Aguarda decisão do cliente</span>
            <span className="text-indigo-600 font-semibold font-mono">Taxa IVA 23%</span>
          </div>
        </div>
      </div>

      {/* Visual Pipeline of Technical Workflow */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Pipeline de Reparação e Estados da Bancada
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Fluxo contínuo desde a receção do equipamento até à entrega final com garantia física A5
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            {activeOrders.length} Ativas
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {pipeline.map(step => (
            <button
              key={step.key}
              onClick={() => onNavigateToOrders ? onNavigateToOrders(step.key) : null}
              className={`p-3 rounded-lg border text-left transition-all hover:scale-[1.02] cursor-pointer ${step.bgColor} ${step.borderColor}`}
            >
              <div className="flex items-center justify-between">
                <span className={`w-2 h-2 rounded-full ${step.color}`} />
                <span className={`text-xl font-bold font-mono ${step.textColor}`}>
                  {step.count}
                </span>
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-800 line-clamp-1">
                {step.name}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Ver assistências &rarr;
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Critical Alerts Banner (if any urgent) */}
      {criticalOrders.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-300 dark:border-amber-800/60 rounded-xl p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                  Assistências Prioritárias a Requerer Atenção ({criticalOrders.length})
                </h3>
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/50 px-2.5 py-0.5 rounded-full self-start">
                  Ação Recomendada
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-1 md:grid-cols-2 gap-2">
                {criticalOrders.slice(0, 4).map(order => {
                  const cust = customers.find(c => c.id === order.customerId);
                  const eq = equipment.find(e => e.id === order.equipmentId);
                  return (
                    <div
                      key={order.id}
                      onClick={() => onOpenOrder(order)}
                      className="bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 border border-amber-200 dark:border-amber-900/50 p-2.5 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-all hover:shadow-xs group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400">
                            {order.visibleNumber}
                          </span>
                          <PriorityBadge priority={order.priority} />
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium mt-0.5">
                          {cust?.name} • {eq?.brand} {eq?.model}
                        </div>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onOpenOrder(order);
                        }}
                        className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 px-2 py-1 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/70 rounded shrink-0 transition-colors"
                      >
                        Abrir Ficha
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ready for Pickup Spotlight (Balcão de Entrega) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-100 text-emerald-700">
                <Truck className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-900">
                Prontos para Levantamento no Balcão • FozSistemas
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Equipamentos com testes concluídos, prontos para entrega física ao cliente e emissão de folha de garantia
            </p>
          </div>

          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            {readyOrders.length} {readyOrders.length === 1 ? 'equipamento' : 'equipamentos'} prontos
          </span>
        </div>

        {readyOrders.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Não há equipamentos pendentes de levantamento no balcão neste momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {readyOrders.map(order => {
              const cust = customers.find(c => c.id === order.customerId);
              const eq = equipment.find(e => e.id === order.equipmentId);

              return (
                <div
                  key={order.id}
                  className="border border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/40 rounded-xl p-4 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded">
                        {order.visibleNumber}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(order.createdAt).toLocaleDateString('pt-PT')}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        {cust?.name || 'Cliente'}
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium">
                        {eq?.brand} {eq?.model} <span className="text-slate-400 font-mono">({eq?.internalTag})</span>
                      </p>
                    </div>

                    <div className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-200 space-y-1">
                      <div className="line-clamp-2">
                        <strong className="text-slate-700">Trabalho:</strong> {order.completedWork || 'Reparação efetuada com sucesso.'}
                      </div>
                      {cust?.phone && (
                        <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px] pt-1 border-t border-slate-100">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{cust.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-emerald-100">
                    <button
                      onClick={() => onOpenPdf(order, 'folha_entrega')}
                      title="Imprimir Folha de Entrega A5 e Termo de Garantia"
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-100 rounded transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenOrder(order)}
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-semibold text-center transition-colors shadow-2xs"
                    >
                      Entregar ao Cliente
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two Column Grid: Technicians Workload & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Technicians Workload */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Carga da Equipa Técnica • FozSistemas
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {technicians.length} técnicos
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {technicians.map(tech => {
                const assigned = orders.filter(
                  o => o.assignedTechnicianId === tech.id &&
                       o.status !== 'entregue_fechado' &&
                       o.status !== 'sem_reparacao'
                );

                return (
                  <div key={tech.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                        {tech.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{tech.name}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Ativo" />
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                          {tech.specialty || 'Técnico de Hardware & Sistemas'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-extrabold text-slate-900 font-mono">
                        {assigned.length}
                      </span>
                      <span className="text-[10px] text-slate-400 block">em bancada</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Reparações distribuídas equitativamente</span>
            <span className="font-semibold text-slate-700 font-mono">fozsistemas.com</span>
          </div>
        </div>

        {/* Right Column: Live Audit & Activity Feed */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Registo Recente de Atividade & Auditoria
                </h3>
              </div>
              <span className="text-xs text-slate-400">Tempo real</span>
            </div>

            <div className="divide-y divide-slate-100 mt-2 space-y-0.5">
              {auditLogs.slice(0, 5).map(log => (
                <div key={log.id} className="py-2.5 text-xs flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800 truncate">
                        {log.userName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">
                      {log.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Trilha de auditoria imutável</span>
            <span className="font-semibold text-slate-700 font-mono">SAT v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
