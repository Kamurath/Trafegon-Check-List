/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Unit, StandardTask, TaskExecution, Pendencia, TaskFrequency, TaskStatus, TaskPriority, GlobalConfig, SystemChangeLog, QuickSuggestion } from './types';
import { INITIAL_UNITS, INITIAL_STANDARD_TASKS, INITIAL_PENDENCIAS } from './data/initialData';
import { INITIAL_SUGGESTIONS } from './data/initialSuggestions';

// Core and New views imports
import HojeView from './components/HojeView';
import SugestoesRapidasView from './components/SugestoesRapidasView';
import DashboardView from './components/DashboardView';
import UnidadesView from './components/UnidadesView';
import ChecklistDiarioView from './components/ChecklistDiarioView';
import ChecklistQuinzenalView from './components/ChecklistQuinzenalView';
import ChecklistSemanalView from './components/ChecklistSemanalView';
import ChecklistMensalView from './components/ChecklistMensalView';
import PendenciasView from './components/PendenciasView';
import CronogramaView from './components/CronogramaView';
import LivesView from './components/LivesView';
import ReunioesView from './components/ReunioesView';
import RelatoriosView from './components/RelatoriosView';
import ConfiguracoesView from './components/ConfiguracoesView';
import NotificationCenter from './components/NotificationCenter';

// Icons import from lucide-react
import { 
  Calendar, 
  BarChart, 
  Building2, 
  CheckCircle, 
  CalendarDays, 
  CalendarCheck, 
  AlertTriangle, 
  Clock, 
  Radio, 
  Users, 
  FileText, 
  Settings,
  Menu,
  X,
  User,
  ArrowUpRight,
  Layers,
  Sparkles,
  Lightbulb,
  Sun,
  Moon
} from 'lucide-react';

