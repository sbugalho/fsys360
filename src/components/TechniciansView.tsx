import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Wrench,
  Search,
  Shield,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Power,
  AlertTriangle,
  X,
  Lock,
  Tag
} from 'lucide-react';
import { User, UserRole } from '../types';
import { DataStore } from '../services/storage';

interface TechniciansViewProps {
  currentUser: User;
  onRefresh: () => void;
}

export const TechniciansView: React.FC<TechniciansViewProps> = ({ currentUser, onRefresh }) => {
  const [users, setUsers] = useState<User[]>(DataStore.getUsers());
  const orders = DataStore.getServiceOrders();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formUsername, setFormUsername] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('123456');
  const [formRole, setFormRole] = useState<UserRole>('tecnico');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formSpecialty, setFormSpecialty] = useState<string>('Hardware & Eletrónica');
  const [formError, setFormError] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  const refreshList = () => {
    setUsers(DataStore.getUsers());
    onRefresh();
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormName('');
    setFormUsername('');
    setFormEmail('');
    setFormPassword('123456');
    setFormRole('tecnico');
    setFormPhone('');
    setFormSpecialty('Hardware & Eletrónica');
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormPassword(user.password || '');
    setFormRole(user.role);
    setFormPhone(user.phone || '');
    setFormSpecialty(user.specialty || '');
    setFormError('');
    setShowModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim() || !formUsername.trim()) {
      setFormError('Por favor preencha o nome e o nome de utilizador.');
      return;
    }

    // Check username uniqueness if creating or changing
    const cleanUsername = formUsername.trim().toLowerCase();
    const existing = users.find(u => u.username?.toLowerCase() === cleanUsername && u.id !== editingUser?.id);
    if (existing) {
      setFormError(`O nome de utilizador "${formUsername}" já está a ser utilizado por outro colaborador.`);
      return;
    }

    const autoEmail = formEmail.trim() || `${cleanUsername}@fozsistemas.com`;

    DataStore.saveUser(
      {
        id: editingUser?.id || '',
        name: formName.trim(),
        username: cleanUsername,
        email: autoEmail,
        password: formPassword || '123456',
        role: formRole,
        active: editingUser ? editingUser.active : true,
        phone: formPhone.trim() || undefined,
        specialty: formSpecialty.trim() || undefined,
        isSuperAdmin: editingUser?.isSuperAdmin || false,
        createdAt: editingUser?.createdAt || new Date().toISOString(),
      },
      currentUser.id,
      currentUser.name
    );

    setActionSuccessMsg(editingUser ? `Colaborador ${formName} atualizado com sucesso.` : `Novo técnico/colaborador ${formName} criado com sucesso.`);
    setShowModal(false);
    refreshList();
    setTimeout(() => setActionSuccessMsg(''), 3500);
  };

  const handleToggleActive = (user: User) => {
    const res = DataStore.toggleUserActive(user.id, currentUser.id, currentUser.name);
    if (res.success && res.user) {
      setActionSuccessMsg(`A conta de ${user.name} foi ${res.user.active ? 'reativada' : 'desativada'} com sucesso.`);
      refreshList();
      setTimeout(() => setActionSuccessMsg(''), 3500);
    } else {
      alert(res.error || 'Não foi possível alterar o estado.');
    }
  };

  const handleDeleteUser = (user: User) => {
    if (user.isSuperAdmin || user.username === 'admin') {
      alert('Não é permitido remover o Super Administrador principal.');
      return;
    }

    if (window.confirm(`Tem a certeza que deseja remover o técnico/utilizador "${user.name}" (${user.username})? Esta ação é irreversível.`)) {
      const res = DataStore.deleteUser(user.id, currentUser.id, currentUser.name);
      if (res.success) {
        setActionSuccessMsg(`Técnico ${user.name} removido com sucesso.`);
        refreshList();
        setTimeout(() => setActionSuccessMsg(''), 3500);
      } else {
        alert(res.error || 'Erro ao remover.');
      }
    }
  };

  // Filtered list
  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter === 'active' && !u.active) return false;
    if (statusFilter === 'inactive' && u.active) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.specialty && u.specialty.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Gestão da Equipa Técnica & Utilizadores</h2>
          <p className="text-xs text-slate-500">
            Registo de técnicos de laboratório, credenciais de acesso, especialidades e controlo de ativação
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          + Registar Novo Técnico / Colaborador
        </button>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {actionSuccessMsg}
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Filters Bar */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por nome, utilizador, email ou especialidade..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-sky-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>Perfil:</span>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-medium"
              >
                <option value="all">Todos os Perfis</option>
                <option value="tecnico">Apenas Técnicos</option>
                <option value="rececao">Receção</option>
                <option value="admin">Administradores</option>
                <option value="gestao">Gestão</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>Estado:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-medium"
              >
                <option value="all">Todos os Estados</option>
                <option value="active">Ativos</option>
                <option value="inactive">Desativados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Colaborador / Técnico</th>
                <th className="py-3 px-4">Utilizador & Email</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4">Especialidade</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Assistências Ativas</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Ações de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Nenhum colaborador encontrado com os critérios de filtro.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const assignedCount = orders.filter(
                    o => o.assignedTechnicianId === user.id && o.status !== 'entregue_fechado' && o.status !== 'sem_reparacao'
                  ).length;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        !user.active ? 'bg-slate-50/40 opacity-75' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : user.role === 'tecnico'
                                ? 'bg-sky-100 text-sky-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {user.name}
                            </span>
                            {user.isSuperAdmin && (
                              <span className="text-[10px] text-purple-700 font-semibold">
                                ★ Super Admin Principal
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-800 block">
                          @{user.username}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {user.email}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                            user.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : user.role === 'tecnico'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : user.role === 'rececao'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        {user.specialty || 'Geral'}
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {user.phone || '—'}
                      </td>

                      <td className="py-3 px-4">
                        {user.role === 'tecnico' ? (
                          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {assignedCount} em curso
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">N/A</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {user.active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 font-medium text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Desativado
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle Active / Deactivate */}
                          <button
                            onClick={() => handleToggleActive(user)}
                            disabled={user.isSuperAdmin || user.username === 'admin'}
                            title={user.active ? 'Desativar acesso do colaborador' : 'Reativar colaborador'}
                            className={`p-1.5 rounded transition-colors disabled:opacity-30 ${
                              user.active
                                ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-800'
                                : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            title="Editar dados ou alterar palavra-passe"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.isSuperAdmin || user.username === 'admin'}
                            title="Remover colaborador"
                            className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded transition-colors disabled:opacity-20"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
          <span>Total de colaboradores registados: {users.length}</span>
          <span className="font-medium text-slate-700">FSYS360 Service — Gestão de Técnicos • FozSistemas</span>
        </div>
      </div>

      {/* Modal Create / Edit User */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-sky-600" />
                {editingUser ? 'Editar Técnico / Colaborador' : 'Registar Novo Técnico'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ex: Rui Duarte"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome de Utilizador (Login) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="Ex: rui"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Perfil / Função *
                  </label>
                  <select
                    value={formRole}
                    onChange={e => setFormRole(e.target.value as UserRole)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-medium"
                  >
                    <option value="tecnico">Técnico de Laboratório</option>
                    <option value="rececao">Receção & Balcão</option>
                    <option value="admin">Administrador</option>
                    <option value="gestao">Gestão Comercial / Financeira</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Palavra-passe *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone de Contacto
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="912 345 678"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Corporativo (@fozsistemas.com)
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="utilizador@fozsistemas.com"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Especialidade Técnica / Área
                </label>
                <input
                  type="text"
                  value={formSpecialty}
                  onChange={e => setFormSpecialty(e.target.value)}
                  placeholder="Ex: Micro-soldadura, Ecrãs, Apple Mac, Servidores..."
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
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-semibold shadow-xs"
                >
                  {editingUser ? 'Guardar Alterações' : 'Criar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
