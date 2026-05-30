import React, { useState, useMemo } from 'react';
import { Unit, StandardTask, TaskExecution, TaskStatus, TaskPriority } from '../types';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  Info,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  Sparkles
} from 'lucide-react';

interface ChecklistQuinzenalViewProps {
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

export default function ChecklistQuinzenalView({
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
}: ChecklistQuinzenalViewProps) {
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

  // Filter quinzenal tasks
  const quinzenalTasks = useMemo(() => {
    return tasks.filter(t => t.frequency === 'quinzenal');
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return quinzenalTasks.filter(task => {
      return task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             task.description.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [quinzenalTasks, searchTerm]);

  // Helper to calculate quinzenal date range (1st-15th or 16th-end of month containing selectedDate)
  const quinzenalRange = useMemo(() => {
    const parts = selectedDate.split('-');
    if (parts.length < 3) return { label: 'Quinzena Operacional', dates: [] };
    
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    const startDay = day <= 15 ? 1 : 16;
    const lastDate = new Date(year, month, 0).getDate();
    const endDay = day <= 15 ? 15 : lastDate;

    // Generate representing dates for execution collection
    const dates: string[] = [];
    for (let i = startDay; i <= endDay; i++) {
      const formattedDay = String(i).padStart(2, '0');
      const formattedMonth = String(month).padStart(2, '0');
      dates.push(`${year}-${formattedMonth}-${formattedDay}`);
    }

    const qLabel = day <= 15 ? '1ª Quinzena' : '2ª Quinzena';
    return {
      label: `${qLabel} de ${month}/${year} (Dias ${startDay} a ${endDay})`,
      dates
    };
  }, [selectedDate]);

  // Completion calculation
  const stats = useMemo(() => {
    if (!selectedUnitId) return { percentage: 0, completed: 0, total: 0 };

    let completedCount = 0;
    quinzenalTasks.forEach(task => {
      const isCompleted = executions.some(
        e => e.unitId === selectedUnitId && quinzenalRange.dates.includes(e.date) && e.taskId === task.id && e.status === 'executado'
      );
      if (isCompleted) completedCount++;
    });

    const total = quinzenalTasks.length;
    const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 100;
    return {
      percentage,
      completed: completedCount,
      total
    };
  }, [selectedUnitId, quinzenalTasks, executions, quinzenalRange]);

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
    setPendencyDesc(`Desvio no checklist Quinzenal da unidade ${currentUnit?.name}: ${task.title} não cumprido.`);
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
      notes: `Registrado a partir do Checklist Quinzenal de Metas (Dia representativo: ${selectedDate})`
    });

    // Automatically set status to 'atrasado' or 'pendente' unless already complete
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
          bgColor: 'bg-rose-955/20 border-rose-900/40 text-rose-400',
          titleColor: 'text-rose-450 font-extrabold'
        };
      case 'pendente':
      default:
        return {
          icon: <Clock className="w-5 h-5 text-indigo-400 font-bold" />,
          bgColor: 'bg-[#191919] border-[#202020] text-gray-350',
          titleColor: 'text-indigo-400'
        };
    }
  };

  const getPriorityStyle = (priority?: TaskPriority) => {
    switch (priority) {
      case 'alta':
        return 'text-rose-400 bg-rose-950/40 border border-rose-900/40';
      case 'baixa':
        return 'text-gray-400 bg-neutral-900/50 border border-neutral-800';
      case 'media':
      default:
        return 'text-amber-400 bg-amber-955/20 border border-amber-900/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#141414] p-5 rounded-xl border border-[#212121] shadow-md shadow-black/15 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest block font-bold mb-1">Rotinas Periódicas de Metas</span>
          <h2 className="text-2xl font-display font-extrabold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" /> Checklist Quinzenal de Auditorias
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Revisão de visualizações, alcance, engajamento e mensagens diretas da Espaçolaser para o feedback da quinzena.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] border border-[#262626] rounded-xl text-xs font-mono text-gray-300 shrink-0">
          <FileSpreadsheet className="w-4 h-4 text-indigo-450 shrink-0" />
          <span>Meta: <strong>{quinzenalRange.label}</strong></span>
        </div>
      </div>

      {/* Select Unit and Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-[#141414] p-5 rounded-xl border border-[#212121]">
        <div className="md:col-span-4 space-y-2">
          <label className="block text-xs font-bold font-mono uppercase text-gray-500 tracking-wider">Mapear Unidades</label>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2.5 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {activeUnits.map(u => (
              <option key={u.id} value={u.id}>
                [{u.region}] {u.name}
              </option>
            ))}
          </select>
          <div className="pt-2 text-xs text-gray-450">
            Responsável Unitária: <strong className="text-gray-300 font-semibold">{currentUnit?.contactName || currentUnit?.gerente || 'N/D'}</strong>
          </div>
        </div>

        <div className="md:col-span-8 bg-[#1A1A1A] border border-[#232323] p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-extrabold text-white">Métricas de Conclusão da Quinzena</h4>
            <p className="text-xs text-indigo-200">
              Mapeamento de desvios em tempo real para o fechamento gerencial do Grupo ONE.
            </p>
            <div className="text-xs text-gray-500 font-mono mt-1">
              Checklist salvo usando data representativa: {selectedDate.split('-').reverse().join('/')}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <span className="text-2xl font-black text-indigo-450">{stats.percentage}%</span>
              <p className="text-[10px] text-gray-450 font-mono uppercase tracking-wider font-extrabold">Taxa Concluída ({stats.completed}/{stats.total})</p>
            </div>
            
            {/* Progress circle */}
            <div className="w-14 h-14 rounded-full border-4 border-[#232323] flex items-center justify-center relative bg-black/60 font-mono select-none">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 transition-all duration-300" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${stats.percentage}%, 0 ${stats.percentage}%)` }}></div>
              <span className="text-[10px] font-black">{stats.completed}t</span>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Checklist tasks filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111] p-3 rounded-xl border border-[#212121]">
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Buscar tarefas quinzenais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2c2c2c] text-xs py-1.5 px-3 rounded-lg text-white focus:outline-none focus:border-indigo-500 placeholder-gray-600"
            />
          </div>
          <span className="text-[11px] text-indigo-300 flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5" /> Foco em consolidação quinzenal das métricas de auditores
          </span>
        </div>

        {/* Tasks Grid */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="p-8 bg-[#141414] border border-[#212121] text-center text-gray-500 rounded-xl">
              Nenhuma tarefa correspondente aos termos de busca.
            </div>
          ) : (
            filteredTasks.map(task => {
              const execution = executions.find(
                e => e.unitId === selectedUnitId && quinzenalRange.dates.includes(e.date) && e.taskId === task.id
              );
              const status: TaskStatus = execution ? execution.status : 'pendente';
              const pNotes = execution?.notes || '';
              const statusVisual = getStatusStyle(status);
              const customPriority = execution?.priority || task.priority || 'media';

              return (
                <div 
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 shadow-md ${statusVisual.bgColor}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    
                    {/* Left: Indicator + Title + Description */}
                    <div className="flex gap-3">
                      <div className="mt-1">{statusVisual.icon}</div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={`text-sm font-bold ${statusVisual.titleColor}`}>
                            {task.title}
                          </h4>

                          {/* Dynamic Priority Toggle Badge */}
                          <button
                            type="button"
                            title="Clique para alternar prioridade da tarefa"
                            onClick={() => {
                              const priorities: TaskPriority[] = ['baixa', 'media', 'alta'];
                              const nextIdx = (priorities.indexOf(customPriority) + 1) % priorities.length;
                              updateTaskPriority(selectedUnitId, task.id, selectedDate, priorities[nextIdx]);
                            }}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all tracking-wider ${getPriorityStyle(customPriority)}`}
                          >
                            Prioridade: {customPriority}
                          </button>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Direct Task Status controllers */}
                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-[#2A2A2A] self-end md:self-start select-none font-mono text-[9px]">
                      {([
                        { id: 'pendente', label: 'Pendente' },
                        { id: 'executado', label: 'Concluído' },
                        { id: 'atrasado', label: 'Atrasado' },
                        { id: 'nao_se_aplica', label: 'N/A' }
                      ] as { id: TaskStatus; label: string }[]).map(btn => (
                        <button
                          key={btn.id}
                          onClick={() => toggleTaskStatus(selectedUnitId, task.id, selectedDate, btn.id)}
                          className={`px-2.5 py-1 rounded text-[10px] font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
                            status === btn.id
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

                  {/* Comment & Register Linked Pendency Actions block */}
                  <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-400">
                    
                    {/* Inline Comment Edit */}
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-bold text-gray-500 font-mono text-[10px]">OBS:</span>
                      {editingNotesId === task.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            placeholder="Adicione notas rápidas ou desvios específicos..."
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
                          <span className="italic text-gray-400 truncate max-w-[400px]">
                            {pNotes ? `"${pNotes}"` : 'Nenhuma anotação.'}
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
                        className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-500 hover:text-amber-400 bg-amber-950/10 border border-amber-900/30 px-2.5 py-1 rounded transition-colors shrink-0"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-550 shrink-0" />
                        <span>Registrar Pendência Vinculada</span>
                      </button>
                    </div>
                  </div>

                  {/* Linked pendency inline creation widget */}
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
