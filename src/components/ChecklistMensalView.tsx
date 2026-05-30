import React, { useState, useMemo } from 'react';
import { Unit, StandardTask, TaskExecution, TaskStatus, TaskPriority } from '../types';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  Info,
  CalendarCheck,
  Award,
  AlertTriangle,
  Send,
  Sparkles
} from 'lucide-react';

interface ChecklistMensalViewProps {
  units: Unit[];
  tasks: StandardTask[];
  executions: TaskExecution[];
  toggleTaskStatus: (unitId: string, taskId: string, date: string, currentStatus: any) => void;
  updateTaskNotes: (unitId: string, taskId: string, date: string, notes: string) => void;
  updateTaskPriority: (unitId: string, taskId: string, date: string, priority: TaskPriority) => void;
  selectedDate: string;
  todayDate: string;
  initialUnitId?: string;
  onAddPendenciaObj: (newPend: any) => void;
}

export default function ChecklistMensalView({
  units,
  tasks,
  executions,
  toggleTaskStatus,
  updateTaskNotes,
  updateTaskPriority,
  selectedDate,
  todayDate,
  initialUnitId,
  onAddPendenciaObj
}: ChecklistMensalViewProps) {
  const activeUnits = useMemo(() => units.filter(u => u.active), [units]);
  const [selectedUnitId, setSelectedUnitId] = useState(initialUnitId || (activeUnits[0]?.id || ''));
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  // States for inline linked pendency registration
  const [addingPendencyTaskId, setAddingPendencyTaskId] = useState<string | null>(null);
  const [pendencyDesc, setPendencyDesc] = useState('');
  const [pendencyUrgency, setPendencyUrgency] = useState<'baixa' | 'media' | 'alta'>('media');
  const [pendencyResponsible, setPendencyResponsible] = useState<'gerente' | 'agencia' | 'unidade'>('gerente');

  const currentUnit = useMemo(() => {
    return units.find(u => u.id === selectedUnitId);
  }, [units, selectedUnitId]);

  // Filter monthly tasks
  const monthlyTasks = useMemo(() => {
    return tasks.filter(t => t.frequency === 'mensal');
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return monthlyTasks.filter(task => {
      return task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             task.description.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [monthlyTasks, searchTerm]);

  // Current Month calculation
  const monthInfo = useMemo(() => {
    const parts = selectedDate.split('-');
    if (parts.length < 2) return { prefix: '', label: 'Mês Operacional' };
    
    const year = parts[0];
    const month = parts[1];
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    return {
      prefix: `${year}-${month}`,
      label: `${monthNames[Number(month) - 1]} de ${year}`
    };
  }, [selectedDate]);

  // Completion stats within current month prefix (YYYY-MM)
  const stats = useMemo(() => {
    if (!selectedUnitId) return { percentage: 0, completed: 0, total: 0 };

    let completedCount = 0;
    monthlyTasks.forEach(task => {
      const isCompleted = executions.some(
        e => e.unitId === selectedUnitId && 
             e.date.startsWith(monthInfo.prefix) && 
             e.taskId === task.id && 
             e.status === 'executado'
      );
      if (isCompleted) completedCount++;
    });

    const total = monthlyTasks.length;
    const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 100;
    return {
      percentage,
      completed: completedCount,
      total
    };
  }, [selectedUnitId, monthlyTasks, executions, monthInfo]);

  const handleNotesSave = (taskId: string) => {
    updateTaskNotes(selectedUnitId, taskId, selectedDate, tempNotes);
    setEditingNotesId(null);
  };

  const startEditingNotes = (taskId: string, currentNotes: string) => {
    setEditingNotesId(taskId);
    setTempNotes(currentNotes);
  };

  // Trigger inline pendency registration
  const handleOpenAddPendency = (task: StandardTask) => {
    setAddingPendencyTaskId(task.id);
    setPendencyDesc(`Falha no Checklist Mensal [Unidade: ${currentUnit?.name}] - ${task.title} não realizado.`);
    setPendencyUrgency('media');
    setPendencyResponsible('gerente');
  };

  const submitLinkedPendency = (event: React.FormEvent, taskId: string) => {
    event.preventDefault();
    if (!selectedUnitId || !pendencyDesc.trim()) return;

    onAddPendenciaObj({
      unitId: selectedUnitId,
      description: pendencyDesc,
      responsible: pendencyResponsible,
      urgency: pendencyUrgency,
      status: 'aberta',
      notes: `Registrado a partir do Checklist Mensal (Mês de check representativo: ${monthInfo.label})`
    });

    setAddingPendencyTaskId(null);
    setPendencyDesc('');
  };

  const getStatusStyle = (status: TaskStatus) => {
    switch (status) {
      case 'executado':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          bgColor: 'bg-emerald-950/20 border-emerald-900/30 text-emerald-300',
          titleColor: 'text-emerald-400'
        };
      case 'nao_se_aplica':
        return {
          icon: <HelpCircle className="w-5 h-5 text-gray-550" />,
          bgColor: 'bg-[#181818] border-[#222222] text-gray-400 line-through',
          titleColor: 'text-gray-500 line-through'
        };
      case 'atrasado':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />,
          bgColor: 'bg-rose-955/20 border-rose-900/40 text-rose-455',
          titleColor: 'text-rose-455 font-bold'
        };
      case 'pendente':
      default:
        return {
          icon: <Clock className="w-5 h-5 text-pink-400 font-bold" />,
          bgColor: 'bg-[#191919] border-[#202020] text-gray-350',
          titleColor: 'text-pink-400'
        };
    }
  };

  const getPriorityStyle = (priority?: TaskPriority) => {
    switch (priority) {
      case 'alta':
        return 'text-rose-400 bg-rose-950/40 border border-rose-900/40 font-bold';
      case 'baixa':
        return 'text-gray-400 bg-neutral-900 border border-neutral-800';
      case 'media':
      default:
        return 'text-amber-400 bg-amber-955/15 border border-amber-900/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#141414] p-5 rounded-xl border border-[#212121] shadow-md shadow-black/15 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest block font-bold mb-1">Rotinas de Fechamento Operativo</span>
          <h2 className="text-2xl font-display font-extrabold text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-pink-400" /> Checklist Mensal de Atividades
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Revisões de fechamento de performance com sócias do Grupo ONE, roteirização mensal e planejamento estratégico das franquias.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] border border-[#262626] rounded-xl text-xs font-mono text-gray-300 shrink-0">
          <Award className="w-4 h-4 text-pink-400 shrink-0" />
          <span>Foco do Mês: <strong className="text-pink-400">{monthInfo.label}</strong></span>
        </div>
      </div>

      {/* Select Unit and Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-[#141414] p-5 rounded-xl border border-[#212121]">
        <div className="md:col-span-4 space-y-2">
          <label className="block text-xs font-bold text-gray-450 uppercase tracking-wider">Unidade Clínica</label>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg py-2.5 px-3 text-sm font-bold text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
          >
            {activeUnits.map(unit => (
              <option key={unit.id} value={unit.id} className="bg-[#141414]">
                [{unit.region}] {unit.name}
              </option>
            ))}
          </select>
          {currentUnit?.contactName && (
            <p className="text-xs text-gray-500 italic mt-1 font-medium">Responsável local: {currentUnit.contactName}</p>
          )}
        </div>

        <div className="md:col-span-8 bg-[#1A1A1A] border border-[#262626] p-4 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-405 font-bold uppercase tracking-wide">Aderência Mensal Estimada</span>
            <span className="text-white font-mono font-extrabold">{stats.percentage}%</span>
          </div>

          <div className="w-full h-2.5 bg-[#0A0A0A] border border-[#2D2D2D] rounded-full overflow-hidden mt-2">
            <div 
              className={`h-full transition-all duration-300 ${
                stats.percentage >= 80 ? 'bg-emerald-500' : stats.percentage >= 40 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${stats.percentage}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-1 pt-1.5">
            <span>Completadas no mês: <strong>{stats.completed}</strong></span>
            <span>Tarefas Mensais Totais: <strong>{stats.total}</strong></span>
          </div>
        </div>
      </div>

      {/* Task list search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Buscar por nome ou descrição da tarefa mensal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-xs text-white placeholder-gray-550 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <span className="text-[11px] text-pink-305 flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5" /> Foco em consolidações estratégias e estratégicos com sócias
          </span>
        </div>

        {/* Task cards */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-[#141414] border border-[#212121] rounded-xl p-10 text-center text-gray-500">
              Nenhuma ação mensal cadastrada ou correspondente à busca.
            </div>
          ) : (
            filteredTasks.map(task => {
              // Get the execution for this task within this month
              const execution = executions.find(
                e => e.unitId === selectedUnitId && e.date.startsWith(monthInfo.prefix) && e.taskId === task.id
              ) || executions.find(
                e => e.unitId === selectedUnitId && e.date === selectedDate && e.taskId === task.id
              );

              const currentStatus: TaskStatus = execution ? execution.status : 'pendente';
              const pNotes = execution?.notes || '';
              const style = getStatusStyle(currentStatus);
              const customPriority = execution?.priority || task.priority || 'media';

              return (
                <div 
                  key={task.id}
                  className={`border rounded-xl p-4 transition-all space-y-3 ${style.bgColor}`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex gap-3">
                      <div className="mt-1 shrink-0">{style.icon}</div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={`text-sm font-bold font-display ${style.titleColor}`}>
                            {task.title}
                          </h4>

                          {/* Priority Toggle switch */}
                          <button
                            type="button"
                            title="Clique para alternar prioridade da tarefa mensal"
                            onClick={() => {
                              const priorities: TaskPriority[] = ['baixa', 'media', 'alta'];
                              const nextIdx = (priorities.indexOf(customPriority) + 1) % priorities.length;
                              updateTaskPriority(selectedUnitId, task.id, selectedDate, priorities[nextIdx]);
                            }}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all tracking-wider ${getPriorityStyle(customPriority)}`}
                          >
                            {customPriority}
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed max-w-3xl">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    {/* Status selection */}
                    <div className="flex items-center gap-1 border border-[#262626] rounded-lg p-0.5 bg-[#0F0F0F] shrink-0 select-none font-mono text-[9px]">
                      {([
                        { id: 'pendente', label: 'Pendente' },
                        { id: 'executado', label: 'Concluído' },
                        { id: 'atrasado', label: 'Atrasado' },
                        { id: 'nao_se_aplica', label: 'N/A' }
                      ] as { id: TaskStatus; label: string }[]).map(btn => (
                        <button
                          key={btn.id}
                          onClick={() => toggleTaskStatus(selectedUnitId, task.id, execution?.date || selectedDate, btn.id)}
                          className={`px-2.5 py-1 rounded text-[10px] font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
                            currentStatus === btn.id
                              ? btn.id === 'executado'
                                ? 'bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/10 border border-emerald-500/20'
                                : btn.id === 'atrasado'
                                ? 'bg-rose-900/70 text-rose-200 border border-rose-800'
                                : btn.id === 'nao_se_aplica'
                                ? 'bg-gray-800 text-gray-250 border border-gray-700'
                                : 'bg-amber-600 text-white font-black border border-amber-500/20'
                              : 'text-gray-450 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes box */}
                  <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-400">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-bold text-gray-500 font-mono text-[10px]">OBS:</span>
                      {editingNotesId === task.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={tempNotes}
                            onChange={e => setTempNotes(e.target.value)}
                            placeholder="Adicionar detalhes ou links do relatório de aprovação..."
                            className="flex-1 bg-black/60 border border-indigo-950 px-2.5 py-1 text-white text-xs rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <button
                            onClick={() => handleNotesSave(task.id)}
                            className="bg-indigo-600 text-white hover:bg-indigo-700 text-[11px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingNotesId(null)}
                            className="text-gray-400 hover:text-white text-[11px] px-2 py-1"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-between">
                          <span className="italic text-gray-450 truncate max-w-[400px]">
                            {pNotes ? `"${pNotes}"` : 'Sem observações mensais informadas.'}
                          </span>
                          <button
                            onClick={() => startEditingNotes(task.id, pNotes)}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                          >
                            {pNotes ? 'Alterar Obs' : '+ Comentar'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="h-4 w-[1px] bg-white/5 hidden sm:block"></div>

                    {/* Linked Pendency trigger Button */}
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenAddPendency(task)}
                        className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-500 hover:text-amber-400 bg-amber-950/10 border border-amber-900/30 px-2.5 py-1 rounded transition-colors shrink-0 cursor-pointer"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-550 shrink-0" />
                        <span>Registrar Pendência Vinculada</span>
                      </button>
                    </div>
                  </div>

                  {/* Inline Pendency Widget code */}
                  {addingPendencyTaskId === task.id && (
                    <form 
                      onSubmit={(e) => submitLinkedPendency(e, task.id)}
                      className="mt-3 p-3.5 bg-amber-950/10 border border-amber-800/20 rounded-xl space-y-3 text-xs"
                    >
                      <h5 className="font-extrabold text-amber-500 flex items-center gap-1 leading-none text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-550" />
                        Abertura de Ocorrência Vinculada a esta Falha
                      </h5>
                      
                      <div className="space-y-1.5">
                        <label className="block text-gray-400 text-[10px] uppercase font-bold">Descrição da Reclamação / Pendência</label>
                        <textarea
                          rows={2}
                          required
                          value={pendencyDesc}
                          onChange={(e) => setPendencyDesc(e.target.value)}
                          className="w-full bg-black/60 border border-amber-900/30 text-white rounded p-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1 col-span-1">Cobrar Resposta de:</label>
                          <select
                            value={pendencyResponsible}
                            onChange={(e) => setPendencyResponsible(e.target.value as any)}
                            className="w-full bg-[#141414] border border-[#272727] text-gray-300 py-1.5 px-2 rounded font-bold cursor-pointer"
                          >
                            <option value="gerente">Gerente da Unidade (Rápido)</option>
                            <option value="unidade">Clínica Inteira (Equipe Local)</option>
                            <option value="agencia">Agência TráfegON (Auditoria)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1">Nível de Urgência:</label>
                          <select
                            value={pendencyUrgency}
                            onChange={(e) => setPendencyUrgency(e.target.value as any)}
                            className="w-full bg-[#141414] border border-[#272727] text-gray-300 py-1.5 px-2 rounded font-bold cursor-pointer"
                          >
                            <option value="baixa">Baixa (Pode aguardar)</option>
                            <option value="media">Média (Atenção prioritária)</option>
                            <option value="alta">Alta (Crítica / Bloqueio imediato)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setAddingPendencyTaskId(null)}
                          className="px-3 py-1 bg-neutral-900 hover:bg-neutral-850 text-gray-400 rounded cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Send className="w-3 h-3" /> Registrar e Vincular
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
