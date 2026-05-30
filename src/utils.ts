import { TaskExecution, StandardTask, Unit, Pendencia } from './types';

/**
 * Formata datas no formato pt-BR de maneira amigável.
 */
export function formatFriendlyDate(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return 'Hoje';
  
  const yesterday = new Date(todayStr);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  if (dateStr === yesterdayStr) return 'Ontem';

  // Parse YYYY-MM-DD manually to avoid timezone shift
  const parts = dateStr.split('-');
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
  return date.toLocaleDateString('pt-BR', options);
}

/**
 * Formata data curta ex: 25/05/2026
 */
export function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Calcula taxa de conclusão de tarefas da unidade no dia
 */
export function calculateCompletionRate(
  unitId: string,
  dateStr: string,
  tasks: StandardTask[],
  executions: TaskExecution[]
): { completed: number; total: number; percentage: number } {
  // Apenas tarefas diárias fazem parte da conclusão diária principal para não inflar ou distorcer o "check do dia"
  const dailyTasks = tasks.filter(t => t.frequency === 'diario');
  if (dailyTasks.length === 0) return { completed: 0, total: 0, percentage: 100 };

  const unitDayExecs = executions.filter(
    e => e.unitId === unitId && e.date === dateStr
  );

  let completedCount = 0;
  let simulatedTotal = dailyTasks.length;

  for (const task of dailyTasks) {
    const exec = unitDayExecs.find(e => e.taskId === task.id);
    if (exec) {
      if (exec.status === 'executado') {
        completedCount++;
      } else if (exec.status === 'nao_se_aplica') {
        simulatedTotal--; // remove dos relevantes
      }
    }
  }

  const finalTotal = simulatedTotal > 0 ? simulatedTotal : 0;
  const percentage = finalTotal > 0 ? Math.round((completedCount / finalTotal) * 100) : 100;

  return { completed: completedCount, total: finalTotal, percentage };
}

/**
 * Gera texto formatado para envio direto no WhatsApp
 */
export function generateWhatsAppSummary(
  dateStr: string,
  units: Unit[],
  tasks: StandardTask[],
  executions: TaskExecution[],
  pendencias: Pendencia[]
): string {
  const activeUnits = units.filter(u => u.active);
  const formattedDate = formatShortDate(dateStr);
  
  let text = `⚡ *TRÁFEGON CHECK - RESUMO OPERACIONAL* ⚡\n`;
  text += `📅 _Data: ${formattedDate}_\n`;
  text += `🏢 _Grupo ONE - Unidades Espaçolaser_\n`;
  text += `===================================\n\n`;

  text += `📊 *CONCLUÍDO HOJE (Checklist Diário)*:\n`;
  
  activeUnits.forEach(unit => {
    const rate = calculateCompletionRate(unit.id, dateStr, tasks, executions);
    const completedTasks = tasks.filter(t => t.frequency === 'diario').map(task => {
      const exec = executions.find(e => e.unitId === unit.id && e.date === dateStr && e.taskId === task.id);
      const statusIcon = exec?.status === 'executado' ? '✅' : exec?.status === 'nao_se_aplica' ? '⚪' : '❌';
      return `${statusIcon} ${task.title}`;
    }).join(' | ');

    text += `📍 *${unit.name}*\n`;
    text += `└ Execução: *${rate.percentage}%* (${rate.completed}/${rate.total} tarefas)\n`;
    text += `└ Rotina: ${completedTasks}\n\n`;
  });

  const abertas = pendencias.filter(p => p.status === 'pendente' || p.status === 'em_andamento' || p.status === 'aberta');
  text += `⚠️ *PENDÊNCIAS ATIVAS NO PAINEL (${abertas.length})*:\n`;
  if (abertas.length === 0) {
    text += `✅ Nenhuma pendência registrada! Parabéns à equipe.\n`;
  } else {
    abertas.forEach((p, idx) => {
      const u = units.find(unit => unit.id === p.unitId);
      const host = u ? u.name : 'Geral';
      const actualPriority = p.priority || p.urgency || 'media';
      const urgencyStr = 
        actualPriority === 'critica' ? '🚨 CRÍTICA' :
        actualPriority === 'alta' ? '🔥 ALTA' : 
        actualPriority === 'media' ? '⚠️ MÉDIA' : '☕ BAIXA';
      const resp = p.responsible.toUpperCase();
      text += `${idx + 1}. *[${urgencyStr}]* em _${host}_\n`;
      text += `   └ *Descrição:* ${p.description}\n`;
      text += `   └ *Origem:* ${p.origin || 'Outro'}\n`;
      if (p.prazo) {
        text += `   └ *Prazo:* ${formatShortDate(p.prazo)}\n`;
      }
      text += `   └ *Resp. pela Ação:* ${resp}\n`;
      if (p.notes) {
        text += `   └ *Obs:* ${p.notes}\n`;
      }
      text += `\n`;
    });
  }

  text += `📥 *Dica TráfegON:* Mantenha gerentes motivadas e colabore diariamente para garantir o tráfego orgânico bombando!\n`;
  text += `-----------------------------------\n`;
  text += `_Gerado automaticamente via TráfegON Check_`;

  return text;
}

