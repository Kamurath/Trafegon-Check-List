import React, { useState, useMemo } from 'react';
import { Unit, StandardTask, TaskExecution, TaskStatus, TaskPriority } from '../types';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Info,
  CheckCircle,
  AlertTriangle,
  Send
} from 'lucide-react';

interface ChecklistDiarioViewProps {
  units: Unit[];
  tasks: StandardTask[];
  executions: TaskExecution[];
  toggleTaskStatus: (unitId: string, taskId: string, date: string, currentStatus: any) => void;
  updateTaskNotes: (unitId: string, taskId: string, date: string, notes: string) => void;
  updateTaskPriority: (unitId: string, taskId: string, date: string, priority: TaskPriority) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  todayDate: string;
  initialUnitId?: string;
  onAddPendenciaObj: (newPend: any) => void;
  globalConfig?: any;
}

export default function ChecklistDiarioView({
  units,
  tasks,
  executions,
  toggleTaskStatus,
  updateTaskNotes,
  updateTaskPriority,
  selectedDate,
  setSelectedDate,
  todayDate,
  initialUnitId,
  onAddPendenciaObj,
  globalConfig
}: ChecklistDiarioViewProps) {
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

  // Determine if selected date is a designated postagem day from config
  const isPostagemDay = useMemo(() => {
    const parts = selectedDate.split('-');
    if (parts.length < 3) return false;
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const day = date.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
    const postagemDays = globalConfig?.postagemPrincipalDays || [1, 3, 5];
    return postagemDays.includes(day);
  }, [selectedDate, globalConfig]);

  // Filter daily tasks
  const dailyTasks = useMemo(() => {
    return tasks.filter(t => t.frequency === 'diario');
  }, [tasks]);

  const activeDailyTasks = useMemo(() => {
    return dailyTasks.filter(task => {
      if (task.id === 'postagem-principal') {
        return isPostagemDay;
      }
      return true;
    });
  }, [dailyTasks, isPostagemDay]);

  const filteredTasks = useMemo(() => {
    return activeDailyTasks.filter(task => {
      return task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             task.description.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [activeDailyTasks, searchTerm]);

  // Completion calculation for selected daily checklist
  const stats = useMemo(() => {
    if (!selectedUnitId) return { percentage: 0, completed: 0, total: 0 };
    
    let completed = 0;
    let na = 0;

    activeDailyTasks.forEach(task => {
      const execution = executions.find(
        e => e.unitId === selectedUnitId && e.date === selectedDate && e.taskId === task.id
      );
      if (execution?.status === 'executado') {
        completed++;
      } else if (execution?.status === 'nao_se_aplica') {
        na++;
      }
    });

    const total = activeDailyTasks.length;
    const expectedTotal = Math.max(0, total - na);
    const percentage = expectedTotal > 0 ? Math.round((completed / expectedTotal) * 100) : (total === na && total > 0 ? 100 : 0);

    return { percentage, completed, total };
  }, [selectedUnitId, selectedDate, activeDailyTasks, executions]);

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
    setPendencyDesc(`Falha no Checklist Diário [Unidade: ${currentUnit?.name}] - ${task.title} não realizado.`);
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
      notes: `Registrado a partir do Checklist Diário (Data: ${selectedDate.split('-').reverse().join('/')})`
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
          icon: <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 animate-pulse" />,
          bgColor: 'bg-rose-955/20 border-rose-900/40 text-rose-450',
          titleColor: 'text-rose-450 font-black'
        };
      case 'pendente':
      default:
        return {
          icon: <Clock className="w-5 h-5 text-sky-450" />,
          bgColor: 'bg-[#191919] border-[#202020] text-gray-350',
          titleColor: 'text-sky-400'
        };
    }
  };

  const getPriorityStyle = (priority?: TaskPriority) => {
    switch (priority) {
      case 'alta':
        return 'text-rose-400 bg-rose-950/40 border border-rose-900/45 font-bold';
      case 'baixa':
        return 'text-gray-400 bg-neutral-900 border border-neutral-800';
      case 'media':
      default:
        return 'text-amber-400 bg-amber-955/15 border border-amber-900/30';
    }
  };

  // Navigating dates by -1 / +1 day
  const changeDateByDays = (days: number) => {
    const parts = selectedDate.split('-');
    const current = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    current.setDate(current.getDate() + days);
    
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#141414] p-5 rounded-xl border border-[#212121] shadow-md shadow-black/15 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest block font-bold mb-1">Rotinas do Dia-a-Dia</span>
          <h2 className="text-2xl font-display font-extrabold text-white flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-sky-400" /> Checklist Diário de Atividades
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Revisão focal das tarefas diárias (como stories, notas e materiais locais) de cada unidade do Grupo ONE.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 shrink-0 select-none">
          <button 
            onClick={() => changeDateByDays(-1)}
            className="p-2 bg-[#1A1A1A] hover:bg-[#222] text-gray-400 hover:text-white rounded-lg border border-[#262626] transition-all cursor-pointer"
            title="Dia Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-black font-mono text-gray-200 px-3 py-2 bg-[#1A1A1A] border border-[#262626] rounded-lg">
            {selectedDate.split('-').reverse().join('/')}
          </span>

          <button 
            onClick={() => changeDateByDays(1)}
            className="p-2 bg-[#1A1A1A] hover:bg-[#222] text-gray-400 hover:text-white rounded-lg border border-[#262626] transition-all cursor-pointer"
            title="Próximo Dia"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Select Unit and Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-[#141414] p-5 rounded-xl border border-[#212121]">
        <div className="md:col-span-5 space-y-2">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Unidade Sob Monitoramento</label>
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
            <p className="text-xs text-gray-500 italic mt-1">Contato Local: {currentUnit.contactName}</p>
          )}
        </div>

        <div className="md:col-span-7 bg-[#1A1A1A] border border-[#262626] p-4 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-wide">Desempenho Diário da Clínica</span>
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
            <span>Completadas: <strong>{stats.completed}</strong></span>
            <span>Tarefas Diárias Totais: <strong>{stats.total}</strong></span>
          </div>
        </div>
      </div>

      {/* Checklist Search and Task List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Buscar por nome ou palavras-chaves da tarefa diária..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-xs text-white placeholder-gray-550 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="text-xs text-indigo-300 italic flex items-center gap-1.5 font-mono">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Postagem Principal gerada somente Seg, Qua, Sex (Hoje: {isPostagemDay ? 'SIM' : 'NÃO'})</span>
          </div>
        </div>

        {/* Task cards listing */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-[#141414] border border-[#212121] rounded-xl p-10 text-center text-gray-500">
              Nenhuma tarefa diária atende ao termo correspondente ou nenhuma tarefa diária cadastrada.
            </div>
          ) : (
            filteredTasks.map(task => {
              const execution = executions.find(
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

                          {/* Priority Toggle switcher */}
                          <button
                            type="button"
                            title="Clique para alternar prioridade da tarefa diária"
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
                        <p className="text-xs text-gray-455 leading-relaxed">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    {/* Status Toggle Switcher */}
                    <div className="flex items-center gap-1 border border-[#262626] rounded-lg p-0.5 bg-[#0F0F0F] shrink-0 select-none font-mono text-[9px]">
                      {([
                        { id: 'pendente', label: 'Pendente' },
                        { id: 'executado', label: 'Concluído' },
                        { id: 'atrasado', label: 'Atrasado' },
                        { id: 'nao_se_aplica', label: 'N/A' }
                      ] as { id: TaskStatus; label: string }[]).map(statusOpt => {
                        const isSelected = currentStatus === statusOpt.id;
                        
                        let selectStyle = 'text-gray-450 hover:text-white';
                        if (isSelected) {
                          if (statusOpt.id === 'executado') selectStyle = 'bg-emerald-600 text-white font-black shadow-md border border-emerald-500/20';
                          else if (statusOpt.id === 'atrasado') selectStyle = 'bg-rose-900/80 text-rose-200 font-black border border-rose-800';
                          else if (statusOpt.id === 'nao_se_aplica') selectStyle = 'bg-gray-800 text-gray-205 border border-gray-700';
                          else selectStyle = 'bg-amber-600 text-white font-black border border-amber-500/25';
                        }

                        return (
                          <button
                            key={statusOpt.id}
                            onClick={() => toggleTaskStatus(selectedUnitId, task.id, selectedDate, statusOpt.id)}
                            className={`px-2.5 py-1 rounded text-[10px] font-black uppercase transition-all whitespace-nowrap cursor-pointer ${selectStyle}`}
                          >
                            {statusOpt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comments Box and Register Linked Ocurrence panel */}
                  <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-400">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-bold text-gray-500 font-mono text-[10px]">OBS:</span>
                      {editingNotesId === task.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={tempNotes}
                            onChange={e => setTempNotes(e.target.value)}
                            placeholder="Gravar observações ou links do material postado..."
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
                            {pNotes ? `"${pNotes}"` : 'Sem observações registradas.'}
                          </span>
                          <button
                            onClick={() => startEditingNotes(task.id, pNotes)}
                            className="text-[11px] text-indigo-455 hover:text-indigo-400 font-semibold"
                          >
                            {pNotes ? 'Alterar Comentário' : '+ Adicionar Comentário'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="h-4 w-[1px] bg-white/5 hidden sm:block"></div>

                    {/* Register Linked Pendency */}
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

                  {/* HTML Linked Pendency inline widget */}
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
                          <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1">Cobrar Resposta de:</label>
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
