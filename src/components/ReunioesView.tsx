import React, { useState, useMemo } from 'react';
import { Unit } from '../types';
import { 
  Users, 
  Plus, 
  Search, 
  Check, 
  Calendar, 
  FileText, 
  AlertTriangle, 
  Award, 
  Trash2, 
  Edit2, 
  X, 
  Sparkles,
  Copy,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Bookmark
} from 'lucide-react';

interface ReunionResumo {
  leituraResultados: string;
  unidadesDestaquePositivo: string;
  unidadesAlerta: string;
  pendenciasCriticasResumo: string;
  proximosPassos: string;
}

interface ReunionItem {
  id: string;
  data: string; // YYYY-MM-DD
  status: 'Agendada' | 'Realizada' | 'Reagendada' | 'Cancelada';
  pontosAtencao: string;
  pendenciasCriticas: string;
  encaminhamentos: string;
  observacoes: string;
  resumo?: ReunionResumo;
}

interface ReunioesViewProps {
  units: Unit[];
  todayDate: string;
}

const DEFAULT_REUNIOES: ReunionItem[] = [
  {
    id: 'reu_1',
    data: '2026-05-20',
    status: 'Realizada',
    pontosAtencao: 'Queda de envio de bastidores em Rio Sul nas terças-feiras. Baixo alcance do TikTok orgânico da Barra.',
    pendenciasCriticas: 'Barra necessita revalidar a contratação de nova modelo parceira para fotos de estúdio urgentemente.',
    encaminhamentos: 'Juliana (Rio Sul) irá designar uma fisioterapeuta exclusivamente para as gravações semanais. Agência TráfegON irá enviar rascunhos de pautas.',
    observacoes: 'Reunião durou 1h15 com foco puramente operacional e alinhamento do funil de stories.',
    resumo: {
      leituraResultados: 'As metas gerais de postagens no Reels atingiram 92% de conformidade, mas a retenção de stories diários flutuou devido à rotatividade de funcionárias.',
      unidadesDestaquePositivo: 'Morumbi Shopping (Teve 100% de presença nas postagens principais e engajamento acima da média).',
      unidadesAlerta: 'Rio Sul (Atrasos na entrega de relatórios e falta de stories sobre peles sensíveis).',
      pendenciasCriticasResumo: 'Revalidação da influencer VIP Rio de Janeiro e configuração da conta comercial TikTok.',
      proximosPassos: 'Alinhamento com as gerentes na sexta-feira de manhã; Produção de novas diretrizes criativas anti-bloqueio; Disparo de cupons de Dia dos Namorados.'
    }
  },
  {
    id: 'reu_2',
    data: '2026-06-03',
    status: 'Agendada',
    pontosAtencao: 'Aprovação de verba extra para campanhas patrocinadas no Instagram Ads avaliando custos médios por clique (CPC).',
    pendenciasCriticas: 'Consolidar planilha de leads gerados vs convertidos por unidade.',
    encaminhamentos: 'Fritz estruturar proposta de criativos novos. Priscila aprovar orçamento extra do Grupo ONE.',
    observacoes: 'Será realizada online via Google Meet com gravação salva para posterior consulta.',
  }
];

