import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Printer,
  Tag,
  ChevronRight,
  Download,
  ShieldCheck,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';
import { EquipmentCategory, ServiceOrder, ServiceOrderPriority, ServiceOrderStatus } from '../types';
import { DataStore } from '../services/storage';
import { StatusBadge, PriorityBadge } from './StatusBadge';

interface ServiceOrdersViewProps {
  onOpenOrder: (order: ServiceOrder) => void;
  onNewOrder: () => void;
  onOpenPdf: (order: ServiceOrder, type?: 'folha_a5' | 'etiqueta' | 'folha_entrega') => void;
}

export const ServiceOrdersView: React.FC<ServiceOrdersViewProps> = ({
  onOpenOrder,
  onNewOrder,
  onOpenPdf,
}) => {
  const orders = DataStore.getServiceOrders();
  const customers = DataStore.getCustomers();
  const equipment = DataStore.getEquipment();
  const technicians = DataStore.getTechnicians(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [technicianFilter, setTechnicianFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [onlyWarranty, setOnlyWarranty] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'priority' | 'number'>('recent');

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setTechnicianFilter('all');
    setCategoryFilter('all');
    setOnlyWarranty(false);
    setSortBy('recent');
  };

  // Filtered & Sorted orders
  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && order.priority !== priorityFilter) return false;
    if (technicianFilter !== 'all') {
      if (technicianFilter === 'unassigned' && order.assignedTechnicianId) return false;
      if (technicianFilter !== 'unassigned' && order.assignedTechnicianId !== technicianFilter) return false;
    }
    if (onlyWarranty && !order.isWarranty) return false;

    const eq = equipment.find(e => e.id === order.equipmentId);
    if (categoryFilter !== 'all' && eq?.category !== categoryFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const cust = customers.find(c => c.id === order.customerId);

      const matchesNumber = order.visibleNumber.toLowerCase().includes(q);
      const matchesFault = order.reportedFault.toLowerCase().includes(q);
      const matchesCustomer = cust
        ? cust.name.toLowerCase().includes(q) || cust.phone.includes(q) || (cust.taxNumber && cust.taxNumber.includes(q))
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
  });

  // Sort
  filteredOrders.sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'priority') {
      const weight: Record<ServiceOrderPriority, number> = { urgente: 4, alta: 3, normal: 2, baixa: 1 };
      return weight[b.priority] - weight[a.priority];
    }
    if (sortBy === 'number') {
      return b.visibleNumber.localeCompare(a.visibleNumber);
    }
    return 0;
  });

  const exportOrdersCSV = () => {
    const header = 'Numero_Ordem;Cliente;Contacto;Equipamento;Numero_Serie;Avaria;Estado;Prioridade;Tecnico;Data_Entrada;Garantia\n';
    const rows = filteredOrders.map(o => {
      const c = customers.find(cust => cust.id === o.customerId);
      const e = equipment.find(eq => eq.id === o.equipmentId);
      const t = technicians.find(tech => tech.id === o.assignedTechnicianId);
      return `"${o.visibleNumber}";"${c?.name || ''}";"${c?.phone || ''}";"${e?.brand || ''} ${e?.model || ''}";"${e?.serialNumber || ''}";"${o.reportedFault.replace(/"/g, '""')}";"${o.status}";"${o.priority}";"${t?.name || 'Não atribuído'}";"${new Date(o.createdAt).toLocaleDateString('pt-PT')}";"${o.isWarranty ? 'Sim' : 'Não'}"`;
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Assistencias_FSYS360_Service_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Registo Central de Assistências Técnicas</h2>
          <p className="text-xs text-slate-500">
            Listagem integral, filtros avançados de triagem, exportação de ordens e histórico completo de reparações
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportOrdersCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Lista (CSV)
          </button>

          <button
            onClick={onNewOrder}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Nova Assistência
          </button>
        </div>
      </div>

      {/* Advanced Filters Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por nº ordem (AT-...), cliente, telefone, marca, modelo ou número de série..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-sky-600 focus:bg-white text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Ordenar:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-medium"
            >
              <option value="recent">Mais Recentes Primeiro</option>
              <option value="oldest">Mais Antigas Primeiro</option>
              <option value="priority">Maior Prioridade</option>
              <option value="number">Número de Ordem</option>
            </select>
          </div>
        </div>

        {/* Filter pills & selects */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Estado:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium"
            >
              <option value="all">Todos os Estados ({orders.length})</option>
              <option value="recebido">1. Recebido</option>
              <option value="em_diagnostico">2. Em Diagnóstico</option>
              <option value="aguarda_aprovacao">3. Aguarda Aprovação</option>
              <option value="aprovado_em_reparacao">4. Aprovado / Em Reparação</option>
              <option value="aguarda_pecas">5. Aguarda Peças</option>
              <option value="aguarda_cliente">6. Aguarda Cliente</option>
              <option value="em_testes">7. Em Testes Finais</option>
              <option value="pronto_levantamento">8. Pronto para Levantamento</option>
              <option value="entregue_fechado">9. Entregue / Fechado</option>
              <option value="sem_reparacao">10. Sem Reparação</option>
              <option value="devolvido_sem_reparar">11. Devolvido sem Reparar</option>
              <option value="em_garantia">12. Em Garantia</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Prioridade:</span>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="normal">Normal</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Técnico:</span>
            <select
              value={technicianFilter}
              onChange={e => setTechnicianFilter(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium"
            >
              <option value="all">Todos os Técnicos</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
              <option value="unassigned">Sem Técnico Atribuído</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Equipamento:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium"
            >
              <option value="all">Todas as Categorias</option>
              <option value="portatil">Portáteis</option>
              <option value="desktop">Desktops</option>
              <option value="servidor">Servidores</option>
              <option value="monitor">Monitores</option>
              <option value="impressora">Impressoras</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 ml-2 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={onlyWarranty}
              onChange={e => setOnlyWarranty(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
            />
            <span>Apenas Garantias</span>
          </label>

          {(statusFilter !== 'all' || priorityFilter !== 'all' || technicianFilter !== 'all' || categoryFilter !== 'all' || onlyWarranty || searchTerm) && (
            <button
              onClick={handleResetFilters}
              className="ml-auto text-sky-600 hover:text-sky-800 text-[11px] font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Main Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Nº Assistência</th>
                <th className="py-3 px-4">Cliente & Contacto</th>
                <th className="py-3 px-4">Equipamento Identificado</th>
                <th className="py-3 px-4">Avaria Reportada</th>
                <th className="py-3 px-4">Técnico Responsável</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Prioridade</th>
                <th className="py-3 px-4">Data Entrada</th>
                <th className="py-3 px-4 text-right">Ações Técnicas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    Nenhuma assistência técnica corresponde aos filtros selecionados.
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
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 group-hover:text-sky-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {order.visibleNumber}
                          {order.isWarranty && (
                            <span className="text-[9px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded" title="Reparação em garantia">
                              GAR
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{cust?.name || 'Cliente'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{cust?.phone}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {eq?.brand} {eq?.model}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {eq?.internalTag} • S/N: {eq?.serialNumber || 'N/A'}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={order.reportedFault}>
                        {order.reportedFault}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                        {tech ? (
                          <span className="font-medium">{tech.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Por atribuir</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <PriorityBadge priority={order.priority} />
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono">
                        {new Date(order.createdAt).toLocaleDateString('pt-PT')}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenPdf(order, 'folha_a5')}
                            title="Imprimir Folha A5"
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenPdf(order, 'etiqueta')}
                            title="Imprimir Etiqueta"
                            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenOrder(order)}
                            className="flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors"
                          >
                            Abrir
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

        {/* Table Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
          <span>A apresentar {filteredOrders.length} de {orders.length} assistências</span>
          <span className="font-medium text-slate-700">FSYS360 Service — Gestão de Assistências Técnicas • FozSistemas</span>
        </div>
      </div>
    </div>
  );
};
