import React, { useState } from 'react';
import { Wrench, Clock, Plus, CheckCircle2, AlertTriangle, Printer, ChevronRight } from 'lucide-react';
import { ServiceOrder } from '../types';
import { DataStore } from '../services/storage';
import { StatusBadge, PriorityBadge } from './StatusBadge';

interface WorkshopViewProps {
  onOpenOrder: (order: ServiceOrder) => void;
  onOpenPdf: (order: ServiceOrder) => void;
}

export const WorkshopView: React.FC<WorkshopViewProps> = ({ onOpenOrder, onOpenPdf }) => {
  const orders = DataStore.getServiceOrders();
  const customers = DataStore.getCustomers();
  const equipment = DataStore.getEquipment();
  const interventions = DataStore.getInterventions();
  const parts = DataStore.getServiceParts();

  // Active bench filter: orders actively being worked on
  const benchOrders = orders.filter(
    o =>
      o.status === 'em_diagnostico' ||
      o.status === 'aprovado_em_reparacao' ||
      o.status === 'em_testes' ||
      o.status === 'aguarda_pecas' ||
      o.status === 'recebido'
  );

  const totalBenchMinutes = interventions.reduce((acc, i) => acc + i.durationMinutes, 0);

  return (
    <div className="space-y-6">
      {/* Workshop Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Bancada Técnica & Intervenções</h2>
          <p className="text-xs text-slate-500">
            Fila de trabalho de laboratório, diagnósticos ativos, cronometragem de tempos e aplicação de peças
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs bg-white border border-slate-200 px-3 py-2 rounded-lg">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>
            Tempo Total Registado em Bancada: <strong className="text-slate-900 font-mono">{Math.floor(totalBenchMinutes / 60)}h {totalBenchMinutes % 60}m</strong>
          </span>
        </div>
      </div>

      {/* Grid of Work Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {benchOrders.length === 0 ? (
          <div className="col-span-3 p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-400 text-xs">
            Não existem equipamentos na bancada de reparação ativa neste momento.
          </div>
        ) : (
          benchOrders.map(order => {
            const cust = customers.find(c => c.id === order.customerId);
            const eq = equipment.find(e => e.id === order.equipmentId);
            const orderInterventions = interventions.filter(i => i.serviceOrderId === order.id);
            const orderParts = parts.filter(p => p.serviceOrderId === order.id);
            const orderTime = orderInterventions.reduce((s, i) => s + i.durationMinutes, 0);

            return (
              <div
                key={order.id}
                onClick={() => onOpenOrder(order)}
                className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-4 shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-mono font-bold text-slate-900 group-hover:text-blue-600">
                      {order.visibleNumber}
                    </span>
                    <PriorityBadge priority={order.priority} />
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <strong className="text-slate-900">{eq?.brand} {eq?.model}</strong>
                      <span className="font-mono text-slate-400 text-[11px]">{eq?.internalTag}</span>
                    </div>
                    <p className="text-xs text-slate-500">Cliente: {cust?.name}</p>
                  </div>

                  <div className="mt-2.5 p-2 bg-slate-50 dark:bg-slate-800/70 rounded text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-semibold block text-[11px] text-slate-500 dark:text-slate-400 uppercase">Avaria:</span>
                    <p className="line-clamp-2 mt-0.5">{order.reportedFault}</p>
                  </div>

                  {order.diagnosis && (
                    <div className="mt-2 p-2 bg-blue-50/70 dark:bg-blue-950/50 rounded text-xs text-blue-950 dark:text-blue-200 border border-transparent dark:border-blue-900/50">
                      <span className="font-semibold block text-[11px] text-blue-600 dark:text-blue-400 uppercase">Diagnóstico:</span>
                      <p className="line-clamp-2 mt-0.5">{order.diagnosis}</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <StatusBadge status={order.status} />
                    <span className="font-mono text-slate-500 text-[11px]">
                      {orderTime > 0 ? `${orderTime} min` : 'Sem tempo'} • {orderParts.length} peças
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onOpenPdf(order);
                      }}
                      className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Folha A5
                    </button>
                    <button
                      onClick={() => onOpenOrder(order)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      Abrir Bancada
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