export default function ReunioesView({ units, todayDate }: ReunioesViewProps) {
  // Persistence key
  const [meetings, setMeetings] = useState<ReunionItem[]>(() => {
    const saved = localStorage.getItem('trafegon_reunioes_v2');
    return saved ? JSON.parse(saved) : DEFAULT_REUNIOES;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas');
  const [showAddForm, setShowAddForm] = useState(false);

  // Summary Toggle IDs
  const [expandedSummaryId, setExpandedSummaryId] = useState<string | null>(null);
  
  // Resumo Builder states (inside detail view / modal modal)
  const [summaryEditorId, setSummaryEditorId] = useState<string | null>(null);
  const [summaryForm, setSummaryForm] = useState<ReunionResumo>({
    leituraResultados: '',
    unidadesDestaquePositivo: '',
    unidadesAlerta: '',
    pendenciasCriticasResumo: '',
    proximosPassos: ''
  });

  // Action / create states
  const [formData, setFormData] = useState({
    data: todayDate,
    status: 'Agendada' as ReunionItem['status'],
    pontosAtencao: '',
    pendenciasCriticas: '',
    encaminhamentos: '',
    observacoes: ''
  });

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<ReunionItem | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Persistence helpers
  const saveMeetings = (updated: ReunionItem[]) => {
    setMeetings(updated);
    localStorage.setItem('trafegon_reunioes_v2', JSON.stringify(updated));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pontosAtencao.trim()) return;

    const newItem: ReunionItem = {
      id: `reu_${Date.now()}`,
      data: formData.data,
      status: formData.status,
      pontosAtencao: formData.pontosAtencao.trim(),
      pendenciasCriticas: formData.pendenciasCriticas.trim(),
      encaminhamentos: formData.encaminhamentos.trim(),
      observacoes: formData.observacoes.trim()
    };

    saveMeetings([newItem, ...meetings]);
    setShowAddForm(false);
    // Reset Form
    setFormData({
      data: todayDate,
      status: 'Agendada',
      pontosAtencao: '',
      pendenciasCriticas: '',
      encaminhamentos: '',
      observacoes: ''
    });
  };

  const startEdit = (item: ReunionItem) => {
    setEditingId(item.id);
    setEditFormData({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  const saveEdit = () => {
    if (!editFormData || !editFormData.pontosAtencao.trim()) return;
    saveMeetings(meetings.map(m => m.id === editFormData.id ? editFormData : m));
    setEditingId(null);
    setEditFormData(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente remover esta ata de reunião?')) {
      saveMeetings(meetings.filter(m => m.id !== id));
    }
  };

  // Open Summary Editor for a Meeting
  const openSummaryEditor = (mId: string) => {
    const target = meetings.find(m => m.id === mId);
    if (!target) return;
    setSummaryEditorId(mId);
    setSummaryForm(target.resumo || {
      leituraResultados: '',
      unidadesDestaquePositivo: '',
      unidadesAlerta: '',
      pendenciasCriticasResumo: target.pendenciasCriticas || '',
      proximosPassos: ''
    });
  };

  const saveSummaryObj = () => {
    if (!summaryEditorId) return;
    const updated = meetings.map(m => {
      if (m.id === summaryEditorId) {
        return {
          ...m,
          resumo: { ...summaryForm }
        };
      }
      return m;
    });
    saveMeetings(updated);
    setSummaryEditorId(null);
  };

  // Filtering meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter(m => {
      const matchesSearch = m.pontosAtencao.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            m.pendenciasCriticas.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.encaminhamentos.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.observacoes.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'todas' || m.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [meetings, searchTerm, statusFilter]);

  // Copy structured Text to clipboard for WhatsApp
  const handleCopyWhatsAppText = (item: ReunionItem) => {
    const formattedDate = item.data.split('-').reverse().join('/');
    let text = `📝 *ATA DE REUNIÃO QUINZENAL — TRÁFEGON CHECK* 📝\n\n`;
    text += `📅 *Data:* ${formattedDate}\n`;
    text += `🟢 *Status:* ${item.status}\n`;
    text += `===================================\n\n`;
    text += `💡 *Pontos de Atenção discutidos:*\n${item.pontosAtencao}\n\n`;
    text += `⚠️ *Pendências Críticas:* \n${item.pendenciasCriticas || 'Nenhuma pendência crítica listada.'}\n\n`;
    text += `🎯 *Encaminhamentos acordados:*\n${item.encaminhamentos}\n\n`;
    if (item.observacoes) {
      text += `📝 *Observações adicionais:*\n${item.observacoes}\n\n`;
    }

    if (item.resumo) {
      text += `📊 *RESUMO EXECUTIVO DE RESULTADOS* 📊\n`;
      text += `📈 *Leitura simples dos resultados:* \n${item.resumo.leituraResultados}\n\n`;
      text += `🏆 *Unidades em Destaque Positivo:* \n${item.resumo.unidadesDestaquePositivo}\n\n`;
      text += `🚨 *Unidades em Alerta:* \n${item.resumo.unidadesAlerta}\n\n`;
      text += `🔥 *Pendências Críticas (Resumo):* \n${item.resumo.pendenciasCriticasResumo}\n\n`;
      text += `🚀 *Próximos Passos Operacionais:* \n${item.resumo.proximosPassos}\n`;
    }

    text += `\n-----------------------------------\n`;
    text += `_Gerado via TráfegON Check • Grupo ONE_`;

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusColor = (status: ReunionItem['status']) => {
    switch (status) {
      case 'Realizada':
        return 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40';
      case 'Agendada':
        return 'bg-indigo-950/40 text-indigo-450 border border-indigo-900/40';
      case 'Reagendada':
        return 'bg-violet-950/40 text-violet-400 border border-[#402D62]';
      case 'Cancelada':
        return 'bg-rose-955/20 text-rose-500 border border-rose-900/10';
      default:
        return 'bg-gray-800 text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#141414] p-5 rounded-2xl border border-[#212121] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest block font-bold mb-1">Comunicação Estratégica</span>
          <h2 className="text-2xl font-display font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" /> Reuniões de Alinhamento
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Cadastre atas de reuniões quinzenais, defina pendências críticas, próximos passos e elabore resumos executivos de resultados.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md select-none"
        >
          <Plus className="w-4 h-4" /> Registrar Nova Reunião
        </button>
      </div>

      {/* Add Form Operational Register */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-[#141414] border border-[#2B2B2B] p-5 rounded-2xl space-y-4 animate-fadeIn text-xs shadow-xl">
          <div className="flex items-center justify-between border-b border-[#212121] pb-3">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wide flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> Gravar Nova Reunião Quinzenal
            </h3>
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)} 
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-450 mb-1">Data da Reunião</label>
              <input
                type="date"
                required
                value={formData.data}
                onChange={e => setFormData({ ...formData, data: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-450 mb-1">Status Operativo</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-bold"
              >
                <option value="Agendada">Agendada</option>
                <option value="Realizada">Realizada</option>
                <option value="Reagendada">Reagendada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-rose-400 mb-1">Pontos de Atenção / Discussões</label>
              <textarea
                required
                value={formData.pontosAtencao}
                onChange={e => setFormData({ ...formData, pontosAtencao: e.target.value })}
                placeholder="Discutido queda de entrega de stories, problemas com a modelo fotográfica, etc..."
                rows={3}
                className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-sans resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-orange-450 mb-1">Pendências Críticas Mapeadas</label>
              <textarea
                required
                value={formData.pendenciasCriticas}
                onChange={e => setFormData({ ...formData, pendenciasCriticas: e.target.value })}
                placeholder="Comissionamento correto da equipe local, aprovação dos novos roteiros urgentes..."
                rows={3}
                className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-sans resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-emerald-400 mb-1">Encaminhamentos / Responsabilidades</label>
              <textarea
                required
                value={formData.encaminhamentos}
                onChange={e => setFormData({ ...formData, encaminhamentos: e.target.value })}
                placeholder="Fritz enviar planilha de leads na segunda; Juliana treinar recepcionista até quarta..."
                rows={3}
                className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-sans resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-450 mb-1">Observações Finais</label>
              <textarea
                value={formData.observacoes}
                onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Próximo encontro via Google Meet. Gravação arquivada no Drive ONE."
                rows={3}
                className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-sans resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#212121]">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-[#262626] hover:bg-[#1F1F1F] text-gray-400 hover:text-white rounded-lg font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-extrabold shadow-lg"
            >
              Registrar Ata
            </button>
          </div>
        </form>
      )}

      {/* Stats Quick Readout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] flex justify-between items-center text-gray-300">
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Histórico de Reuniões</span>
            <p className="text-xl font-bold text-white mt-1">{filteredMeetings.length} reuniões</p>
          </div>
          <Bookmark className="w-8 h-8 text-indigo-500/10" />
        </div>

        <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] flex justify-between items-center">
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Realizadas</span>
            <p className="text-xl font-bold text-emerald-400 mt-1">{meetings.filter(m => m.status === 'Realizada').length} encontros</p>
          </div>
          <Check className="w-8 h-8 text-emerald-500/10" />
        </div>

        <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] flex justify-between items-center">
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Total de Resumos Operacionais</span>
            <p className="text-xl font-bold text-indigo-400 mt-1">{meetings.filter(m => m.resumo).length} relatórios gerados</p>
          </div>
          <Sparkles className="w-8 h-8 text-indigo-500/15" />
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-[#141414] p-4 rounded-2xl border border-[#212121] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por pautas, encaminhamentos, pontos de atenção ou resumo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg pl-10 pr-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-[#1A1A1A] text-gray-300 border border-[#262626] rounded-lg p-2.5 focus:outline-none cursor-pointer font-bold"
          >
            <option value="todas">Todos os Status</option>
            <option value="Agendada">Agendada</option>
            <option value="Realizada">Realizada</option>
            <option value="Reagendada">Reagendada</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Summary Editor Modal / Section (If editing a summary) */}
      {summaryEditorId && (
        <div className="bg-[#1F1212]/35 border border-amber-500/50 p-5 rounded-2xl space-y-4 animate-fadeIn text-xs shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#2B2B2B] pb-2 text-amber-500 font-bold font-mono tracking-wider">
            <span className="flex items-center gap-1.5 uppercase text-[11px]">
              <Sparkles className="w-4 h-4" /> Construção de Resumo de Resultados da Ata (Grupo ONE)
            </span>
            <button onClick={() => setSummaryEditorId(null)} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Leitura simples dos resultados</label>
              <textarea
                value={summaryForm.leituraResultados}
                onChange={e => setSummaryForm({ ...summaryForm, leituraResultados: e.target.value })}
                rows={2}
                placeholder="Descreva de forma simples e executiva a análise dos relatórios e rotinas..."
                className="w-full bg-[#1A1A1A] border border-[#2B2B2B] rounded-lg p-2 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-emerald-400 mb-1">Unidades em Destaque Positivo</label>
                <input
                  type="text"
                  value={summaryForm.unidadesDestaquePositivo}
                  onChange={e => setSummaryForm({ ...summaryForm, unidadesDestaquePositivo: e.target.value })}
                  placeholder="Ex: Rio Sul (100%), Morumbi Shopping"
                  className="w-full bg-[#1A1A1A] border border-[#2B2B2B] rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-rose-500 mb-1">Unidades em Alerta (Gargalos)</label>
                <input
                  type="text"
                  value={summaryForm.unidadesAlerta}
                  onChange={e => setSummaryForm({ ...summaryForm, unidadesAlerta: e.target.value })}
                  placeholder="Ex: Barra da Tijuca (falta de stories)"
                  className="w-full bg-[#1A1A1A] border border-[#2B2B2B] rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-orange-450 mb-1">Pendências Críticas</label>
                <textarea
                  value={summaryForm.pendenciasCriticasResumo}
                  onChange={e => setSummaryForm({ ...summaryForm, pendenciasCriticasResumo: e.target.value })}
                  rows={2}
                  placeholder="Apoio financeiro de anúncios, renegociar influenciadora..."
                  className="w-full bg-[#1A1A1A] border border-[#2B2B2B] rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-indigo-400 mb-1">Próximos Passos</label>
                <textarea
                  value={summaryForm.proximosPassos}
                  onChange={e => setSummaryForm({ ...summaryForm, proximosPassos: e.target.value })}
                  rows={2}
                  placeholder="Treinar equipe da Barra, revisar orçamentos, monitorar chats..."
                  className="w-full bg-[#1A1A1A] border border-[#2B2B2B] rounded-lg p-2 text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              onClick={() => setSummaryEditorId(null)}
              className="px-3.5 py-1.5 border border-[#2B2B2B] rounded-md hover:bg-[#1A1A1A]"
            >
              Cancelar
            </button>
            <button
              onClick={saveSummaryObj}
              className="px-4.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-md shadow-md"
            >
              Salvar Resumo Quinzenal
            </button>
          </div>
        </div>
      )}

      {/* Reunion items List */}
      <div className="space-y-6">
        {filteredMeetings.length === 0 ? (
          <div className="bg-[#141414] border border-[#212121] rounded-2xl p-12 text-center text-gray-500 font-sans">
            Nenhum registro de alinhamento ou reunião quinzenal encontrado.
          </div>
        ) : (
          filteredMeetings.map(item => {
            const isEditing = editingId === item.id;
            const hasResumo = !!item.resumo;
            const isExpanded = expandedSummaryId === item.id;

            if (isEditing && editFormData) {
              return (
                <div key={item.id} className="bg-[#181818] border border-amber-500/45 rounded-2xl p-4.5 space-y-3.5 text-xs animate-fadeIn text-gray-300">
                  <div className="flex items-center justify-between border-b border-[#262626] pb-2 text-amber-400 font-mono font-bold text-[10px]">
                    <span>MODIFICANDO REGISTRO DE REUNIÃO</span>
                    <div className="flex gap-2.5">
                      <button onClick={saveEdit} className="text-emerald-400 hover:text-white flex items-center gap-1 font-extrabold">
                        <Check className="w-3.5 h-3.5" /> Confirmar
                      </button>
                      <button onClick={cancelEdit} className="text-rose-400 hover:text-white flex items-center gap-1 font-extrabold">
                        <X className="w-3.5 h-3.5" /> Cancelar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold mb-1">DATA</label>
                      <input
                        type="date"
                        value={editFormData.data}
                        onChange={e => setEditFormData({ ...editFormData, data: e.target.value })}
                        className="w-full bg-[#111] border border-[#2D2D2D] p-2 text-xs text-white rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold mb-1 col-span-1">STATUS</label>
                      <select
                        value={editFormData.status}
                        onChange={e => setEditFormData({ ...editFormData, status: e.target.value as any })}
                        className="w-full bg-[#111] border border-[#2D2D2D] p-2 text-xs text-white rounded cursor-pointer font-bold"
                      >
                        <option value="Agendada">Agendada</option>
                        <option value="Realizada">Realizada</option>
                        <option value="Reagendada">Reagendada</option>
                        <option value="Cancelada">Cancelada</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-550 font-bold mb-1">PONTOS DE ATENÇÃO</label>
                      <textarea
                        value={editFormData.pontosAtencao}
                        onChange={e => setEditFormData({ ...editFormData, pontosAtencao: e.target.value })}
                        rows={2}
                        className="w-full bg-[#111] border border-[#2D2D2D] p-2 text-xs text-white rounded font-sans resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-550 font-bold mb-1">PENDÊNCIAS CRÍTICAS</label>
                      <textarea
                        value={editFormData.pendenciasCriticas}
                        onChange={e => setEditFormData({ ...editFormData, pendenciasCriticas: e.target.value })}
                        rows={2}
                        className="w-full bg-[#111] border border-[#2D2D2D] p-2 text-xs text-white rounded font-sans resize-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-550 font-bold mb-1">ENCAMINHAMENTOS</label>
                      <textarea
                        value={editFormData.encaminhamentos}
                        onChange={e => setEditFormData({ ...editFormData, encaminhamentos: e.target.value })}
                        rows={2}
                        className="w-full bg-[#111] border border-[#2D2D2D] p-2 text-xs text-white rounded font-sans resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-550 font-bold mb-1 col-span-1 col-end-3">OBSERVAÇÕES</label>
                      <textarea
                        value={editFormData.observacoes}
                        onChange={e => setEditFormData({ ...editFormData, observacoes: e.target.value })}
                        rows={2}
                        className="w-full bg-[#111] border border-[#2D2D2D] p-2 text-xs text-white rounded font-sans resize-none"
                      />
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={item.id}
                className="bg-[#141414] border border-[#242424] hover:border-indigo-550/30 rounded-2xl p-5.5 space-y-4 transition-all"
              >
                {/* Visual title and status row */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-[#212121] pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="text-gray-400 font-bold">
                        📅 REUNIÃO QUINZENAL DE: {item.data.split('-').reverse().join('/')}
                      </span>
                      <span className="text-gray-650">•</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-white leading-snug mt-1 font-sans">
                      Ata Operacional Técnica do Encontro Quinzenal
                    </h4>
                  </div>

                  {/* Actions column */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleCopyWhatsAppText(item)}
                      className="px-3 py-1 bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-400 border border-indigo-900/40 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> {copiedId === item.id ? 'Copiado!' : 'Copiar p/ WhatsApp'}
                    </button>

                    <button
                      onClick={() => openSummaryEditor(item.id)}
                      className="px-3 py-1 bg-amber-955/15 hover:bg-amber-900/10 text-amber-400 border border-amber-900/20 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> {hasResumo ? 'Editar Resumo' : 'Criar Resumo'}
                    </button>

                    <button
                      onClick={() => startEdit(item)}
                      className="p-1 px-2 text-gray-500 hover:text-white rounded border border-transparent hover:border-[#2D2D2D] transition-all text-[11px] font-bold font-mono cursor-pointer"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-gray-500 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Excluir ata"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Primary Data Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans text-gray-300">
                  <div className="p-3 bg-[#181818]/70 border border-[#222] rounded-xl space-y-1">
                    <span className="text-[9px] uppercase font-bold text-rose-400 block font-mono">Discutido / Pontos de Atenção</span>
                    <p className="leading-relaxed">{item.pontosAtencao}</p>
                  </div>

                  <div className="p-3 bg-[#181818]/70 border border-[#222] rounded-xl space-y-1">
                    <span className="text-[9px] uppercase font-bold text-orange-450 block font-mono">⚠️ Pendências Críticas</span>
                    <p className="leading-relaxed">{item.pendenciasCriticas || <span className="text-gray-500 italic">Nenhuma pendência prioritária.</span>}</p>
                  </div>

                  <div className="p-3 bg-[#181818]/70 border border-[#222] rounded-xl space-y-1">
                    <span className="text-[9px] uppercase font-bold text-emerald-400 block font-mono">🎯 Encaminhamentos Acordados</span>
                    <p className="leading-relaxed">{item.encaminhamentos}</p>
                  </div>

                  <div className="p-3 bg-[#181818]/70 border border-[#222] rounded-xl space-y-1">
                    <span className="text-[9px] uppercase font-bold text-gray-550 block font-mono">Observações Gerais</span>
                    <p className="leading-relaxed text-gray-400">{item.observacoes || <span className="text-gray-600 italic">Sem observações.</span>}</p>
                  </div>
                </div>

                {/* Collapsible / Expandable Resumo de Resultados section */}
                {hasResumo && (
                  <div className="border border-[#262626] rounded-xl overflow-hidden bg-[#1D121F]/15 animate-fadeIn">
                    <button
                      onClick={() => setExpandedSummaryId(isExpanded ? null : item.id)}
                      className="w-full p-3.5 bg-[#1B1B1B]/80 hover:bg-[#202020] flex items-center justify-between text-xs font-bold text-purple-300 border-b border-[#262626] transition-colors"
                    >
                      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-amber-500">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Resumo Consolidado de Resultados da Quinzena
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>

                    {isExpanded && (
                      <div className="p-4 space-y-3.5 text-xs text-gray-300 font-sans border-t border-[#262626]">
                        <div>
                          <h5 className="font-semibold text-gray-400 text-[10px] uppercase font-mono tracking-wider">Leitura simples dos resultados</h5>
                          <p className="mt-1 leading-relaxed text-slate-200">{item.resumo?.leituraResultados}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-[#1C1D1C]/25 border border-emerald-900/10 p-3 rounded-lg">
                            <span className="text-[9px] font-bold uppercase text-emerald-400 font-mono tracking-wider">🏆 Unidades em Destaque Positivo</span>
                            <p className="mt-1 font-medium text-slate-100">{item.resumo?.unidadesDestaquePositivo}</p>
                          </div>

                          <div className="bg-[#1E1C1D]/20 border border-rose-900/15 p-3 rounded-lg">
                            <span className="text-[9px] font-bold uppercase text-rose-500 font-mono tracking-wider">🚨 Unidades em Alerta</span>
                            <p className="mt-1 font-medium text-slate-100">{item.resumo?.unidadesAlerta}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-semibold text-orange-450 text-[10px] uppercase font-mono tracking-wider">Pendências Críticas (Resumidas)</h5>
                            <p className="mt-1 leading-relaxed text-slate-300">{item.resumo?.pendenciasCriticasResumo}</p>
                          </div>
                          <div>
                            <h5 className="font-semibold text-indigo-400 text-[10px] uppercase font-mono tracking-wider">Próximos Passos Operacionais</h5>
                            <p className="mt-1 leading-relaxed text-slate-300">{item.resumo?.proximosPassos}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
