import React, { useState, useMemo } from 'react';
import { Unit, StandardTask, TaskExecution, Pendencia, TaskStatus, ResponsibleParty } from '../types';
import { formatShortDate, formatFriendlyDate } from '../utils';
import { 
  BarChart2, 
  TrendingUp, 
  Trophy, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  HelpCircle, 
  Copy, 
  Check, 
  MessageSquare, 
  Users, 
  Instagram, 
  Video, 
  AlertCircle, 
  Calendar, 
  FileText, 
  ChevronRight, 
  User, 
  MapPin, 
  SlidersHorizontal,
  X,
  Plus
} from 'lucide-react';

interface DashboardViewProps {
  units: Unit[];
  tasks: StandardTask[];
  executions: TaskExecution[];
  pendencias: Pendencia[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  todayDate: string;
  onNavigateToSection: (section: string, unitId?: string) => void;
  globalConfig?: any;
}

export default function DashboardView({
  units,
  tasks,
  executions,
  pendencias,
  selectedDate,
  setSelectedDate,
  todayDate,
  onNavigateToSection,
  globalConfig
}: DashboardViewProps) {
  const activeUnits = useMemo(() => units.filter(u => u.active), [units]);
  
  // Stats and state
  const [isMeetingModeOpen, setIsMeetingModeOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Helper: Evaluates if a task suggested hour has passed today (to flag delays)
  const isTaskDelayed = (suggestedTime?: string, status?: string, dateStr?: string) => {
    if (status === 'executado' || status === 'nao_se_aplica' || status === 'atrasado') {
      return status === 'atrasado';
    }

    const dateObj = new Date(dateStr + 'T00:00:00');
    const todayObj = new Date(todayDate + 'T00:00:00');

    if (dateObj < todayObj) {
      return true;
    }
    if (dateObj > todayObj) {
      return false;
    }

    if (suggestedTime) {
      const [sHour, sMin] = suggestedTime.split(':').map(Number);
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();

      if (currentHour > sHour || (currentHour === sHour && currentMin >= sMin)) {
        return true;
      }
    }

    return false;
  };

  // Helper function to build list of tasks for any given unit and date (parity with HojeView)
  const getTasksForUnit = useMemo(() => {
    return (unitId: string, dateStr: string) => {
      const targetDate = new Date(dateStr + 'T00:00:00');
      const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon, etc.
      const postagemDays = globalConfig?.postagemPrincipalDays || [1, 3, 5];
      const isPostagemDay = postagemDays.includes(dayOfWeek);

      const checklistItems: any[] = [];
      if (dayOfWeek !== 0) {
        checklistItems.push(
          { id: 'story-1', title: 'Story 1 publicado/programado', suggestedTime: '08:00', isStory: true },
          { id: 'nota-instagram', title: 'Insira Nota', suggestedTime: '08:00', isNota: true }
        );
      }

      if (isPostagemDay) {
        checklistItems.push({
          id: 'postagem-principal',
          title: 'Postagem principal publicada/programada',
          suggestedTime: '12:00',
          isPostagem: true
        } as any);
      }

      return checklistItems;
    };
  }, [globalConfig]);

  // Compute Task Status directly
  const getTaskStatus = (unitId: string, taskId: string, dateStr: string, suggestedTime?: string) => {
    const exec = executions.find(e => e.unitId === unitId && e.taskId === taskId && e.date === dateStr);
    if (exec) {
      return exec.status;
    }
    const delayed = isTaskDelayed(suggestedTime, 'pendente', dateStr);
    return delayed ? 'atrasado' : 'pendente';
  };

  // Calculate stats for current week (Monday to Sunday)
  const getPostagensDaSemana = () => {
    const target = new Date(selectedDate + 'T00:00:00');
    const day = target.getDay(); // 0 = Sun, 1 = Mon, etc.
    const diffToMon = target.getDate() - day + (day === 0 ? -6 : 1);
    
    const monday = new Date(target);
    monday.setDate(diffToMon);
    
    const datesOfWeek: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      datesOfWeek.push(`${yyyy}-${mm}-${dd}`);
    }

    return executions.filter(e => 
      e.taskId === 'postagem-principal' && 
      e.status === 'executado' && 
      datesOfWeek.includes(e.date)
    ).length;
  };

  // EVALUATING THE COMPLEX OPERATIONAL METRICS FOR TOP CARDS
  const computedMetrics = useMemo(() => {
    let totalTasksToday = 0;
    let completedTasksToday = 0;
    let pendingTasksToday = 0;
    let delayedTasksToday = 0;
    
    let executedStoriesToday = 0;
    let executedNotesToday = 0;
    let pendingVideosToday = 0; // 'story-real' or 'bastidor' that are pendente/atrasado
    let alarmUnitsCount = 0;

    activeUnits.forEach(unit => {
      const unitTasks = getTasksForUnit(unit.id, selectedDate);
      let unitHasDelayed = false;
      const hasHighUrgencyPendency = pendencias.some(p => {
        const isPending = p.status === 'pendente' || p.status === 'em_andamento' || p.status === 'aberta';
        const isPriorityHighOrCritical = p.priority === 'critica' || p.priority === 'alta' || p.urgency === 'alta';
        const isOverdue = p.prazo ? (p.prazo < todayDate) : false;
        return p.unitId === unit.id && isPending && (isPriorityHighOrCritical || isOverdue);
      });

      unitTasks.forEach(task => {
        const status = getTaskStatus(unit.id, task.id, selectedDate, task.suggestedTime);
        totalTasksToday++;

        if (status === 'executado') {
          completedTasksToday++;
          if (task.id.startsWith('story-')) {
            executedStoriesToday++;
          }
          if (task.id === 'nota-instagram') {
            executedNotesToday++;
          }
        } else if (status === 'atrasado') {
          delayedTasksToday++;
          unitHasDelayed = true;
          if (task.id === 'story-real' || task.id === 'bastidor') {
            pendingVideosToday++;
          }
        } else if (status === 'nao_se_aplica') {
          // Counted as ignored
        } else {
          pendingTasksToday++;
          if (task.id === 'story-real' || task.id === 'bastidor') {
            pendingVideosToday++;
          }
        }
      });

      if (unitHasDelayed || hasHighUrgencyPendency) {
        alarmUnitsCount++;
      }
    });

    const criticalPendenciesCount = pendencias.filter(p => {
      const isPending = p.status === 'pendente' || p.status === 'em_andamento' || p.status === 'aberta';
      const isPriorityHighOrCritical = p.priority === 'critica' || p.priority === 'alta' || p.urgency === 'alta';
      const isOverdue = p.prazo ? (p.prazo < todayDate) : false;
      return isPending && (isPriorityHighOrCritical || isOverdue);
    }).length;
    const weeklyMainPostsCount = getPostagensDaSemana();

    return {
      totalTasksToday,
      completedTasksToday,
      pendingTasksToday,
      delayedTasksToday,
      executedStoriesToday,
      executedNotesToday,
      pendingVideosToday,
      alarmUnitsCount,
      criticalPendenciesCount,
      weeklyMainPostsCount
    };
  }, [activeUnits, selectedDate, executions, pendencias, getTasksForUnit]);

  // UNIT DETAIL STATUS MAPPERS FOR STATUS TABLE
  const unitStatuses = useMemo(() => {
    return activeUnits.map(unit => {
      const unitTasks = getTasksForUnit(unit.id, selectedDate);
      const isPostagemDay = unitTasks.some(t => t.id === 'postagem-principal');

      // Individual Task Status Queries
      const story1Status = getTaskStatus(unit.id, 'story-1', selectedDate, '08:00');

      const notaStatus = getTaskStatus(unit.id, 'nota-instagram', selectedDate, '08:00');
      const postagemStatus = isPostagemDay ? getTaskStatus(unit.id, 'postagem-principal', selectedDate, '12:00') : 'nao_se_aplica';

      const unitPendencias = pendencias.filter(p => p.unitId === unit.id && (p.status === 'pendente' || p.status === 'em_andamento' || p.status === 'aberta'));
      const hasHighUrgency = unitPendencias.some(p => {
        const isPriorityHighOrCritical = p.priority === 'critica' || p.priority === 'alta' || p.urgency === 'alta';
        const isOverdue = p.prazo ? (p.prazo < todayDate) : false;
        return isPriorityHighOrCritical || isOverdue;
      });
      const hasMediumUrgency = unitPendencias.some(p => p.priority === 'media' || p.urgency === 'media');

      // Delay check
      const taskStatuses = unitTasks.map(t => getTaskStatus(unit.id, t.id, selectedDate, t.suggestedTime));
      const delayedCount = taskStatuses.filter(s => s === 'atrasado').length;
      const isAllCompleted = unitTasks.length > 0 && taskStatuses.every(s => s === 'executado' || s === 'nao_se_aplica');

      // GENERAL STATUS CALCULATION
      // - Verde: em dia (all today's tasks completed or N/A)
      // - Vermelho: crítico (high urgency open pendency OR 2 or more delayed tasks)
      // - Amarelo: atenção (some unfinished/pending tasks OR medium urgency open pendency OR 1 delayed task)
      // - Cinza: não se aplica
      let generalStatus: 'verde' | 'amarelo' | 'vermelho' | 'cinza' = 'amarelo';
      if (hasHighUrgency || delayedCount >= 2) {
        generalStatus = 'vermelho';
      } else if (isAllCompleted) {
        generalStatus = 'verde';
      } else if (delayedCount === 1 || hasMediumUrgency || taskStatuses.includes('pendente')) {
        generalStatus = 'amarelo';
      }

      // COLLABORATION CALCULATION
      // based on story-1, nota-instagram, delays, and open pendencies
      let collaborationScore = 100;
      
      if (story1Status !== 'executado' && story1Status !== 'nao_se_aplica') {
        collaborationScore -= 35; // story 1 missing
      }
      
      if (notaStatus !== 'executado' && notaStatus !== 'nao_se_aplica') {
        collaborationScore -= 25; // note missing
      }

      collaborationScore -= delayedCount * 15;
      collaborationScore -= unitPendencias.length * 15;
      collaborationScore = Math.max(0, collaborationScore);

      let collaborationRating: 'Boa' | 'Média' | 'Baixa' | 'Crítica' = 'Boa';
      if (collaborationScore >= 80) collaborationRating = 'Boa';
      else if (collaborationScore >= 55) collaborationRating = 'Média';
      else if (collaborationScore >= 30) collaborationRating = 'Baixa';
      else collaborationRating = 'Crítica';

      return {
        unit,
        generalStatus,
        story1Status,
        notaStatus,
        postagemStatus,
        isPostagemDay,
        openPendenciasCount: unitPendencias.length,
        collaborationRating,
        collaborationScore,
        unitPendencias,
        hasHighUrgency
      };
    });
  }, [activeUnits, selectedDate, executions, pendencias, getTasksForUnit]);

  // CATEGORIZATIONS FOR THE MEETING SUMMARY SCREEN
  const meetingSummaryObject = useMemo(() => {
    const sortedUnits = [...unitStatuses].sort((a, b) => b.collaborationScore - a.collaborationScore);
    
    const bestExecution = sortedUnits.filter(x => x.generalStatus === 'verde').map(x => x.unit);
    const alertUnits = unitStatuses.filter(x => x.generalStatus === 'vermelho' || x.generalStatus === 'amarelo');
    const lowCollaboration = unitStatuses.filter(x => x.collaborationRating === 'Baixa' || x.collaborationRating === 'Crítica');
    const criticalPendencies = pendencias.filter(p => {
      const isPending = p.status === 'pendente' || p.status === 'em_andamento' || p.status === 'aberta';
      const isPriorityHighOrCritical = p.priority === 'critica' || p.priority === 'alta' || p.urgency === 'alta';
      const isOverdue = p.prazo ? (p.prazo < todayDate) : false;
      return isPending && (isPriorityHighOrCritical || isOverdue);
    });

    // Autogenerate intelligent Next Steps action items
    const steps: string[] = [];
    if (alertUnits.length > 0) {
      steps.push(`Cobrar imediata publicação de checklists atrasados de: ${alertUnits.slice(0, 3).map(u => u.unit.sigla).join(', ')}`);
    } else {
      steps.push("Parabenizar a equipe pela brilhante entrega sem atrasos na data de hoje.");
    }
    if (lowCollaboration.length > 0) {
      steps.push(`Notificar gerentes de ${lowCollaboration.slice(0, 2).map(u => u.unit.sigla).join(', ')} sobre envio de Stories Reais e Bastidores.`);
    }
    if (criticalPendencies.length > 0) {
      steps.push(`Atuar na resolução das ${criticalPendencies.length} pendências de urgência Crítica nas próximas 2 horas.`);
    } else {
      steps.push("Monitorar canais de tráfego orgânico para novos reports de clínicas.");
    }

    return {
      bestExecution,
      alertUnits,
      lowCollaboration,
      criticalPendencies,
      steps
    };
  }, [unitStatuses, pendencias]);

  // GENERATING WHATSAPP TEXT IN PORTUGUESE
  const whatsappReportText = useMemo(() => {
    const formattedDate = formatShortDate(selectedDate);
    const alarmCount = unitStatuses.filter(u => u.generalStatus === 'vermelho').length;
    const okCount = unitStatuses.filter(u => u.generalStatus === 'verde').length;

    let text = `📝 *TRÁFEGON CHECK - RESUMO DA REUNIÃO* 📝\n`;
    text += `📅 _Data: ${formattedDate}_\n`;
    text += `🏢 _Grupo ONE - Operação Spot Espaçolaser_\n`;
    text += `===================================\n\n`;

    text += `1️⃣ *SITUAÇÃO GERAL DA OPERAÇÃO*:\n`;
    text += `- Média de Checklist Completo: *${computedMetrics.completedTasksToday}/${computedMetrics.totalTasksToday}* tarefas\n`;
    text += `- Clínicas 100% Em Dia: *${okCount}* unidades\n`;
    text += `- Clínicas em Alerta Crítico: *${alarmCount}* unidades\n`;
    text += `- Stories Publicados Hoje: *${computedMetrics.executedStoriesToday}* stories\n`;
    text += `- Pendências Críticas Ativas: *${computedMetrics.criticalPendenciesCount}* ocorridas\n\n`;

    text += `2️⃣ *MELHORES EXECUÇÕES DO DIA*:\n`;
    const inDia = unitStatuses.filter(u => u.generalStatus === 'verde');
    if (inDia.length === 0) {
      text += `- Nenhuma unidade concluiu todas as tarefas previstas até o momento.\n`;
    } else {
      inDia.forEach(u => {
        text += `- ✅ *${u.unit.name}* (${u.unit.sigla}) - 100% Completo\n`;
      });
    }
    text += `\n`;

    text += `3️⃣ *CLÍNICAS EM ALERTA (Urgente!)*:\n`;
    const alertList = unitStatuses.filter(u => u.generalStatus === 'vermelho' || u.generalStatus === 'amarelo');
    if (alertList.length === 0) {
      text += `- Nenhuma clínica registra atrasos ou inconformidades hoje!\n`;
    } else {
      alertList.forEach(u => {
        const storiesStr = `${u.storiesCompleted}/3`;
        const noteStr = u.notaStatus === 'executado' ? '✅' : '❌';
        text += `- 🔸 *${u.unit.sigla}* Status: *${u.generalStatus.toUpperCase()}* | Stories: ${storiesStr} | Nota: ${noteStr}\n`;
        if (u.openPendenciasCount > 0) {
          text += `  └ _Possui ${u.openPendenciasCount} pendência(s) em aberto_\n`;
        }
      });
    }
    text += `\n`;

    text += `4️⃣ *COLABORAÇÃO DOS LOGISTAS (Baixa/Crítica)*:\n`;
    const lowColab = unitStatuses.filter(u => u.collaborationRating === 'Baixa' || u.collaborationRating === 'Crítica');
    if (lowColab.length === 0) {
      text += `- Excelente engajamento! Todas as clínicas enviando materiais adequadamente.\n`;
    } else {
      lowColab.forEach(u => {
        const story1Str = executions.some(e => e.unitId === u.unit.id && e.date === selectedDate && e.taskId === 'story-1' && e.status === 'executado') ? 'Postado' : '❌ Não postado';
        const notaStr = executions.some(e => e.unitId === u.unit.id && e.date === selectedDate && e.taskId === 'nota-instagram' && e.status === 'executado') ? 'Postado' : '❌ Não postado';
        text += `- ⚠️ *${u.unit.name}* (Ponto de Contato: _${u.unit.gerente}_)\n`;
        text += `  └ Story 1: ${story1Str} | Insira Nota: ${notaStr}\n`;
      });
    }
    text += `\n`;

    text += `5️⃣ *PENDÊNCIAS CRÍTICAS REGISTRADAS*:\n`;
    const highPend = pendencias.filter(p => p.status === 'aberta' && p.urgency === 'alta');
    if (highPend.length === 0) {
      text += `- Nenhuma pendência crítica em aberto.\n`;
    } else {
      highPend.forEach((p, index) => {
        const u = units.find(unit => unit.id === p.unitId);
        text += `${index + 1}. *[CRÍTICA]* em _${u ? u.sigla : 'Geral'}_\n`;
        text += `   └ Problema: ${p.description}\n`;
        text += `   └ Responsável: ${p.responsible.toUpperCase()}\n`;
      });
    }
    text += `\n`;

    text += `6️⃣ *RECOMENDAÇÕES / PRÓXIMOS PASSOS*:\n`;
    meetingSummaryObject.steps.forEach(step => {
      text += `- ⚡ ${step}\n`;
    });

    text += `\n-----------------------------------\n`;
    text += `_Gerado automaticamente via TráfegON Check Dashboard_`;

    return text;
  }, [selectedDate, unitStatuses, computedMetrics, pendencias, executions, units, meetingSummaryObject]);

  // Handle Clipboard Copy
  const handleCopyWhatsAppText = async () => {
    try {
      await navigator.clipboard.writeText(whatsappReportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar: ', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER BRAND PANEL */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 bg-[#141414] p-6 rounded-2xl border border-[#232323] shadow-lg shadow-black/40">
        <div>
          <span className="text-[10px] uppercase font-mono font-black text-violet-400 tracking-widest block mb-1">
            Painel Executivo & Business Intelligence
          </span>
          <h2 className="text-3xl font-display font-extrabold text-white tracking-tight flex flex-wrap items-center gap-2">
            Visão Gerencial da Operação
            <span className="text-xs font-mono font-bold text-gray-500 bg-[#1A1A1A] px-2.5 py-1 rounded border border-[#282828]">
              {formatShortDate(selectedDate)}
            </span>
          </h2>
          <p className="text-sm text-gray-450 mt-1 max-w-2xl">
            Acompanhe a conformidade das publicações orgânicas, alertas críticos e níveis de colaboração de todas as clínicas em dia de reunião com as sócias.
          </p>
        </div>

        {/* TOP BUTTONS CONTAINER FOR DATE PICKER & MEETING MODE */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Resumo para reunião button */}
          <button
            onClick={() => setIsMeetingModeOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-950/20 flex items-center gap-2 cursor-pointer transition-all border border-indigo-500/35 hover:scale-[1.02]"
          >
            <Users className="w-4 h-4 text-violet-100" /> Resumo para Reunião
          </button>

          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if(e.target.value) setSelectedDate(e.target.value);
              }}
              className="pl-9 pr-3 py-2 border border-[#262626] rounded-xl text-xs text-white bg-[#1A1A1A] hover:bg-[#202020] focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all font-mono"
            />
          </div>
        </div>
      </div>

      {/* 2. OPERATIONAL BENTO GRID OF CARDS (8 cards requested!) */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
        {/* Card 1: Total tarefas de hoje */}
        <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] shadow-md flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider block">Tarefas de Hoje</span>
          <strong className="text-2xl font-mono font-black text-white mt-1.5 block">
            {computedMetrics.totalTasksToday}
          </strong>
          <span className="text-[9.5px] text-gray-450 font-medium block mt-1.5">Rotinas ativas</span>
        </div>

        {/* Card 2: Concluídas */}
        <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] shadow-md flex flex-col justify-between">
          <span className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-wider block">Concluídas</span>
          <strong className="text-2xl font-mono font-black text-emerald-450 mt-1.5 block">
            {computedMetrics.completedTasksToday}
          </strong>
          <span className="text-[9.5px] text-gray-450 font-medium block mt-1.5">Tarefa executadas</span>
        </div>

        {/* Card 3: Pendentes */}
        <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] shadow-md flex flex-col justify-between">
          <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider block">Pendentes</span>
          <strong className="text-2xl font-mono font-black text-amber-400 mt-1.5 block">
            {computedMetrics.pendingTasksToday}
          </strong>
          <span className="text-[9.5px] text-gray-450 font-medium block mt-1.5">Aguardando check</span>
        </div>

        {/* Card 4: Unidades em Alerta */}
        <div className={`p-4 rounded-xl border shadow-md flex flex-col justify-between ${
          computedMetrics.alarmUnitsCount > 0 ? 'bg-[#291717]/40 border-rose-900/40 animate-pulse-slow' : 'bg-[#141414] border-[#212121]'
        }`}>
          <span className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider block">Cli. em Alerta</span>
          <strong className="text-2xl font-mono font-black text-rose-450 mt-1.5 block">
            {computedMetrics.alarmUnitsCount}
          </strong>
          <span className="text-[9.5px] text-gray-455 font-medium block mt-1.5">Atraso ou urgência</span>
        </div>

        {/* Card 5: Stories Publicados */}
        <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] shadow-md flex flex-col justify-between">
          <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider block">Stories OK</span>
          <strong className="text-2xl font-mono font-black text-indigo-300 mt-1.5 block flex items-center gap-1">
            <Instagram className="w-4 h-4 text-indigo-400 inline" />
            {computedMetrics.executedStoriesToday}
          </strong>
          <span className="text-[9.5px] text-gray-450 font-medium block mt-1.5">Rotina de Stories</span>
        </div>

