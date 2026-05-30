import React, { useState, useMemo } from 'react';
import { Unit, StandardTask, TaskExecution, TaskStatus, ResponsibleParty, Pendencia, QuickSuggestion } from '../types';
import { 
  Check, 
  Clipboard, 
  AlertTriangle, 
  Calendar,
  ChevronRight, 
  Plus, 
  RefreshCw, 
  Star, 
  Edit2, 
  Sparkles, 
  Filter, 
  Search, 
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  Send,
  UserPlus,
  HelpCircle,
  X,
  Smartphone,
  Tablet,
  Laptop
} from 'lucide-react';
import { formatShortDate, calculateCompletionRate, generateWhatsAppReport } from '../utils';

interface HojeViewProps {
  units: Unit[];
  tasks: StandardTask[];
  executions: TaskExecution[];
  toggleTaskStatus: (unitId: string, taskId: string, date: string, currentStatus: any) => void;
  updateTaskNotes: (unitId: string, taskId: string, date: string, notes: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  todayDate: string;
  pendencias: Pendencia[];
  onAddPendencia: (unitId: string) => void;
  onSwitchToChecklist: (unitId: string) => void;
  onAddPendenciaObj?: (newPend: Omit<Pendencia, 'id' | 'dateAdded'>) => void;
  onTogglePendencia?: (id: string) => void;
  suggestions: QuickSuggestion[];
  onUpdateSuggestions: (updated: QuickSuggestion[]) => void;
  onResetDateTasks?: (dateStr: string) => void;
  onAddUnit?: (
    name: string, 
    region: string, 
    contactName: string,
    sigla?: string,
    cidadeUf?: string,
    gerente?: string,
    socia?: string,
    instagramUrl?: string,
    tiktokUrl?: string,
    notes?: string
  ) => void;
  globalConfig?: any;
}

export default function HojeView({
  units,
  tasks,
  executions,
  toggleTaskStatus,
  updateTaskNotes,
  selectedDate,
  setSelectedDate,
  todayDate,
  pendencias,
  onAddPendencia,
  onSwitchToChecklist,
  onAddPendenciaObj,
  onTogglePendencia,
  suggestions,
  onUpdateSuggestions,
  onResetDateTasks,
  onAddUnit,
  globalConfig
}: HojeViewProps) {
  // Navigation & searches
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'pendente' | 'atrasado' | 'concluido'>('todas');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('todas');

  // Modal controls
  const [isPendencyModalOpen, setIsPendencyModalOpen] = useState(false);
  const [pendencyTargetUnit, setPendencyTargetUnit] = useState<Unit | null>(null);
  const [pendencyTargetTaskTitle, setPendencyTargetTaskTitle] = useState('');
  const [pendencyDescription, setPendencyDescription] = useState('');
  const [pendencyUrgency, setPendencyUrgency] = useState<'baixa' | 'media' | 'alta'>('media');
  const [pendencyResponsible, setPendencyResponsible] = useState<ResponsibleParty>('gerente');
  const [pendencyNotes, setPendencyNotes] = useState('');

  // WhatsApp Multi-Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'resumo_dia' | 'pendencias_unidade' | 'resumo_reuniao' | 'unidades_alerta' | 'tarefas_balanco'>('resumo_dia');
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  // Unit Quick Insertion State
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitSigla, setNewUnitSigla] = useState('');
  const [newUnitRegion, setNewUnitRegion] = useState('PE');
  const [newUnitCity, setNewUnitCity] = useState('');
  const [newUnitGerente, setNewUnitGerente] = useState('');
  const [newUnitSocia, setNewUnitSocia] = useState('');

  // Suggestions states for Note instagram
  const [unitSelectedNoteId, setUnitSelectedNoteId] = useState<Record<string, string>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  const activeUnits = useMemo(() => units.filter(u => u.active), [units]);

  // Evaluates if a task's suggested hour has passed today (delay check)
  const isTaskDelayed = (suggestedTime?: string, status?: string, dateStr?: string) => {
    if (status === 'executado' || status === 'nao_se_aplica' || status === 'atrasado') {
      return status === 'atrasado';
    }
    const dateObj = new Date(dateStr + 'T00:00:00');
    const todayObj = new Date(todayDate + 'T00:00:00');
    if (dateObj < todayObj) return true;
    if (dateObj > todayObj) return false;

    if (suggestedTime) {
      const [sHour, sMin] = suggestedTime.split(':').map(Number);
      const now = new Date();
      if (now.getHours() > sHour || (now.getHours() === sHour && now.getMinutes() >= sMin)) {
        return true;
      }
    }
    return false;
  };

