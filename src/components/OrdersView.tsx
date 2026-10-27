import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Printer,
  Tag,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Laptop,
  ArrowUpDown,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  FileText,
  UserCheck,
  Calendar,
  ShieldCheck,
  Phone,
  Building,
  User as UserIcon,
  Truck
} from 'lucide-react';
import { Customer, Equipment, ServiceOrder, ServiceOrderPriority, ServiceOrderStatus, User } from '../types';
import { DataStore } from '../services/storage';
import { StatusBadge, PriorityBadge } from './StatusBadge';

interface OrdersViewProps {
  onOpenOrder: (order: ServiceOrder) => void;
  onNewOrder: () => void;
  onOpenPdf: (order: ServiceOrder, type?: 'folha_a5' | 'etiqueta' | 'folha_entrega') => void;
  initialFilterStatus?: string;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  onOpenOrder,
  onNewOrder,
  onOpenPdf,
  initialFilterStatus = 'all',
}) => {
  const orders = DataStore.getServiceOrders();
  const customers = DataStore.getCustomers();
  const equipment = DataStore.getEquipment();
  const technicians = DataStore.getTechnicians(false);

  // View mode: 'table' or 'kanban'
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilterStatus);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [techFilter, setTechFilter] = useState<string>('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>('all');
  const [warrantyFilter, setWarrantyFilter] = useState<string>('all');

  // Sort
  const [sortField, setSortField] = useState<'date' | 'number' | 'priority' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    techFilter !== 'all' ||
    customerTypeFilter !== 'all' ||
    warrantyFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setTechFilter('all');
    setCustomerTypeFilter('all');
    setWarrantyFilter('all');
  };

  // Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        // Status
        if (statusFilter !== 'all' && order.status !== statusFilter) return false;
        // Priority
        if (priorityFilter !== 'all' && order.priority !== priorityFilter) return false;
        // Technician
        if (techFilter !== 'all') {
          if (techFilter === 'unassigned') {
            if (order.assignedTechnicianId) return false;
          } else if (order.assignedTechnicianId !== techFilter) {
            return false;
          }
        }
        // Warranty
        if (warrantyFilter === 'yes' && !order.isWarranty) return false;
        if (warrantyFilter === 'no' && order.isWarranty) return false;

        const cust = customers.find(c => c.id === order.customerId);
        const eq = equipment.find(e => e.id === order.equipmentId);

        // Customer Type
        if (customerTypeFilter !== 'all' && cust && cust.type !== customerTypeFilter) return false;

        // Search text
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchesNumber = order.visibleNumber.toLowerCase().includes(q);
          const matchesFault = order.reportedFault.toLowerCase().includes(q);
          const matchesCustomer = cust
            ? cust.name.toLowerCase().includes(q) ||
              cust.phone.includes(q) ||
              (cust.taxNumber && cust.taxNumber.includes(q))
            : false;
          const matchesEquipment = eq
            ? eq.brand.toLowerCase().includes(q) ||
              eq.model.toLowerCase().includes(q) ||
              eq.serialNumber.toLowerCase().includes(q) ||
              eq.internalTag.toLowerCase().includes(q)
            : false;

          return matchesNumber || matchesFault || matchesCustomer || matchesEquipment;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'date') {
          const da = new Date(a.createdAt).getTime();
          const db = new Date(b.createdAt).getTime();
          return sortDirection === 'asc' ? da - db : db - da;
        }
        if (sortField === 'number') {
          return sortDirection === 'asc'
            ? a.visibleNumber.localeCompare(b.visibleNumber)
            : b.visibleNumber.localeCompare(a.visibleNumber);
        }
        if (sortField === 'priority') {
          const weights: Record<ServiceOrderPriority, number> = {
            urgente: 4,
            alta: 3,
            normal: 2,
            baixa: 1,
          };
          return sortDirection === 'asc'
            ? weights[a.priority] - weights[b.priority]
            : weights[b.priority] - weights[a.priority];
        }
        return 0;
      });
  }, [
    orders,
    customers,
    equipment,
    statusFilter,
    priorityFilter,
    techFilter,
    warrantyFilter,
    customerTypeFilter,
    searchTerm,
    sortField,
    sortDirection,
  ]);

  // Counts for summary pills
  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      recebido: orders.filter(o => o.status === 'recebido').length,
      em_diagnostico: orders.filter(o => o.status === 'em_diagnostico').length,
      aguarda_aprovacao: orders.filter(o => o.status === 'aguarda_aprovacao').length,
      aprovado_em_reparacao: orders.filter(o => o.status === 'aprovado_em_reparacao').length,
      aguarda_pecas: orders.filter(o => o.status === 'aguarda_pecas').length,
      pronto_levantamento: orders.filter(o => o.status === 'pronto_levantamento').length,
      entregue_fechado: orders.filter(o => o.status === 'entregue_fechado').length,
    };
  }, [orders]);

  // Kanban columns definition
  const kanbanColumns: { id: string; title: string; statuses: ServiceOrderStatus[]; color: string }[] = [
    {
      id: 'triagem',
      title: 'Triagem & Entrada',
      statuses: ['recebido'],
      color: 'border-blue-500 bg-blue-50/50',
    },
    {
      id: 'diagnostico',
      title: 'Em Diagnóstico',
      statuses: ['em_diagnostico'],
      color: 'border-indigo-500 bg-indigo-50/50',
    },
    {
      id: 'aprovacao',
      title: 'Aprovação Orçamento',
      statuses: ['aguarda_aprovacao', 'aguarda_cliente'],
      color: 'border-amber-500 bg-amber-50/50',
    },
    {
      id: 'reparacao',
      title: 'Reparação & Peças',
      statuses: ['aprovado_em_reparacao', 'aguarda_pecas'],
      color: 'border-orange-500 bg-orange-50/50',
    },
    {
      id: 'testes_pronto',
      title: 'Testes & Levantamento',
      statuses: ['em_testes', 'pronto_levantamento'],
      color: 'border-emerald-500 bg-emerald-50/50',
    },
    {
      id: 'fechado',
      title: 'Concluído / Entregue',
      statuses: ['entregue_fechado', 'sem_reparacao', 'devolvido_sem_reparar'],
      color: 'border-slate-400 bg-slate-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Assistências Técnicas
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'ordem' : 'ordens'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão operacional de ordens de serviço, ciclo de vida de reparação e emissão de folhas A5
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Modo Tabela Detalhada"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabela</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Modo Quadro Kanban"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quadro</span>
            </button>
          </div>

          <button
            onClick={onNewOrder}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Nova Assistência
          </button>
        </div>
      </div>

      {/* Quick Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
            statusFilter === 'all'
              ? 'bg-slate-900 border-slate-900 text-white'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>Todos</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
            statusFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}>
            {statusCounts.all}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('recebido')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
            statusFilter === 'recebido'
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span>Recebido / Triagem</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
            statusFilter === 'recebido' ? 'bg-blue-800 text-white' : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
          }`}>
            {statusCounts.recebido}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('em_diagnostico')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
            statusFilter === 'em_diagnostico'
              ? 'bg-indigo-600 border-indigo-600 text-white'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span>Em Diagnóstico</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
            statusFilter === 'em_diagnostico' ? 'bg-indigo-800 text-white' : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
          }`}>
            {statusCounts.em_diagnostico}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('aguarda_aprovacao')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
            statusFilter === 'aguarda_aprovacao'
              ? 'bg-amber-600 border-amber-600 text-white'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span>Aguarda Orçamento</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
            statusFilter === 'aguarda_aprovacao' ? 'bg-amber-800 text-white' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
          }`}>
            {statusCounts.aguarda_aprovacao}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('aprovado_em_reparacao')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
            statusFilter === 'aprovado_em_reparacao'
              ? 'bg-orange-600 border-orange-600 text-white'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span>Em Reparação</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
            statusFilter === 'aprovado_em_reparacao' ? 'bg-orange-800 text-white' : 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300'
          }`}>
            {statusCounts.aprovado_em_reparacao}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('pronto_levantamento')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
            statusFilter === 'pronto_levantamento'
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span>Pronto p/ Levantamento</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
            statusFilter === 'pronto_levantamento' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
          }`}>
            {statusCounts.pronto_levantamento}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('entregue_fechado')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
            statusFilter === 'entregue_fechado'
              ? 'bg-slate-700 border-slate-700 text-white'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span>Entregue / Fechado</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
            statusFilter === 'entregue_fechado' ? 'bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}>
            {statusCounts.entregue_fechado}
          </span>
        </button>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Main search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por nº (AT-...), cliente, NIF, telemóvel, marca, modelo ou avaria..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-sky-600 text-slate-900 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* Priority filter */}
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:bg-white focus:outline-sky-600"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="normal">Normal</option>
              <option value="baixa">Baixa</option>
            </select>

            {/* Technician filter */}
            <select
              value={techFilter}
              onChange={e => setTechFilter(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:bg-white focus:outline-sky-600"
            >
              <option value="all">Todos os Técnicos</option>
              <option value="unassigned">Sem Técnico Atribuído</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* Customer Type filter */}
            <select
              value={customerTypeFilter}
              onChange={e => setCustomerTypeFilter(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:bg-white focus:outline-sky-600"
            >
              <option value="all">Tipos de Cliente</option>
              <option value="particular">Particular</option>
              <option value="empresa">Empresa</option>
            </select>

            {/* Warranty filter */}
            <select
              value={warrantyFilter}
              onChange={e => setWarrantyFilter(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:bg-white focus:outline-sky-600"
            >
              <option value="all">Garantia (Todas)</option>
              <option value="yes">Em Garantia</option>
              <option value="no">Fora de Garantia</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors flex items-center justify-center gap-1 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-200/60" onClick={() => {
                    setSortField('number');
                    setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                  }}>
                    <div className="flex items-center gap-1.5">
                      <span>Nº Ordem</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Cliente & Contacto</th>
                  <th className="py-3 px-4">Equipamento & Nº Série</th>
                  <th className="py-3 px-4">Avaria / Sintomas</th>
                  <th className="py-3 px-4">Técnico Responsável</th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-200/60" onClick={() => {
                    setSortField('status');
                    setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                  }}>
                    <div className="flex items-center gap-1.5">
                      <span>Estado</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-200/60" onClick={() => {
                    setSortField('priority');
                    setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                  }}>
                    <div className="flex items-center gap-1.5">
                      <span>Prioridade</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-200/60" onClick={() => {
                    setSortField('date');
                    setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                  }}>
                    <div className="flex items-center gap-1.5">
                      <span>Entrada</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Ações Físicas & Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-slate-400">
                      <div className="max-w-sm mx-auto space-y-3">
                        <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="text-sm font-semibold text-slate-700">Nenhuma assistência encontrada</p>
                        <p className="text-xs text-slate-400">
                          Tente alterar ou limpar os termos de pesquisa e filtros selecionados.
                        </p>
                        {hasActiveFilters && (
                          <button
                            onClick={clearFilters}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100"
                          >
                            Limpar todos os filtros
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => {
                    const cust = customers.find(c => c.id === order.customerId);
                    const eq = equipment.find(e => e.id === order.equipmentId);
                    const tech = technicians.find(t => t.id === order.assignedTechnicianId);

                    return (
                      <tr
                        key={order.id}
                        onClick={() => onOpenOrder(order)}
                        className="hover:bg-sky-50/40 cursor-pointer transition-colors group"
                      >
                        {/* Visible Number */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:text-sky-600">
                          <div className="flex items-center gap-1.5">
                            <span>{order.visibleNumber}</span>
                            {order.isWarranty && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 font-sans" title="Equipamento sob garantia">
                                GAR
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            {cust?.type === 'empresa' ? (
                              <span title="Cliente Empresa">
                                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              </span>
                            ) : (
                              <span title="Cliente Particular">
                                <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              </span>
                            )}
                            <span>{cust?.name || 'Cliente Desconhecido'}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                            <span>{cust?.phone}</span>
                            {cust?.taxNumber && <span>• NIF: {cust.taxNumber}</span>}
                          </div>
                        </td>

                        {/* Equipment */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800 flex items-center gap-1.5">
                            <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {eq?.brand} {eq?.model}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Etiqueta: <strong className="text-slate-600">{eq?.internalTag}</strong>
                            {eq?.serialNumber && <span> • S/N: {eq.serialNumber}</span>}
                          </div>
                        </td>

                        {/* Fault */}
                        <td className="py-3.5 px-4 max-w-xs text-slate-600">
                          <div className="truncate" title={order.reportedFault}>
                            {order.reportedFault}
                          </div>
                          {order.externalDamageState && (
                            <div className="text-[11px] text-slate-400 truncate italic">
                              Estado: {order.externalDamageState}
                            </div>
                          )}
                        </td>

                        {/* Assigned Tech */}
                        <td className="py-3.5 px-4">
                          {tech ? (
                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                                {tech.name.charAt(0)}
                              </span>
                              <span>{tech.name}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Por Atribuir
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge status={order.status} />
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <PriorityBadge priority={order.priority} />
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {new Date(order.createdAt).toLocaleDateString('pt-PT')}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {/* Folha A5 */}
                            <button
                              onClick={() => onOpenPdf(order, 'folha_a5')}
                              title="Imprimir Folha A5 de Assistência (148 × 210 mm)"
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {/* Etiqueta */}
                            <button
                              onClick={() => onOpenPdf(order, 'etiqueta')}
                              title="Imprimir Etiqueta Autocolante com Código"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            >
                              <Tag className="w-4 h-4" />
                            </button>

                            {/* Folha de Entrega (se pronto ou fechado) */}
                            {(order.status === 'pronto_levantamento' || order.status === 'entregue_fechado') && (
                              <button
                                onClick={() => onOpenPdf(order, 'folha_entrega')}
                                title="Imprimir Folha de Entrega e Garantia"
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              >
                                <Truck className="w-4 h-4" />
                              </button>
                            )}

                            {/* Ver Ficha */}
                            <button
                              onClick={() => onOpenOrder(order)}
                              className="flex items-center gap-1 ml-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md font-semibold transition-colors text-[11px]"
                            >
                              Ficha
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table summary bar */}
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              A apresentar <strong className="text-slate-800">{filteredOrders.length}</strong> de{' '}
              <strong className="text-slate-800">{orders.length}</strong> assistências registadas
            </div>
            <div className="flex items-center gap-4">
              <span>Dimensão A5 física: 148 × 210 mm</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">FSYS360 Service • FozSistemas</span>
            </div>
          </div>
        </div>
      )}

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
          {kanbanColumns.map(col => {
            const colOrders = filteredOrders.filter(o => col.statuses.includes(o.status));

            return (
              <div key={col.id} className="bg-slate-100/70 border border-slate-200 rounded-xl p-3 flex flex-col min-h-[450px]">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                    <h3 className="text-xs font-bold text-slate-800">{col.title}</h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
                    {colOrders.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {colOrders.length === 0 ? (
                    <div className="h-28 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-[11px]">
                      Vazio
                    </div>
                  ) : (
                    colOrders.map(order => {
                      const cust = customers.find(c => c.id === order.customerId);
                      const eq = equipment.find(e => e.id === order.equipmentId);
                      const tech = technicians.find(t => t.id === order.assignedTechnicianId);

                      return (
                        <div
                          key={order.id}
                          onClick={() => onOpenOrder(order)}
                          className="bg-white border border-slate-200 hover:border-sky-400 rounded-lg p-3 shadow-2xs hover:shadow-xs cursor-pointer transition-all space-y-2 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-sky-600">
                              {order.visibleNumber}
                            </span>
                            <PriorityBadge priority={order.priority} />
                          </div>

                          <div>
                            <div className="text-xs font-semibold text-slate-800 truncate">
                              {cust?.name || 'Cliente'}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {eq?.brand} {eq?.model}
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-100">
                            {order.reportedFault}
                          </p>

                          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-medium text-slate-600">
                              {tech ? tech.name.split(' ')[0] : 'Sem técnico'}
                            </span>
                            <span className="font-mono">{new Date(order.createdAt).toLocaleDateString('pt-PT')}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
