import React, { useState, useMemo, useEffect } from 'react';
import { Unit, StandardTask, TaskExecution, Pendencia } from '../types';
import { 
  Bell, 
  BellRing, 
  Check, 
  ExternalLink, 
  AlertTriangle, 
  Clock, 
  X, 
  AlertOctagon,
  CheckCircle,
  HelpCircle,
  Filter
} from 'lucide-react';

interface NotificationCenterProps {
  units: Unit[];
  tasks: StandardTask[];
  executions: TaskExecution[];
  pendencias: Pendencia[];
  selectedDate: string;
  todayDate: string;
  toggleTaskStatus: (unitId: string, taskId: string, date: string, status: any) => void;
  togglePendenciaStatus: (id: string) => void;
  onNavigateToSection: (section: string, unitId?: string) => void;
  sociaName?: string;
}

export interface AlertNotification {
  id: string;
  type: 'diario' | 'semanal' | 'mensal' | 'pendencia';
  title: string;
  message: string;
  urgency: 'alta' | 'media' | 'baixa'; // alta = red dot, media = yellow dot, baixa = gray dot
  unitName: string;
  unitId: string;
  taskId?: string;
  date?: string;
  pendenciaId?: string;
}

export default function NotificationCenter({
  units,
  tasks,
  executions,
  pendencias,
  selectedDate,
  todayDate,
  toggleTaskStatus,
  togglePendenciaStatus,
  onNavigateToSection,
  sociaName = 'Fritz TráfegON'
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<'todas' | 'urgente' | 'rotina' | 'pendencia'>('todas');
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Calculate Monday to Sunday dates for the week containing selectedDate
  const weekDates = useMemo(() => {
    const parts = selectedDate.split('-');
    if (parts.length < 3) return [];
    
    // Parse manually
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const day = date.getDay();
    // Monday of the week
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.getFullYear(), date.getMonth(), diff);
    
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const dy = String(d.getDate()).padStart(2, '0');
      dates.push(`${yr}-${mo}-${dy}`);
    }
    return dates;
  }, [selectedDate]);

  // Calculate live alerts based strictly on the current day's active daily routine
  const alerts: AlertNotification[] = useMemo(() => {
    const list: AlertNotification[] = [];
    const activeUnitsList = units.filter(u => u.active);

    const parts = todayDate.split('-');
    const dayOfWeek = parts.length === 3 ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getDay() : new Date().getDay();

    const postagemDays = [1, 3, 5]; // Mondays, Wednesdays, Fridays
    const isPostagemDay = postagemDays.includes(dayOfWeek);

    const dailyTasks = tasks.filter(t => t.frequency === 'diario');
    const activeDailyTasks = dailyTasks.filter(task => {
      if (task.id === 'postagem-principal') {
        return isPostagemDay;
      }
      if ((task.id === 'story-1' || task.id === 'nota-instagram') && dayOfWeek === 0) {
        return false;
      }
      return true;
    });

    // Generate alerts only for today's outstanding daily tasks
    activeUnitsList.forEach(u => {
      activeDailyTasks.forEach(task => {
        const foundExec = executions.find(
          e => e.unitId === u.id && e.date === todayDate && e.taskId === task.id
        );
        const isCompleted = foundExec && (foundExec.status === 'executado' || foundExec.status === 'nao_se_aplica');

        if (!isCompleted) {
          list.push({
            id: `daily_${u.id}_${task.id}_${todayDate}`,
            type: 'diario',
            title: 'Rotina Diária Pendente',
            message: `Procedimento "${task.title}" não foi atualizado hoje nesta unidade.`,
            urgency: 'alta',
            unitId: u.id,
            unitName: u.name,
            taskId: task.id,
            date: todayDate
          });
        }
      });
    });

    return list.filter(alert => !dismissedAlerts.includes(alert.id));
  }, [units, tasks, executions, todayDate, dismissedAlerts]);

  // Handle outside click to close notification box
  useEffect(() => {
    if (!isOpen) return;
    const handleClose = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#notification-bell-container')) {
        setIsOpen(false);
      }
    };
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [isOpen]);

  // Filter output
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (filterType === 'urgente') return a.urgency === 'alta';
      if (filterType === 'rotina') return a.type === 'diario' || a.type === 'semanal' || a.type === 'mensal';
      if (filterType === 'pendencia') return a.type === 'pendencia';
      return true;
    });
  }, [alerts, filterType]);

  const handleResolveAlert = (alert: AlertNotification) => {
    if (alert.type === 'pendencia' && alert.pendenciaId) {
      togglePendenciaStatus(alert.pendenciaId);
    } else if (alert.taskId && alert.date) {
      toggleTaskStatus(alert.unitId, alert.taskId, alert.date, 'executado');
    }
    // Remove from active alerts immediately by adding to dismissed
    setDismissedAlerts(prev => [...prev, alert.id]);
  };

  const handleDismissSingle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedAlerts(prev => [...prev, id]);
  };

  const handleInspectUnit = (unitId: string) => {
    onNavigateToSection('checklist', unitId);
    setIsOpen(false);
  };

  const highUrgencyCount = useMemo(() => {
    return alerts.filter(a => a.urgency === 'alta').length;
  }, [alerts]);

  return (
    <div className="relative" id="notification-bell-container">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-[#1A1A1A] border border-[#262626] hover:bg-[#202020] transition-all text-gray-300 hover:text-white cursor-pointer flex items-center justify-center shadow-inner"
        title="Central de Alertas Operacionais"
      >
        {highUrgencyCount > 0 ? (
          <BellRing className="w-5 h-5 text-amber-400 animate-pulse" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        
        {alerts.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full text-[9px] font-mono h-4 min-w-4 px-1 flex items-center justify-center font-bold border border-[#141414]">
            {alerts.length}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#141414] border border-[#2D2D2D] rounded-xl shadow-2xl shadow-black/80 z-50 overflow-hidden text-xs text-gray-300 transform origin-top-right transition-all">
          {/* Header */}
          <div className="p-4 bg-[#1C1C1C] border-b border-[#2D2D2D] flex items-center justify-between">
            <div>
              <h4 className="font-display font-extrabold text-white text-sm flex items-center gap-1.5">
                Central de Alertas 
                <span className="text-[10px] font-semibold bg-amber-955/40 text-amber-400 px-2 py-0.2 border border-amber-900/30 rounded-full font-mono">
                  {alerts.length} Ativos
                </span>
              </h4>
              <p className="text-[10px] text-gray-500 mt-0.5">Pendências e rotinas com prazo de entrega extrapolado.</p>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-[#2A2A2A] text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Filters */}
          <div className="px-3 py-2 bg-[#181818] border-b border-[#242424] flex items-center gap-1 overflow-x-auto select-none">
            <span className="text-[9px] text-gray-500 font-bold uppercase shrink-0 mr-1 flex items-center gap-0.5">
              <Filter className="w-2.5 h-2.5" /> Filtrar:
            </span>
            <button
              onClick={() => setFilterType('todas')}
              className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                filterType === 'todas' ? 'bg-[#292929] text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterType('urgente')}
              className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                filterType === 'urgente' ? 'bg-rose-950/40 text-rose-455' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Críticas
            </button>
            <button
              onClick={() => setFilterType('rotina')}
              className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                filterType === 'rotina' ? 'bg-blue-900/40 text-blue-300' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Rotinas
            </button>
            <button
              onClick={() => setFilterType('pendencia')}
              className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                filterType === 'pendencia' ? 'bg-amber-900/30 text-amber-400' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Gargalos
            </button>
          </div>

          {/* Alerts list */}
          <div className="max-h-[350px] overflow-y-auto divide-y divide-[#212121]">
            {filteredAlerts.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-semibold text-white">Tudo em dia!</p>
                <p className="text-[10px] text-gray-500">Parabéns {sociaName.split(' ')[0]}! Sem rotinas de comunicação pendentes ou pendências críticas no painel.</p>
              </div>
            ) : (
              filteredAlerts.map(alert => {
                const isUrgent = alert.urgency === 'alta';
                
                return (
                  <div
                    key={alert.id}
                    className="p-3.5 hover:bg-[#181818] transition-colors relative flex gap-3 select-text"
                  >
                    {/* Status Dot / Indicator Icon */}
                    <div className="shrink-0 pt-0.5">
                      {alert.type === 'pendencia' ? (
                        <AlertOctagon className="w-5 h-5 text-rose-500" />
                      ) : alert.urgency === 'alta' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-blue-400" />
                      )}
                    </div>

                    {/* Alert Info Body */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[9px] font-bold uppercase text-gray-550 flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                            isUrgent ? 'bg-rose-500 animate-ping' : 'bg-amber-500'
                          }`}></span>
                          {alert.unitName.replace('Espaçolaser - ', '')}
                        </span>
                        
                        {/* Dismiss alert */}
                        <button
                          onClick={(e) => handleDismissSingle(alert.id, e)}
                          className="text-gray-600 hover:text-gray-400 cursor-pointer"
                          title="Soneca/Ignorar"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      <h5 className="font-bold text-white text-[11px] leading-tight flex items-center justify-between">
                        {alert.title}
                      </h5>
                      
                      <p className="text-[11px] text-gray-400 leading-relaxed font-sans">{alert.message}</p>

                      {/* CTA Action Buttons Inside Alert */}
                      <div className="flex items-center gap-2 pt-2 pb-0.5 select-none">
                        <button
                          onClick={() => handleResolveAlert(alert)}
                          className="px-2.5 py-1 bg-emerald-950/50 text-emerald-400 hover:bg-emerald-900/40 border border-emerald-900/30 rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all"
                        >
                          <Check className="w-3 h-3" />
                          {alert.type === 'pendencia' ? 'Marcar Resolvido' : 'Concluir Agora'}
                        </button>

                        <button
                          onClick={() => handleInspectUnit(alert.unitId)}
                          className="px-2 py-1 bg-[#222] text-gray-300 hover:bg-[#2E2E2E] hover:text-white rounded text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer transition-all"
                        >
                          Acesssar Clínica <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer of panel */}
          <div className="p-3 bg-[#1C1C1C] border-t border-[#2D2D2D] text-center">
            <span className="text-[10px] text-gray-500 font-mono tracking-widest font-medium">ALERT ENGINE ACTIVE • TRÁFEGON</span>
          </div>
        </div>
      )}
    </div>
  );
}