        {/* Card 6: Notas Publicadas */}
        <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] shadow-md flex flex-col justify-between">
          <span className="text-[10px] text-sky-400 font-extrabold uppercase tracking-wider block">Notas Inst. OK</span>
          <strong className="text-2xl font-mono font-black text-sky-300 mt-1.5 block">
            {computedMetrics.executedNotesToday}
          </strong>
          <span className="text-[9.5px] text-gray-450 font-medium block mt-1.5">Dispersão de Notas</span>
        </div>

        {/* Card 7: Postagens da Semana */}
        <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] shadow-md flex flex-col justify-between">
          <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-wider block">Postagens Sem.</span>
          <strong className="text-2xl font-mono font-black text-purple-300 mt-1.5 block">
            {computedMetrics.weeklyMainPostsCount}
          </strong>
          <span className="text-[9.5px] text-gray-450 font-medium block mt-1.5">Principais no Feed</span>
        </div>

        {/* Card 8: Pendências Críticas */}
        <div className={`p-4 rounded-xl border shadow-md flex flex-col justify-between ${
          computedMetrics.criticalPendenciesCount > 0 ? 'bg-[#292217]/50 border-amber-900/40' : 'bg-[#141414] border-[#212121]'
        }`}>
          <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider block">Pend. Críticas</span>
          <strong className="text-2xl font-mono font-black text-amber-400 mt-1.5 block">
            {computedMetrics.criticalPendenciesCount}
          </strong>
          <span className="text-[9.5px] text-gray-455 font-medium block mt-1.5">Urgência ALTA ativa</span>
        </div>
      </div>

      {/* 3. THE "STATUS POR UNIDADE" MAIN INTERACTIVE TABLE */}
      <div className="bg-[#141414] border border-[#232323] rounded-2xl shadow-lg overflow-hidden">
        <div className="p-5 border-b border-[#212121] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-display font-extrabold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-violet-400" /> Tabela de Status de Publicações por Unidade
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Reflete de forma automatizada o cumprimento de stories, notas instagram, posts de feed e o ranking de colaboração operacional.
            </p>
          </div>

          <div className="flex items-center gap-3 select-none text-[10px] font-serif">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-gray-300 font-bold font-mono">Em Dia</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span className="text-gray-300 font-bold font-mono">Atenção</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span className="text-gray-300 font-bold font-mono">Crítico</span>
            </div>
          </div>
        </div>

        {/* Scrollable table viewport */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-[#181818] text-gray-400 font-mono text-[9px] uppercase tracking-wider font-extrabold border-b border-[#212121] select-none">
              <tr>
                <th className="py-3 px-4">Unidade</th>
                <th className="py-3 px-3 text-center">Status Geral</th>
                <th className="py-3 px-3 text-center">Story 1</th>
                <th className="py-3 px-3 text-center">Insira Nota</th>
                <th className="py-3 px-3 text-center">Postagem Feed</th>
                <th className="py-3 px-3 text-center">Ocorrências Ativas</th>
                <th className="py-3 px-4 text-right">Colaboração da Unidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#212121]">
              {unitStatuses.map(({ unit, generalStatus, story1Status, notaStatus, postagemStatus, isPostagemDay, openPendenciasCount, collaborationRating, collaborationScore, unitPendencias, hasHighUrgency }) => {
                return (
                  <tr key={unit.id} className="hover:bg-[#191919] transition-all group">
                    {/* Unidade Column */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 bg-violet-950/60 text-violet-400 border border-violet-900/30 rounded text-[9px] font-mono font-black uppercase">
                            {unit.sigla}
                          </span>
                          <span className="font-extrabold text-[13px] text-gray-100 group-hover:text-white">
                            {unit.name}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-gray-400 flex items-center gap-1">
                          <span className="inline-block py-0.2 px-1 rounded bg-[#202020] text-gray-400 text-[8.5px] font-bold uppercase mr-1">R: {unit.region}</span>
                          Gerente: {unit.gerente || 'Não cadastrada'}
                        </p>
                      </div>
                    </td>

                    {/* Status Geral Badge Column */}
                    <td className="py-4 px-3 text-center">
                      <div className="flex justify-center">
                        <span className={`px-2.5 py-0.8 rounded-full text-[9px] font-black uppercase tracking-wider border select-none ${
                          generalStatus === 'verde'
                            ? 'bg-emerald-950/45 text-emerald-450 border-emerald-900/30'
                            : generalStatus === 'amarelo'
                            ? 'bg-[#292017] text-amber-450 border-amber-900/30'
                            : generalStatus === 'vermelho'
                            ? 'bg-[#291717] text-rose-455 border-rose-900/40'
                            : 'bg-neutral-800 text-gray-400 border-neutral-700'
                        }`}>
                          {generalStatus === 'verde' ? '● Em Dia' : generalStatus === 'amarelo' ? '▲ Atenção' : generalStatus === 'vermelho' ? '■ Crítico' : '⚪ N/A'}
                        </span>
                      </div>
                    </td>

                    {/* Story 1 Progress Column */}
                    <td className="py-4 px-3 text-center">
                      <div className="flex justify-center">
                        <span className={`p-1 rounded-lg ${
                          story1Status === 'executado' 
                            ? 'bg-emerald-950/30 border border-emerald-900/30 text-emerald-450' 
                            : story1Status === 'nao_se_aplica'
                            ? 'bg-zinc-800/40 border border-zinc-700/30 text-gray-400'
                            : 'bg-rose-950/20 border border-rose-900/20 text-rose-450'
                        }`} title={story1Status === 'executado' ? 'Story 1 publicado' : story1Status === 'nao_se_aplica' ? 'Story 1 não se aplica' : 'Story 1 pendente'}>
                          <Instagram className="w-4 h-4" />
                        </span>
                      </div>
                    </td>

                    {/* Nota Instagram Column */}
                    <td className="py-4 px-3 text-center">
                      <div className="flex justify-center">
                        <span className={`p-1 rounded-lg ${
                          notaStatus === 'executado' 
                            ? 'bg-emerald-950/30 border border-emerald-900/30 text-emerald-450' 
                            : notaStatus === 'nao_se_aplica'
                            ? 'bg-zinc-800/40 border border-zinc-700/30 text-gray-400'
                            : 'bg-rose-950/20 border border-rose-900/20 text-rose-450'
                        }`} title={notaStatus === 'executado' ? 'Nota publicada com sucesso' : notaStatus === 'nao_se_aplica' ? 'Nota não se aplica' : 'Nota não realizada ou pendente'}>
                          <Instagram className="w-4 h-4" />
                        </span>
                      </div>
                    </td>

                    {/* Postagem Principal Column */}
                    <td className="py-4 px-3 text-center">
                      <div className="flex justify-center">
                        {!isPostagemDay ? (
                          <span className="text-[10px] text-gray-550 font-mono uppercase bg-[#181818] border border-[#252525] px-2 py-0.5 rounded select-none">
                            N/A
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            postagemStatus === 'executado' 
                              ? 'bg-indigo-950/30 border border-indigo-900/30 text-indigo-400' 
                              : 'bg-rose-950/20 border border-rose-900/20 text-rose-400'
                          }`}>
                            {postagemStatus === 'executado' ? 'Postado' : 'Falta'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Pendencias Column */}
                    <td className="py-4 px-3 text-center">
                      <div className="flex justify-center">
                        {openPendenciasCount === 0 ? (
                          <span className="text-[10px] text-gray-500 font-mono">0 ativas</span>
                        ) : (
                          <div className="flex items-center gap-1 font-mono">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              hasHighUrgency ? 'bg-rose-950/50 text-rose-400 border border-rose-900/40' : 'bg-amber-955/20 text-amber-455 border border-amber-900/30'
                            }`}>
                              ⚠️ {openPendenciasCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Colaboração Column */}
                    <td className="py-4 px-4 text-right">
                      <div className="space-y-1">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border select-none ${
                          collaborationRating === 'Boa'
                            ? 'bg-emerald-950/40 text-emerald-450 border-emerald-950/80 animate-shine'
                            : collaborationRating === 'Média'
                            ? 'bg-[#1D2B44] text-sky-400 border border-[#2B4B7C]'
                            : collaborationRating === 'Baixa'
                            ? 'bg-amber-955/20 text-amber-455 border-amber-900/30'
                            : 'bg-rose-955/40 text-rose-400 border border-rose-900/30 font-black'
                        }`}>
                          {collaborationRating}
                        </span>
                        
                        <div className="flex items-center justify-end gap-1.5 pt-1 font-mono text-[9.5px] text-gray-450">
                          <span>Índice: {collaborationScore}%</span>
                          <div className="w-[60px] bg-[#222] h-1 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${collaborationRating === 'Boa' ? 'bg-emerald-500' : collaborationRating === 'Média' ? 'bg-sky-500' : collaborationRating === 'Baixa' ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${collaborationScore}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Dynamic Tips section at bottom of status table */}
        <div className="p-4 bg-[#181818] text-gray-450 text-[11px] font-mono border-t border-[#212121] flex items-center gap-2">
          <span className="text-violet-400 font-extrabold text-[10px] px-1.5 py-0.2 rounded bg-violet-950/30 border border-violet-900/30">DICA</span>
          <span>A colaboração é calculada baseando-se no envio correto de <strong>Stories Reais</strong>, <strong>Bastidores</strong> e no cumprimento dos roteiros no dia.</span>
        </div>
      </div>

      {/* 4. MODAL: ELABORATED "RESUMO OPERACIONAL PARA REUNIÃO" MODAL */}
      {isMeetingModeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#141414] border border-[#2D2D2D] w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scaleIn">
            
            {/* Modal Header */}
            <div className="p-5 bg-[#181818] border-b border-[#212121] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-violet-400 shrink-0" />
                <div>
                  <h3 className="font-display font-extrabold text-white text-base leading-none">
                    Resumo Operacional para Reunião
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1 font-mono">
                    Visão limpa consolidada • Grupo ONE Espaçolaser
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsMeetingModeOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white cursor-pointer hover:bg-[#252525] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Meeting Report Body */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Section 1: RESUMO DO DIA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-950/10 border border-emerald-900/20 p-4 rounded-xl">
                  <span className="text-[9px] uppercase font-black text-emerald-500 block mb-1">Média de Conclusão</span>
                  <span className="text-2xl font-mono font-black text-emerald-400">
                    {Math.round((computedMetrics.completedTasksToday / Math.max(1, computedMetrics.totalTasksToday)) * 100)}%
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">Das rotinas operacionais no dia de hoje.</p>
                </div>

                <div className="bg-rose-950/15 border border-rose-900/20 p-4 rounded-xl">
                  <span className="text-[9px] uppercase font-black text-rose-500 block mb-1">Unidades em Alerta</span>
                  <span className="text-2xl font-mono font-black text-rose-400">
                    {meetingSummaryObject.alertUnits.length}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">Requerem cobrança ativa ou apoio da agência.</p>
                </div>

                <div className="bg-violet-950/15 border border-violet-900/20 p-4 rounded-xl">
                  <span className="text-[9px] uppercase font-black text-violet-400 block mb-1">Stories Publicados hoje</span>
                  <span className="text-2xl font-mono font-black text-violet-300">
                    {computedMetrics.executedStoriesToday}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">Presença ativa garantida no Instagram.</p>
                </div>
              </div>

              {/* Grid split for core cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* 2 & 3. MELHOR EXECUÇÃO e ALERTA */}
                <div className="space-y-4">
                  {/* Melhores Execuções */}
                  <div className="bg-[#1A1A1A] p-4.5 rounded-xl border border-[#252525]">
                    <h4 className="text-[11px] uppercase font-black font-mono text-emerald-400 tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-emerald-450" /> 1. Clínicas com Melhor Execução em Dia
                    </h4>
                    <div className="space-y-2">
                      {meetingSummaryObject.bestExecution.length === 0 ? (
                        <p className="text-gray-550 italic text-[11px]">Nenhuma clínica concluiu 100% das tarefas previstas ainda hoje.</p>
                      ) : (
                        meetingSummaryObject.bestExecution.map(unit => (
                          <div key={unit.id} className="flex justify-between items-center text-[11.5px] border-b border-[#2C2C2C] last:border-0 pb-1.5 last:pb-0">
                            <span className="font-extrabold text-gray-200">[{unit.sigla}] - {unit.name}</span>
                            <span className="text-emerald-450 font-bold">100% Ok</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Clínicas em Alerta */}
                  <div className="bg-[#1A1A1A] p-4.5 rounded-xl border border-[#252525]">
                    <h4 className="text-[11px] uppercase font-black font-mono text-rose-455 tracking-wider mb-2.5 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> 2. Clínicas em Alerta (Atenção Operacional)
                    </h4>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {meetingSummaryObject.alertUnits.length === 0 ? (
                        <p className="text-[#888] italic">Parabéns! Nenhuma clínica em alerta.</p>
                      ) : (
                        meetingSummaryObject.alertUnits.map(({ unit, generalStatus, openPendenciasCount }) => (
                          <div key={unit.id} className="flex justify-between items-center text-[11.5px] border-b border-[#2C2C2C] last:border-0 pb-1.5 last:pb-0">
                            <div>
                              <span className="font-extrabold text-gray-200">[{unit.sigla}] - {unit.name}</span>
                              <span className="text-[9px] text-gray-400 block font-mono">Gerente: {unit.gerente}</span>
                            </div>
                            <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-black uppercase ${
                              generalStatus === 'vermelho' ? 'bg-rose-955/35 text-rose-400' : 'bg-amber-955/15 text-amber-455'
                            }`}>
                              {generalStatus.toUpperCase()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* 4 & 5. BAIXA COLABORAÇÃO e OCORRÊNCIAS CRÍTICAS */}
                <div className="space-y-4">
                  {/* Colaboração Baixa */}
                  <div className="bg-[#1A1A1A] p-4.5 rounded-xl border border-[#252525]">
                    <h4 className="text-[11px] uppercase font-black font-mono text-amber-500 tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-500" /> 3. Clínicas com Baixa Colaboração no Período
                    </h4>
                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {meetingSummaryObject.lowCollaboration.length === 0 ? (
                        <p className="text-gray-550 italic text-[11px]">Nenhuma unidade crítica. Bom engajamento!</p>
                      ) : (
                        meetingSummaryObject.lowCollaboration.map(({ unit, collaborationRating, collaborationScore }) => (
                          <div key={unit.id} className="flex justify-between items-center text-[11.5px] border-b border-[#2C2C2C] last:border-0 pb-1.5 last:pb-0">
                            <div>
                              <span className="font-extrabold text-gray-200">[{unit.sigla}] - {unit.name}</span>
                              <span className="text-[9.5px] text-gray-450 block font-mono">Feedback: {unit.gerente}</span>
                            </div>
                            <span className="text-rose-400/90 font-mono text-[10px] font-bold">
                              {collaborationRating} ({collaborationScore}%)
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Ocorrências Críticas */}
                  <div className="bg-[#1A1A1A] p-4.5 rounded-xl border border-[#252525]">
                    <h4 className="text-[11px] uppercase font-black font-mono text-rose-400 tracking-wider mb-2.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> 4. Pendências Críticas e Atrasadas
                    </h4>
                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {meetingSummaryObject.criticalPendencies.length === 0 ? (
                        <p className="text-gray-500 italic">Nenhuma pendência prioritária ou atrasada no painel.</p>
                      ) : (
                        meetingSummaryObject.criticalPendencies.map(p => {
                          const associatedUnit = units.find(u => u.id === p.unitId);
                          const isOverdue = p.prazo ? (p.prazo < todayDate) : false;
                          const mappedPriority = p.priority || p.urgency || 'media';
                          return (
                            <div key={p.id} className="text-[11px] border-b border-[#2C2C2C] last:border-0 pb-1.5 last:pb-0 space-y-0.5">
                              <div className="flex justify-between items-start">
                                <span className="font-extrabold text-rose-300">[{associatedUnit ? associatedUnit.sigla : 'Geral'}] {p.description}</span>
                                <span className={`text-[8px] uppercase font-mono px-1 rounded font-black ${isOverdue ? 'bg-rose-955/40 text-rose-450 border border-rose-900/30' : 'bg-[#222] text-gray-400'}`}>
                                  {isOverdue ? 'ATRASADA' : mappedPriority.toUpperCase()}
                                </span>
                              </div>
                              <div className="flex justify-between text-[10px] text-gray-400">
                                <span>Responsável: {p.responsible}</span>
                                {p.prazo && <span>Prazo: {formatShortDate(p.prazo)}</span>}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. RECOMMENDATIONS & NEXT STEPS */}
              <div className="bg-[#1d1b18] border border-amber-900/20 p-5 rounded-xl space-y-2.5">
                <h4 className="text-[11px] uppercase font-black font-mono text-amber-500 tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" /> recomendados para próximos passos (Reunião das Sócias)
                </h4>
                <ul className="space-y-1.5 list-none pl-0">
                  {meetingSummaryObject.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[11.5px] text-gray-200">
                      <span className="text-amber-500 font-bold mt-0.5">↳</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* TEXT RAW AREA PREVIEW */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase font-black text-gray-400 font-mono">
                  Visualização do Resumo p/ Copiar (WhatsApp)
                </label>
                <textarea
                  readOnly
                  value={whatsappReportText}
                  className="w-full h-40 p-3 bg-[#111111] border border-[#252525] rounded-xl text-[11px] text-gray-400 font-mono focus:outline-none resize-none leading-relaxed overflow-y-auto"
                />
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-[#181818] border-t border-[#212121] flex flex-wrap gap-2.5 justify-end shrink-0 select-none">
              <button
                type="button"
                onClick={() => setIsMeetingModeOpen(false)}
                className="px-4 py-2 bg-transparent text-gray-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer py-1.5 hover:bg-[#252525] transition-all"
              >
                Voltar ao Painel
              </button>

              <button
                type="button"
                onClick={handleCopyWhatsAppText}
                className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer border transition-all ${
                  copied
                    ? 'bg-emerald-950/40 text-emerald-450 border-emerald-900/40'
                    : 'bg-[#1C1C1C] hover:bg-[#202020] border-[#2E2E2E] text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-450" /> Copiado! Pronto p/ enviar
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copiar Resumo para WhatsApp
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