  // Build the checklist items for a given unit
  const getTasksForUnit = useMemo(() => {
    return (unitId: string, dateStr: string) => {
      const targetDate = new Date(dateStr + 'T00:00:00');
      const dayOfWeek = targetDate.getDay();
      const postagemDays = globalConfig?.postagemPrincipalDays || [1, 3, 5];
      const isPostagemDay = postagemDays.includes(dayOfWeek);

      const dailyTasks = tasks.filter(t => t.frequency === 'diario');
      const activeDailyTasks = dailyTasks.filter(task => {
        if (task.id === 'postagem-principal') {
          return isPostagemDay;
        }
        return true;
      });

      const checklistItems = activeDailyTasks.map(task => ({
        id: task.id,
        title: task.title,
        suggestedTime: task.suggestedTime || (
          task.id === 'story-1' ? '09:00' :
          task.id === 'story-2' ? '14:00' :
          task.id === 'story-3' ? '18:00' :
          task.id === 'nota-instagram' ? '11:00' :
          task.id === 'story-real' ? '12:00' :
          task.id === 'bastidor' ? '16:00' : '12:00'
        ),
        description: task.description
      }));

      // Add linked active pendencies for clinical awareness
      const unitOpenPendencias = pendencias.filter(p => p.unitId === unitId && (p.status === 'pendente' || p.status === 'em_andamento' || p.status === 'aberta'));
      const pendencyTasks = unitOpenPendencias.map(p => {
        const priorityVal = p.priority || p.urgency || 'media';
        return {
          id: `pendencia-${p.id}`,
          title: `Pendência: ${p.description}`,
          isPendency: true,
          pendencyId: p.id,
          urgency: priorityVal,
          description: `Resp: ${p.responsible} | Prazo: ${p.prazo ? formatShortDate(p.prazo) : 'Imediato'}`
        } as any;
      });

      return [...checklistItems, ...pendencyTasks];
    };
  }, [tasks, pendencias]);

  // Compute Task Status helpers
  const getTaskStatus = (unitId: string, taskId: string, dateStr: string, suggestedTime?: string) => {
    if (taskId.startsWith('pendencia-')) return 'atrasado'; // active pendencies represent delay

    const exec = executions.find(e => e.unitId === unitId && e.taskId === taskId && e.date === dateStr);
    if (exec) return exec.status;

    return isTaskDelayed(suggestedTime, 'pendente', dateStr) ? 'atrasado' : 'pendente';
  };

  const resolveUnitNote = (unitId: string) => {
    const chosenId = unitSelectedNoteId[unitId];
    let found = suggestions.find(s => s.id === chosenId);
    if (!found) {
      const candidates = suggestions.filter(s => s.type === 'nota');
      if (candidates.length > 0) {
        const numId = unitId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        found = candidates[numId % candidates.length];
      }
    }
    return found;
  };

  const handleDrawAnotherNote = (unitId: string, currentCategory: string) => {
    let pool = suggestions.filter(s => s.type === 'nota');
    if (currentCategory && currentCategory !== 'all') {
      pool = pool.filter(s => s.category === currentCategory);
    }
    if (pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      setUnitSelectedNoteId(prev => ({ ...prev, [unitId]: pool[idx].id }));
    }
  };

