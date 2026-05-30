import React, { useState, useMemo } from 'react';
import { Unit } from '../types';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  ExternalLink,
  Trash2,
  Edit2,
  Check,
  X,
  HelpCircle,
  Video,
  AlertTriangle,
  Flame
} from 'lucide-react';

interface CronogramaItem {
  id: string;
  data: string; // YYYY-MM-DD
  unitId: string; // ID da unidade ou 'all'
  tipoConteudo: string; // Reels, Stories, Feed, Carrossel, TikTok, etc.
  tema: string;
  status: 'Planejado' | 'Em produção' | 'Aguardando material da unidade' | 'Programado' | 'Publicado' | 'Reagendado' | 'Cancelado';
  observacao: string;
  dependeGravacao: boolean;
  prazoEnvio: string; // YYYY-MM-DD
  linkReferencia?: string;
}

interface CronogramaViewProps {
  units: Unit[];
  todayDate: string;
}

const DEFAULT_CRONOGRAMA: CronogramaItem[] = [
  {
    id: 'cro_1',
    data: '2026-05-28',
    unitId: 'all',
    tipoConteudo: 'Reels',
    tema: 'Mitos vs Verdades sobre Depilação a Laser no Inverno',
    status: 'Em produção',
    observacao: 'Focar na nova ponteira de resfriamento e sem dor. Usar áudio em alta do Reels.',
    dependeGravacao: true,
    prazoEnvio: '2026-05-26',
    linkReferencia: 'https://workdrive.google.com/trafegon-inverno'
  },
  {
    id: 'cro_2',
    data: '2026-05-29',
    unitId: '1',
    tipoConteudo: 'Stories',
    tema: 'Proximidade com Cliente VIP: Depoimento Axilas',
    status: 'Aguardando material da unidade',
    observacao: 'Gerente Juliana ficou de gravar com a cliente de sexta-feira passada.',
    dependeGravacao: true,
    prazoEnvio: '2026-05-27',
    linkReferencia: ''
  },
  {
    id: 'cro_3',
    data: '2026-06-01',
    unitId: '2',
    tipoConteudo: 'Feed / Postagem Principal',
    tema: 'Abertura da Campanha de Namorados: Compre 1 Leve Outro',
    status: 'Planejado',
    observacao: 'Card estático de alta conversão de vendas. Link direto para o Direct/WhatsApp.',
    dependeGravacao: false,
    prazoEnvio: '2026-05-29',
    linkReferencia: 'https://canva.com/design/namorados-espacolaser'
  },
  {
    id: 'cro_4',
    data: '2026-05-25',
    unitId: '3',
    tipoConteudo: 'TikTok',
    tema: 'Bastidores divertidos da recepção em dia de movimento',
    status: 'Publicado',
    observacao: 'A equipe de Morumbi realizou a gravação do áudio viral com humor leve.',
    dependeGravacao: true,
    prazoEnvio: '2026-05-23',
    linkReferencia: 'https://tiktok.com/@espacolaser_morumbi/video/1'
  }
];

