import React, { useState } from 'react';
import { Unit, Pendencia, ResponsibleParty, PendenciaStatus, PendenciaPriority, PendenciaOrigin } from '../types';
import { 
  Plus, 
  Check, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Filter, 
  ShieldAlert, 
  CheckCircle, 
  Info, 
  MessageSquare, 
  Copy, 
  Calendar, 
  HelpCircle, 
  X, 
  RefreshCw,
  FolderLock
} from 'lucide-react';
import { formatShortDate } from '../utils';

interface PendenciasViewProps {
  units: Unit[];
  pendencias: Pendencia[];
  addPendencia: (pendencia: Omit<Pendencia, 'id' | 'dateAdded'>) => void;
  togglePendenciaStatus: (id: string) => void;
  deletePendencia: (id: string) => void;
  updatePendencia?: (updatedPend: Pendencia) => void;
  initialUnitId?: string;
}

export default function PendenciasView({
  units,
  pendencias,
  addPendencia,
  togglePendenciaStatus,
  deletePendencia,
  updatePendencia,
  initialUnitId = ''
}: PendenciasViewProps) {
  const activeUnits = units.filter(u => u.active);
  const todayStr = new Date().toISOString().split('T')[0];

  // States for new pendency form
  const [showAddForm, setShowAddForm] = useState(initialUnitId !== '');
  const [newUnitId, setNewUnitId] = useState(initialUnitId || (activeUnits[0]?.id || ''));
  const [newDescription, setNewDescription] = useState('');
  const [newResponsible, setNewResponsible] = useState<ResponsibleParty>('gerente');
  const [newPriority, setNewPriority] = useState<PendenciaPriority>('media');
  const [newOrigin, setNewOrigin] = useState<PendenciaOrigin>('outro');
  const [newPrazo, setNewPrazo] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newStatus, setNewStatus] = useState<PendenciaStatus>('pendente');

  // States for filtering
  const [filterUnitId, setFilterUnitId] = useState('todas');
  const [filterStatus, setFilterStatus] = useState<string>('ativas'); // defaults to active items (pendente + em_andamento)
  const [filterPriority, setFilterPriority] = useState('todas');
  const [filterResponsible, setFilterResponsible] = useState('todas');
  const [filterOrigin, setFilterOrigin] = useState('todas');
  const [filterPeriod, setFilterPeriod] = useState<string>('todos'); // todos, hoje, atrasadas

  // State for inline resolutions
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [colabResolvedBy, setColabResolvedBy] = useState('Agência TráfegON');
  const [colabResolvedNotes, setColabResolvedNotes] = useState('');
  
  // State for WhatsApp exports
  const [copiedList, setCopiedList] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim()) return;

    addPendencia({
      unitId: newUnitId,
      description: newDescription,
      responsible: newResponsible,
      status: newStatus,
      priority: newPriority,
      notes: newNotes,
      origin: newOrigin,
      prazo: newPrazo,
      resolvedDate: '',
      resolvedNotes: '',
      resolvedBy: '',
      urgency: (newPriority === 'critica' ? 'alta' : newPriority) as any
    });

    // Reset standard form state
    setNewDescription('');
    setNewNotes('');
    setNewPrazo('');
    setNewPriority('media');
    setNewStatus('pendente');
    setNewOrigin('outro');
    setShowAddForm(false);
  };

  // Perform filtering
  const filteredPendencias = pendencias.filter(p => {
    const matchesUnit = filterUnitId === 'todas' || p.unitId === filterUnitId;
    
    // Status Filter handler
    let matchesStatus = true;
    if (filterStatus === 'ativas') {
      matchesStatus = p.status === 'pendente' || p.status === 'em_andamento' || p.status === 'aberta';
    } else if (filterStatus !== 'todas') {
      const normStatus = p.status === 'resolvida' ? 'resolvido' : p.status;
      const targetStatus = filterStatus === 'resolvida' ? 'resolvido' : filterStatus;
      matchesStatus = normStatus === targetStatus;
    }

    // Priority checks (combines new priority and old urgency)
    const pPriority = p.priority || p.urgency || 'media';
    const matchesPriority = filterPriority === 'todas' || pPriority === filterPriority;

    // Responsibility checks
    const matchesResponsible = filterResponsible === 'todas' || p.responsible === filterResponsible;

    // Origin checks
    const matchesOrigin = filterOrigin === 'todas' || p.origin === filterOrigin;

    // Period checks
    let matchesPeriod = true;
    if (filterPeriod === 'atrasadas') {
      const isPending = p.status === 'pendente' || p.status === 'em_andamento' || p.status === 'aberta';
      const isOverdue = p.prazo ? (p.prazo < todayStr) : false;
      matchesPeriod = isPending && isOverdue;
    } else if (filterPeriod === 'hoje') {
      matchesPeriod = p.dateAdded === todayStr || p.prazo === todayStr;
    }

    return matchesUnit && matchesStatus && matchesPriority && matchesResponsible && matchesOrigin && matchesPeriod;
  });

  // METRICS COMPUTATIONS
  const totalOpenCount = pendencias.filter(p => p.status === 'pendente' || p.status === 'em_andamento' || p.status === 'aberta').length;
  
  const highPriorityCount = pendencias.filter(p => {
    const isPending = p.status === 'pendente' || p.status === 'em_andamento' || p.status === 'aberta';
    const prio = p.priority || p.urgency || 'media';
    const isOverdue = p.prazo ? (p.prazo < todayStr) : false;
    return isPending && (prio === 'critica' || prio === 'alta' || isOverdue);
  }).length;

  const totalResolvedCount = pendencias.filter(p => p.status === 'resolvido' || p.status === 'resolvida').length;

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'critica':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-955/50 text-red-400 border border-red-500/35">Crítica</span>;
      case 'alta':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-955/40 text-orange-400 border border-orange-500/30">Alta</span>;
      case 'media':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-955/40 text-amber-400 border border-amber-900/30">Média</span>;
      case 'baixa':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-955/40 text-blue-300 border border-blue-900/30">Baixa</span>;
    }
  };

  const getStatusBadge = (status: string, overrideOverdue?: boolean) => {
    if (overrideOverdue) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-950/55 text-rose-400 border border-rose-900/50 animate-pulse-slow">Atrasada</span>;
    }
    switch (status) {
      case 'resolvido':
      case 'resolvida':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-900/35">Resolvido</span>;
      case 'cancelado':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-900 text-gray-500 border border-gray-800">Cancelado</span>;
      case 'em_andamento':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-violet-950/60 text-violet-300 border border-violet-850">Em andamento</span>;
      case 'pendente':
      case 'aberta':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-950/40 text-rose-400 border border-rose-900/30">Pendente</span>;
    }
  };

  const getResponsibleLabel = (resp: string) => {
    switch (resp) {
      case 'agencia': return 'Agência TráfegON';
      case 'unidade': return 'Sócia / Franqueado';
      case 'colaboradora': return 'Colaboradora Clínica';
      case 'gerente': return 'Gerente Local';
      default: return String(resp);
    }
  };

  const getOriginLabel = (origin?: string) => {
    switch (origin) {
      case 'unidade': return 'Unidade própria';
      case 'agencia': return 'Agência de Tráfego';
      case 'socias': return 'Diretoria Sócias';
      case 'reuniao_quinzenal': return 'Reunião Quinzenal';
      case 'cronograma': return 'Cronograma de Postagens';
      case 'live_gravada': return 'Live Gravada / Reels';
      case 'conteudo': return 'Ideias de Conteúdo';
      case 'outro':
      default: return 'Outra Origem';
    }
  };

  // HANDLER FOR INLINE COMPLETION RESOLUTION FORM
  const handleOpenResolveForm = (id: string) => {
    setResolvingId(id);
    setColabResolvedNotes('');
    setColabResolvedBy('Agência TráfegON');
  };

  const handleConfirmResolution = (p: Pendencia) => {
    if (!updatePendencia) {
      // Fallback if updatePendencia is not accessible (just use toggle)
      togglePendenciaStatus(p.id);
      setResolvingId(null);
      return;
    }

    const updated: Pendencia = {
      ...p,
      status: 'resolvido' as any,
      resolvedDate: todayStr,
      resolvedBy: colabResolvedBy,
      resolvedNotes: colabResolvedNotes || 'Resolvido e verificado com sucesso.'
    };

    updatePendencia(updated);
    setResolvingId(null);
  };

  const handleReopenPendencia = (p: Pendencia) => {
    if (!updatePendencia) {
      togglePendenciaStatus(p.id);
      return;
    }

    const updated: Pendencia = {
      ...p,
      status: 'pendente' as any,
      resolvedDate: '',
      resolvedBy: '',
      resolvedNotes: ''
    };

    updatePendencia(updated);
  };

  // WHATSAPP PLAIN EXPORTER FOR FILTERED ITEMS
  const handleExportToWhatsApp = () => {
    if (filteredPendencias.length === 0) return;

    let text = `⚠️ *PENDÊNCIAS REGISTRADAS - TRÁFEGON CHECK* ⚠️\n`;
    text += `📅 _Relatório exportado em: ${formatShortDate(todayStr)}_\n`;
    text += `🏢 _Grupo ONE - Operação Espaçolaser_\n`;
    text += `===================================\n\n`;

    filteredPendencias.forEach((p, index) => {
      const u = units.find(unit => unit.id === p.unitId);
      const unitName = u ? u.name : 'Geral (Grupo ONE)';
      const pPriority = p.priority || p.urgency || 'media';
      const isOverdue = p.prazo ? (p.prazo < todayStr && p.status !== 'resolvido') : false;
      
      const prioLabel = 
        pPriority === 'critica' ? '🚨 CRÍTICA' :
        pPriority === 'alta' ? '🔥 ALTA' : 
        pPriority === 'media' ? '⚠️ MÉDIA' : '☕ BAIXA';
        
      const statusLabel = isOverdue 
        ? '🔴 ATRASADA' 
        : p.status === 'resolvido' || p.status === 'resolvida' ? '✅ RESOLVIDA' : '⏳ PENDENTE';

      text += `*${index + 1}. [${prioLabel}]* em _${unitName}_\n`;
      text += `   └ *Descrição:* ${p.description}\n`;
      text += `   └ *Responsável:* ${getResponsibleLabel(p.responsible)}\n`;
      text += `   └ *Origem:* ${getOriginLabel(p.origin)}\n`;
      if (p.prazo) text += `   └ *Prazo:* ${formatShortDate(p.prazo)}\n`;
      text += `   └ *Status:* ${statusLabel}\n`;
      if (p.notes) text += `   └ *Notas Acomp.:* ${p.notes}\n`;
      
      if (p.status === 'resolvido' || p.status === 'resolvida') {
        text += `   └ *Resolvido em:* ${p.resolvedDate ? formatShortDate(p.resolvedDate) : 'N/D'}\n`;
        if (p.resolvedBy) text += `   └ *Quem resolveu:* ${p.resolvedBy}\n`;
        if (p.resolvedNotes) text += `   └ *Anotação de Fechamento:* ${p.resolvedNotes}\n`;
      }
      text += `\n`;
    });

    text += `-----------------------------------\n`;
    text += `_Gerado automaticamente via TráfegON Check_`;

    navigator.clipboard.writeText(text);
    setCopiedList(true);
    setTimeout(() => {
      setCopiedList(false);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Pendente */}
        <div className="bg-[#141414] p-4.5 rounded-2xl border border-[#212121] flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] font-mono font-black uppercase text-gray-500 tracking-wider">Total em Aberto</p>
            <h3 className="text-3xl font-mono font-black text-rose-450 mt-1">{totalOpenCount}</h3>
            <span className="text-[9.5px] text-gray-400 block mt-0.5">Obstáculos sendo tratados</span>
          </div>
          <AlertTriangle className="w-9 h-9 text-rose-400 bg-rose-955/20 p-2 rounded-xl border border-rose-900/35 animate-pulse-slow" />
        </div>

        {/* Alta Urgência e Atrasados */}
        <div className="bg-[#141414] p-4.5 rounded-2xl border border-[#212121] flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] font-mono font-black uppercase text-gray-500 tracking-wider">Críticas ou Atrasadas</p>
            <h3 className="text-3xl font-mono font-black text-amber-450 mt-1">{highPriorityCount}</h3>
            <span className="text-[9.5px] text-gray-400 block mt-0.5">Ações que exigem foco imediato</span>
          </div>
          <ShieldAlert className="w-9 h-9 text-amber-400 bg-amber-955/25 p-2 rounded-xl border border-amber-900/25" />
        </div>

        {/* Concluídas de Forma Corretiva */}
        <div className="bg-[#141414] p-4.5 rounded-2xl border border-[#212121] flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] font-mono font-black uppercase text-gray-500 tracking-wider">Total de Resolvidas</p>
            <h3 className="text-3xl font-mono font-black text-emerald-450 mt-1">{totalResolvedCount}</h3>
            <span className="text-[9.5px] text-gray-400 block mt-0.5">Resoluções gravadas no histórico</span>
          </div>
          <CheckCircle className="w-9 h-9 text-emerald-455 bg-emerald-955/25 p-2 rounded-xl border border-emerald-900/25" />
        </div>
      </div>

      {/* 2. CREATION WIDGET */}
      <div className="bg-[#141414] rounded-2xl border border-[#232323] shadow-md overflow-hidden">
        <div className="p-4.5 bg-[#1C1C1C] border-b border-[#242424] flex items-center justify-between">
          <div>
            <h3 className="font-display font-extrabold text-white text-[15px]">
              Ficha de Registro e Ação Corretiva
            </h3>
            <p className="text-[10.5px] text-gray-450 mt-0.5">Cadastre o que está travando a operação de tráfego orgânico.</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4" /> {showAddForm ? 'Ocultar Formulário' : 'Registrar Ocorrência'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleFormSubmit} className="p-6 border-b border-[#242424] space-y-4 bg-[#181818]/60 animate-fadeIn text-xs">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Unidade */}
              <div>
                <label className="block text-[11px] font-extrabold text-gray-400 mb-1">Unidade Relacionada</label>
                <select
                  value={newUnitId}
                  onChange={(e) => setNewUnitId(e.target.value)}
                  className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {activeUnits.map(u => (
                    <option key={u.id} value={u.id} className="bg-[#111]">[{u.sigla}] {u.name}</option>
                  ))}
                </select>
              </div>

              {/* Responsável */}
              <div>
                <label className="block text-[11px] font-extrabold text-gray-400 mb-1">Responsável pela Ação</label>
                <select
                  value={newResponsible}
                  onChange={(e) => setNewResponsible(e.target.value as ResponsibleParty)}
                  className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="gerente">Gerente da Unidade</option>
                  <option value="colaboradora">Colaboradora da Clínica</option>
                  <option value="agencia">Agência TráfegON</option>
                  <option value="unidade">Sócia / Franqueado</option>
                </select>
              </div>

              {/* Origem */}
              <div>
                <label className="block text-[11px] font-extrabold text-gray-400 mb-1">Origem da Pendência</label>
                <select
                  value={newOrigin}
                  onChange={(e) => setNewOrigin(e.target.value as PendenciaOrigin)}
                  className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="unidade">Unidade própria ou ponto</option>
                  <option value="agencia">Controle da Agência</option>
                  <option value="socias">Diretoria / Sócias</option>
                  <option value="reuniao_quinzenal">Reunião Quinzenal</option>
                  <option value="cronograma">Descumprimento de Cronograma</option>
                  <option value="live_gravada">Vídeo / Live gravada</option>
                  <option value="conteudo">Falta de Conteúdo / Promoção</option>
                  <option value="outro">Outro (Geral)</option>
                </select>
              </div>

              {/* Prioridade */}
              <div>
                <label className="block text-[11px] font-extrabold text-gray-400 mb-1">Gravidade / Prioridade</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as PendenciaPriority)}
                  className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="baixa">Baixa (Pode aguardar)</option>
                  <option value="media">Média (Acompanhamento diário)</option>
                  <option value="alta">Alta (Prejudica engajamento)</option>
                  <option value="critica">🚨 Crítica (Bloqueia resultados)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Prazo */}
              <div>
                <label className="block text-[11px] font-extrabold text-gray-400 mb-1">Prazo Estimado de Resolução (Opcional)</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={newPrazo}
                    onChange={(e) => setNewPrazo(e.target.value)}
                    className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-lg p-2 pl-9 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Status inicial de criação */}
              <div>
                <label className="block text-[11px] font-extrabold text-gray-400 mb-1">Status de Direcionamento</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as PendenciaStatus)}
                  className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="pendente">Pendente para Atuação</option>
                  <option value="em_andamento">Já Em Andamento</option>
                  <option value="resolvido">Resolvida Diretamente</option>
                  <option value="cancelado">Cancelada / Irrelevante</option>
                </select>
              </div>

              {/* Obs adicionais */}
              <div>
                <label className="block text-[11px] font-extrabold text-gray-400 mb-1">Notas Rápidas de Acompanhamento</label>
                <input
                  type="text"
                  placeholder="Ex: Já cobrado via grupo WhatsApp..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Descrição detalhada */}
            <div>
              <label className="block text-[11px] font-extrabold text-gray-400 mb-1">Descrição do Bloqueio ou Falha Operacional</label>
              <textarea
                required
                placeholder="Descreva claramente o ocorrido para que as sócias ou a agência entendam o problema..."
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-lg p-3.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-[#232323] hover:bg-[#2C2C2C] text-gray-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold rounded-xl text-xs cursor-pointer hover:scale-[1.01] transition-all"
              >
                Gravar Pendência
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3. EXPERT FILTER BAR */}
      <div className="space-y-4">
        <div className="bg-[#141414] p-4 rounded-xl border border-[#232323] space-y-3.5 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 border-b border-[#202020] pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-400 shrink-0" />
              <strong className="text-xs uppercase font-mono tracking-wider text-gray-300">Filtros Avançador de Pendências</strong>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={filteredPendencias.length === 0}
                onClick={handleExportToWhatsApp}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all select-none border cursor-pointer ${
                  copiedList
                    ? 'bg-emerald-950/40 border-emerald-900/40 text-emerald-450'
                    : 'bg-[#1C1C1C] hover:bg-[#252525] text-gray-300 hover:text-white border-[#2A2A2A]'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedList ? 'Copiado para o WhatsApp!' : 'Exportar p/ WhatsApp'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setFilterUnitId('todas');
                  setFilterStatus('ativas');
                  setFilterPriority('todas');
                  setFilterResponsible('todas');
                  setFilterOrigin('todas');
                  setFilterPeriod('todos');
                }}
                className="p-1.5 bg-[#1C1C1C] text-gray-400 hover:text-white border border-[#2A2A2A] rounded-lg cursor-pointer"
                title="Limpar todos filtros"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
            {/* Unidade */}
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase font-mono">Unidade</label>
              <select
                value={filterUnitId}
                onChange={(e) => setFilterUnitId(e.target.value)}
                className="w-full bg-[#181818] text-white border border-[#272727] rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="todas">Todas Unidades</option>
                {activeUnits.map(u => (
                  <option key={u.id} value={u.id}>[{u.sigla}] {u.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase font-mono">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-[#181818] text-white border border-[#272727] rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="todas">Todos Status</option>
                <option value="ativas">Ativas (Pendente / Em And.)</option>
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="resolvido">Resolvida</option>
                <option value="cancelado">Cancelada</option>
              </select>
            </div>

            {/* Gravidade */}
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase font-mono">Gravidade</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full bg-[#181818] text-white border border-[#272727] rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="todas">Todas Gravidades</option>
                <option value="critica">Crítica</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>

            {/* Responsável */}
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase font-mono">Responsável</label>
              <select
                value={filterResponsible}
                onChange={(e) => setFilterResponsible(e.target.value)}
                className="w-full bg-[#181818] text-white border border-[#272727] rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="todas">Todos</option>
                <option value="gerente">Gerente</option>
                <option value="colaboradora">Colaboradora</option>
                <option value="unidade">Sócia</option>
                <option value="agencia">Agência</option>
              </select>
            </div>

            {/* Origem */}
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase font-mono">Origem</label>
              <select
                value={filterOrigin}
                onChange={(e) => setFilterOrigin(e.target.value)}
                className="w-full bg-[#181818] text-white border border-[#272727] rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="todas">Todas Origens</option>
                <option value="unidade">Clínica</option>
                <option value="agencia">Agência</option>
                <option value="socias">Sócias</option>
                <option value="reuniao_quinzenal">Reunião Quinzenal</option>
                <option value="cronograma">Cronograma</option>
                <option value="live_gravada">Live Gravada</option>
                <option value="conteudo">Conteúdo</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            {/* Período */}
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase font-mono">Período</label>
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="w-full bg-[#181818] text-white border border-[#272727] rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="todos">Todo Histórico</option>
                <option value="hoje">Movimentos de Hoje</option>
                <option value="atrasadas">Atrasadas (Prazo Vencido)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. LISTING GRID OF PENDENCIES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPendencias.length === 0 ? (
          <div className="col-span-full bg-[#141414] border border-[#212121] rounded-2xl p-14 text-center text-gray-500">
            <Info className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
            <p className="font-extrabold text-white text-base">Nenhum registro encontrado!</p>
            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
              Experimente alterar os filtros avançados acima para encontrar pendências resolvidas ou de outras origens.
            </p>
          </div>
        ) : (
          filteredPendencias.map(p => {
            const unitObj = units.find(u => u.id === p.unitId);
            const isResolved = p.status === 'resolvido' || p.status === 'resolvida';
            const mappedPriority = p.priority || p.urgency || 'media';
            const isOverdue = p.prazo ? (p.prazo < todayStr && !isResolved) : false;

            return (
              <div
                key={p.id}
                className={`border rounded-2xl p-5 bg-[#141414] shadow-md hover:border-[#2F2F2F] hover:shadow-lg transition-all flex flex-col justify-between whitespace-normal ${
                  isResolved 
                    ? 'border-emerald-900/15 bg-emerald-950/2 opacity-75' 
                    : isOverdue 
                    ? 'border-red-900/30 bg-red-950/2' 
                    : 'border-[#242424]'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Header metadata */}
                  <div className="flex items-start justify-between gap-3 border-b border-[#212121] pb-3">
                    <div>
                      <span className="text-[9px] font-mono font-black text-gray-500 block uppercase tracking-wider">
                        Filial Associada
                      </span>
                      <h4 className="font-display font-black text-white text-[13.5px] leading-tight">
                        {unitObj ? `[${unitObj.sigla}] - ${unitObj.name}` : 'Diretoria / Geral'}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {getPriorityBadge(mappedPriority)}
                      {getStatusBadge(p.status, isOverdue)}
                    </div>
                  </div>

                  {/* Core description text */}
                  <div className="space-y-2">
                    <p className={`text-xs leading-relaxed text-gray-200 ${isResolved ? 'line-through text-gray-500' : ''}`}>
                      {p.description}
                    </p>

                    {/* Metadata layout box */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 bg-[#181818] p-3 rounded-xl text-[11px] text-gray-300 border border-[#202020] font-mono">
                      <div>
                        <strong className="text-gray-500 uppercase text-[9px] block">Responsável Pela Ação</strong>
                        <span className="text-gray-200 font-sans font-bold block mt-0.5">{getResponsibleLabel(p.responsible)}</span>
                      </div>

                      <div>
                        <strong className="text-gray-500 uppercase text-[9px] block">Origem Foco</strong>
                        <span className="text-gray-200 font-sans font-bold block mt-0.5">{getOriginLabel(p.origin)}</span>
                      </div>

                      <div className="mt-2 text-[10.5px]">
                        <strong className="text-gray-500 uppercase text-[9px] block">Data Criação</strong>
                        <span className="text-gray-300 font-mono block mt-0.5">{p.dateAdded ? formatShortDate(p.dateAdded) : formatShortDate(todayStr)}</span>
                      </div>

                      <div className="mt-2 text-[10.5px]">
                        <strong className="text-gray-500 uppercase text-[9px] block">Prazo Estimado</strong>
                        <span className={`block font-mono font-bold mt-0.5 ${isOverdue ? 'text-red-400' : 'text-gray-300'}`}>
                          {p.prazo ? formatShortDate(p.prazo) : 'Sem definição'}
                        </span>
                      </div>
                    </div>

                    {/* Additional Notes tracker text */}
                    {p.notes && (
                      <div className="p-2.5 bg-yellow-950/10 border border-yellow-900/10 rounded-lg text-[11px] text-amber-500/90 italic flex gap-1.5 leading-snug">
                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>Acompanhamento: "{p.notes}"</span>
                      </div>
                    )}

                    {/* HISTORIC RESOLUTION RECORD */}
                    {isResolved && (
                      <div className="p-3 bg-emerald-950/10 border border-emerald-900/20 rounded-xl space-y-1 text-[11px] text-emerald-450/90">
                        <strong className="font-sans font-black flex items-center gap-1 uppercase tracking-wider text-[9px]">
                          <CheckCircle className="w-3.5 h-3.5" /> Ficha de Encerramento Registrada
                        </strong>
                        <p className="font-mono mt-1 text-gray-300">
                          <span className="text-emerald-500 font-bold">Quem resolveu:</span> {p.resolvedBy || 'Agência TráfegON'}
                        </p>
                        <p className="font-mono text-gray-300">
                          <span className="text-emerald-500 font-bold">Encerrado em:</span> {p.resolvedDate ? formatShortDate(p.resolvedDate) : formatShortDate(todayStr)}
                        </p>
                        <p className="text-gray-100 font-sans italic bg-[#15201A] p-2 rounded border border-emerald-900/30 mt-1.5 leading-relaxed">
                          "{p.resolvedNotes || 'Encerrado sem observações adicionais.'}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline form or controls overlay */}
                <div className="mt-4 pt-3 border-t border-[#212121] flex flex-col gap-2">
                  {/* Expanding inline resolution fields */}
                  {resolvingId === p.id && (
                    <div className="bg-[#181818] p-3.5 rounded-xl border border-indigo-900/30 text-xs space-y-3 animate-fadeIn mb-2 leading-none">
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-[10px] text-indigo-400 font-black uppercase font-mono tracking-wider flex items-center gap-1">
                          <FolderLock className="w-3.5 h-3.5" /> Formulário de Encerramento
                        </span>
                        <button 
                          onClick={() => setResolvingId(null)}
                          className="text-gray-500 hover:text-white"
                          type="button"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2 text-left">
                        <div>
                          <label className="block text-[10px] font-extrabold text-gray-400 mb-1">Quem Equacionou a Ação?</label>
                          <input
                            type="text"
                            required
                            value={colabResolvedBy}
                            onChange={(e) => setColabResolvedBy(e.target.value)}
                            className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            placeholder="Ex: Amanda (Gerente), Larissa (Sócia)"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold text-gray-400 mb-1">Nota de Conclusão / Solução Adotada</label>
                          <textarea
                            required
                            rows={2}
                            value={colabResolvedNotes}
                            onChange={(e) => setColabResolvedNotes(e.target.value)}
                            className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-normal"
                            placeholder="Descreva brevemente como a pendência foi contornada (ex: story postado atrasado; bastidores enviados posterior)."
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setResolvingId(null)}
                          className="px-2.5 py-1.5 bg-[#252525] text-gray-400 hover:text-white rounded-lg text-[10px] font-bold"
                        >
                          Voltar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmResolution(p)}
                          className="px-3.5 py-1.5 bg-emerald-650 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black"
                        >
                          Gravar Resolução!
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Standard trigger controls */}
                  {resolvingId !== p.id && (
                    <div className="flex items-center justify-between gap-2.5 select-none text-xs">
                      {isResolved ? (
                        <button
                          onClick={() => handleReopenPendencia(p)}
                          className="px-3 py-1.5 rounded-lg text-xs font-black bg-[#232323] border border-[#2D2D2D] text-gray-300 hover:bg-[#2B2B2B] hover:text-white cursor-pointer transition-all flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Reabrir Registro
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenResolveForm(p.id)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-all flex items-center gap-1 hover:scale-[1.01]"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-100" /> Resolver Pendência
                        </button>
                      )}

                      <button
                        onClick={() => deletePendencia(p.id)}
                        className="p-1.5 border border-transparent text-gray-500 hover:text-rose-455 hover:border-rose-950/20 rounded-lg hover:bg-rose-955/35 transition-all text-xs cursor-pointer ml-auto"
                        title="Remover Registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
