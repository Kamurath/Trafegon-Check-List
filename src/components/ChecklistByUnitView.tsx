import React, { useState } from 'react';
import { Unit, StandardTask, TaskExecution, TaskFrequency, TaskStatus } from '../types';
import { calculateCompletionRate, formatFriendlyDate, formatShortDate } from '../utils';
import { Calendar, CheckCircle2, Circle, AlertCircle, HelpCircle, ChevronRight, MessageSquare, Info, Star, Bookmark } from 'lucide-react';

interface ChecklistByUnitViewProps {
  units: Unit[];
  tasks: StandardTask[];
  executions: TaskExecution[];
  toggleTaskStatus: (unitId: string, taskId: string, date: string, currentStatus: any) => void;
  updateTaskNotes: (unitId: string, taskId: string, date: string, notes: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  todayDate: string;
  initialSelectedUnitId: string;
}

export default function ChecklistByUnitView({
  units,
  tasks,
  executions,
  toggleTaskStatus,
  updateTaskNotes,
  selectedDate,
  setSelectedDate,
  todayDate,
  initialSelectedUnitId
}: ChecklistByUnitViewProps) {
  const activeUnits = units.filter(u => u.active);
  const [selectedUnitId, setSelectedUnitId] = useState(initialSelectedUnitId || (activeUnits[0]?.id || ''));
  const [activeTab, setActiveTab] = useState<TaskFrequency | 'todas'>('todas');
  const [searchTaskTerm, setSearchTaskTerm] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  const currentUnit = units.find(u => u.id === selectedUnitId);

  // Group current tasks
  const frequencies: { value: TaskFrequency | 'todas'; label: string }[] = [
    { value: 'todas', label: 'Todas as Frequências' },
    { value: 'diario', label: 'Diárias' },
    { value: 'semanal', label: 'Semanais' },
    { value: 'quinzenal', label: 'Quinzenais (15d)' },
    { value: 'mensal', label: 'Mensais (30d)' },
  ];

  const filteredTasks = tasks.filter(task => {
    const matchesFrequency = activeTab === 'todas' || task.frequency === activeTab;
    const matchesSearch = task.title.toLowerCase().includes(searchTaskTerm.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchTaskTerm.toLowerCase());
    return matchesFrequency && matchesSearch;
  });

  const getStatusDisplay = (taskId: string) => {
    const execution = executions.find(
      e => e.unitId === selectedUnitId && e.date === selectedDate && e.taskId === taskId
    );
    const status = execution ? execution.status : 'pendente';
    
    switch (status) {
      case 'executado':
        return {
          statusId: 'executado' as TaskStatus,
          color: 'bg-emerald-950/60 text-emerald-450 border border-emerald-900/40',
          bgLight: 'border-[#1B2F2A] bg-[#101A18]/80',
          textClass: 'text-emerald-405 font-bold text-emerald-400',
          label: 'Executado',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
        };
      case 'nao_se_aplica':
        return {
          statusId: 'nao_se_aplica' as TaskStatus,
          color: 'bg-neutral-800 text-gray-200 border border-neutral-700',
          bgLight: 'border-[#2D2D2D] bg-[#141414]/90',
          textClass: 'text-gray-500 line-through',
          label: 'Não se aplica',
          icon: <HelpCircle className="w-5 h-5 text-gray-500 shrink-0" />
        };
      case 'pendente':
      default:
        return {
          statusId: 'pendente' as TaskStatus,
          color: 'bg-rose-955/60 text-rose-350 border border-rose-900/40',
          bgLight: 'border-[#2F1F22] bg-[#1C1214]/90',
          textClass: 'text-[#F43F5E] font-bold text-rose-400',
          label: 'Pendente',
          icon: <Circle className="w-5 h-5 text-rose-500 shrink-0" />
        };
    }
  };

  const handleNotesSave = (taskId: string) => {
    updateTaskNotes(selectedUnitId, taskId, selectedDate, tempNotes);
    setEditingNotesId(null);
  };

  const startEditingNotes = (taskId: string, currentNotes: string) => {
    setEditingNotesId(taskId);
    setTempNotes(currentNotes);
  };

  const getCompletionBadgeColor = (percentage: number) => {
    if (percentage === 100) return 'bg-emerald-950/45 text-emerald-400 border-emerald-900/30';
    if (percentage > 50) return 'bg-amber-950/45 text-amber-400 border-amber-900/30';
    return 'bg-rose-950/45 text-rose-450 border-rose-900/30';
  };

  const getFrequencyBadgeColor = (freq: TaskFrequency) => {
    switch (freq) {
      case 'diario': return 'bg-sky-950/50 text-sky-450 border border-sky-900/40';
      case 'semanal': return 'bg-purple-950/50 text-purple-405 border border-purple-900/40';
      case 'quinzenal': return 'bg-indigo-950/50 text-indigo-405 border border-indigo-900/40';
      case 'mensal': return 'bg-pink-950/50 text-pink-405 border border-pink-900/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Unidades & Resumos */}
      <div className="bg-[#141414] p-5 rounded-xl border border-[#212121] shadow-md shadow-black/10 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Painel Operacional</span>
            <label className="block text-sm font-semibold text-gray-300">Selecione a Unidade Espaçolaser:</label>
            <div className="relative">
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full sm:w-[320px] bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg py-2 pl-3 pr-8 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
              >
                {activeUnits.map(unit => (
                  <option key={unit.id} value={unit.id} className="bg-[#141414]">
                    [{unit.region}] {unit.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Taxa de Conclusão e Informações de Contato */}
          {currentUnit && (
            <div className="flex flex-wrap items-center gap-4 bg-[#1A1A1A] p-4 rounded-lg border border-[#262626]">
              <div className="text-left">
                <p className="text-[11px] uppercase font-mono tracking-wider text-gray-500 font-bold block">Status da Unidade</p>
                <p className="text-sm font-semibold text-gray-200">{currentUnit.contactName || 'Sem gerente mapeado'}</p>
                <p className="text-xs text-gray-400">Região de Atendimento: {currentUnit.region}</p>
              </div>

              <div className="h-10 w-[1px] bg-[#262626] hidden sm:block"></div>

              <div>
                <p className="text-[11px] uppercase font-mono tracking-wider text-gray-500 font-extrabold block">Conclusão Diária</p>
                {(() => {
                  const rate = calculateCompletionRate(selectedUnitId, selectedDate, tasks, executions);
                  return (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCompletionBadgeColor(rate.percentage)}`}>
                        {rate.percentage}% Concluído
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        ({rate.completed}/{rate.total} t)
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Data do Checklist */}
        <div className="pt-3 border-t border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-sm text-gray-300 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            Registros para o dia: <strong className="font-semibold text-white">{formatFriendlyDate(selectedDate, todayDate)}</strong> <span className="text-gray-400 text-xs font-mono">({formatShortDate(selectedDate)})</span>
          </p>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-[#262626] rounded-lg text-sm bg-[#1A1A1A] text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Abas de Frequência e Filtro Interno */}
      <div className="space-y-4">
        {/* Navegação de Abas */}
        <div className="flex overflow-x-auto pb-1 gap-1 border-b border-[#262626]">
          {frequencies.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2.5 rounded-t-lg text-sm font-semibold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                activeTab === tab.value
                  ? 'border-blue-500 text-blue-400 bg-blue-950/20 font-bold'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Busca de Tarefas e Dica de Procedimento */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:max-w-xs relative">
            <input
              type="text"
              placeholder="Buscar tarefa no checklist..."
              value={searchTaskTerm}
              onChange={(e) => setSearchTaskTerm(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#262626] bg-[#1A1A1A] text-white rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-gray-500 font-medium"
            />
          </div>

          <div className="p-2.5 bg-sky-950/15 rounded-lg border border-sky-900/30 flex items-center gap-2 text-sky-350 text-xs w-full sm:w-auto">
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
            <span>As tarefas concluídas acima são salvas em tempo real no seu dispositivo.</span>
          </div>
        </div>

        {/* Checklist Operacional de fato */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-[#141414] border border-[#212121] rounded-xl p-8 text-center text-gray-500">
              Não há tarefas registradas para esta frequência ou termo de busca.
            </div>
          ) : (
            filteredTasks.map(task => {
              const statusInfo = getStatusDisplay(task.id);
              const execution = executions.find(
                e => e.unitId === selectedUnitId && e.date === selectedDate && e.taskId === task.id
              );

              return (
                <div
                  key={task.id}
                  className={`border rounded-xl transition-all p-4 ${statusInfo.bgLight} shadow-sm`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Descrição e título da tarefa */}
                    <div className="flex gap-3">
                      <div className="mt-1 shrink-0">{statusInfo.icon}</div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={`text-[16px] font-bold ${statusInfo.textClass}`}>
                            {task.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getFrequencyBadgeColor(task.frequency)}`}>
                            {task.frequency}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    {/* Controlador do Status */}
                    <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-lg border border-[#2D2D2D] shrink-0 select-none">
                      {(['pendente', 'nao_se_aplica', 'executado'] as TaskStatus[]).map(statusOpt => {
                        const optLabels: { [key in TaskStatus]: string } = {
                          pendente: 'Pendente',
                          nao_se_aplica: 'N/A',
                          executado: 'Executado',
                          atrasado: 'Atrasado'
                        };

                        const optColors: { [key in TaskStatus]: string } = {
                          pendente: 'bg-rose-955/65 text-rose-350 border border-rose-900/60',
                          nao_se_aplica: 'bg-neutral-800 text-gray-200 border border-neutral-700',
                          executado: 'bg-emerald-955/65 text-emerald-400 border border-emerald-900/40',
                          atrasado: 'bg-rose-955/80 text-rose-200 border border-rose-900/80'
                        };

                        const isSelected = statusInfo.statusId === statusOpt;

                        return (
                          <button
                            key={statusOpt}
                            onClick={() => toggleTaskStatus(selectedUnitId, task.id, selectedDate, statusOpt)}
                            className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              isSelected
                                ? `${optColors[statusOpt]} shadow-sm`
                                : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
                            }`}
                          >
                            {optLabels[statusOpt]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Campo de Notas e Observações Específicas */}
                  <div className="mt-3 pt-3 border-t border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1A1A1A]/70 p-2.5 rounded-lg border border-[#242424]">
                    <div className="flex items-center gap-2 text-xs text-gray-450 w-full">
                      <span className="font-bold text-gray-500 shrink-0 font-mono">OBS:</span>
                      {editingNotesId === task.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            placeholder="Descreva detalhes específicos (ex: 'Unidade postou atrasado', 'Stories excelentes de depoimentos')"
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            className="w-full px-3 py-1 bg-[#141414] text-white border border-[#2D2D2D] rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                          <button
                            onClick={() => handleNotesSave(task.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs transition-colors shrink-0 cursor-pointer"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingNotesId(null)}
                            className="px-3 py-1 bg-[#262626] hover:bg-[#333] text-gray-300 rounded text-xs transition-colors shrink-0 cursor-pointer"
                          >
                            Voltar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="italic block truncate max-w-[500px] text-gray-400">
                            {execution?.notes ? `"${execution.notes}"` : 'Nenhum detalhe registrado para este check.'}
                          </span>
                          <button
                            onClick={() => startEditingNotes(task.id, execution?.notes || '')}
                            className="text-xs font-bold text-blue-400 hover:text-blue-300 focus:outline-none ml-2 shrink-0 cursor-pointer"
                          >
                            {execution?.notes ? 'Alterar Detalhe' : '+ Adicionar Comentário'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