export default function App() {
  // Theme state: locked strictly to 'dark' (Modo Noite) for a permanent luxurious aesthetic
  const theme = 'dark';

  // Current operational date in local timezone YYYY-MM-DD
  const todayDateString = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayDateString);

  // Core navigation state (defaults to 'hoje')
  const [activeTab, setActiveTab] = useState<string>('hoje');
  const [focusedUnitId, setFocusedUnitId] = useState<string>('');
  
  // Mobile navigation drawers states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Local storage lists
  const [units, setUnits] = useState<Unit[]>([]);
  const [tasks, setTasks] = useState<StandardTask[]>([]);
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);

  // Settings custom states
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({
    postagemPrincipalDays: [1, 3, 5],
    storiesFrequency: '1 story diário (Story 1)',
    instagramNotesFrequency: '1 nota diária (Insira Nota)',
    tiktokFrequency: '3 postagens semanais',
    livesFrequency: '1 vez por semana',
    reuniaoQuinzenal: '2026-05-30T10:00',
    cronogramaMensalPrazo: '2026-06-05',
    suggestedPublishTimes: ['09:00', '11:00', '12:00'],
    specialDates: [],
    criteriosStatusVerde: 'Unidade executou Story 1, Insira Nota, postagem principal de feed e sem pendências ativas.',
    criteriosStatusAmarelo: 'Algum story diário ou nota em atraso.',
    criteriosStatusVermelho: 'Qualquer pendência de gravidade ALTA/CRÍTICA aberta.'
  });
  const [changeLogs, setChangeLogs] = useState<SystemChangeLog[]>([]);
  const [suggestions, setSuggestions] = useState<QuickSuggestion[]>([]);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedUnits = localStorage.getItem('trafegon_units');
    const savedTasks = localStorage.getItem('trafegon_tasks');
    const savedExecs = localStorage.getItem('trafegon_executions');
    const savedPendencias = localStorage.getItem('trafegon_pendencias');
    const savedConfig = localStorage.getItem('trafegon_global_config');
    const savedLogs = localStorage.getItem('trafegon_change_history');
    const savedSuggestions = localStorage.getItem('trafegon_suggestions');

    if (savedUnits && localStorage.getItem('trafegon_units_v2') === 'true') {
      setUnits(JSON.parse(savedUnits));
    } else {
      setUnits(INITIAL_UNITS);
      localStorage.setItem('trafegon_units', JSON.stringify(INITIAL_UNITS));
      localStorage.setItem('trafegon_units_v2', 'true');
    }

    if (savedTasks) {
      let parsed = JSON.parse(savedTasks) as StandardTask[];
      parsed = parsed.filter(t => t.frequency !== 'diario' || !['story-2', 'story-3', 'story-real', 'bastidor'].includes(t.id));
      parsed = parsed.map(t => {
        if (t.id === 'nota-instagram') {
          return { ...t, title: 'Insira Nota' };
        }
        return t;
      });
      setTasks(parsed);
      localStorage.setItem('trafegon_tasks', JSON.stringify(parsed));
    } else {
      setTasks(INITIAL_STANDARD_TASKS);
      localStorage.setItem('trafegon_tasks', JSON.stringify(INITIAL_STANDARD_TASKS));
    }

    if (savedExecs) {
      setExecutions(JSON.parse(savedExecs));
    } else {
      setExecutions([]);
      localStorage.setItem('trafegon_executions', JSON.stringify([]));
    }

    if (savedPendencias) {
      setPendencias(JSON.parse(savedPendencias));
    } else {
      setPendencias(INITIAL_PENDENCIAS);
      localStorage.setItem('trafegon_pendencias', JSON.stringify(INITIAL_PENDENCIAS));
    }

    if (savedConfig) {
      setGlobalConfig(JSON.parse(savedConfig));
    } else {
      localStorage.setItem('trafegon_global_config', JSON.stringify({
        postagemPrincipalDays: [1, 3, 5],
        storiesFrequency: '1 story diário (Story 1)',
        instagramNotesFrequency: '1 nota diária (Insira Nota)',
        tiktokFrequency: '3 postagens semanais',
        livesFrequency: '1 vez por semana',
        reuniaoQuinzenal: '2026-05-30T10:00',
        cronogramaMensalPrazo: '2026-06-05',
        suggestedPublishTimes: ['09:00', '11:00', '12:00'],
        specialDates: [],
        criteriosStatusVerde: 'Unidade executou Story 1, Insira Nota, postagem principal de feed e sem pendências ativas.',
        criteriosStatusAmarelo: 'Algum story diário ou nota em atraso.',
        criteriosStatusVermelho: 'Qualquer pendência de gravidade ALTA/CRÍTICA aberta.'
      }));
    }

    if (savedLogs) {
      setChangeLogs(JSON.parse(savedLogs));
    } else {
      localStorage.setItem('trafegon_change_history', JSON.stringify([]));
    }

    if (savedSuggestions) {
      setSuggestions(JSON.parse(savedSuggestions));
    } else {
      setSuggestions(INITIAL_SUGGESTIONS);
      localStorage.setItem('trafegon_suggestions', JSON.stringify(INITIAL_SUGGESTIONS));
    }
  }, []);

  // Theme effect locked to dark selector on root element
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('trafegon_theme', 'dark');
  }, []);

  // Helper write back to localStorage
  const saveSuggestions = (updated: QuickSuggestion[]) => {
    setSuggestions(updated);
    localStorage.setItem('trafegon_suggestions', JSON.stringify(updated));
  };

  const saveUnits = (updated: Unit[]) => {
    setUnits(updated);
    localStorage.setItem('trafegon_units', JSON.stringify(updated));
  };

  const saveTasks = (updated: StandardTask[]) => {
    setTasks(updated);
    localStorage.setItem('trafegon_tasks', JSON.stringify(updated));
  };

  const saveGlobalConfig = (updated: GlobalConfig) => {
    setGlobalConfig(updated);
    localStorage.setItem('trafegon_global_config', JSON.stringify(updated));
  };

  const saveChangeLogs = (updated: SystemChangeLog[]) => {
    setChangeLogs(updated);
    localStorage.setItem('trafegon_change_history', JSON.stringify(updated));
  };

  const saveExecutions = (updated: TaskExecution[]) => {
    setExecutions(updated);
    localStorage.setItem('trafegon_executions', JSON.stringify(updated));
  };

  const savePendencias = (updated: Pendencia[]) => {
    setPendencias(updated);
    localStorage.setItem('trafegon_pendencias', JSON.stringify(updated));
  };

  // Automated Task Generation Effect for Selected Date (Requirement: Criar histórico diário)
  useEffect(() => {
    if (!selectedDate || units.length === 0 || tasks.length === 0) return;
    
    const parts = selectedDate.split('-');
    if (parts.length < 3) return;
    const targetDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon...
    
    const postagemDays = globalConfig?.postagemPrincipalDays || [1, 3, 5];
    const isPostagemDay = postagemDays.includes(dayOfWeek);

    const dailyTasks = tasks.filter(t => t.frequency === 'diario');
    const activeDailyTasks = dailyTasks.filter(task => {
      if (task.id === 'postagem-principal') {
        return isPostagemDay;
      }
      return true;
    });

    const activeUnits = units.filter(u => u.active);
    if (activeUnits.length > 0 && activeDailyTasks.length > 0) {
      const newExecs: TaskExecution[] = [];
      activeUnits.forEach(unit => {
        activeDailyTasks.forEach(task => {
          // Check if this execution already exists for this unit, task and date
          const exists = executions.some(e => e.unitId === unit.id && e.taskId === task.id && e.date === selectedDate);
          if (!exists) {
            newExecs.push({
              date: selectedDate,
              unitId: unit.id,
              taskId: task.id,
              status: 'pendente',
              updatedBy: 'Sistema (Auto)',
              updatedAt: new Date().toISOString()
            });
          }
        });
      });

      if (newExecs.length > 0) {
        // Safe append to state and local storage
        const updated = [...executions, ...newExecs];
        setExecutions(updated);
        localStorage.setItem('trafegon_executions', JSON.stringify(updated));
      }
    }
  }, [selectedDate, units, tasks, executions, globalConfig]);

  // Date-specific Reset with Audit Trail (Requirement: Permitir reset diário das tarefas com salvamento de histórico opcional)
  const handleResetForDate = (dateStr: string) => {
    const confirmReset = window.confirm(`Deseja retornar todas as tarefas do dia ${dateStr.split('-').reverse().join('/')} ao estado pendente?`);
    if (!confirmReset) return;

    const saveHistory = window.confirm("Deseja salvar o histórico antes de resetar?");
    if (saveHistory) {
      // Record state of completions prior to reset for changeLogs
      const activeUnits = units.filter(u => u.active);
      let total = 0;
      let completed = 0;
      
      activeUnits.forEach(unit => {
        const dailyTasks = tasks.filter(t => t.frequency === 'diario');
        const parts = dateStr.split('-');
        const dayOfWeek = parts.length === 3 ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getDay() : 1;
        const postagemDays = globalConfig?.postagemPrincipalDays || [1, 3, 5];
        const isPostagemDay = postagemDays.includes(dayOfWeek);
        const activeDailyTasks = dailyTasks.filter(task => task.id !== 'postagem-principal' || isPostagemDay);

        activeDailyTasks.forEach(task => {
          total++;
          const exec = executions.find(e => e.unitId === unit.id && e.date === dateStr && e.taskId === task.id);
          if (exec?.status === 'executado') {
            completed++;
          }
        });
      });

      const rate = total > 0 ? Math.round((completed / total) * 100) : 100;
      
      const newLog: SystemChangeLog = {
        id: 'log_' + Date.now(),
        date: new Date().toISOString(),
        description: `Reset de Tarefas do dia ${dateStr.split('-').reverse().join('/')}`,
        oldValue: `Aderência antes do reset: ${rate}% (${completed}/${total} tarefas concluídas)`,
        newValue: `Resetado para Pendente por solicitação de Agência TráfegON`,
        reason: 'Reset de conformidade operacional diária com preservação de auditoria',
        origin: 'ajuste_interno'
      };
      saveChangeLogs([newLog, ...changeLogs]);
    }

    // Perform the purge of existing executions for this day and regenerate them as pendente
    const remainExecs = executions.filter(e => e.date !== dateStr);
    
    const parts = dateStr.split('-');
    const dayOfWeek = parts.length === 3 ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getDay() : 1;
    const postagemDays = globalConfig?.postagemPrincipalDays || [1, 3, 5];
    const isPostagemDay = postagemDays.includes(dayOfWeek);
    const dailyTasks = tasks.filter(t => t.frequency === 'diario');
    const activeDailyTasks = dailyTasks.filter(task => task.id !== 'postagem-principal' || isPostagemDay);

    const activeUnits = units.filter(u => u.active);
    const newExecs: TaskExecution[] = [];
    activeUnits.forEach(unit => {
      activeDailyTasks.forEach(task => {
        newExecs.push({
          date: dateStr,
          unitId: unit.id,
          taskId: task.id,
          status: 'pendente',
          updatedBy: 'Sistema (Reset)',
          updatedAt: new Date().toISOString()
        });
      });
    });

    saveExecutions([...remainExecs, ...newExecs]);
  };


  // State actions
  const toggleTaskStatus = (
    unitId: string, 
    taskId: string, 
    date: string, 
    status: TaskStatus
  ) => {
    const index = executions.findIndex(
      e => e.unitId === unitId && e.taskId === taskId && e.date === date
    );

    let updatedExecs = [...executions];

    if (index !== -1) {
      updatedExecs[index] = {
        ...updatedExecs[index],
        status,
        updatedAt: new Date().toISOString()
      };
    } else {
      updatedExecs.push({
        date,
        unitId,
        taskId,
        status,
        updatedBy: 'Agência TráfegON',
        updatedAt: new Date().toISOString()
      });
    }

    saveExecutions(updatedExecs);
  };

  const updateTaskNotes = (
    unitId: string, 
    taskId: string, 
    date: string, 
    notes: string
  ) => {
    const index = executions.findIndex(
      e => e.unitId === unitId && e.taskId === taskId && e.date === date
    );

    let updatedExecs = [...executions];

    if (index !== -1) {
      updatedExecs[index] = {
        ...updatedExecs[index],
        notes,
        updatedAt: new Date().toISOString()
      };
    } else {
      updatedExecs.push({
        date,
        unitId,
        taskId,
        status: 'pendente',
        notes,
        updatedBy: 'Agência TráfegON',
        updatedAt: new Date().toISOString()
      });
    }

    saveExecutions(updatedExecs);
  };

  const updateTaskPriority = (
    unitId: string, 
    taskId: string, 
    date: string, 
    priority: TaskPriority
  ) => {
    const index = executions.findIndex(
      e => e.unitId === unitId && e.taskId === taskId && e.date === date
    );

    let updatedExecs = [...executions];

    if (index !== -1) {
      updatedExecs[index] = {
        ...updatedExecs[index],
        priority,
        updatedAt: new Date().toISOString()
      };
    } else {
      updatedExecs.push({
        date,
        unitId,
        taskId,
        status: 'pendente',
        priority,
        updatedBy: 'Agência TráfegON',
        updatedAt: new Date().toISOString()
      });
    }

    saveExecutions(updatedExecs);
  };

  // Add Pendencia
  const handleAddPendenciaObj = (newPend: any) => {
    const mappedPriority = newPend.priority || (newPend.urgency === 'alta' ? 'alta' : newPend.urgency === 'baixa' ? 'baixa' : 'media');
    const mappedStatus = newPend.status === 'aberta' ? 'pendente' : (newPend.status || 'pendente');
    const mappedOrigin = newPend.origin || 'outro';
    const mappedResponsible = newPend.responsible || 'gerente';

    const freshPend: Pendencia = {
      id: 'p_' + Date.now(),
      unitId: newPend.unitId,
      description: newPend.description,
      responsible: mappedResponsible,
      dateAdded: todayDateString,
      prazo: newPend.prazo || '',
      status: mappedStatus as any,
      priority: mappedPriority as any,
      notes: newPend.notes || '',
      origin: mappedOrigin,
      resolvedDate: newPend.resolvedDate || '',
      resolvedNotes: newPend.resolvedNotes || '',
      resolvedBy: newPend.resolvedBy || '',
      urgency: (mappedPriority === 'critica' ? 'alta' : mappedPriority) as any
    };
    savePendencias([freshPend, ...pendencias]);
  };

  const updatePendencia = (updatedPend: Pendencia) => {
    const updated = pendencias.map(p => p.id === updatedPend.id ? updatedPend : p);
    savePendencias(updated);
  };

  const togglePendenciaStatus = (id: string) => {
    const updated = pendencias.map(p => {
      if (p.id === id) {
        const isResolved = p.status === 'resolvido';
        const nextStatus = isResolved ? 'pendente' : 'resolvido';
        return {
          ...p,
          status: nextStatus as any,
          resolvedDate: nextStatus === 'resolvido' ? todayDateString : '',
          resolvedBy: nextStatus === 'resolvido' ? 'Agência TráfegON' : '',
          resolvedNotes: nextStatus === 'resolvido' ? 'Resolvido via alteração rápida' : ''
        };
      }
      return p;
    });
    savePendencias(updated);
  };

  const deletePendencia = (id: string) => {
    const updated = pendencias.filter(p => p.id !== id);
    savePendencias(updated);
  };

  // Settings: Add Unit
  const handleAddNewUnit = (
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
  ) => {
    const newU: Unit = {
      id: 'u_' + Date.now(),
      name,
      region: region || 'PE',
      contactName: contactName || gerente || 'Ponto de Contato',
      sigla: sigla || region || 'EXP',
      cidadeUf: cidadeUf || `${name}/${region}`,
      active: true,
      gerente: gerente || contactName || 'Gerente',
      socia: socia || 'Sócia Responsável',
      instagramUrl: instagramUrl || 'https://www.instagram.com/espacolaser',
      tiktokUrl: tiktokUrl || 'https://www.tiktok.com/@espacolaser',
      notes: notes || '',
      useStandardChecklist: true,
      hasStoriesControle: true,
      hasInstagramNota: true,
      hasPostagemPrincipal: true,
      hasPendenciasControle: true,
      hasColaboracaoControle: true,
      hasDashboardEntrada: true,
      hasReuniaoEntrada: true,
      hasRelatoriosEntrada: true,
      extraTasks: [],
      removedTasks: [],
      pausedTasks: []
    };
    saveUnits([...units, newU]);
  };

  const handleUpdateUnit = (updatedUnit: Unit) => {
    const updated = units.map(u => u.id === updatedUnit.id ? updatedUnit : u);
    saveUnits(updated);
  };

  const toggleUnitActive = (id: string) => {
    const updated = units.map(u => {
      if (u.id === id) {
        return { ...u, active: !u.active };
      }
      return u;
    });
    saveUnits(updated);
  };

  const deleteUnit = (id: string) => {
    const updated = units.filter(u => u.id !== id);
    saveUnits(updated);
  };

  // Settings: Add Routine Task
  const handleAddNewTask = (title: string, frequency: TaskFrequency, description: string) => {
    const newT: StandardTask = {
      id: 't_' + Date.now(),
      title,
      frequency,
      description
    };
    saveTasks([...tasks, newT]);
  };

  const handleUpdateTask = (updatedTask: StandardTask) => {
    const updated = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
  };

  // Reset entire database to default
  const handleResetToFactoryDefault = () => {
    setUnits(INITIAL_UNITS);
    setTasks(INITIAL_STANDARD_TASKS);
    setExecutions([]);
    setPendencias(INITIAL_PENDENCIAS);

    localStorage.setItem('trafegon_units', JSON.stringify(INITIAL_UNITS));
    localStorage.setItem('trafegon_tasks', JSON.stringify(INITIAL_STANDARD_TASKS));
    localStorage.setItem('trafegon_executions', JSON.stringify([]));
    localStorage.setItem('trafegon_pendencias', JSON.stringify(INITIAL_PENDENCIAS));
  };

  // Cross-navigation support between sections (maps old checklist to checklist_diario)
  const selectSectionAndFocusUnit = (section: string, unitId?: string) => {
    let resolvedSection = section;
    if (section === 'checklist' || section === 'checklist_diario') {
      resolvedSection = 'checklist_diario';
    }
    setActiveTab(resolvedSection);
    if (unitId) {
      setFocusedUnitId(unitId);
    }
    setIsMobileMenuOpen(false);
  };

  // Dynamic Array mapping our requested tabs for absolute consistency
  const navigationItems = [
    { id: 'hoje', label: 'Hoje', icon: Calendar, color: 'text-blue-400' },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart, color: 'text-violet-400' },
    { id: 'unidades', label: 'Unidades', icon: Building2, color: 'text-indigo-400' },
    { id: 'checklist_diario', label: 'Checklist Diário', icon: CheckCircle, color: 'text-sky-400' },
    { id: 'sugestoes', label: 'Sugestões Rápidas', icon: Sparkles, color: 'text-amber-400' },
    { id: 'checklist_quinzenal', label: 'Checklist Quinzenal', icon: Layers, color: 'text-teal-400' },
    { id: 'checklist_semanal', label: 'Checklist Semanal', icon: CalendarDays, color: 'text-purple-400' },
    { id: 'checklist_mensal', label: 'Checklist Mensal', icon: CalendarCheck, color: 'text-pink-400' },
    { id: 'pendencias', label: 'Pendências', icon: AlertTriangle, color: 'text-rose-400', badgeCount: pendencias.filter(p => p.status === 'pendente' || p.status === 'em_andamento').length },
    { id: 'cronograma', label: 'Cronograma', icon: Clock, color: 'text-teal-400' },
    { id: 'lives', label: 'Lives', icon: Radio, color: 'text-amber-400' },
    { id: 'reunioes', label: 'Reuniões', icon: Users, color: 'text-cyan-400' },
    { id: 'relatorios', label: 'Relatórios', icon: FileText, color: 'text-slate-400' },
    { id: 'configuracoes', label: 'Configurações', icon: Settings, color: 'text-gray-400' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] flex flex-col md:flex-row font-sans antialiased selection:bg-blue-950 selection:text-white">
      
      {/* 1. DESKTOP STICKY LEFT SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-[#141414] border-r border-[#262626] h-screen sticky top-0 shrink-0 select-none">
        {/* Sidebar Brand header */}
        <div className="p-5 border-b border-[#212121] flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-display font-black text-lg rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10 tracking-tighter shrink-0">
            T
          </div>
          <div>
            <h1 className="font-display font-black text-base tracking-tight text-white flex items-center gap-1 leading-none">
              TráfegON <span className="text-blue-450 font-extrabold text-[10px] px-1.5 py-0.2 rounded bg-[#1C1C1C] border border-[#2C2C2C] uppercase font-mono">Check</span>
            </h1>
            <span className="text-[9px] text-[#808080] font-bold font-mono tracking-wider">GERENCIAL • ESPAÇOLASER</span>
          </div>
        </div>

        {/* Sidebar navigation list */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-neutral-850">
          {navigationItems.map(item => {
            const IconComponent = item.icon;
            const isTabActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'checklist_diario' || item.id === 'checklist_semanal' || item.id === 'checklist_mensal') {
                    const activeUs = units.filter(u => u.active);
                    if (activeUs.length > 0 && !focusedUnitId) {
                      setFocusedUnitId(activeUs[0].id);
                    }
                  }
                  setActiveTab(item.id);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isTabActive
                    ? 'bg-[#1C1C1C] text-white border border-[#333333] shadow-xs shadow-black/40'
                    : 'text-slate-400 hover:text-white hover:bg-[#1C1C1C] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <IconComponent className={`w-4 h-4 ${item.color}`} />
                  <span>{item.label}</span>
                </div>

                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className="bg-rose-500 text-white rounded-full px-1.5 py-0.2 text-[9px] font-mono font-black scale-95">
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop sidebar bottom footer profile */}
        <div className="p-4 border-t border-[#212121] bg-[#111111] flex items-center gap-3 shrink-0">
          <div className="relative">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 border border-[#141414] animate-pulse"></span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-700 to-blue-600 flex items-center justify-center font-bold font-mono text-xs text-white shadow-inner">
              FT
            </div>
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-white leading-tight">Fritz TráfegON</p>
            <p className="text-[9px] text-[#757575] font-mono font-medium">Controlador de Tráfego</p>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE TOP STICKY HEADER & DRAWER */}
      <header className="md:hidden sticky top-0 z-40 bg-[#141414] border-b border-[#262626] h-16 flex items-center justify-between px-4 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-gray-300 hover:text-white focus:outline-none"
            title="Abrir Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-650 text-white font-black text-base rounded-lg flex items-center justify-center shadow-lg">
              T
            </div>
            <h1 className="font-display font-black text-sm tracking-tight text-white leading-none">
              TráfegON <span className="text-blue-400 font-bold text-[10px] font-mono">Check</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationCenter 
            units={units}
            tasks={tasks}
            executions={executions}
            pendencias={pendencias}
            selectedDate={selectedDate}
            todayDate={todayDateString}
            toggleTaskStatus={toggleTaskStatus}
            togglePendenciaStatus={togglePendenciaStatus}
            onNavigateToSection={selectSectionAndFocusUnit}
          />

          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
        </div>
      </header>

      {/* Mobile sidebar sliding overlay panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop screen fog */}
          <div 
            className="fixed inset-0 bg-black/85 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer structural sheet */}
          <div className="relative flex flex-col w-64 max-w-xs bg-[#141414] border-r border-[#262626] h-full z-10 animate-slideRight">
            {/* Drawer Brand title */}
            <div className="p-4 border-b border-[#212121] flex items-center justify-between bg-[#181818]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 text-white font-black text-xs rounded-lg flex items-center justify-center">
                  T
                </div>
                <span className="font-display font-black text-xs text-white">Menu de Navegação</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-white"
                title="Fechar Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List navigation in mobile */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navigationItems.map(item => {
                const IconComponent = item.icon;
                const isTabActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'checklist_diario' || item.id === 'checklist_semanal' || item.id === 'checklist_mensal') {
                        const activeUs = units.filter(u => u.active);
                        if (activeUs.length > 0 && !focusedUnitId) {
                          setFocusedUnitId(activeUs[0].id);
                        }
                      }
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      isTabActive
                        ? 'bg-[#1C1C1C] text-white border border-[#303030]'
                        : 'text-slate-400 hover:text-white hover:bg-[#1A1A1A] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent className={`w-4 h-4 ${item.color}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span className="bg-rose-500 text-white rounded-full px-1.5 py-0.2 text-[9px] font-mono">
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile drawer profile info */}
            <div className="p-4 border-t border-[#212121] bg-[#111111] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center font-bold font-mono text-xs text-white">
                FT
              </div>
              <div>
                <p className="text-xs font-black text-white">Fritz TráfegON</p>
                <p className="text-[9px] text-gray-500 font-mono">Operacional Espaçolaser</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. RIGHT CONTENT AREA (STRETCHES NEXT TO DESKTOP SIDEBAR) */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto main-content-portal">
        
        {/* Desktop Header panel elements */}
        <header className="hidden md:flex h-16 border-b border-[#212121] bg-[#141414] px-6 items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>TráfegON Check ativo para o Grupo ONE • Controle Gerencial Espaçolaser</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono bg-[#1A1A1A] text-slate-300 px-3 py-1 rounded-full font-semibold border border-[#262626]">
              📅 Operacional de Hoje: {todayDateString.split('-').reverse().join('/')}
            </span>

            {/* Central de Alertas Dropdown */}
            <NotificationCenter 
              units={units}
              tasks={tasks}
              executions={executions}
              pendencias={pendencias}
              selectedDate={selectedDate}
              todayDate={todayDateString}
              toggleTaskStatus={toggleTaskStatus}
              togglePendenciaStatus={togglePendenciaStatus}
              onNavigateToSection={selectSectionAndFocusUnit}
            />
          </div>
        </header>

        {/* Content View workspace viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* Active View Renders */}
          <div className="transition-all duration-150 ease-in-out">
            
            {activeTab === 'hoje' && (
              <HojeView 
                units={units}
                tasks={tasks}
                executions={executions}
                toggleTaskStatus={toggleTaskStatus}
                updateTaskNotes={updateTaskNotes}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                todayDate={todayDateString}
                pendencias={pendencias}
                suggestions={suggestions}
                onUpdateSuggestions={saveSuggestions}
                onAddPendencia={(unitId) => selectSectionAndFocusUnit('pendencias', unitId)}
                onSwitchToChecklist={(unitId) => selectSectionAndFocusUnit('checklist_diario', unitId)}
                onAddPendenciaObj={handleAddPendenciaObj}
                onTogglePendencia={togglePendenciaStatus}
                onResetDateTasks={handleResetForDate}
                onAddUnit={handleAddNewUnit}
                globalConfig={globalConfig}
              />
            )}

            {activeTab === 'sugestoes' && (
              <SugestoesRapidasView 
                suggestions={suggestions}
                onUpdateSuggestions={saveSuggestions}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardView
                units={units}
                tasks={tasks}
                executions={executions}
                pendencias={pendencias}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                todayDate={todayDateString}
                onNavigateToSection={selectSectionAndFocusUnit}
                globalConfig={globalConfig}
              />
            )}

            {activeTab === 'unidades' && (
              <UnidadesView 
                units={units}
                tasks={tasks}
                executions={executions}
                pendencias={pendencias}
                todayDate={todayDateString}
                onNavigateToSection={selectSectionAndFocusUnit}
                onAddUnit={handleAddNewUnit}
                onToggleUnitActive={toggleUnitActive}
                onUpdateUnit={handleUpdateUnit}
                onDeleteUnit={deleteUnit}
              />
            )}

            {activeTab === 'checklist_diario' && (
              <ChecklistDiarioView 
                units={units}
                tasks={tasks}
                executions={executions}
                toggleTaskStatus={toggleTaskStatus}
                updateTaskNotes={updateTaskNotes}
                updateTaskPriority={updateTaskPriority}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                todayDate={todayDateString}
                initialUnitId={focusedUnitId}
                onAddPendenciaObj={handleAddPendenciaObj}
                globalConfig={globalConfig}
              />
            )}

            {activeTab === 'checklist_quinzenal' && (
              <ChecklistQuinzenalView 
                units={units}
                tasks={tasks}
                executions={executions}
                toggleTaskStatus={toggleTaskStatus}
                updateTaskNotes={updateTaskNotes}
                updateTaskPriority={updateTaskPriority}
                selectedDate={selectedDate}
                todayDate={todayDateString}
                initialUnitId={focusedUnitId}
                onAddPendenciaObj={handleAddPendenciaObj}
              />
            )}

            {activeTab === 'checklist_semanal' && (
              <ChecklistSemanalView 
                units={units}
                tasks={tasks}
                executions={executions}
                toggleTaskStatus={toggleTaskStatus}
                updateTaskNotes={updateTaskNotes}
                updateTaskPriority={updateTaskPriority}
                selectedDate={selectedDate}
                todayDate={todayDateString}
                initialUnitId={focusedUnitId}
                onAddPendenciaObj={handleAddPendenciaObj}
              />
            )}

            {activeTab === 'checklist_mensal' && (
              <ChecklistMensalView 
                units={units}
                tasks={tasks}
                executions={executions}
                toggleTaskStatus={toggleTaskStatus}
                updateTaskNotes={updateTaskNotes}
                updateTaskPriority={updateTaskPriority}
                selectedDate={selectedDate}
                todayDate={todayDateString}
                initialUnitId={focusedUnitId}
                onAddPendenciaObj={handleAddPendenciaObj}
              />
            )}

            {activeTab === 'pendencias' && (
              <PendenciasView 
                units={units}
                pendencias={pendencias}
                addPendencia={handleAddPendenciaObj}
                togglePendenciaStatus={togglePendenciaStatus}
                deletePendencia={deletePendencia}
                updatePendencia={updatePendencia}
                initialUnitId={focusedUnitId}
              />
            )}

            {activeTab === 'cronograma' && (
              <CronogramaView 
                units={units}
                todayDate={todayDateString}
              />
            )}

            {activeTab === 'lives' && (
              <LivesView 
                units={units}
                todayDate={todayDateString}
              />
            )}

            {activeTab === 'reunioes' && (
              <ReunioesView 
                units={units}
                todayDate={todayDateString}
              />
            )}

            {activeTab === 'relatorios' && (
              <RelatoriosView 
                units={units}
                tasks={tasks}
                executions={executions}
                pendencias={pendencias}
                todayDate={todayDateString}
              />
            )}

            {activeTab === 'configuracoes' && (
              <ConfiguracoesView 
                units={units}
                tasks={tasks}
                onAddUnit={handleAddNewUnit}
                onToggleUnitActive={toggleUnitActive}
                onUpdateUnit={handleUpdateUnit}
                onDeleteUnit={deleteUnit}
                onAddTask={handleAddNewTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={deleteTask}
                onResetDatabase={handleResetToFactoryDefault}
                globalConfig={globalConfig}
                onUpdateGlobalConfig={saveGlobalConfig}
                changeLogs={changeLogs}
                onUpdateChangeLogs={saveChangeLogs}
                suggestions={suggestions}
                onUpdateSuggestions={saveSuggestions}
              />
            )}

          </div>
        </main>

        {/* Footer Brand copyright label */}
        <footer className="mt-auto bg-[#141414] border-t border-[#1F1F1F] py-6 px-8 text-center sm:text-left text-xs text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-4 select-none">
          <div className="space-y-1">
            <p className="font-display font-semibold text-slate-300">
              TráfegON Check — Sistema de Monitoramento Operacional de Rotinas para Espaçolaser • Grupo ONE
            </p>
            <p className="text-gray-500 font-medium text-[10px]">
              Salvo localmente no navegador via LocalStorage • Foco na consistência operacional orgânica diária das franquias.
            </p>
          </div>
          <div className="text-right whitespace-nowrap text-[10px] font-mono text-gray-600">
            © 2026 Agência TráfegON. Todos os direitos reservados.
          </div>
        </footer>

      </div>
    </div>
  );
}
