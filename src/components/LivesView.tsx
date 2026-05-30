import React, { useState, useMemo } from 'react';
import { Unit } from '../types';
import { 
  PlayCircle, 
  Radio, 
  Plus, 
  Search, 
  Check, 
  Flame, 
  ExternalLink,
  Tag, 
  AlertCircle,
  Video,
  X,
  Edit2,
  Trash2,
  HelpCircle,
  CheckSquare,
  Calendar,
  Sparkles,
  Database,
  ArrowDownToLine
} from 'lucide-react';
import { CRONOGRAMA_LIVES_OFICIAL } from '../data/cronogramaLives';

interface LiveItem {
  id: string;
  unitId: string; // Unidade ID ou 'all'
  dataPrevista: string; // YYYY-MM-DD
  status: 'Planejada' | 'Aguardando material' | 'Teste pendente' | 'Pronta' | 'Realizada' | 'Reagendada' | 'Cancelada';
  materialDisponivel: string; // link ou ref
  ofertaTema: string;
  testeTecnicoFeito: boolean;
  observacoes: string;
}

interface LivesViewProps {
  units: Unit[];
  todayDate: string;
}

const MAPPED_CRONOGRAMA_LIVES: LiveItem[] = CRONOGRAMA_LIVES_OFICIAL.map((item, index) => ({
  id: `live_cron_${index}_${item.data}`,
  unitId: item.unitId,
  dataPrevista: item.data,
  status: 'Planejada',
  materialDisponivel: '',
  ofertaTema: `Live Oficial Espaçolaser | Unidade: ${item.unidade} (${item.sigla})`,
  testeTecnicoFeito: false,
  observacoes: `Horário oficial: ${item.horario}h. Cronograma de lives 2026.`
}));

const DEFAULT_LIVES_V2: LiveItem[] = [
  ...MAPPED_CRONOGRAMA_LIVES,
  {
    id: 'live_1',
    unitId: '1',
    dataPrevista: '2026-05-28',
    status: 'Teste pendente',
    materialDisponivel: 'https://drive.google.com/drive/folders/live1_rjosul',
    ofertaTema: 'Live Especial de Axilas + Buço: Até 60% OFF com cupom RIOAXILAS',
    testeTecnicoFeito: false,
    observacoes: 'Apresentação pela gerente Juliana. Teste do transmissor de áudio marcado para quinta às 18h.'
  },
  {
    id: 'live_2',
    unitId: '2',
    dataPrevista: '2026-05-30',
    status: 'Planejada',
    materialDisponivel: 'Roteiro e PDFs de depoimentos salvos localmente',
    ofertaTema: 'Estética Masculina - Pernas Inteiras e Peito/Costas',
    testeTecnicoFeito: false,
    observacoes: 'Doutor Eduardo participará para tirar dúvidas clínicas complexas ao vivo.'
  },
  {
    id: 'live_3',
    unitId: 'all',
    dataPrevista: '2026-05-22',
    status: 'Realizada',
    materialDisponivel: 'https://instagram.com/p/live_replay_shop_one',
    ofertaTema: 'Live Shop Geral do Grupo ONE (Sorteio de 5 sessões completas)',
    testeTecnicoFeito: true,
    observacoes: 'Enorme sucesso! Mais de 125 cupons gerados no Direct com a palavra CHAVE.'
  }
];

