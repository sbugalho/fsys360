import React from 'react';
import { ServiceOrderPriority, ServiceOrderStatus } from '../types';

interface StatusBadgeProps {
  status: ServiceOrderStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config: Record<ServiceOrderStatus, { label: string; bg: string; text: string; dot: string }> = {
    recebido: {
      label: 'Recebido',
      bg: 'bg-slate-100 dark:bg-slate-800/90 dark:border dark:border-slate-700/60',
      text: 'text-slate-700 dark:text-slate-300',
      dot: 'bg-slate-400 dark:bg-slate-400',
    },
    em_diagnostico: {
      label: 'Em Diagnóstico',
      bg: 'bg-blue-50 dark:bg-blue-950/60 dark:border dark:border-blue-800/50',
      text: 'text-blue-700 dark:text-blue-300',
      dot: 'bg-blue-500 dark:bg-blue-400',
    },
    aguarda_aprovacao: {
      label: 'Aguarda Aprovação',
      bg: 'bg-amber-50 dark:bg-amber-950/60 dark:border dark:border-amber-800/50',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500 dark:bg-amber-400',
    },
    aprovado_em_reparacao: {
      label: 'Aprovado / Em Reparação',
      bg: 'bg-indigo-50 dark:bg-indigo-950/60 dark:border dark:border-indigo-800/50',
      text: 'text-indigo-700 dark:text-indigo-300',
      dot: 'bg-indigo-500 dark:bg-indigo-400',
    },
    aguarda_pecas: {
      label: 'Aguarda Peças',
      bg: 'bg-purple-50 dark:bg-purple-950/60 dark:border dark:border-purple-800/50',
      text: 'text-purple-700 dark:text-purple-300',
      dot: 'bg-purple-500 dark:bg-purple-400',
    },
    aguarda_cliente: {
      label: 'Aguarda Cliente',
      bg: 'bg-orange-50 dark:bg-orange-950/60 dark:border dark:border-orange-800/50',
      text: 'text-orange-700 dark:text-orange-300',
      dot: 'bg-orange-500 dark:bg-orange-400',
    },
    em_testes: {
      label: 'Em Testes',
      bg: 'bg-cyan-50 dark:bg-cyan-950/60 dark:border dark:border-cyan-800/50',
      text: 'text-cyan-700 dark:text-cyan-300',
      dot: 'bg-cyan-500 dark:bg-cyan-400',
    },
    pronto_levantamento: {
      label: 'Pronto p/ Levantamento',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 dark:border dark:border-emerald-800/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500 dark:bg-emerald-400',
    },
    entregue_fechado: {
      label: 'Entregue / Fechado',
      bg: 'bg-stone-100 dark:bg-stone-800/90 dark:border dark:border-stone-700/60',
      text: 'text-stone-600 dark:text-stone-300',
      dot: 'bg-stone-400 dark:bg-stone-400',
    },
    sem_reparacao: {
      label: 'Sem Reparação',
      bg: 'bg-rose-50 dark:bg-rose-950/60 dark:border dark:border-rose-800/50',
      text: 'text-rose-700 dark:text-rose-300',
      dot: 'bg-rose-500 dark:bg-rose-400',
    },
    devolvido_sem_reparar: {
      label: 'Devolvido sem Reparar',
      bg: 'bg-rose-50 dark:bg-rose-950/60 dark:border dark:border-rose-800/50',
      text: 'text-rose-700 dark:text-rose-300',
      dot: 'bg-rose-500 dark:bg-rose-400',
    },
    em_garantia: {
      label: 'Em Garantia',
      bg: 'bg-teal-50 dark:bg-teal-950/60 dark:border dark:border-teal-800/50',
      text: 'text-teal-700 dark:text-teal-300',
      dot: 'bg-teal-500 dark:bg-teal-400',
    },
  };

  const item = config[status] || {
    label: status,
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium ${item.bg} ${item.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} aria-hidden="true" />
      {item.label}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: ServiceOrderPriority }> = ({ priority }) => {
  const config: Record<ServiceOrderPriority, { label: string; text: string }> = {
    baixa: { label: 'Baixa', text: 'text-slate-500 dark:text-slate-400' },
    normal: { label: 'Normal', text: 'text-slate-700 dark:text-slate-300' },
    alta: { label: 'Alta', text: 'text-amber-600 dark:text-amber-400 font-semibold' },
    urgente: { label: 'Urgente', text: 'text-rose-600 dark:text-rose-400 font-bold' },
  };

  const item = config[priority] || { label: priority, text: 'text-slate-700 dark:text-slate-300' };

  return <span className={`text-xs ${item.text}`}>{item.label}</span>;
};