export default function CronogramaView({ units, todayDate }: CronogramaViewProps) {
  // Load from local storage or set default
  const [items, setItems] = useState<CronogramaItem[]>(() => {
    const saved = localStorage.getItem('trafegon_cronograma_v2');
    return saved ? JSON.parse(saved) : DEFAULT_CRONOGRAMA;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [unitFilter, setUnitFilter] = useState('todas');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [recordingFilter, setRecordingFilter] = useState('todos');

  // Addition form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    data: todayDate,
    unitId: 'all',
    tipoConteudo: 'Reels',
    tema: '',
    status: 'Planejado' as CronogramaItem['status'],
    observacao: '',
    dependeGravacao: false,
    prazoEnvio: todayDate,
    linkReferencia: ''
  });

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<CronogramaItem | null>(null);

  // Persistence helper
  const saveItems = (updated: CronogramaItem[]) => {
    setItems(updated);
    localStorage.setItem('trafegon_cronograma_v2', JSON.stringify(updated));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tema.trim()) return;

    const newItem: CronogramaItem = {
      id: `cro_${Date.now()}`,
      data: formData.data,
      unitId: formData.unitId,
      tipoConteudo: formData.tipoConteudo,
      tema: formData.tema.trim(),
      status: formData.status,
      observacao: formData.observacao.trim(),
      dependeGravacao: formData.dependeGravacao,
      prazoEnvio: formData.prazoEnvio,
      linkReferencia: formData.linkReferencia.trim() || undefined
    };

    saveItems([newItem, ...items]);
    setShowAddForm(false);
    // Reset form data
    setFormData({
      data: todayDate,
      unitId: 'all',
      tipoConteudo: 'Reels',
      tema: '',
      status: 'Planejado',
      observacao: '',
      dependeGravacao: false,
      prazoEnvio: todayDate,
      linkReferencia: ''
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta postagem prevista do cronograma?')) {
      saveItems(items.filter(item => item.id !== id));
    }
  };

  const startEdit = (item: CronogramaItem) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const saveEdit = () => {
    if (!editData || !editData.tema.trim()) return;
    saveItems(items.map(item => item.id === editData.id ? editData : item));
    setEditingId(null);
    setEditData(null);
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.tema.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.observacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.tipoConteudo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'todos' || item.status === statusFilter;
      const matchesUnit = unitFilter === 'todas' || item.unitId === 'all' || item.unitId === unitFilter;
      const matchesType = typeFilter === 'todos' || item.tipoConteudo === typeFilter;
      const matchesRec = recordingFilter === 'todos' 
        ? true 
        : recordingFilter === 'sim' ? item.dependeGravacao : !item.dependeGravacao;

      return matchesSearch && matchesStatus && matchesUnit && matchesType && matchesRec;
    });
  }, [items, searchTerm, statusFilter, unitFilter, typeFilter, recordingFilter]);

  // Derived statistics
  const stats = useMemo(() => {
    const total = filteredItems.length;
    const planejado = filteredItems.filter(i => i.status === 'Planejado').length;
    const emProducao = filteredItems.filter(i => i.status === 'Em produção').length;
    const aguardando = filteredItems.filter(i => i.status === 'Aguardando material da unidade').length;
    const publicado = filteredItems.filter(i => i.status === 'Publicado').length;
    const programado = filteredItems.filter(i => i.status === 'Programado').length;
    const dependeGravacaoCount = filteredItems.filter(i => i.dependeGravacao).length;

    return { total, planejado, emProducao, aguardando, publicado, programado, dependeGravacaoCount };
  }, [filteredItems]);

  const getStatusColor = (status: CronogramaItem['status']) => {
    switch (status) {
      case 'Publicado':
        return 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40';
      case 'Programado':
        return 'bg-teal-950/40 text-teal-400 border border-teal-900/40';
      case 'Em produção':
        return 'bg-blue-950/40 text-blue-400 border border-blue-900/40';
      case 'Aguardando material da unidade':
        return 'bg-amber-950/40 text-amber-400 border border-amber-900/40';
      case 'Planejado':
        return 'bg-gray-800 text-gray-400 border border-gray-700';
      case 'Reagendado':
        return 'bg-violet-950/40 text-violet-400 border border-violet-900/40';
      case 'Cancelado':
        return 'bg-rose-950/40 text-rose-400 border border-rose-900/40';
      default:
        return 'bg-gray-800 text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#141414] p-5 rounded-2xl border border-[#212121] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest block font-bold mb-1">Planejamento de Cronograma</span>
          <h2 className="text-2xl font-display font-extrabold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-400" /> Cronograma de Postagens
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Cadastre, ordene e ative o monitoramento operacional de postagens previstas para cada unidade do Grupo ONE.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md select-none"
        >
          <Plus className="w-4 h-4" /> Cadastrar Postagem Prevista
        </button>
      </div>

      {/* Add Form Block */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-[#141414] border border-[#2B2B2B] p-5 rounded-2xl space-y-4 animate-fadeIn text-xs shadow-xl">
          <div className="flex items-center justify-between border-b border-[#212121] pb-3">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wide flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> Inserir Novo Conteúdo no Cronograma
            </h3>
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)} 
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-450 mb-1">Data da Postagem</label>
              <input
                type="date"
                required
                value={formData.data}
                onChange={e => setFormData({ ...formData, data: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-450 mb-1">Clínica / Unidade</label>
              <select
                value={formData.unitId}
                onChange={e => setFormData({ ...formData, unitId: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">Todas as Clínicas (Nacional / Grupo)</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>[{u.region}] {u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-450 mb-1">Tipo de Conteúdo</label>
              <select
                value={formData.tipoConteudo}
                onChange={e => setFormData({ ...formData, tipoConteudo: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Reels">Reels</option>
                <option value="Stories">Stories</option>
                <option value="Feed / Postagem Principal">Feed / Postagem Principal</option>
                <option value="TikTok">TikTok</option>
                <option value="Carrossel">Carrossel</option>
                <option value="Nota Instagram">Nota Instagram</option>
                <option value="Collab / Parceria">Collab / Parceria</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-450 mb-1">Status Operacional</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Planejado">Planejado</option>
                <option value="Em produção">Em produção</option>
                <option value="Aguardando material da unidade">Aguardando material da unidade</option>
                <option value="Programado">Programado</option>
                <option value="Publicado">Publicado</option>
                <option value="Reagendado">Reagendado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8">
              <label className="block text-[10px] uppercase font-bold text-gray-450 mb-1">Tema / Linha de Assunto</label>
              <input
                type="text"
                required
                value={formData.tema}
                onChange={e => setFormData({ ...formData, tema: e.target.value })}
                placeholder="Exemplo: Especial de Inverno com laser indolor..."
                className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-[10px] uppercase font-bold text-gray-450 mb-1">Prazo p/ Envio do Material</label>
              <input
                type="date"
                required
                value={formData.prazoEnvio}
                onChange={e => setFormData({ ...formData, prazoEnvio: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8">
              <label className="block text-[10px] uppercase font-bold text-gray-450 mb-1">Observações / Direcionamento Criativo</label>
              <textarea
                value={formData.observacao}
                onChange={e => setFormData({ ...formData, observacao: e.target.value })}
                placeholder="Insira detalhes de roteiro, referências ou avisos importantes..."
                rows={2}
                className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 resize-none font-sans"
              />
            </div>

            <div className="md:col-span-4 space-y-3">
              <label className="flex items-center gap-2.5 p-3.5 bg-[#181818] border border-[#242424] rounded-xl cursor-pointer select-none hover:bg-[#1C1C1C] transition-colors">
                <input
                  type="checkbox"
                  checked={formData.dependeGravacao}
                  onChange={e => setFormData({ ...formData, dependeGravacao: e.target.checked })}
                  className="rounded bg-[#111] text-indigo-650 border-[#2D2D2D] scale-110"
                />
                <div>
                  <span className="block font-bold text-white text-[11px]">Depende de gravação local</span>
                  <span className="block text-[9px] text-gray-500">Clínica precisa enviar bastidores/vídeos</span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-450 mb-1">Link de Apoio ou Referência (Se houver)</label>
            <input
              type="url"
              value={formData.linkReferencia}
              onChange={e => setFormData({ ...formData, linkReferencia: e.target.value })}
              placeholder="https://drive.google.com/..."
              className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
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
              Adicionar ao Cronograma
            </button>
          </div>
        </form>
      )}

      {/* Stats derived Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5 font-mono text-xs">
        <div className="bg-[#141414] p-3 rounded-xl border border-[#212121]">
          <span className="text-[9px] text-gray-500 uppercase font-black tracking-wider block">Previstos</span>
          <p className="text-xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-[#141414] p-3 rounded-xl border border-[#212121]">
          <span className="text-[9px] text-blue-400 uppercase font-black tracking-wider block">Produção</span>
          <p className="text-xl font-bold text-blue-400 mt-1">{stats.emProducao}</p>
        </div>
        <div className="bg-[#141414] p-3 rounded-xl border border-[#212121]">
          <span className="text-[9px] text-amber-500 uppercase font-black tracking-wider block">Aguard. Material</span>
          <p className="text-xl font-bold text-amber-500 mt-1">{stats.aguardando}</p>
        </div>
        <div className="bg-[#141414] p-3 rounded-xl border border-[#212121]">
          <span className="text-[9px] text-teal-400 uppercase font-black tracking-wider block">Programado</span>
          <p className="text-xl font-bold text-teal-400 mt-1">{stats.programado}</p>
        </div>
        <div className="bg-[#141414] p-3 rounded-xl border border-[#212121]">
          <span className="text-[9px] text-emerald-400 uppercase font-black tracking-wider block">Publicados</span>
          <p className="text-xl font-bold text-emerald-400 mt-1">{stats.publicado}</p>
        </div>
        <div className="bg-[#141414] p-3 rounded-xl border border-[#212121] col-span-2 md:col-span-1">
          <span className="text-[9px] text-indigo-400 uppercase font-black tracking-wider block">Gravação Unidade</span>
          <p className="text-xl font-bold text-indigo-400 mt-1">{stats.dependeGravacaoCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar controls */}
      <div className="bg-[#141414] p-4 rounded-2xl border border-[#212121] grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por tema ou obs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-[#1A1A1A] text-gray-350 border border-[#262626] rounded-lg p-2 focus:outline-none cursor-pointer font-bold"
          >
            <option value="todos">Todos os Status</option>
            <option value="Planejado">Planejado</option>
            <option value="Em produção">Em produção</option>
            <option value="Aguardando material da unidade">Aguardando material da unidade</option>
            <option value="Programado">Programado</option>
            <option value="Publicado">Publicado</option>
            <option value="Reagendado">Reagendado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        <div>
          <select
            value={unitFilter}
            onChange={e => setUnitFilter(e.target.value)}
            className="w-full bg-[#1A1A1A] text-gray-350 border border-[#262626] rounded-lg p-2 focus:outline-none cursor-pointer font-bold"
          >
            <option value="todas">Todas as Clínicas</option>
            <option value="all">Geral (Todas as Clínicas)</option>
            {units.map(u => (
              <option key={u.id} value={u.id}>[{u.region}] {u.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full bg-[#1A1A1A] text-gray-350 border border-[#262626] rounded-lg p-2 focus:outline-none cursor-pointer font-bold"
          >
            <option value="todos">Todos os Formatos</option>
            <option value="Reels">Reels</option>
            <option value="Stories">Stories</option>
            <option value="Feed / Postagem Principal">Feed</option>
            <option value="TikTok">TikTok</option>
            <option value="Carrossel">Carrossel</option>
            <option value="Nota Instagram">Nota Instagram</option>
            <option value="Collab / Parceria">Collab / Parceria</option>
          </select>
        </div>

        <div>
          <select
            value={recordingFilter}
            onChange={e => setRecordingFilter(e.target.value)}
            className="w-full bg-[#1A1A1A] text-gray-350 border border-[#262626] rounded-lg p-2 focus:outline-none cursor-pointer font-bold"
          >
            <option value="todos">Filtro Necessita Gravação</option>
            <option value="sim">Sim (Depende da Unidade)</option>
            <option value="nao">Não (Apenas Agência/Lançado)</option>
          </select>
        </div>
      </div>

      {/* Main List Table / Card View */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-[#141414] border border-[#212121] rounded-2xl p-12 text-center text-gray-500 font-sans">
            Nenhuma publicação prevista atende a estes critérios de busca ou filtros de cronograma.
          </div>
        ) : (
          filteredItems.map(item => {
            const isEditing = editingId === item.id;
            const targetUnit = item.unitId === 'all' 
              ? 'Todas as Clínicas (Grupo ONE)' 
              : units.find(u => u.id === item.unitId)?.name || 'Clínica Mapeada';

            if (isEditing && editData) {
              return (
                <div key={item.id} className="bg-[#181818] border border-amber-500/40 rounded-2xl p-4 space-y-3 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-[#242424] pb-2 font-bold font-mono text-amber-400 text-[10px]">
                    <span>EDITANDO CONTEÚDO CRONOGRAMA</span>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="text-emerald-400 hover:text-white flex items-center gap-1 font-bold">
                        <Check className="w-3 h-3" /> Salvar
                      </button>
                      <button onClick={cancelEdit} className="text-rose-400 hover:text-white flex items-center gap-1 font-bold">
                        <X className="w-3 h-3" /> Cancelar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold mb-1 col-span-1">DATA</label>
                      <input
                        type="date"
                        value={editData.data}
                        onChange={e => setEditData({ ...editData, data: e.target.value })}
                        className="w-full bg-[#111] border border-[#2D2D2D] p-1.5 text-xs text-white rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold mb-1">UNIDADE</label>
                      <select
                        value={editData.unitId}
                        onChange={e => setEditData({ ...editData, unitId: e.target.value })}
                        className="w-full bg-[#111] border border-[#2D2D2D] p-1.5 text-xs text-white rounded cursor-pointer"
                      >
                        <option value="all">Todas as Clínicas</option>
                        {units.map(u => (
                          <option key={u.id} value={u.id}>[{u.region}] {u.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold mb-1">FORMATO</label>
                      <input
                        type="text"
                        value={editData.tipoConteudo}
                        onChange={e => setEditData({ ...editData, tipoConteudo: e.target.value })}
                        className="w-full bg-[#111] border border-[#2D2D2D] p-1.5 text-xs text-white rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold mb-1">STATUS</label>
                      <select
                        value={editData.status}
                        onChange={e => setEditData({ ...editData, status: e.target.value as any })}
                        className="w-full bg-[#111] border border-[#2D2D2D] p-1.5 text-xs text-white rounded cursor-pointer"
                      >
                        <option value="Planejado">Planejado</option>
                        <option value="Em produção">Em produção</option>
                        <option value="Aguardando material da unidade">Aguardando material da unidade</option>
                        <option value="Programado">Programado</option>
                        <option value="Publicado">Publicado</option>
                        <option value="Reagendado">Reagendado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 font-bold mb-1">TEMA</label>
                    <input
                      type="text"
                      value={editData.tema}
                      onChange={e => setEditData({ ...editData, tema: e.target.value })}
                      className="w-full bg-[#111] border border-[#2D2D2D] p-1.5 text-xs text-white rounded"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-gray-500 font-bold mb-1">OBSERVAÇÕES</label>
                      <input
                        type="text"
                        value={editData.observacao}
                        onChange={e => setEditData({ ...editData, observacao: e.target.value })}
                        className="w-full bg-[#111] border border-[#2D2D2D] p-1.5 text-xs text-white rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold mb-1">PRAZO PARA ENVIO</label>
                      <input
                        type="date"
                        value={editData.prazoEnvio}
                        onChange={e => setEditData({ ...editData, prazoEnvio: e.target.value })}
                        className="w-full bg-[#111] border border-[#2D2D2D] p-1.5 text-xs text-white rounded"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-center pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editData.dependeGravacao}
                        onChange={e => setEditData({ ...editData, dependeGravacao: e.target.checked })}
                        className="rounded bg-[#111] text-indigo-650 border-[#2D2D2D]"
                      />
                      <span className="font-semibold text-gray-300">Depende de gravação da unidade</span>
                    </label>

                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold mb-0.5">LINK / REF</label>
                      <input
                        type="url"
                        value={editData.linkReferencia || ''}
                        onChange={e => setEditData({ ...editData, linkReferencia: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-[#111] border border-[#2D2D2D] p-1 text-xs text-white rounded"
                      />
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={item.id}
                className="bg-[#141414] border border-[#242424] hover:border-indigo-550/30 rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-4 transition-all"
              >
                {/* Meta details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-indigo-400 font-bold font-mono">
                      📅 {item.data.split('-').reverse().join('/')}
                    </span>
                    <span className="text-gray-650">•</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase bg-[#1D1D1D] text-gray-300 border border-[#262626]">
                      {item.tipoConteudo}
                    </span>
                    <span className="text-gray-650">•</span>
                    <span className="text-[10px] font-semibold text-gray-400">
                      Unidade: <strong className="text-indigo-300">{targetUnit}</strong>
                    </span>
                    {item.dependeGravacao && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-black font-mono uppercase bg-amber-955/15 text-amber-500 border border-amber-900/10 flex items-center gap-1">
                        <Video className="w-2.5 h-2.5" /> Depende de gravação
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-extrabold text-white leading-snug">
                    {item.tema}
                  </h3>

                  {item.observacao && (
                    <p className="text-xs text-gray-400 leading-relaxed font-sans mt-0.5 max-w-4xl">
                      {item.observacao}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-gray-500 pt-1 font-mono">
                    <span>Prazo Material: <strong className="text-gray-350">{item.prazoEnvio.split('-').reverse().join('/')}</strong></span>
                    {item.linkReferencia && (
                      <a 
                        href={item.linkReferencia}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-bold"
                      >
                        Material ou Referência <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Status and Action options */}
                <div className="flex flex-col md:items-end justify-between gap-1.5 shrink-0">
                  <div className="flex flex-col gap-1 items-start md:items-end">
                    <span className="text-[9px] uppercase font-bold text-gray-500 font-mono">Status do Cronograma</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-[10px] font-extrabold font-mono uppercase tracking-wider ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                      {/* Fast status switcher inline dropdown */}
                      <select
                        value={item.status}
                        onChange={e => {
                          const updated = items.map(s => s.id === item.id ? { ...s, status: e.target.value as any } : s);
                          saveItems(updated);
                        }}
                        className="bg-[#1A1A1A] border border-[#2D2D2D] rounded py-0.5 px-1.5 text-[9px] font-mono text-gray-400 cursor-pointer focus:outline-none"
                      >
                        <option value="Planejado">Planejar</option>
                        <option value="Em produção">Produzir</option>
                        <option value="Aguardando material da unidade">Aguardar</option>
                        <option value="Programado">Programar</option>
                        <option value="Publicado">Publicar</option>
                        <option value="Reagendado">Reagendar</option>
                        <option value="Cancelado">Cancelar</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center md:justify-end gap-2.5 pt-1.5 font-mono text-[10px]">
                    <button
                      onClick={() => startEdit(item)}
                      className="text-gray-450 hover:text-white flex items-center gap-0.5 cursor-pointer font-bold"
                    >
                      <Edit2 className="w-3 h-3" /> Editar
                    </button>
                    <span className="text-gray-700">|</span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-rose-500 hover:text-rose-455 flex items-center gap-0.5 cursor-pointer font-extrabold"
                    >
                      <Trash2 className="w-3 h-3" /> Excluir
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
}