  const handleToggleFavoriteNote = (id: string) => {
    const updated = suggestions.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s);
    onUpdateSuggestions(updated);
  };

  // Stats summaries
  const stats = useMemo(() => {
    let total = 0;
    let completed = 0;
    let pending = 0;
    let delayed = 0;
    let unitsWithAlert = 0;

    activeUnits.forEach(unit => {
      const unitTasks = getTasksForUnit(unit.id, selectedDate);
      let unitHasDelayed = false;

      const hasHighUrgencyPendency = pendencias.some(p => {
        const isPending = p.status === 'pendente' || p.status === 'em_andamento' || p.status === 'aberta';
        const isPriorityHigh = p.priority === 'critica' || p.priority === 'alta';
        const isOverdue = p.prazo ? (p.prazo < selectedDate) : false;
        return p.unitId === unit.id && isPending && (isPriorityHigh || isOverdue);
      });

      unitTasks.forEach(task => {
        const status = getTaskStatus(unit.id, task.id, selectedDate, task.suggestedTime);
        total++;
        if (status === 'executado') completed++;
        else if (status === 'atrasado') {
          delayed++;
          unitHasDelayed = true;
        } else if (status !== 'nao_se_aplica') pending++;
      });

      if (unitHasDelayed || hasHighUrgencyPendency) {
        unitsWithAlert++;
      }
    });

    return { total, completed, pending, delayed, unitsWithAlert };
  }, [activeUnits, selectedDate, executions, pendencias, getTasksForUnit]);

  // Fast cycle status
  const handleToggleStatus = (unitId: string, taskId: string, currentStatus: string) => {
    if (taskId.startsWith('pendencia-')) {
      const pendId = taskId.replace('pendencia-', '');
      if (onTogglePendencia) onTogglePendencia(pendId);
      return;
    }
    const nextStatus: TaskStatus = currentStatus === 'executado' ? 'pendente' : 'executado';
    toggleTaskStatus(unitId, taskId, selectedDate, nextStatus);
  };

  const handleMarkNA = (unitId: string, taskId: string, currentStatus: string) => {
    if (taskId.startsWith('pendencia-')) return;
    const nextStatus: TaskStatus = currentStatus === 'nao_se_aplica' ? 'pendente' : 'nao_se_aplica';
    toggleTaskStatus(unitId, taskId, selectedDate, nextStatus);
  };

  const handleMarkDelayed = (unitId: string, taskId: string, currentStatus: string) => {
    if (taskId.startsWith('pendencia-')) return;
    const nextStatus: TaskStatus = currentStatus === 'atrasado' ? 'pendente' : 'atrasado';
    toggleTaskStatus(unitId, taskId, selectedDate, nextStatus);
  };

  const triggerAddPendencyModal = (unit: Unit, taskTitle: string) => {
    setPendencyTargetUnit(unit);
    setPendencyTargetTaskTitle(taskTitle);
    setPendencyDescription(`Falha no Checklist: [${unit.sigla}] - ${taskTitle} pendente`);
    setPendencyUrgency('media');
    setPendencyResponsible('gerente');
    setPendencyNotes('');
    setIsPendencyModalOpen(true);
  };

  const handleCreatePendency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendencyTargetUnit || !onAddPendenciaObj) return;

    onAddPendenciaObj({
      unitId: pendencyTargetUnit.id,
      description: pendencyDescription,
      responsible: pendencyResponsible,
      priority: pendencyUrgency,
      urgency: pendencyUrgency,
      status: 'pendente',
      notes: pendencyNotes,
      origin: 'cronograma',
      prazo: ''
    });

    setIsPendencyModalOpen(false);
    setPendencyTargetUnit(null);
  };

  const handleAddUnitFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName || !newUnitSigla || !onAddUnit) return;
    
    onAddUnit(
      newUnitName,
      newUnitRegion,
      newUnitGerente,
      newUnitSigla.toUpperCase(),
      newUnitCity,
      newUnitGerente,
      newUnitSocia,
      'https://www.instagram.com/espacolaser',
      'https://www.tiktok.com/@espacolaser',
      'Inserção rápida via dashboard de pendência'
    );

    setNewUnitName('');
    setNewUnitSigla('');
    setNewUnitCity('');
    setNewUnitGerente('');
    setNewUnitSocia('');
    setIsAddUnitModalOpen(false);
  };

  const displayedWhatsAppText = useMemo(() => {
    return generateWhatsAppReport(exportType, selectedDate, units, tasks, executions, pendencias);
  }, [exportType, selectedDate, units, tasks, executions, pendencias]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(displayedWhatsAppText);
    setCopiedFeedback(true);
    setTimeout(() => {
      setCopiedFeedback(false);
    }, 2000);
  };

  // Selected date Day of Week check for Header Table Context
  const targetDayOfWeek = useMemo(() => {
    const parts = selectedDate.split('-');
    if (parts.length < 3) return 0;
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.getDay();
  }, [selectedDate]);
  
  const isPostagemFieldDay = targetDayOfWeek === 1 || targetDayOfWeek === 3 || targetDayOfWeek === 5;

  const displayUnits = useMemo(() => {
    return activeUnits.filter(unit => {
      if (selectedUnitId !== 'todas' && unit.id !== selectedUnitId) return false;

      const query = searchTerm.toLowerCase();
      const matchesSearch = 
        unit.name.toLowerCase().includes(query) || 
        unit.sigla.toLowerCase().includes(query) || 
        unit.cidadeUf.toLowerCase().includes(query) ||
        (unit.gerente && unit.gerente.toLowerCase().includes(query)) ||
        (unit.socia && unit.socia.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      const unitTasks = getTasksForUnit(unit.id, selectedDate);
      const taskStatuses = unitTasks.map(t => getTaskStatus(unit.id, t.id, selectedDate, t.suggestedTime));

      if (statusFilter === 'pendente') return taskStatuses.includes('pendente');
      if (statusFilter === 'atrasado') {
        const hasHighUrgencyPendency = pendencias.some(p => {
          const isPending = p.status === 'pendente' || p.status === 'em_andamento' || p.status === 'aberta';
          const isPriorityHigh = p.priority === 'critica' || p.priority === 'alta';
          const isOverdue = p.prazo ? (p.prazo < selectedDate) : false;
          return p.unitId === unit.id && isPending && (isPriorityHigh || isOverdue);
        });
        return taskStatuses.includes('atrasado') || hasHighUrgencyPendency;
      }
      if (statusFilter === 'concluido') {
        return taskStatuses.length > 0 && taskStatuses.every(st => st === 'executado' || st === 'nao_se_aplica');
      }

      return true;
    });
  }, [activeUnits, selectedUnitId, searchTerm, statusFilter, selectedDate, getTasksForUnit, pendencias, executions]);

  // Color mapper for standard statuses following colors guideline (Green, Yellow, Red, Gray)
  const getStatusVisualClasses = (status: TaskStatus) => {
    switch (status) {
      case 'executado':
        return 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30';
      case 'atrasado':
        return 'bg-rose-955/25 text-rose-400 border-rose-900/30 font-black animate-pulse-slow';
      case 'nao_se_aplica':
        return 'bg-zinc-900 text-zinc-400 border-zinc-800';
      default: // 'pendente'
        return 'bg-amber-955/15 text-amber-400 border-amber-900/30';
    }
  };

  const getStatusTextLabel = (status: TaskStatus) => {
    switch (status) {
      case 'executado':
        return 'Conclúido / Em dia';
      case 'atrasado':
        return 'Crítico / Atrasado';
      case 'nao_se_aplica':
        return 'Não se aplica';
      default:
        return 'Pendente';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#141414] p-5 rounded-2xl border border-[#232323] shadow-lg">
        <div>
          <span className="text-[10px] uppercase font-mono font-black text-indigo-400 tracking-wider block mb-1">
            Painel Central de Monitoramento TráfegON
          </span>
          <h2 className="text-2xl font-display font-extrabold text-white flex flex-wrap items-center gap-2">
            Rotina Operacional das Clínicas
            <span className="text-xs font-mono font-bold text-gray-400 bg-[#1D1D1D] px-2.5 py-1 rounded border border-[#2C2C2C]">
              {formatShortDate(selectedDate)}
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Clique nos statuses da tabela desktop para atualizar instantaneamente as tarefas. Use filtros acima.
          </p>
        </div>

        {/* TOP MAIN ROUTINE BUTTONS (Requirements prioritized) */}
        <div className="flex flex-wrap items-center gap-2">
          {onAddUnit && (
            <button
              onClick={() => setIsAddUnitModalOpen(true)}
              className="px-3.5 py-2 bg-[#1C1C1D] text-white hover:bg-[#2A2A2B] text-xs font-bold rounded-xl border border-[#2D2D2E] flex items-center gap-1.5 transition-all cursor-pointer shadow"
              title="Cadastrar nova unidade no sistema"
            >
              <UserPlus className="w-4 h-4 text-sky-400" />
              <span>Adicionar Unidade</span>
            </button>
          )}

          {onResetDateTasks && (
            <button
              onClick={() => onResetDateTasks(selectedDate)}
              className="px-3.5 py-2 bg-rose-955/20 text-rose-450 hover:bg-rose-955/35 text-xs font-bold rounded-xl border border-rose-900/40 flex items-center gap-1.5 transition-all cursor-pointer shadow"
              title="Retornar todas as tarefas deste dia ao estado pendente"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Resetar Dia</span>
            </button>
          )}

          <button
            onClick={() => {
              setCopiedFeedback(false);
              setIsExportModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            title="Copiar resumo de dados formatado para WhatsApp"
          >
            <Send className="w-4 h-4 fill-current" />
            <span>Copiar Resumo (WhatsApp)</span>
          </button>

          <div className="flex items-center gap-1.5 bg-[#1B1B1C] border border-[#29292A] rounded-xl px-2.5 py-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if(e.target.value) setSelectedDate(e.target.value);
              }}
              className="bg-transparent text-xs text-white uppercase font-mono focus:outline-none border-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* COMPACT BENTO CARD NUMBERS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] shadow-md flex flex-col justify-between relative">
          <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block">Aderência Geral</span>
          <strong className="text-2xl font-mono font-black text-indigo-400 mt-1 block">
            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 100}%
          </strong>
          <span className="text-[10px] text-gray-400 mt-2 block">Conformidade nas clínicas</span>
        </div>

        <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] shadow-md flex flex-col justify-between relative">
          <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block">Concluídas</span>
          <strong className="text-2xl font-mono font-black text-emerald-400 mt-1 block">
            {stats.completed}
          </strong>
          <span className="text-[10px] text-gray-400 mt-2 block">{stats.total} rituais totais</span>
        </div>

        <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] shadow-md flex flex-col justify-between relative">
          <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block">Pendentes</span>
          <strong className="text-2xl font-mono font-black text-amber-400 mt-1 block">
            {stats.pending}
          </strong>
          <span className="text-[10px] text-gray-400 mt-2 block">Cumpra os prazos hoje</span>
        </div>

        <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] shadow-md flex flex-col justify-between relative">
          <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block">Atrasadas / Críticas</span>
          <strong className="text-2xl font-mono font-black text-rose-500 mt-1 block">
            {stats.delayed}
          </strong>
          <span className="text-[10px] text-gray-400 mt-2 block">Exigem ação imediata</span>
        </div>

        <div className="bg-[rgba(38,30,21,0.2)] p-4 rounded-xl border border-amber-900/20 shadow-md flex flex-col justify-between relative">
          <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-widest block">Unidades Alerta</span>
          <strong className="text-2xl font-mono font-black text-amber-500 mt-1 block">
            {stats.unitsWithAlert}
          </strong>
          <span className="text-[10px] text-amber-450 mt-2 block">Gargalo de entrega ativa</span>
        </div>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 bg-[#141414] p-4 rounded-xl border border-[#1E1E1E]">
        <div className="md:col-span-5 relative flex items-center">
          <Search className="w-4 h-4 text-gray-550 absolute left-3" />
          <input 
            type="text"
            placeholder="Buscar por clínica, gerente ou gerente parceira..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#1A1A1A] border border-[#262626] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="md:col-span-4 flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500 uppercase font-extrabold tracking-wider shrink-0">Status:</span>
          <div className="grid grid-cols-4 gap-1 w-full bg-[#1A1A1A] border border-[#242424] p-0.5 rounded-xl">
            <button
              onClick={() => setStatusFilter('todas')}
              className={`py-1.5 rounded-lg text-[9.5px] font-black text-center transition-all cursor-pointer ${
                statusFilter === 'todas' ? 'bg-indigo-650 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStatusFilter('pendente')}
              className={`py-1.5 rounded-lg text-[9.5px] font-black text-center transition-all cursor-pointer ${
                statusFilter === 'pendente' ? 'bg-amber-600/90 text-white' : 'text-gray-450 hover:text-amber-400'
              }`}
            >
              Pend
            </button>
            <button
              onClick={() => setStatusFilter('atrasado')}
              className={`py-1.5 rounded-lg text-[9.5px] font-black text-center transition-all cursor-pointer ${
                statusFilter === 'atrasado' ? 'bg-rose-600 text-white' : 'text-gray-450 hover:text-rose-450'
              }`}
            >
              Atrasadas
            </button>
            <button
              onClick={() => setStatusFilter('concluido')}
              className={`py-1.5 rounded-lg text-[9.5px] font-black text-center transition-all cursor-pointer ${
                statusFilter === 'concluido' ? 'bg-emerald-600 text-white' : 'text-gray-450 hover:text-emerald-450'
              }`}
            >
              100% Ok
            </button>
          </div>
        </div>

        <div className="md:col-span-3 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="w-full bg-[#1A1A1A] text-gray-300 border border-[#262626] rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="todas">Todas as Unidades (Filtro)</option>
            {activeUnits.map(unit => (
              <option key={unit.id} value={unit.id}>
                [{unit.sigla}] {unit.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* EMPTY STATE FILTER RENDER */}
      {displayUnits.length === 0 ? (
        <div className="col-span-full bg-[#141414] border border-[#212121] rounded-2xl p-12 text-center text-gray-400 shadow-md">
          <span className="text-gray-650 block text-3xl mb-2">📭</span>
          <p className="font-extrabold text-white text-sm">Nenhuma clínica corresponde ao filtro operacional</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('todas');
              setSelectedUnitId('todas');
            }}
            className="mt-3 px-3.5 py-1.5 bg-[#212121] text-xs font-bold text-gray-300 border border-[#2B2B2B] rounded-xl hover:bg-[#2D2D2D] cursor-pointer transition-all"
          >
            Resetar Filtros
          </button>
        </div>
      ) : (
        <>
          {/* ========================================================
              1. DESKTOP VIEW: TABELA EXECUTIVA / CONTROL BOARD 
              ======================================================== */}
          <div className="hidden lg:block bg-[#141414] border border-[#212121] rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 bg-[#181818] border-b border-[#212121] flex justify-between items-center select-none">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <Laptop className="w-3.5 h-3.5 text-indigo-400" /> Mesa de Controle - Mesa Digital de Trabalho
              </span>
              <span className="text-[10px] text-indigo-300 font-semibold bg-indigo-950/20 px-2 py-0.5 rounded border border-indigo-900/30">
                Aderência ao Vivo do Grupo ONE
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#222]">
                <thead className="bg-[#111] text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 text-left font-extrabold">Unidade</th>
                    <th className="py-3 px-4 text-center font-extrabold">% Ok</th>
                    <th className="py-3 px-3 text-center">Story 1<span className="block text-[8px] text-gray-500 font-mono">09h</span></th>
                    <th className="py-3 px-3 text-center">Story 2<span className="block text-[8px] text-gray-500 font-mono">14h</span></th>
                    <th className="py-3 px-3 text-center">Story 3<span className="block text-[8px] text-gray-500 font-mono">18h</span></th>
                    <th className="py-3 px-3 text-center">Insta Nota<span className="block text-[8px] text-gray-500 font-mono">11h</span></th>
                    <th className="py-3 px-3 text-center">Story Real<span className="block text-[8px] text-gray-500 font-mono">12h</span></th>
                    <th className="py-3 px-3 text-center">Bastidor<span className="block text-[8px] text-gray-500 font-mono">16h</span></th>
                    {isPostagemFieldDay && (
                      <th className="py-3 px-3 text-center text-indigo-400">Feed Principal<span className="block text-[8px] text-indigo-500 font-mono">12h</span></th>
                    )}
                    <th className="py-3 px-4 text-left">Alertas Ativos</th>
                    <th className="py-3 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D1D1D] text-xs">
                  {displayUnits.map(unit => {
                    const completion = calculateCompletionRate(unit.id, selectedDate, tasks, executions);
                    const unitPendencias = pendencias.filter(p => p.unitId === unit.id && !['resolvido', 'resolvida', 'cancelado'].includes(p.status));

                    // Dynamic column status retrieval
                    const s1St = getTaskStatus(unit.id, 'story-1', selectedDate, '09:00');
                    const s2St = getTaskStatus(unit.id, 'story-2', selectedDate, '14:00');
                    const s3St = getTaskStatus(unit.id, 'story-3', selectedDate, '18:00');
                    const instSt = getTaskStatus(unit.id, 'nota-instagram', selectedDate, '11:00');
                    const realSt = getTaskStatus(unit.id, 'story-real', selectedDate, '12:00');
                    const bastSt = getTaskStatus(unit.id, 'bastidor', selectedDate, '16:00');
                    const feedSt = isPostagemFieldDay ? getTaskStatus(unit.id, 'postagem-principal', selectedDate, '12:00') : 'nao_se_aplica';

                    return (
                      <tr key={unit.id} className="hover:bg-[#181818] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">[{unit.sigla}] - {unit.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>Gerente: {unit.gerente}</span>
                            <span>•</span>
                            <span>Sócia: {unit.socia}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-black ${
                            completion.percentage === 100 
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' 
                              : completion.percentage > 40 
                              ? 'bg-amber-955/20 text-amber-400 border border-amber-900/20' 
                              : 'bg-rose-955/35 text-rose-450 border border-rose-900/40 font-extrabold animate-pulse-slow'
                          }`}>
                            {completion.percentage}%
                          </span>
                        </td>

                        {/* Interactive columns (Single click completes, right click opens helper) */}
                        {[
                          { id: 'story-1', st: s1St },
                          { id: 'story-2', st: s2St },
                          { id: 'story-3', st: s3St },
                          { id: 'nota-instagram', st: instSt },
                          { id: 'story-real', st: realSt },
                          { id: 'bastidor', st: bastSt },
                          ...(isPostagemFieldDay ? [{ id: 'postagem-principal', st: feedSt }] : [])
                        ].map(col => {
                          const cycle = (e: React.MouseEvent) => {
                            e.preventDefault();
                            handleToggleStatus(unit.id, col.id, col.st);
                          };
                          const openNavNA = (e: React.MouseEvent) => {
                            e.preventDefault(); // right-click marks NA
                            handleMarkNA(unit.id, col.id, col.st);
                          };

                          return (
                            <td key={col.id} className="py-2.5 px-1.5 text-center select-none">
                              <button
                                onClick={cycle}
                                onContextMenu={openNavNA}
                                className={`w-20 mx-auto px-1 py-1 text-[9px] font-extrabold rounded-lg uppercase tracking-wider text-center border focus:outline-none cursor-pointer transition-all duration-100 flex flex-col justify-center items-center shadow-xs ${getStatusVisualClasses(col.st as any)}`}
                                title="Clique: Alterna Ok/Pend. Botão Direito: Marca como Não se Aplica."
                              >
                                {col.st === 'executado' ? (
                                  <span className="flex items-center gap-0.5 text-emerald-400">
                                    <Check className="w-2.5 h-2.5 font-black text-emerald-400 shrink-0" />
                                    <span>EM DIA</span>
                                  </span>
                                ) : col.st === 'atrasado' ? (
                                  <span className="flex items-center gap-0.5 text-rose-400">
                                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                    <span>ATRASO</span>
                                  </span>
                                ) : col.st === 'nao_se_aplica' ? (
                                  <span className="text-gray-400">N/A</span>
                                ) : (
                                  <span className="text-amber-400">PEND</span>
                                )}
                              </button>
                            </td>
                          );
                        })}

                        {/* Open Pendencia Summary */}
                        <td className="py-3 px-4 max-w-[200px]">
                          {unitPendencias.length === 0 ? (
                            <span className="text-gray-600 italic text-[11px]">- Sem ocorrências -</span>
                          ) : (
                            <div className="flex flex-col gap-1 max-h-[45px] overflow-y-auto">
                              {unitPendencias.map(p => (
                                <span key={p.id} className="text-[10px] text-amber-500 font-semibold truncate block" title={p.description}>
                                  ↳ {p.description}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Navigation & actions per unit row */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1 select-none">
                            <button
                              onClick={() => triggerAddPendencyModal(unit, 'Mesa de Controle')}
                              className="px-1.5 py-0.5 text-[9px] hover:bg-amber-955/20 border border-amber-900/30 hover:border-amber-500/50 rounded font-bold text-amber-500 transition-all cursor-pointer"
                              title="Criar Ocorrência impeditiva"
                            >
                              +Pend
                            </button>
                            <button
                              onClick={() => onSwitchToChecklist(unit.id)}
                              className="p-1 hover:bg-[#202020] rounded border border-transparent hover:border-[#2C2C2C] text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                              title="Expandir Calendários"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================
              2. MOBILE VIEW: CARDS DE CONTROLE (Otimizado) 
              ======================================================== */}
          <div className="block lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayUnits.map(unit => {
              const unitTasks = getTasksForUnit(unit.id, selectedDate);
              const completion = calculateCompletionRate(unit.id, selectedDate, tasks, executions);
              const unitPendencias = pendencias.filter(p => p.unitId === unit.id && p.status === 'aberta');

              return (
                <div key={unit.id} className="bg-[#141414] border border-[#212121] rounded-2xl shadow-md overflow-hidden flex flex-col justify-between">
                  {/* Card Header information */}
                  <div className="p-4 bg-[#181818] border-b border-[#212121] flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-mono font-extrabold text-indigo-400 bg-indigo-950/20 px-1.5 py-0.5 rounded border border-indigo-900/30 select-none">
                        {unit.sigla}
                      </span>
                      <h3 className="font-display font-extrabold text-sm text-white mt-1 leading-tight">
                        {unit.name}
                      </h3>
                      <span className="text-[10px] text-gray-500 mt-0.5 block font-medium">
                        Gerente: {unit.gerente}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-black text-indigo-400">
                        {completion.percentage}% OK
                      </div>
                      <span className="text-[9px] text-gray-500 uppercase font-black">Adherence</span>
                    </div>
                  </div>

                  {/* Tasks List within Card */}
                  <div className="p-4 space-y-3 flex-1">
                    <span className="text-[8.5px] uppercase font-mono font-black text-gray-550 block select-none">
                      Rotina de Checklists
                    </span>

                    <div className="space-y-2 max-h-[290px] overflow-y-auto pr-0.5">
                      {unitTasks.map(task => {
                        const currentStatus = getTaskStatus(unit.id, task.id, selectedDate, task.suggestedTime);
                        
                        return (
                          <div 
                            key={task.id} 
                            className="p-2.5 bg-[#1B1B1C] hover:bg-[#202021] border border-[#262627] rounded-xl flex items-start gap-2 justify-between transition-all"
                          >
                            <div className="flex-1 min-w-0 pr-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.2 rounded border ${getStatusVisualClasses(currentStatus as any)}`}>
                                  {currentStatus === 'executado' ? 'Em dia' : currentStatus === 'nao_se_aplica' ? 'N/A' : currentStatus === 'atrasado' ? 'Crítico' : 'Pendente'}
                                </span>
                                {task.suggestedTime && (
                                  <span className="text-[8px] font-mono text-gray-500 font-bold">
                                    ↳ {task.suggestedTime}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-[11px] text-white mt-1 leading-snug break-words">
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            {/* Status controls toggling */}
                            <div className="flex flex-col gap-1 items-end shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(unit.id, task.id, currentStatus)}
                                className={`px-2 py-1 rounded text-[9.5px] font-black uppercase shadow-xs transition-all cursor-pointer ${
                                  currentStatus === 'executado' 
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-black' 
                                    : 'bg-indigo-650 hover:bg-indigo-700 text-white'
                                }`}
                              >
                                {currentStatus === 'executado' ? 'Concluído' : 'Confirmar'}
                              </button>

                              {!task.isPendency && (
                                <div className="flex bg-[#232324] rounded border border-[#2D2D2E]">
                                  <button
                                    onClick={() => handleMarkNA(unit.id, task.id, currentStatus)}
                                    className={`py-0.5 px-1.5 text-[8.5px] font-black hover:bg-zinc-800 ${currentStatus === 'nao_se_aplica' ? 'bg-[#1C1C1D] text-indigo-400' : 'text-gray-500'} rounded`}
                                    title="Não se aplica"
                                  >
                                    N/A
                                  </button>
                                  <button
                                    onClick={() => handleMarkDelayed(unit.id, task.id, currentStatus)}
                                    className={`py-0.5 px-1.5 text-[8.5px] font-black hover:bg-zinc-800 ${currentStatus === 'atrasado' ? 'bg-[#1C1C1D] text-rose-450' : 'text-gray-500'} border-l border-[#2D2D2E] rounded`}
                                    title="Atraso"
                                  >
                                    Atr
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Active Pendency Displays inside cards */}
                    {unitPendencias.length > 0 && (
                      <div className="mt-2.5 p-2 bg-amber-955/10 border border-amber-900/30 rounded-xl space-y-1">
                        <span className="text-[8.5px] font-mono font-black text-amber-500 block">
                          Pendências Ativas de {unit.sigla}
                        </span>
                        {unitPendencias.map(p => (
                          <div key={p.id} className="text-[10px] text-gray-300 flex justify-between items-center bg-black/20 p-1 rounded">
                            <span className="truncate pr-2">↳ {p.description}</span>
                            <button
                              onClick={() => onTogglePendencia && onTogglePendencia(p.id)}
                              className="text-[9px] font-black text-amber-500 hover:underline cursor-pointer"
                            >
                              Resolver
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card bottom interaction */}
                  <div className="p-3 bg-[#181818] border-t border-[#212121] flex justify-between items-center select-none">
                    <button 
                      onClick={() => onSwitchToChecklist(unit.id)}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      Ver Calendário <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => triggerAddPendencyModal(unit, 'Card Checklist')}
                      className="px-2 py-1 bg-[#202021] border border-[#2E2E2F] hover:border-amber-900 text-[10px] text-amber-450 font-bold rounded-lg cursor-pointer"
                    >
                      Nova Pendência
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ========================================================
          3. WHATSAPP REPORT MODAL (5 distinct templates)
          ======================================================== */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#141414] border border-[#2D2D2D] w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-scaleIn flex flex-col max-h-[85vh]">
            <div className="p-4 bg-[#181818] border-b border-[#212121] flex justify-between items-center select-none">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-450 fill-current" />
                <h3 className="font-display font-extrabold text-sm text-white">
                  Exportador Multi-Modelo p/ WhatsApp
                </h3>
              </div>
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer hover:bg-[#252525] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-2 select-none">
                  Escolha o Modelo de Relatório (Texto Limpo Sem Tabela)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 select-none">
                  {[
                    { id: 'resumo_dia', label: '1. Resumo Diário', desc: 'Controle de conclusão' },
                    { id: 'pendencias_unidade', label: '2. Pendências/Clínica', desc: 'Erros agrupados' },
                    { id: 'resumo_reuniao', label: '3. Pauta Reunião', desc: 'Destaques e taxas' },
                    { id: 'unidades_alerta', label: '4. Clínicas Alerta', desc: 'Pontos críticos' },
                    { id: 'tarefas_balanco', label: '5. Atividades OK/Pendente', desc: 'Listagem individual' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setExportType(tab.id as any);
                        setCopiedFeedback(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        exportType === tab.id 
                          ? 'bg-emerald-950/20 text-emerald-400 border-emerald-550/40' 
                          : 'bg-[#1C1C1D] border-[#252526] text-gray-450 hover:border-gray-500'
                      }`}
                    >
                      <span className="block text-[10px] font-black">{tab.label}</span>
                      <span className="block text-[8px] text-gray-500 font-medium mt-0.5">{tab.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5 select-none">
                  Mensagem Pronta para Envio (Copie e Cole)
                </label>
                <pre className="w-full bg-slate-900 border border-[#222] p-4 text-[10.5px] text-gray-200 rounded-xl font-mono whitespace-pre-wrap max-h-[260px] overflow-y-auto leading-relaxed overflow-x-hidden">
                  {displayedWhatsAppText}
                </pre>
              </div>
            </div>

            <div className="p-4 bg-[#181818] border-t border-[#212121] flex justify-between items-center text-xs">
              <span className="text-[10px] text-gray-500 font-mono">
                Sem tabelas complexas, ideal para colar diretamente no grupo One.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-gray-400 hover:text-white"
                >
                  Fechar
                </button>
                <button
                  onClick={copyToClipboard}
                  className={`px-4.5 py-2 rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 select-none ${
                    copiedFeedback 
                      ? 'bg-emerald-500 text-black' 
                      : 'bg-[#183a21] text-emerald-300 border border-emerald-900 hover:bg-emerald-950'
                  }`}
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>{copiedFeedback ? 'Copiado para o Clipboard!' : 'Copiar Texto Formato WhatsApp'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          4. DETAILED PENDENCY REGISTRATION MODAL 
          ======================================================== */}
      {isPendencyModalOpen && pendencyTargetUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <form 
            onSubmit={handleCreatePendency}
            className="bg-[#141414] border border-[#2D2D2D] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scaleIn flex flex-col justify-between"
          >
            <div className="p-4 bg-[#181818] border-b border-[#212121] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-display font-extrabold text-sm text-white">
                  Registrar Pendência Crítica
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsPendencyModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-[#1E1C18] border border-amber-900/30 p-2.5 rounded-xl">
                <span className="text-[8.5px] uppercase font-black text-amber-500 block mb-1">Clínica Vinculada</span>
                <span className="font-bold text-gray-250 block">
                  [{pendencyTargetUnit.sigla}] - {pendencyTargetUnit.name}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  Preenchido a partir do: {pendencyTargetTaskTitle}
                </span>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Descrição do Problema *</label>
                <textarea
                  required
                  rows={3}
                  value={pendencyDescription}
                  onChange={(e) => setPendencyDescription(e.target.value)}
                  placeholder="Explique o ocorrido para notificação imediata à gerente..."
                  className="w-full bg-[#1A1A1A] text-white border border-[#252525] rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-xs whitespace-pre-wrap leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Urabilidade/Gravidade *</label>
                  <select
                    value={pendencyUrgency}
                    onChange={(e) => setPendencyUrgency(e.target.value as any)}
                    className="w-full bg-[#1A1A1A] text-white border border-[#252525] rounded-xl p-2 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="baixa">Baixa Urgência</option>
                    <option value="media">Média Urgência</option>
                    <option value="alta">Alta (Aciona Alerta!)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Quem Resolve? *</label>
                  <select
                    value={pendencyResponsible}
                    onChange={(e) => setPendencyResponsible(e.target.value as ResponsibleParty)}
                    className="w-full bg-[#1A1A1A] text-white border border-[#252525] rounded-xl p-2 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="gerente">Gerente Local</option>
                    <option value="agencia">Agência TráfegON</option>
                    <option value="colaboradora">Colaboradora Interna</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Anotações complementar de Apoio</label>
                <input
                  type="text"
                  value={pendencyNotes}
                  onChange={(e) => setPendencyNotes(e.target.value)}
                  placeholder="Instruções de cobrança, prazo acordado..."
                  className="w-full bg-[#1A1A1A] text-white border border-[#252525] rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            <div className="p-3.5 bg-[#181818] border-t border-[#212121] flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsPendencyModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold font-black"
              >
                Registrar e Emitir Alerta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          5. ADD UNIT QUICK MODAL
          ======================================================== */}
      {isAddUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <form 
            onSubmit={handleAddUnitFormSubmit}
            className="bg-[#141414] border border-[#2D2D2D] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scaleIn flex flex-col justify-between"
          >
            <div className="p-4 bg-[#181818] border-b border-[#212121] flex justify-between items-center select-none">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-display font-extrabold text-sm text-white">
                  Cadastrar Nova Unidade no Sistema
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddUnitModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Nome completo da Clínica *</label>
                  <input
                    type="text"
                    required
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    placeholder="Ex: 14 - Caruaru"
                    className="w-full bg-[#1A1A1A] text-white border border-[#252525] rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Sigla *</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={newUnitSigla}
                    onChange={(e) => setNewUnitSigla(e.target.value)}
                    placeholder="Ex: CAR"
                    className="w-full bg-[#1A1A1A] text-white border border-[#252525] rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">UF / Região *</label>
                  <select
                    value={newUnitRegion}
                    onChange={(e) => setNewUnitRegion(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white border border-[#252525] rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="PE">Pernambuco (PE)</option>
                    <option value="PB">Paraíba (PB)</option>
                    <option value="AL">Alagoas (AL)</option>
                    <option value="RN">Rio Grande do Norte (RN)</option>
                    <option value="CE">Ceará (CE)</option>
                    <option value="BA">Bahia (BA)</option>
                    <option value="SP">São Paulo (SP)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Cidade / Estado *</label>
                  <input
                    type="text"
                    required
                    value={newUnitCity}
                    onChange={(e) => setNewUnitCity(e.target.value)}
                    placeholder="Ex: Caruaru/PE"
                    className="w-full bg-[#1A1A1A] text-white border border-[#252525] rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Nome da Gerente Local *</label>
                  <input
                    type="text"
                    required
                    value={newUnitGerente}
                    onChange={(e) => setNewUnitGerente(e.target.value)}
                    placeholder="Ex: Mariana Souza"
                    className="w-full bg-[#1A1A1A] text-white border border-[#252525] rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Sócia do Grupo ONE *</label>
                  <input
                    type="text"
                    required
                    value={newUnitSocia}
                    onChange={(e) => setNewUnitSocia(e.target.value)}
                    placeholder="Ex: Amanda Albuquerque"
                    className="w-full bg-[#1A1A1A] text-white border border-[#252525] rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-[#181818] border-t border-[#212121] flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsAddUnitModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-black transition-all cursor-pointer shadow-md"
              >
                Salvar Clínica
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
