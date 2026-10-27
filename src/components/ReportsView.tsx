import React, { useState } from 'react';
import { BarChart3, Clock, AlertTriangle, ShieldCheck, Download, Search, FileText } from 'lucide-react';
import { DataStore } from '../services/storage';

export const ReportsView: React.FC = () => {
  const orders = DataStore.getServiceOrders();
  const parts = DataStore.getServiceParts();
  const auditLogs = DataStore.getAuditLogs();
  const interventions = DataStore.getInterventions();
  const quotes = DataStore.getQuotes();

  const [auditSearch, setAuditSearch] = useState<string>('');
  const [activeReportTab, setActiveReportTab] = useState<'kpis' | 'auditoria' | 'pecas'>('kpis');

  // KPI Calculations
  const completedOrders = orders.filter(o => o.status === 'entregue_fechado');
  const totalInterventionMinutes = interventions.reduce((acc, i) => acc + i.durationMinutes, 0);
  const avgMinutesPerRepair = completedOrders.length > 0 ? Math.round(totalInterventionMinutes / completedOrders.length) : 85;

  const pendingQuotesCount = quotes.filter(q => q.status === 'enviado').length;
  const warrantyOrdersCount = orders.filter(o => o.isWarranty).length;

  // Filtered audit logs
  const filteredAudit = auditLogs.filter(log => {
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      log.entityId.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q)
    );
  });

  const exportAuditCSV = () => {
    const header = 'Timestamp;Utilizador;Ação;Entidade;ID_Entidade;Detalhes\n';
    const rows = filteredAudit.map(a =>
      `"${a.timestamp}";"${a.userName}";"${a.action}";"${a.entity}";"${a.entityId}";"${a.details.replace(/"/g, '""')}"`
    ).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Auditoria_SAT_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Relatórios & Auditoria</h2>
          <p className="text-xs text-slate-500">
            Indicadores operacionais de oficina, tempo médio de reparação e registo imutável de ações
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportAuditCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Auditoria (CSV)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-medium">
        <button
          onClick={() => setActiveReportTab('kpis')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeReportTab === 'kpis'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Métricas Operacionais
        </button>
        <button
          onClick={() => setActiveReportTab('auditoria')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeReportTab === 'auditoria'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Trilha de Auditoria ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveReportTab('pecas')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeReportTab === 'pecas'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Consumo de Peças
        </button>
      </div>

      {/* TAB 1: KPIS */}
      {activeReportTab === 'kpis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Tempo Médio de Intervenção</span>
              <p className="text-2xl font-bold font-mono text-slate-900">{avgMinutesPerRepair} min</p>
              <p className="text-[11px] text-slate-400">Por reparação concluída</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Orçamentos Pendentes</span>
              <p className="text-2xl font-bold font-mono text-amber-600">{pendingQuotesCount}</p>
              <p className="text-[11px] text-slate-400">A aguardar aprovação de cliente</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Taxa de Reparações em Garantia</span>
              <p className="text-2xl font-bold font-mono text-blue-600">
                {orders.length > 0 ? ((warrantyOrdersCount / orders.length) * 100).toFixed(0) : 0}%
              </p>
              <p className="text-[11px] text-slate-400">{warrantyOrdersCount} ordens cobertas por garantia</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Total de Peças/Serviços Aplicados</span>
              <p className="text-2xl font-bold font-mono text-emerald-600">{parts.length}</p>
              <p className="text-[11px] text-slate-400">Com retenção histórica de valores</p>
            </div>
          </div>

          {/* Breakdown by Status */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Distribuição de Ordens por Estado Operacional
            </h3>
            <div className="space-y-2.5">
              {[
                { status: 'recebido', label: 'Recebido (Triagem)', count: orders.filter(o => o.status === 'recebido').length },
                { status: 'em_diagnostico', label: 'Em Diagnóstico', count: orders.filter(o => o.status === 'em_diagnostico').length },
                { status: 'aguarda_aprovacao', label: 'Aguarda Aprovação', count: orders.filter(o => o.status === 'aguarda_aprovacao').length },
                { status: 'aprovado_em_reparacao', label: 'Aprovado / Em Reparação', count: orders.filter(o => o.status === 'aprovado_em_reparacao').length },
                { status: 'pronto_levantamento', label: 'Pronto para Levantamento', count: orders.filter(o => o.status === 'pronto_levantamento').length },
                { status: 'entregue_fechado', label: 'Entregue / Concluído', count: orders.filter(o => o.status === 'entregue_fechado').length },
              ].map(item => {
                const percentage = orders.length > 0 ? (item.count / orders.length) * 100 : 0;
                return (
                  <div key={item.status} className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span>{item.label}</span>
                      <span className="font-mono font-medium">{item.count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.max(percentage, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDITORIA */}
      {activeReportTab === 'auditoria' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por utilizador, ação, ID de registo ou detalhe..."
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-blue-600"
                />
              </div>
              <span className="text-xs text-slate-500">
                A exibir {filteredAudit.length} registos
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-4">Data / Hora</th>
                  <th className="py-2.5 px-4">Utilizador</th>
                  <th className="py-2.5 px-4">Ação</th>
                  <th className="py-2.5 px-4">Entidade</th>
                  <th className="py-2.5 px-4">ID Ref</th>
                  <th className="py-2.5 px-4">Descrição da Operação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAudit.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleString('pt-PT')}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">
                      {log.userName}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-blue-600">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 uppercase text-[10px]">
                      {log.entity}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                      {log.entityId}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONSUMO DE PEÇAS */}
      {activeReportTab === 'pecas' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-xs font-bold text-slate-900">
              Discriminação de Artigos e Serviços Utilizados
            </h3>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-4">Referência</th>
                <th className="py-2.5 px-4">Descrição</th>
                <th className="py-2.5 px-4 text-right">Qtd Total</th>
                <th className="py-2.5 px-4 text-right">Preço Unit.</th>
                <th className="py-2.5 px-4">Ordem Técnica</th>
                <th className="py-2.5 px-4">Data Registo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parts.map(p => (
                <tr key={p.id}>
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-700">{p.articleRef}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-900">{p.description}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold">{p.quantity}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{p.unitPrice.toFixed(2)} €</td>
                  <td className="py-2.5 px-4 font-mono text-blue-600">
                    {orders.find(o => o.id === p.serviceOrderId)?.visibleNumber || p.serviceOrderId}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-500">
                    {new Date(p.registeredAt).toLocaleDateString('pt-PT')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