/**
 * Custom WhatsApp multi-report generator.
 */
export function generateWhatsAppReport(
  type: 'resumo_dia' | 'pendencias_unidade' | 'resumo_reuniao' | 'unidades_alerta' | 'tarefas_balanco',
  dateStr: string,
  units: Unit[],
  tasks: StandardTask[],
  executions: TaskExecution[],
  pendencias: Pendencia[]
): string {
  const activeUnits = units.filter(u => u.active);
  const formattedDate = formatShortDate(dateStr);
  const todayDate = dateStr;

  const getTaskStatusLabel = (unitId: string, taskId: string, date: string) => {
    const exec = executions.find(e => e.unitId === unitId && e.taskId === taskId && e.date === date);
    if (exec) {
      if (exec.status === 'executado') return 'Concluído';
      if (exec.status === 'nao_se_aplica') return 'Não se aplica';
      if (exec.status === 'atrasado') return 'Crítico/Atrasado';
      return 'Pendente';
    }
    return 'Pendente';
  };

  let totalTasks = 0;
  let completedCount = 0;
  let pendingCount = 0;
  let delayedCount = 0;

  const rawAlertList: { unit: Unit; reason: string }[] = [];

  activeUnits.forEach(unit => {
    const dailyTasks = tasks.filter(t => t.frequency === 'diario');
    const parts = dateStr.split('-');
    const dayOfWeek = parts.length === 3 ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getDay() : 1;
    const isPostagemDay = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
    
    const activeDailyTasks = dailyTasks.filter(task => {
      if (task.id === 'postagem-principal') return isPostagemDay;
      return true;
    });

    let unitHasDelayed = false;
    let reasons: string[] = [];

    const hasHighUrgencyPendency = pendencias.some(p => {
      const isPending = p.status === 'pendente' || p.status === 'em_andamento' || p.status === 'aberta';
      const isPriorityHigh = p.priority === 'critica' || p.priority === 'alta';
      const isOverdue = p.prazo ? (p.prazo < todayDate) : false;
      return p.unitId === unit.id && isPending && (isPriorityHigh || isOverdue);
    });

    activeDailyTasks.forEach(task => {
      const status = getTaskStatusLabel(unit.id, task.id, dateStr);
      totalTasks++;
      if (status === 'Concluído') {
        completedCount++;
      } else if (status === 'Crítico/Atrasado') {
        delayedCount++;
        unitHasDelayed = true;
        reasons.push(`${task.title} em atraso`);
      } else if (status === 'Não se aplica') {
        // Ignored
      } else {
        pendingCount++;
      }
    });

    if (hasHighUrgencyPendency) {
      reasons.push("Possui pendências críticas em aberto");
    }

    if (unitHasDelayed || hasHighUrgencyPendency) {
      rawAlertList.push({
        unit,
        reason: reasons.length > 0 ? reasons.join(", ") : "Possui desvio operacional não resolvido"
      });
    }
  });

  const adherenceRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 100;

  let r = '';

  switch (type) {
    case 'resumo_dia': {
      r += `📋 *RESUMO OPERACIONAL - TRÁFEGON CHECK* 📋\n\n`;
      r += `⏱️ *Hoje (${formattedDate}):*\n`;
      r += `• Tarefas concluídas: *${completedCount}*\n`;
      r += `• Pendências em aberto: *${pendencias.filter(p => !['resolvido', 'resolvida', 'cancelado'].includes(p.status)).length}*\n`;
      r += `• Unidades em alerta: *${rawAlertList.length}*\n\n`;

      r += `🚨 *Unidades em alerta:*\n`;
      if (rawAlertList.length === 0) {
        r += `• _Nenhuma unidade em alerta hoje! Excelente consistência._\n`;
      } else {
        rawAlertList.forEach(item => {
          r += `• *${item.unit.name}:* ${item.reason}\n`;
        });
      }
      r += `\n`;

      r += `⚠️ *Pendências críticas:*\n`;
      const criticalPendencies = pendencias.filter(p => (p.status === 'pendente' || p.status === 'em_andamento' || p.status === 'aberta') && (p.priority === 'critica' || p.priority === 'alta'));
      if (criticalPendencies.length === 0) {
        r += `• _Nenhum bloqueio crítico em aberto._\n`;
      } else {
        criticalPendencies.forEach(p => {
          const uName = units.find(u => u.id === p.unitId)?.name || 'Geral';
          r += `• *[${uName}]* ${p.description} (Resp: ${p.responsible})\n`;
        });
      }
      r += `\n`;

      r += `📌 *Próximos passos:*\n`;
      r += `• Cobrar stories e materiais das unidades com pendências diárias\n`;
      r += `• Resolver bloqueios críticos de publicação com gerentes locais\n`;
      r += `• Acompanhar novos conteúdos orgânicos gerados nas clínicas\n\n`;
      r += `_Relatório gerado em ${formattedDate} via TráfegON Check • Grupo ONE_`;
      break;
    }

    case 'pendencias_unidade': {
      r += `📋 *PENDÊNCIAS POR UNIDADE - TRÁFEGON CHECK* 📋\n`;
      r += `⏱️ *Data de Emissão:* ${formattedDate}\n`;
      r += `========================================\n\n`;

      const activePendencies = pendencias.filter(p => !['resolvido', 'resolvida', 'cancelado'].includes(p.status));
      if (activePendencies.length === 0) {
        r += `✅ _Excelente! Nenhuma pendência cadastrada em todo o Grupo._\n`;
      } else {
        const grouped: Record<string, Pendencia[]> = {};
        activePendencies.forEach(p => {
          if (!grouped[p.unitId]) grouped[p.unitId] = [];
          grouped[p.unitId].push(p);
        });

        Object.keys(grouped).forEach(unitId => {
          const u = units.find(u => u.id === unitId);
          if (u) {
            r += `🏢 *${u.name}*\n`;
            grouped[unitId].forEach(p => {
              const priorityText = p.priority === 'critica' ? 'CRÍTICO' : p.priority === 'alta' ? 'URGENTE' : p.priority === 'media' ? 'ATENÇÃO' : 'NORMAL';
              r += `  • *[${priorityText}]* ${p.description}\n`;
              r += `    └ Resp: ${p.responsible} | Prazo: ${p.prazo ? formatShortDate(p.prazo) : 'Sem prazo'}\n`;
            });
            r += `\n`;
          }
        });
      }
      r += `_TráfegON Check • Grupo ONE_`;
      break;
    }

    case 'resumo_reuniao': {
      r += `🤝 *RESUMO PARA REUNIÃO - TRÁFEGON CHECK* 🤝\n`;
      r += `⏱️ *Destaques de Alinhamento (${formattedDate}):*\n`;
      r += `========================================\n\n`;

      r += `📊 *Indicador Geral:* Aderência de *${adherenceRate}%* das franquias ao ritual orgânico.\n\n`;

      r += `🏆 *Unidades Destaque (Consistentes):*\n`;
      const sortedUnits = [...activeUnits].map(unit => {
        const rate = calculateCompletionRate(unit.id, dateStr, tasks, executions);
        return { unit, rate };
      }).sort((a, b) => b.rate.percentage - a.rate.percentage);

      sortedUnits.slice(0, 3).forEach((item, index) => {
        r += `  ${index + 1}. *${item.unit.name}* (${item.rate.percentage}% concluído)\n`;
      });
      r += `\n`;

      r += `⚠️ *Pontos de Alerta (Necessitam de Apoio):*\n`;
      const bottomUnits = [...sortedUnits].reverse();
      const bottomCount = bottomUnits.slice(0, 3).filter(item => item.rate.percentage < 100);
      bottomCount.forEach((item, index) => {
        r += `  • *${item.unit.name}:* Aderência de ${item.rate.percentage}% (${item.rate.completed}/${item.rate.total} tarefas)\n`;
      });
      if (bottomCount.length === 0) {
        r += `  • _Nenhuma unidade abaixo da meta!_\n`;
      }
      r += `\n`;

      r += `🎯 *Pauta Recomendada de Discussão:*\n`;
      r += `1. Alinhamento de criativos de campanha com as franquias em alerta\n`;
      r += `2. Compartilhar boas práticas das unidades destaques do Grupo ONE\n`;
      r += `3. Meta de stories humanizados: Reforçar importância das gerentes gravarem bastidores locais diariamente\n\n`;
      r += `_Apoio de decisões táticas via TráfegON Check_`;
      break;
    }

    case 'unidades_alerta': {
      r += `🚨 *ALERTA OPERACIONAL DE FRANQUIAS - TRÁFEGON CHECK* 🚨\n`;
      r += `⏱️ *Visualizador de Risco (${formattedDate}):*\n`;
      r += `Unidades que necessitam de intervenção imediata:\n\n`;

      if (rawAlertList.length === 0) {
        r += `✅ _Sem alertas operacionais ativos! Todas as clínicas estão em conformidade diária._\n`;
      } else {
        rawAlertList.forEach((item, index) => {
          r += `${index + 1}. *🏢 ${item.unit.name}*\n`;
          r += `   ├ *Motivo:* ${item.reason}\n`;
          r += `   ├ *Contato:* ${item.unit.gerente} (Gerente) | ${item.unit.socia} (Sócia)\n`;
          r += `   └ *Status Atual:* Canal sob risco operacional\n\n`;
        });
      }
      r += `_Por favor, gestores e acionistas tomem as providências de alinhamento com as unidades em alerta._`;
      break;
    }

    case 'tarefas_balanco': {
      r += `📋 *BALANÇO DE TAREFAS - TRÁFEGON CHECK* 📋\n`;
      r += `⏱️ *Conformidade de Rotinas:* ${formattedDate}\n`;
      r += `========================================\n\n`;

      let totalLogged = 0;
      let executedLog = '';
      let pendingLog = '';

      activeUnits.forEach(unit => {
        const dailyTasks = tasks.filter(t => t.frequency === 'diario');
        const parts = dateStr.split('-');
        const dayOfWeek = parts.length === 3 ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getDay() : 1;
        const isPostagemDay = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
        
        const activeDailyTasks = dailyTasks.filter(task => {
          if (task.id === 'postagem-principal') return isPostagemDay;
          return true;
        });

        activeDailyTasks.forEach(task => {
          const status = getTaskStatusLabel(unit.id, task.id, dateStr);
          totalLogged++;
          if (status === 'Concluído') {
            executedLog += `• [${unit.sigla}] - ${task.title} (OK)\n`;
          } else if (status !== 'Não se aplica') {
            pendingLog += `• [${unit.sigla}] - ${task.title} (Pendente ou em atraso)\n`;
          }
        });
      });

      r += `✅ *TAREFAS CONCLUÍDAS:* \n`;
      r += executedLog || `_Nenhuma tarefa concluída neste dia ainda._\n`;
      r += `\n`;

      r += `⏳ *TAREFAS PENDENTES / EM ATRASO:* \n`;
      r += pendingLog || `_Parabéns, todas as tarefas agendadas foram executadas!_\n`;
      r += `\n`;
      
      r += `_Total de tarefas avaliadas: ${totalLogged} • TráfegON Check_`;
      break;
    }
  }

  return r;
}

