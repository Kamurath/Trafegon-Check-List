import React, { useState } from 'react';
import { Unit, StandardTask, TaskExecution } from '../types';
import { formatShortDate } from '../utils';
import { Calendar, Search, Filter, Info, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

interface HistoricoViewProps {
  units: Unit[];
  tasks: StandardTask[];
  executions: TaskExecution[];
  todayDate: string;
}

export default function HistoricoView({
  units,
  tasks,
  executions,
  todayDate
}: HistoricoViewProps) {
  const activeUnits = units.filter(u => u.active);
  const dailyTasks = tasks.filter(t => t.frequency === 'diario');
  
  // State for Unit Filter
  const [selectedUnitId, setSelectedUnitId] = useState('todas');
  
  // Let's generate the last 7 calendar days to display as a history matrix (Seg, Ter, Qua, Qui, Sex, Sáb, Dom)
  const getPastDays = (): string[] => {
    const list: string[] = [];
    const baseDate = new Date(todayDate);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      list.push(d.toISOString().split('T')[0]);
    }
    return list;
  };

  const pastDays = getPastDays();

  const getDayLabel = (dateStr: string): string => {
    const parts = dateStr.split('-');
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    return `${weekday.toUpperCase()} (${parts[2]}/${parts[1]})`;
  };

  // Filter units according to state
  const displayedUnits = selectedUnitId === 'todas'
    ? activeUnits
    : activeUnits.filter(u => u.id === selectedUnitId);

  return (
    <div className="space-y-6 bg-[#141414] p-5 rounded-xl border border-[#212121] shadow-xs">
      <div className="border-b border-[#262626] pb-4 space-y-1">
        <h3 className="text-xl font-display font-bold text-white">
          Matriz de Histórico de Rotinas
        </h3>
        <p className="text-sm text-gray-400">
          Veja a consistência de execução diária das unidades nos últimos 7 dias. Um indicador rápido de aderência aos procedimentos.
        </p>
      </div>

      {/* Filtros rápidos do Histórico */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#1A1A1A] p-4 rounded-lg border border-[#262626]">
        <Filter className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-xs font-bold text-gray-300 shrink-0">Filtrar para visualização:</span>
        <select
          value={selectedUnitId}
          onChange={(e) => setSelectedUnitId(e.target.value)}
          className="w-full sm:w-[280px] bg-[#141414] border border-[#2A2A2A] rounded p-1.5 text-xs text-white focus:ring-1 focus:ring-blue-500 cursor-pointer focus:outline-none"
        >
          <option value="todas" className="bg-[#141414]">Todas as Unidades Ativas</option>
          {activeUnits.map(u => (
            <option key={u.id} value={u.id} className="bg-[#141414]">[{u.region}] {u.name}</option>
          ))}
        </select>

        <div className="ml-auto text-[11px] text-gray-400 flex items-center gap-2">
          <span>Legenda:</span>
          <span className="flex items-center gap-0.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Executado</span>
          <span className="flex items-center gap-0.5"><XCircle className="w-3.5 h-3.5 text-rose-500" /> Pendente</span>
          <span className="flex items-center gap-0.5"><HelpCircle className="w-3.5 h-3.5 text-gray-500" /> N/A</span>
        </div>
      </div>

      {/* Grid de Timeline Matrix horizontal */}
      <div className="overflow-x-auto border border-[#262626] rounded-lg">
        <div className="min-w-[800px]">
          {displayedUnits.map(unit => {
            return (
              <div key={unit.id} className="border-b border-[#212121] last:border-0 p-4 hover:bg-[#1A1A1A]/40 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-bold font-mono text-blue-300 bg-blue-955/45 px-2 py-0.5 rounded uppercase mr-2 border border-blue-900/30">
                      REG: {unit.region}
                    </span>
                    <strong className="text-sm text-white font-display font-bold">{unit.name}</strong>
                  </div>
                  <span className="text-xs text-gray-400 italic">Contato: {unit.contactName || 'Não registrado'}</span>
                </div>

                {/* Sub-tabela de tarefas diárias pelos dias passados */}
                <div className="grid grid-cols-7 gap-2">
                  {pastDays.map(day => {
                    // Check if tasks are completed
                    const dayExecs = executions.filter(e => e.unitId === unit.id && e.date === day);
                    const completedTasksCount = dayExecs.filter(e => e.status === 'executado' && dailyTasks.some(t => t.id === e.taskId)).length;
                    
                    // Task list status for detail
                    const totalApplicable = dailyTasks.length;

                    return (
                      <div key={day} className="bg-[#1A1A1A]/90 border border-[#262626] rounded-lg p-3 text-center space-y-2 flex flex-col justify-between min-h-[140px] hover:border-[#333] transition-colors">
                        <div>
                          <p className="text-[10px] font-bold text-gray-300 border-b border-[#262626] pb-1 uppercase font-mono truncate">
                            {getDayLabel(day)}
                          </p>

                          <div className="mt-2 space-y-1">
                            {dailyTasks.map(task => {
                              const exec = dayExecs.find(e => e.taskId === task.id);
                              const status = exec ? exec.status : 'pendente';
                              
                              let symbol = <XCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" title={`${task.title}: Pendente`} />;
                              if (status === 'executado') {
                                symbol = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" title={`${task.title}: Executado`} />;
                              } else if (status === 'nao_se_aplica') {
                                symbol = <HelpCircle className="w-3.5 h-3.5 text-gray-500 mx-auto" title={`${task.title}: Não Se Aplica`} />;
                              }

                              return (
                                <div key={task.id} className="flex items-center justify-between text-[11px] px-1 py-0.5 hover:bg-[#202020] rounded">
                                  <span className="truncate text-gray-350 max-w-[55px] text-left text-gray-300 font-medium" title={task.title}>{task.title}</span>
                                  <span>{symbol}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Coeficiente final do mini card */}
                        <div className="pt-1.5 border-t border-[#262626] text-[10px] font-bold text-gray-400 font-mono">
                          {completedTasksCount}/{totalApplicable} Concluído
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-3 bg-amber-955/15 rounded-lg border border-amber-900/30 text-amber-400 text-xs flex items-center gap-2">
        <Info className="w-4 h-4 text-amber-500 shrink-0" />
        <span>Gostaria de registrar conclusões para datas passadas? Você pode alterar a data operacional no topo para dias anteriores e realizar o check diretamente.</span>
      </div>
    </div>
  );
}
