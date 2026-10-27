import React, { useState } from 'react';
import { Search, Plus, Laptop, User, Tag, PlusCircle, X } from 'lucide-react';
import { Customer, Equipment, EquipmentCategory, ServiceOrder } from '../types';
import { DataStore } from '../services/storage';
import { CustomerSearchSelect } from './CustomerSearchSelect';

interface EquipmentViewProps {
  onOpenOrder: (order: ServiceOrder) => void;
  onNewOrderForEquipment?: (equipment: Equipment) => void;
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({ onOpenOrder }) => {
  const currentUser = DataStore.getCurrentUser();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(DataStore.getEquipment());
  const customers = DataStore.getCustomers();
  const allOrders = DataStore.getServiceOrders();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState<boolean>(false);

  // Form State
  const [formCustomerId, setFormCustomerId] = useState<string>('');
  const [formCategory, setFormCategory] = useState<EquipmentCategory>('portatil');
  const [formBrand, setFormBrand] = useState<string>('');
  const [formModel, setFormModel] = useState<string>('');
  const [formSerial, setFormSerial] = useState<string>('');
  const [formTag, setFormTag] = useState<string>('');
  const [formSpecs, setFormSpecs] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  const handleSaveEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBrand.trim() || !formModel.trim() || !formCustomerId) return;

    DataStore.saveEquipment(
      {
        id: '',
        customerId: formCustomerId,
        category: formCategory,
        brand: formBrand.trim(),
        model: formModel.trim(),
        serialNumber: formSerial.trim() || 'S/N-PENDENTE',
        internalTag: formTag.trim(),
        specsDescription: formSpecs.trim() || undefined,
        externalNotes: formNotes.trim() || undefined,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      currentUser.id,
      currentUser.name
    );

    setEquipmentList(DataStore.getEquipment());
    setShowModal(false);
  };

  const filteredEquipment = equipmentList.filter(eq => {
    if (categoryFilter !== 'all' && eq.category !== categoryFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const cust = customers.find(c => c.id === eq.customerId);
      return (
        eq.brand.toLowerCase().includes(q) ||
        eq.model.toLowerCase().includes(q) ||
        eq.serialNumber.toLowerCase().includes(q) ||
        eq.internalTag.toLowerCase().includes(q) ||
        (cust && cust.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Parque de Equipamentos</h2>
          <p className="text-xs text-slate-500">
            Registo de hardware, números de série, etiquetas internas SAT e histórico de intervenções
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          + Registar Equipamento
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Filters */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por S/N, etiqueta, marca, modelo ou cliente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-blue-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Categoria:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-medium"
            >
              <option value="all">Todas as Categorias</option>
              <option value="portatil">Portáteis</option>
              <option value="desktop">Desktop / Torre</option>
              <option value="servidor">Servidores</option>
              <option value="monitor">Monitores</option>
              <option value="impressora">Impressoras</option>
              <option value="tablet">Tablets</option>
              <option value="smartphone">Smartphones</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Etiqueta SAT</th>
                <th className="py-3 px-4">Equipamento</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Número de Série</th>
                <th className="py-3 px-4">Cliente Associado</th>
                <th className="py-3 px-4">Assistências</th>
                <th className="py-3 px-4 text-right">Data Registo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Nenhum equipamento encontrado com os critérios de pesquisa.
                  </td>
                </tr>
              ) : (
                filteredEquipment.map(eq => {
                  const cust = customers.find(c => c.id === eq.customerId);
                  const equipOrders = allOrders.filter(o => o.equipmentId === eq.id);

                  return (
                    <tr key={eq.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {eq.internalTag}
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 block">{eq.brand} {eq.model}</strong>
                        <span className="text-[11px] text-slate-400 line-clamp-1">{eq.specsDescription || '—'}</span>
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-500">
                        {eq.category}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800 font-medium">
                        {eq.serialNumber || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 block">{cust?.name || '—'}</span>
                        <span className="text-[11px] text-slate-400">{cust?.phone}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {equipOrders.length} ordens
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {new Date(eq.createdAt).toLocaleDateString('pt-PT')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal New Equipment */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Registar Novo Equipamento</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEquipment} className="space-y-3">
              <CustomerSearchSelect
                customers={customers}
                selectedCustomerId={formCustomerId}
                onSelectCustomer={customer => setFormCustomerId(customer ? customer.id : '')}
                label="Cliente Proprietário"
                placeholder="Comece a escrever o nome do cliente..."
                required
              />

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  >
                    <option value="portatil">Portátil</option>
                    <option value="desktop">Desktop</option>
                    <option value="servidor">Servidor</option>
                    <option value="monitor">Monitor</option>
                    <option value="impressora">Impressora</option>
                    <option value="tablet">Tablet</option>
                    <option value="smartphone">Smartphone</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    value={formBrand}
                    onChange={e => setFormBrand(e.target.value)}
                    placeholder="Apple, Lenovo..."
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    value={formModel}
                    onChange={e => setFormModel(e.target.value)}
                    placeholder="MacBook, ThinkPad..."
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Número de Série (S/N)</label>
                  <input
                    type="text"
                    value={formSerial}
                    onChange={e => setFormSerial(e.target.value)}
                    placeholder="PF3X89K2..."
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Etiqueta Interna (Opcional)</label>
                  <input
                    type="text"
                    value={formTag}
                    onChange={e => setFormTag(e.target.value)}
                    placeholder="Auto: EQ-2026-XX"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Especificações Relevantes</label>
                <input
                  type="text"
                  value={formSpecs}
                  onChange={e => setFormSpecs(e.target.value)}
                  placeholder="Ex: Core i7, 16GB RAM, 512GB SSD..."
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                >
                  Gravar Equipamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
