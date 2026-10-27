import React, { useState } from 'react';
import { FileText, CheckCircle2, Clock, XCircle, Search, ChevronRight, Mail } from 'lucide-react';
import { Quote, ServiceOrder } from '../types';
import { DataStore } from '../services/storage';

interface QuotesViewProps {
  onOpenOrder: (order: ServiceOrder) => void;
}

export const QuotesView: React.FC<QuotesViewProps> = ({ onOpenOrder }) => {
  const quotes = DataStore.getQuotes();
  const orders = DataStore.getServiceOrders();
  const customers = DataStore.getCustomers();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredQuotes = quotes.filter(q => {
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const qLower = searchTerm.toLowerCase();
      const parentOrder = orders.find(o => o.id === q.serviceOrderId);
      const cust = parentOrder ? customers.find(c => c.id === parentOrder.customerId) : null;
      return (
        q.visibleNumber.toLowerCase().includes(qLower) ||
        (parentOrder && parentOrder.visibleNumber.toLowerCase().includes(qLower)) ||
        (cust && cust.name.toLowerCase().includes(qLower))
      );
    }
    return true;
  });

  const totalQuotedAmount = filteredQuotes.reduce((acc, q) => acc + q.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Orçamentos & Aprovações</h2>
          <p className="text-xs text-slate-500">
            Controlo de propostas comerciais emitidas, linhas de serviços, peças e evidências de aceitação do cliente
          </p>
        </div>
        <div className="text-xs bg-white border border-slate-200 px-3 py-2 rounded-lg">
          <span>
            Total Orçado na Lista: <strong className="text-slate-900 font-mono text-sm">{totalQuotedAmount.toFixed(2)} €</strong>
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Filter bar */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por nº orçamento, ordem técnica ou cliente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-blue-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Estado:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-medium"
            >
              <option value="all">Todos os Estados</option>
              <option value="enviado">Enviado (Pendente)</option>
              <option value="aprovado">Aprovado</option>
              <option value="rejeitado">Rejeitado</option>
              <option value="rascunho">Rascunho</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Nº Orçamento</th>
                <th className="py-3 px-4">Ordem Técnica</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Total c/ IVA</th>
                <th className="py-3 px-4">Validade</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Nenhum orçamento encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map(q => {
                  const parentOrder = orders.find(o => o.id === q.serviceOrderId);
                  const cust = parentOrder ? customers.find(c => c.id === parentOrder.customerId) : null;

                  return (
                    <tr
                      key={q.id}
                      onClick={() => parentOrder && onOpenOrder(parentOrder)}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {q.visibleNumber}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-blue-600">
                        {parentOrder?.visibleNumber || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{cust?.name || '—'}</span>
                        <div className="flex flex-col text-[11px]">
                          {cust?.email ? (
                            <span className="text-blue-600 font-mono flex items-center gap-1" title={cust.email}>
                              <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                              {cust.email}
                            </span>
                          ) : (
                            <span className="text-slate-400">Sem email registado</span>
                          )}
                          <span className="text-slate-400">{cust?.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                            q.status === 'aprovado'
                              ? 'bg-emerald-50 text-emerald-700'
                              : q.status === 'rejeitado'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {q.subtotal.toFixed(2)} €
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {q.total.toFixed(2)} €
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {q.validUntil}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (parentOrder) onOpenOrder(parentOrder);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                        >
                          Abrir
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