export default function LivesView({ units, todayDate }: LivesViewProps) {
  // Local storage management
  const [lives, setLives] = useState<LiveItem[]>(() => {
    const saved = localStorage.getItem('trafegon_lives_v2');
    return saved ? JSON.parse(saved) : DEFAULT_LIVES_V2;
  });

  const [importSuccess, setImportSuccess] = useState<string>('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas');
  const [unitFilter, setUnitFilter] = useState('todas');
  const [testFilter, setTestFilter] = useState('todos');

  const handleImportOfficialLives = (overwrite: boolean) => {
    const officialMapped: LiveItem[] = CRONOGRAMA_LIVES_OFICIAL.map((item, index) => ({
      id: `live_cron_${index}_${item.data}_${Date.now()}`,
      unitId: item.unitId,
      dataPrevista: item.data,
      status: 'Planejada',
      materialDisponivel: '',
      ofertaTema: `Live Oficial Espaçolaser | Unidade: ${item.unidade} (${item.sigla})`,
      testeTecnicoFeito: false,
      observacoes: `Horário oficial: ${item.horario}h. Cronograma de lives 2026.`
    }));

    if (overwrite) {
      saveLives(officialMapped);
      setImportSuccess('Cronograma oficial com 91 lives de Junho a Dezembro de 2026 carregado com sucesso!');
    } else {
      const existingKeys = new Set(lives.map(l => `${l.unitId}_${l.dataPrevista}`));
      const uniqueNew = officialMapped.filter(l => !existingKeys.has(`${l.unitId}_${l.dataPrevista}`));
      
      saveLives([...uniqueNew, ...lives]);
      setImportSuccess(`Calendário mesclado! Adicionadas ${uniqueNew.length} lives oficiais que não existiam ainda.`);
    }

    setTimeout(() => {
      setImportSuccess('');
    }, 4500);
  };

  // Addition form states
  const [formData, setFormData] = useState({
    unitId: 'all',
    dataPrevista: todayDate,
    status: 'Planejada' as LiveItem['status'],
    materialDisponivel: '',
    ofertaTema: '',
    testeTecnicoFeito: false,
    observacoes: ''
  });

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<LiveItem | null>(null);

  // Persistence write helper
  const saveLives = (updated: LiveItem[]) => {
    setLives(updated);
    localStorage.setItem('trafegon_lives_v2', JSON.stringify(updated));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ofertaTema.trim()) return;

    const newLive: LiveItem = {
      id: `live_${Date.now()}`,
      unitId: formData.unitId,
      dataPrevista: formData.dataPrevista,
      status: formData.status,
      materialDisponivel: formData.materialDisponivel.trim(),
      ofertaTema: formData.ofertaTema.trim(),
      testeTecnicoFeito: formData.testeTecnicoFeito,
      observacoes: formData.observacoes.trim()
    };

    saveLives([newLive, ...lives]);
    setShowAddForm(false);
    // Reset Form
    setFormData({
      unitId: 'all',
      dataPrevista: todayDate,
      status: 'Planejada',
      materialDisponivel: '',
      ofertaTema: '',
      testeTecnicoFeito: false,
      observacoes: ''
    });
  };

  const startEdit = (live: LiveItem) => {
    setEditingId(live.id);
    setEditFormData({ ...live });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  const saveEdit = () => {
    if (!editFormData || !editFormData.ofertaTema.trim()) return;
    saveLives(lives.map(p => p.id === editFormData.id ? editFormData : p));
    setEditingId(null);
    setEditFormData(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir esta programação de live?')) {
      saveLives(lives.filter(p => p.id !== id));
    }
  };

  // Filter computation
  const filteredLives = useMemo(() => {
    return lives.filter(l => {
      const matchesSearch = l.ofertaTema.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            l.observacoes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            l.materialDisponivel.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'todas' || l.status === statusFilter;
      const matchesUnit = unitFilter === 'todas' || l.unitId === 'all' || l.unitId === unitFilter;
      const matchesTest = testFilter === 'todos' 
        ? true 
        : testFilter === 'feito' ? l.testeTecnicoFeito : !l.testeTecnicoFeito;

      return matchesSearch && matchesStatus && matchesUnit && matchesTest;
    });
  }, [lives, searchTerm, statusFilter, unitFilter, testFilter]);

  // Derived metrics
  const stats = useMemo(() => {
    const total = filteredLives.length;
    const realizada = filteredLives.filter(l => l.status === 'Realizada').length;
    const pronta = filteredItemsCount(filteredLives, 'Pronta');
    const pendenteM = filteredItemsCount(filteredLives, 'Aguardando material');
    const testePend = filteredLives.filter(l => l.status === 'Teste pendente' || !l.testeTecnicoFeito).length;

    return { total, realizada, pronta, pendenteM, testePend };

    function filteredItemsCount(arr: LiveItem[], s: string) {
      return arr.filter(l => l.status === s).length;
    }
  }, [filteredLives]);

  const getStatusColor = (status: LiveItem['status']) => {
    switch (status) {
      case 'Realizada':
        return 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40';
      case 'Pronta':
        return 'bg-teal-950/40 text-teal-400 border border-teal-900/40';
      case 'Aguardando material':
        return 'bg-amber-955/20 text-amber-500 border border-amber-900/30';
      case 'Teste pendente':
        return 'bg-orange-950/40 text-orange-400 border border-orange-900/40 font-bold';
      case 'Planejada':
        return 'bg-gray-800 text-gray-400 border border-gray-700';
      case 'Reagendada':
        return 'bg-violet-950/40 text-violet-400 border border-violet-900/40';
      case 'Cancelada':
        return 'bg-rose-955/25 text-rose-500 border border-rose-900/20';
      default:
        return 'bg-gray-800 text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-[#141414] p-5 rounded-2xl border border-[#212121] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest block font-bold mb-1">Transmissões ao Vivo</span>
          <h2 className="text-2xl font-display font-extrabold text-white flex items-center gap-2">
            <Radio className="w-6 h-6 text-pink-400 animate-pulse" /> Monitor de Lives Gravadas
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Planeje, acompanhe e audite transmissões ao vivo de ofertas promocionais específicas para as clínicas locais.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md select-none"
        >
          <Plus className="w-4 h-4" /> Agendar Nova Live
        </button>
      </div>

      {/* Import Notification Banner */}
      {importSuccess && (
        <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-xl text-xs font-bold text-center animate-fadeIn flex items-center justify-center gap-2">
          <CheckSquare className="w-4 h-4 text-emerald-450 shrink-0 animate-pulse" />
          <span>{importSuccess}</span>
        </div>
      )}

      {/* Official Lives Schedule Synchronizer Banner */}
      <div className="bg-[#141414] border border-[#212121] rounded-2xl p-5 relative overflow-hidden shadow-xl text-left">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-650/5 blur-3xl pointer-events-none rounded-full" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-950/40 text-indigo-400 border border-indigo-900/40 rounded text-[9px] font-black uppercase tracking-wider font-mono">
                📅 Parâmetro de CRM
              </span>
              <span className="text-[10px] text-gray-500 font-mono font-bold">Ano: 2026 | Horário Padrão: 15h | Duração: 30-60 min</span>
            </div>
            <h3 className="text-sm font-extrabold text-white">Cronograma Geral de Lives Sazonais Oficial (Junho - Dezembro)</h3>
            <p className="text-xs text-gray-400 max-w-3xl leading-relaxed">
              O cronograma distribui estrategicamente <strong>91 transmissões</strong> de segunda a sexta-feira durante o mês inteiro para cada unidade local de forma harmônica, desconsiderando feriados nacionais ou municipais pontuais.
            </p>
            
            {/* Criteria mini-tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-850 text-[10px]">🎯 1 live por dia</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-850 text-[10px]">📍 1 unidade por dia</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-850 text-[10px]">⏳ Escopo: Seg a Sex</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-850 text-[10px]">🛡️ Feriados Nacionais Isentos</span>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col gap-2 w-full lg:w-auto shrink-0 select-none">
            <button
              onClick={() => {
                if (confirm('Atenção: Isso irá ADICIONAR as 91 lives do Calendário Oficial sem apagar as transmissões que você já personalizou. Prosseguir?')) {
                  handleImportOfficialLives(false);
                }
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-gray-250 border border-zinc-800 rounded-lg text-xs font-bold font-sans transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-zinc-400" />
              Mesclar no Calendário
            </button>
            
            <button
              type="button"
              onClick={() => {
                if (confirm('ATENÇÃO: Você tem certeza de que deseja SUBSTITUIR todas as lives salvas atualmente pelo Cronograma Oficial com 91 datas? Essa ação apagará as customizações atuais de status ou material.')) {
                  handleImportOfficialLives(true);
                }
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-950/40 hover:bg-indigo-900/30 text-indigo-300 border border-indigo-900/40 rounded-lg text-xs font-black font-sans transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-indigo-400" />
              Resetar para Oficial
            </button>
          </div>
        </div>
      </div>

      {/* Add New Live Form */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-[#141414] border border-[#2B2B2B] p-5 rounded-2xl space-y-4 animate-fadeIn text-xs shadow-xl">
          <div className="flex items-center justify-between border-b border-[#212121] pb-3">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wide flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> Cadastrar Novo Registro de Transmissão Live
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
              <label className="block text-[10px] uppercase font-bold text-gray-450 mb-1">Unidade Participante</label>
              <select
                value={formData.unitId}
                onChange={e => setFormData({ ...formData, unitId: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">Todas as Clínicas (Live Conjunta)</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>[{u.region}] {u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-450 mb-1">Data Prevista da Live</label>
              <input
                type="date"
                required
                value={formData.dataPrevista}
                onChange={e => setFormData({ ...formData, dataPrevista: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-450 mb-1">Status Pré-Transmissão</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Planejada">Planejada</option>
                <option value="Aguardando material">Aguardando material</option>
                <option value="Teste pendente">Teste pendente</option>
                <option value="Pronta">Pronta</option>
                <option value="Realizada">Realizada</option>
                <option value="Reagendada">Reagendada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-450 mb-1">Teste Técnico Resolvido?</label>
              <select
                value={formData.testeTecnicoFeito ? 'sim' : 'nao'}
                onChange={e => setFormData({ ...formData, testeTecnicoFeito: e.target.value === 'sim' })}
                className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-bold"
              >
                <option value="nao">Pendente (Não Realizado)</option>
                <option value="sim">Sim (Concluído & Aprovado)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-450 mb-1">Oferta Especial ou Tema de Vendas</label>
            <input
              type="text"
              required
              value={formData.ofertaTema}
              onChange={e => setFormData({ ...formData, ofertaTema: e.target.value })}
              placeholder="Ex: Noite de Preços Exclusivos para Morumbi - Cupom MORUMBIVIP 50%"
              className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-450 mb-1">Material Disponível (Link de Scripts / Canva / Drive)</label>
              <input
                type="text"
                value={formData.materialDisponivel}
                onChange={e => setFormData({ ...formData, materialDisponivel: e.target.value })}
                placeholder="Insira link ou referência textual..."
                className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-450 mb-1">Observações Internas (Apresentador / Pauta)</label>
              <input
                type="text"
                value={formData.observacoes}
                onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Exemplo: Juliana e fisioterapeuta de plantão. Sorteio no final."
                className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
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
              Agendar Transmissão
            </button>
          </div>
        </form>
      )}

      {/* Stats derived Bento Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 font-mono text-xs">
        <div className="bg-[#141414] p-3.5 rounded-xl border border-[#212121] text-gray-350">
          <span className="text-[9px] text-gray-500 uppercase font-black tracking-wider block">Registros de Live</span>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-[#141414] p-3.5 rounded-xl border border-[#212121]">
          <span className="text-[9px] text-emerald-400 uppercase font-black tracking-wider block">Realizadas</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.realizada}</p>
        </div>
        <div className="bg-[#141414] p-3.5 rounded-xl border border-[#212121]">
          <span className="text-[9px] text-teal-400 uppercase font-black tracking-wider block">Prontas p/ Ar</span>
          <p className="text-2xl font-extrabold text-teal-400 mt-1">{stats.pronta}</p>
        </div>
        <div className="bg-[#141414] p-3.5 rounded-xl border border-[#212121]">
          <span className="text-[9px] text-amber-500 uppercase font-black tracking-wider block">Aguard. Material</span>
          <p className="text-2xl font-extrabold text-amber-500 mt-1">{stats.pendenteM}</p>
        </div>
        <div className="bg-[#141414] p-3.5 rounded-xl border border-[#212121] col-span-2 md:col-span-1">
          <span className="text-[9px] text-rose-500 uppercase font-black tracking-wider block">Atenção Técnica</span>
          <p className="text-2xl font-extrabold text-rose-500 mt-1">{stats.testePend} pendentes</p>
        </div>
      </div>

      {/* Filter Options Section */}
      <div className="bg-[#141414] p-4 rounded-2xl border border-[#212121] grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar tema, cupom, obs..."
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
            <option value="todas">Todos os Status</option>
            <option value="Planejada">Planejada</option>
            <option value="Aguardando material">Aguardando material</option>
            <option value="Teste pendente">Teste pendente</option>
            <option value="Pronta">Pronta</option>
            <option value="Realizada">Realizada</option>
            <option value="Reagendada">Reagendada</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>

        <div>
          <select
            value={unitFilter}
            onChange={e => setUnitFilter(e.target.value)}
            className="w-full bg-[#1A1A1A] text-gray-350 border border-[#262626] rounded-lg p-2 focus:outline-none cursor-pointer font-bold"
          >
            <option value="todas">Todas as Unidades</option>
            <option value="all">Live Conjunta (Geral)</option>
            {units.map(u => (
              <option key={u.id} value={u.id}>[{u.region}] {u.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={testFilter}
            onChange={e => setTestFilter(e.target.value)}
            className="w-full bg-[#1A1A1A] text-gray-350 border border-[#262626] rounded-lg p-2 focus:outline-none cursor-pointer font-bold"
          >
            <option value="todos">Status Canal Técnico</option>
            <option value="feito">Sim (Teste Concluído)</option>
            <option value="pendente">Não (Teste Pendente/Atenção)</option>
          </select>
        </div>
      </div>

      {/* Main Lives Display */}
      <div className="space-y-4">
        {filteredLives.length === 0 ? (
          <div className="bg-[#141414] border border-[#212121] rounded-2xl p-12 text-center text-gray-500 font-sans">
            Nenhuma live cadastrada atende a estes critérios de filtro ou busca de transmissões.
          </div>
        ) : (
          filteredLives.map(live => {
            const isEditing = editingId === live.id;
            const targetUnit = live.unitId === 'all' 
              ? 'Todas as Clínicas (Live Coletiva)' 
              : units.find(u => u.id === live.unitId)?.name || 'Franquia Local';

            if (isEditing && editFormData) {
              return (
                <div key={live.id} className="bg-[#181818] border border-amber-500/40 rounded-2xl p-4 space-y-3 text-xs animate-fadeIn text-gray-300">
                  <div className="flex items-center justify-between border-b border-[#242424] pb-2 font-bold font-mono text-amber-400 text-[10px]">
                    <span>EDITAR INFORMAÇÕES DA LIVE</span>
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
                      <label className="block text-[10px] text-gray-500 font-bold mb-1">DATA PREVISTA</label>
                      <input
                        type="date"
                        value={editFormData.dataPrevista}
                        onChange={e => setEditFormData({ ...editFormData, dataPrevista: e.target.value })}
                        className="w-full bg-[#111] border border-[#2D2D2D] p-1.5 text-xs text-white rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold mb-1">CLÍNICA</label>
                      <select
                        value={editFormData.unitId}
                        onChange={e => setEditFormData({ ...editFormData, unitId: e.target.value })}
                        className="w-full bg-[#111] border border-[#2D2D2D] p-1.5 text-xs text-white rounded cursor-pointer"
                      >
                        <option value="all">Todas as Clínicas</option>
                        {units.map(u => (
                          <option key={u.id} value={u.id}>[{u.region}] {u.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold mb-1">STATUS</label>
                      <select
                        value={editFormData.status}
                        onChange={e => setEditFormData({ ...editFormData, status: e.target.value as any })}
                        className="w-full bg-[#111] border border-[#2D2D2D] p-1.5 text-xs text-white rounded cursor-pointer font-bold"
                      >
                        <option value="Planejada">Planejada</option>
                        <option value="Aguardando material">Aguardando material</option>
                        <option value="Teste pendente">Teste pendente</option>
                        <option value="Pronta">Pronta</option>
                        <option value="Realizada">Realizada</option>
                        <option value="Reagendada font-sans">Reagendada</option>
                        <option value="Cancelada">Cancelada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold mb-1 col-span-1">TESTE TÉCNICO?</label>
                      <select
                        value={editFormData.testeTecnicoFeito ? 'sim' : 'nao'}
                        onChange={e => setEditFormData({ ...editFormData, testeTecnicoFeito: e.target.value === 'sim' })}
                        className="w-full bg-[#111] border border-[#2D2D2D] p-1.5 text-xs text-white rounded cursor-pointer font-bold"
                      >
                        <option value="nao">Não (Pendente)</option>
                        <option value="sim">Sim (Concluído)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 font-bold mb-1">OFERTA OU TEMA DE TRANSMISSÃO</label>
                    <input
                      type="text"
                      value={editFormData.ofertaTema}
                      onChange={e => setEditFormData({ ...editFormData, ofertaTema: e.target.value })}
                      className="w-full bg-[#111] border border-[#2D2D2D] p-1.5 text-xs text-white rounded"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold mb-1">MATERIAL DISPONÍVEL</label>
                      <input
                        type="text"
                        value={editFormData.materialDisponivel}
                        onChange={e => setEditFormData({ ...editFormData, materialDisponivel: e.target.value })}
                        className="w-full bg-[#111] border border-[#2D2D2D] p-1.5 text-xs text-white rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold mb-1 col-span-1">OBSERVAÇÕES / PAUTA</label>
                      <input
                        type="text"
                        value={editFormData.observacoes}
                        onChange={e => setEditFormData({ ...editFormData, observacoes: e.target.value })}
                        className="w-full bg-[#111] border border-[#2D2D2D] p-1.5 text-xs text-white rounded"
                      />
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={live.id}
                className="bg-[#141414] border border-[#242424] hover:border-indigo-500/30 rounded-2xl p-4.5 flex flex-col md:flex-row justify-between gap-4 transition-all"
              >
                {/* Details list info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-pink-400 font-bold font-mono">
                      📅 Live em: {live.dataPrevista.split('-').reverse().join('/')}
                    </span>
                    <span className="text-gray-650">•</span>
                    <span className="text-[10px] font-semibold text-gray-300">
                      Unidade de Apadrinhamento: <strong className="text-indigo-300">{targetUnit}</strong>
                    </span>
                    <span className="text-gray-650">•</span>
                    
                    {/* Test indicator pill */}
                    <button
                      onClick={() => {
                        const updated = lives.map(l => l.id === live.id ? { ...l, testeTecnicoFeito: !l.testeTecnicoFeito } : l);
                        saveLives(updated);
                      }}
                      title="Clique para alternar o status do teste técnico rápido"
                      className={`px-2 py-0.5 rounded text-[9px] font-black font-mono uppercase transition-all flex items-center gap-1 ${
                        live.testeTecnicoFeito 
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' 
                          : 'bg-rose-955/20 text-rose-500 border border-rose-900/10'
                      }`}
                    >
                      {live.testeTecnicoFeito ? '🥇 Teste Técnico Concluído' : '⚠️ Teste Pendente'}
                    </button>
                  </div>

                  <h3 className="text-sm font-extrabold text-white leading-snug">
                    {live.ofertaTema}
                  </h3>

                  {live.observacoes && (
                    <p className="text-xs text-gray-400 max-w-4xl font-sans mt-0.5">
                      <strong>Observações:</strong> {live.observacoes}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-x-5 gap-y-1.5 text-[10px] font-mono text-gray-500 pt-1">
                    <div className="flex items-center gap-1 text-xs">
                      <span>Material:</span>
                      {live.materialDisponivel.startsWith('http') ? (
                        <a 
                          href={live.materialDisponivel}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-bold"
                        >
                          Ver Material Externo <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-300 font-sans font-medium">{live.materialDisponivel || 'Nenhum material amarrado'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Switcher & delete row operational details */}
                <div className="flex flex-col md:items-end justify-between gap-2 shrink-0">
                  <div className="flex flex-col gap-1 items-start md:items-end">
                    <span className="text-[9px] uppercase font-bold text-gray-500 font-mono">Status da Transmissão</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-[10px] font-extrabold font-mono uppercase tracking-wider ${getStatusColor(live.status)}`}>
                        {live.status}
                      </span>
                      {/* Dropdown fast switch */}
                      <select
                        value={live.status}
                        onChange={e => {
                          const updated = lives.map(l => l.id === live.id ? { ...l, status: e.target.value as any } : l);
                          saveLives(updated);
                        }}
                        className="bg-[#1A1A1A] border border-[#2D2D2D] rounded py-0.5 px-1 text-[9px] font-mono text-gray-400 cursor-pointer focus:outline-none"
                      >
                        <option value="Planejada">Planejar</option>
                        <option value="Aguardando material">Aguardar Material</option>
                        <option value="Teste pendente">Disparar Teste</option>
                        <option value="Pronta">Marcar Pronta</option>
                        <option value="Realizada">Concluir</option>
                        <option value="Reagendada">Reagendar</option>
                        <option value="Cancelada">Cancelar</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center md:justify-end gap-2 text-[10px] font-mono">
                    <button
                      onClick={() => startEdit(live)}
                      className="text-gray-450 hover:text-white flex items-center gap-0.5 cursor-pointer font-bold"
                    >
                      <Edit2 className="w-3 h-3" /> Editar
                    </button>
                    <span className="text-gray-700">|</span>
                    <button
                      onClick={() => handleDelete(live.id)}
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
