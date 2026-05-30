import React, { useState } from 'react';
import { Unit, StandardTask, TaskFrequency, TaskPriority, GlobalConfig, SystemChangeLog, SpecialDate, QuickSuggestion } from '../types';
import { 
  Building,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  History,
  FileText,
  Sliders,
  Settings,
  ListTodo,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Shield,
  FileSpreadsheet,
  Link,
  ChevronRight,
  Bookmark,
  CalendarDays,
  Flame,
  User,
  Heart,
  Check,
  Briefcase,
  HelpCircle,
  ArrowRight,
  Star,
  Skull,
  Info,
  Layers,
  Database,
  Download,
  Upload,
  Copy,
  FileCode
} from 'lucide-react';

interface ConfiguracoesViewProps {
  units: Unit[];
  tasks: StandardTask[];
  onAddUnit: (
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
  onToggleUnitActive: (id: string) => void;
  onUpdateUnit: (updatedUnit: Unit) => void;
  onDeleteUnit: (id: string) => void;
  onAddTask: (title: string, frequency: TaskFrequency, description: string) => void;
  onUpdateTask: (updatedTask: StandardTask) => void;
  onDeleteTask: (id: string) => void;
  onResetDatabase: () => void;
  globalConfig: GlobalConfig;
  onUpdateGlobalConfig: (config: GlobalConfig) => void;
  changeLogs: SystemChangeLog[];
  onUpdateChangeLogs: (logs: SystemChangeLog[]) => void;
  suggestions: QuickSuggestion[];
  onUpdateSuggestions: (updated: QuickSuggestion[]) => void;
}

export default function ConfiguracoesView({
  units,
  tasks,
  onAddUnit,
  onToggleUnitActive,
  onUpdateUnit,
  onDeleteUnit,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onResetDatabase,
  globalConfig,
  onUpdateGlobalConfig,
  changeLogs,
  onUpdateChangeLogs,
  suggestions,
  onUpdateSuggestions
}: ConfiguracoesViewProps) {
  // Navigation tabs of settings
  const [activeSubTab, setActiveSubTab] = useState<'unidades' | 'datas' | 'tarefas' | 'regras' | 'status' | 'historico' | 'sugestoes' | 'backup'>('unidades');

  // Backup and Data sync states
  const [pastedBackupText, setPastedBackupText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Unified feedback alerts
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Helper notice display
  const showNotice = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 4000);
  };

  const utf8_to_b64 = (str: string) => {
    return window.btoa(unescape(encodeURIComponent(str)));
  };

  const b64_to_utf8 = (str: string) => {
    return decodeURIComponent(escape(window.atob(str)));
  };

  const handleImportData = (rawText: string) => {
    try {
      let jsonText = rawText.trim();
      
      // Try treating as base64 token if it doesn't start with {
      if (!jsonText.startsWith('{')) {
        try {
          jsonText = b64_to_utf8(jsonText);
        } catch (e) {
          // If decoding base64 failed, continue and try parsing anyway
        }
      }

      const parsed = JSON.parse(jsonText);
      
      // Ensure it contains mandatory database elements
      const requiredKeys = ['trafegon_units', 'trafegon_tasks'];
      const hasKeys = requiredKeys.some(k => k in parsed);
      if (!hasKeys) {
        throw new Error('O formato do arquivo ou token inserido é inválido. Certifique-se de estar usando um backup exportado do TráfegON.');
      }

      // Save keys into localStorage
      Object.keys(parsed).forEach(k => {
        if (parsed[k] !== null && parsed[k] !== undefined) {
          localStorage.setItem(k, typeof parsed[k] === 'string' ? parsed[k] : JSON.stringify(parsed[k]));
        }
      });

      // Maintain internal v2 storage compatibility
      localStorage.setItem('trafegon_units_v2', 'true');

      showNotice('Backup importado com sucesso! Sincronizando e recarregando o painel...', 'success');
      
      // Clear pasting text state list
      setPastedBackupText('');

      // Reload window to let App.tsx re-initialize states from localStorage
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      showNotice(err.message || 'Falha ao processar arquivo ou código de backup. Verifique se o conteúdo está correto.', 'error');
    }
  };

  // -------------------------------------------------------------
  // GENIUS CHANGE JUSTIFICATION FLOW (Requirements 5 & 6)
  // -------------------------------------------------------------
  const [justificationModal, setJustificationModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    oldValue: string;
    newValue: string;
    origin: 'reuniao_quinzenal' | 'ajuste_interno' | 'demanda_pontual' | 'outro';
    reason: string;
    applyFrom: 'hoje' | 'amanha' | 'semana' | 'mes' | 'customizada';
    customDate: string;
    taskRemovalOption?: 'hoje_tambem' | 'apenas_proximos' | 'escolher_data';
    standardTaskOption?: 'all' | 'specific' | 'new';
    onConfirm: (data: {
      reason: string;
      origin: 'reuniao_quinzenal' | 'ajuste_interno' | 'demanda_pontual' | 'outro';
      applyFrom: string;
      taskRemovalOption?: string;
      standardTaskOption?: string;
    }) => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    oldValue: '',
    newValue: '',
    origin: 'ajuste_interno',
    reason: '',
    applyFrom: 'hoje',
    customDate: '',
    onConfirm: () => {}
  });

  const triggerChangeLogFlow = (
    title: string,
    description: string,
    oldValue: string,
    newValue: string,
    onConfirmCallback: () => void,
    options?: {
      hasTaskRemoval?: boolean;
      hasStandardCohort?: boolean;
    }
  ) => {
    setJustificationModal({
      isOpen: true,
      title,
      description,
      oldValue,
      newValue,
      origin: 'ajuste_interno',
      reason: '',
      applyFrom: 'hoje',
      customDate: new Date().toISOString().split('T')[0],
      taskRemovalOption: options?.hasTaskRemoval ? 'hoje_tambem' : undefined,
      standardTaskOption: options?.hasStandardCohort ? 'all' : undefined,
      onConfirm: (data) => {
        // Run core operation payload
        onConfirmCallback();

        // Build log item
        const logId = 'log_' + Date.now();
        const logDate = new Date().toISOString();
        const applyText = data.applyFrom === 'customizada' ? `Data customizada: ${justificationModal.customDate}` : 
                          data.applyFrom === 'amanha' ? 'Amanhã' :
                          data.applyFrom === 'semana' ? 'Próxima semana' :
                          data.applyFrom === 'mes' ? 'Próximo mês' : 'Hoje';

        const taskRemoveText = data.taskRemovalOption ? ` • Ação de remoção: ${
          data.taskRemovalOption === 'hoje_tambem' ? 'Remover do painel de hoje também' :
          data.taskRemovalOption === 'apenas_proximos' ? 'Manter hoje e remover apenas dos próximos dias' : 'Escolher data de aplicação'
        }` : '';

        const cohortText = data.standardTaskOption ? ` • Aplicar mudança a: ${
          data.standardTaskOption === 'all' ? 'Todas as unidades ativas' :
          data.standardTaskOption === 'specific' ? 'Apenas unidades selecionadas' : 'Apenas a novas unidades'
        }` : '';

        const completeDescription = `${description} [Aplicado em: ${applyText}${taskRemoveText}${cohortText}]`;

        const newLog: SystemChangeLog = {
          id: logId,
          date: logDate,
          description: completeDescription,
          oldValue,
          newValue,
          reason: data.reason || 'Ajuste de conformidade técnica operacional.',
          origin: data.origin
        };

        // Save log
        onUpdateChangeLogs([newLog, ...changeLogs]);
        showNotice('Alteração realizada e gravada no histórico com sucesso!', 'success');
      }
    });
  };

  // -------------------------------------------------------------
  // STATES TAB 1: UNIDADES MANAGEMENT
  // -------------------------------------------------------------
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [unitForm, setUnitForm] = useState({
    name: '',
    sigla: '',
    cidadeUf: '',
    region: 'PE',
    gerente: '',
    socia: 'Cristina ONE',
    instagramUrl: '',
    tiktokUrl: '',
    notes: '',
    applyStandardChecklist: true
  });

  const resetUnitForm = () => {
    setUnitForm({
      name: '',
      sigla: '',
      cidadeUf: '',
      region: 'PE',
      gerente: '',
      socia: 'Cristina ONE',
      instagramUrl: '',
      tiktokUrl: '',
      notes: '',
      applyStandardChecklist: true
    });
    setEditingUnitId(null);
  };

  const handleEditUnitClick = (u: Unit) => {
    setEditingUnitId(u.id);
    setUnitForm({
      name: u.name,
      sigla: u.sigla,
      cidadeUf: u.cidadeUf,
      region: u.region || 'PE',
      gerente: u.gerente || '',
      socia: u.socia || 'Cristina ONE',
      instagramUrl: u.instagramUrl || '',
      tiktokUrl: u.tiktokUrl || '',
      notes: u.notes || '',
      applyStandardChecklist: u.useStandardChecklist ?? true
    });
  };

  const handleSaveUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitForm.name.trim()) return;

    if (editingUnitId) {
      // Editing existing unit
      const oldUnit = units.find(u => u.id === editingUnitId);
      const updated: Unit = {
        ...oldUnit!,
        name: unitForm.name,
        sigla: unitForm.sigla || unitForm.region,
        cidadeUf: unitForm.cidadeUf,
        region: unitForm.region,
        gerente: unitForm.gerente,
        socia: unitForm.socia,
        instagramUrl: unitForm.instagramUrl,
        tiktokUrl: unitForm.tiktokUrl,
        notes: unitForm.notes,
        useStandardChecklist: unitForm.applyStandardChecklist
      };

      triggerChangeLogFlow(
        'Editar Cadastro de Unidade',
        `Edição cadastral da unidade '${oldUnit?.name}'`,
        JSON.stringify(oldUnit),
        JSON.stringify(updated),
        () => onUpdateUnit(updated)
      );
      resetUnitForm();
    } else {
      // Add new unit (Question 1 checklist application prompt)
      const promptAndAdd = () => {
        const uId = 'u_' + Date.now();
        // Generate new unit directly
        const newU: Unit = {
          id: uId,
          name: unitForm.name,
          sigla: unitForm.sigla || unitForm.region || 'EXP',
          cidadeUf: unitForm.cidadeUf || `${unitForm.name}/${unitForm.region}`,
          active: true,
          gerente: unitForm.gerente || 'Gerente',
          socia: unitForm.socia || 'Sócia Responsável',
          instagramUrl: unitForm.instagramUrl || 'https://www.instagram.com/espacolaser',
          tiktokUrl: unitForm.tiktokUrl || 'https://www.tiktok.com/@espacolaser',
          notes: unitForm.notes || '',
          region: unitForm.region || 'PE',
          contactName: unitForm.gerente || 'Gerente local',
          
          // Question 1 auto checklist application
          useStandardChecklist: unitForm.applyStandardChecklist,
          hasStoriesControle: unitForm.applyStandardChecklist,
          hasInstagramNota: unitForm.applyStandardChecklist,
          hasPostagemPrincipal: unitForm.applyStandardChecklist,
          hasPendenciasControle: unitForm.applyStandardChecklist,
          hasColaboracaoControle: unitForm.applyStandardChecklist,
          hasDashboardEntrada: unitForm.applyStandardChecklist,
          hasReuniaoEntrada: unitForm.applyStandardChecklist,
          hasRelatoriosEntrada: unitForm.applyStandardChecklist
        };

        const updatedList = [...units, newU];
        // Trigger save and log in history
        triggerChangeLogFlow(
          'Nova Unidade Cadastrada',
          `Criação da unidade '${newU.name}' (Sigla: ${newU.sigla}) com checklist padrão: ${unitForm.applyStandardChecklist ? 'Sim' : 'Não'}`,
          'Nenhum cadastro anterior',
          JSON.stringify(newU),
          () => onAddUnit(
            newU.name, 
            newU.region, 
            newU.gerente, 
            newU.sigla, 
            newU.cidadeUf, 
            newU.gerente, 
            newU.socia, 
            newU.instagramUrl, 
            newU.tiktokUrl, 
            newU.notes
          )
        );
        resetUnitForm();
      };
      promptAndAdd();
    }
  };

  const handleUnitActiveToggle = (u: Unit) => {
    const nextActive = !u.active;
    triggerChangeLogFlow(
      'Alterar Status de Atividade da Unidade',
      `Unidade '${u.name}' alterada para ${nextActive ? 'Ativa' : 'Desativada'}`,
      `Status: ${u.active ? 'Ativa' : 'Inativa'}`,
      `Status: ${nextActive ? 'Ativa' : 'Inativa'}`,
      () => onToggleUnitActive(u.id)
    );
  };

  const handleUnitDelete = (u: Unit) => {
    if (confirm(`Tem certeza absoluta de que deseja excluir a unidade ${u.name}? Todos os dados desta unidade serão impactados.`)) {
      triggerChangeLogFlow(
        'Excluir Unidade',
        `Exclusão definitiva da clínica '${u.name}' do painel`,
        JSON.stringify(u),
        'Cadastro removido',
        () => onDeleteUnit(u.id)
      );
    }
  };


  // -------------------------------------------------------------
  // STATES TAB 2: DATAS E RECORRÊNCIAS (Requirement 2)
  // -------------------------------------------------------------
  const [datesForm, setDatesForm] = useState<GlobalConfig>({
    ...globalConfig
  });
  const [newSuggestedTime, setNewSuggestedTime] = useState('');
  
  // States of special dates form
  const [newSpecialLabel, setNewSpecialLabel] = useState('');
  const [newSpecialDate, setNewSpecialDate] = useState('');
  const [newSpecialType, setNewSpecialType] = useState<'evento' | 'feriado' | 'pausa'>('feriado');

  const handleWeekdayToggle = (day: number) => {
    const current = datesForm.postagemPrincipalDays || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort();
    setDatesForm({ ...datesForm, postagemPrincipalDays: updated });
  };

  const handleAddSuggestedTime = () => {
    if (!newSuggestedTime) return;
    const current = datesForm.suggestedPublishTimes || [];
    if (current.includes(newSuggestedTime)) return;
    const updated = [...current, newSuggestedTime].sort();
    setDatesForm({ ...datesForm, suggestedPublishTimes: updated });
    setNewSuggestedTime('');
  };

  const handleRemoveSuggestedTime = (time: string) => {
    const updated = (datesForm.suggestedPublishTimes || []).filter(t => t !== time);
    setDatesForm({ ...datesForm, suggestedPublishTimes: updated });
  };

  const handleAddSpecialDate = () => {
    if (!newSpecialDate || !newSpecialLabel.trim()) return;
    const current = datesForm.specialDates || [];
    const newSpec: SpecialDate = {
      id: 'spec_' + Date.now(),
      date: newSpecialDate,
      label: newSpecialLabel.trim(),
      type: newSpecialType,
      active: true
    };
    const updated = [...current, newSpec].sort((a,b) => a.date.localeCompare(b.date));
    setDatesForm({ ...datesForm, specialDates: updated });
    setNewSpecialDate('');
    setNewSpecialLabel('');
  };

  const handleRemoveSpecialDate = (id: string) => {
    const updated = (datesForm.specialDates || []).filter(sd => sd.id !== id);
    setDatesForm({ ...datesForm, specialDates: updated });
  };

  const handleSaveDatesAndRecurrence = (e: React.FormEvent) => {
    e.preventDefault();
    triggerChangeLogFlow(
      'Salvar Configurações de Datas e Recorrências',
      'Alteração das diretrizes operacionais de frequências de Stories, Notas, Reunião e prazos mensais',
      JSON.stringify(globalConfig),
      JSON.stringify(datesForm),
      () => onUpdateGlobalConfig(datesForm)
    );
  };


  // -------------------------------------------------------------
  // STATES TAB 3: MODELOS DE TAREFAS (Requirement 3 & 7)
  // -------------------------------------------------------------
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    frequency: 'diario' as TaskFrequency,
    description: '',
    priority: 'media' as TaskPriority,
    applicationType: 'all' as 'all' | 'specific',
    applicableUnits: [] as string[],
    isRequired: true,
    suggestedTime: '',
    active: true,
    recurrenceRule: ''
  });

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      frequency: 'diario',
      description: '',
      priority: 'media',
      applicationType: 'all',
      applicableUnits: [],
      isRequired: true,
      suggestedTime: '',
      active: true,
      recurrenceRule: ''
    });
    setEditingTaskId(null);
  };

  const handleEditTaskClick = (t: StandardTask) => {
    setEditingTaskId(t.id);
    setTaskForm({
      title: t.title,
      frequency: t.frequency,
      description: t.description,
      priority: t.priority || 'media',
      applicationType: t.applicationType || 'all',
      applicableUnits: t.applicableUnits || [],
      isRequired: t.isRequired ?? true,
      suggestedTime: t.suggestedTime || '',
      active: t.active ?? true,
      recurrenceRule: t.recurrenceRule || ''
    });
  };

  const handleSaveTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    if (editingTaskId) {
      // Editing task template
      const oldTask = tasks.find(t => t.id === editingTaskId);
      const updated: StandardTask = {
        ...oldTask!,
        title: taskForm.title,
        frequency: taskForm.frequency,
        description: taskForm.description,
        priority: taskForm.priority,
        applicationType: taskForm.applicationType,
        applicableUnits: taskForm.applicableUnits,
        isRequired: taskForm.isRequired,
        suggestedTime: taskForm.suggestedTime,
        active: taskForm.active,
        recurrenceRule: taskForm.recurrenceRule
      };

      // Question 7 Prompt configuration (cohort of execution)
      triggerChangeLogFlow(
        'Alterar Modelo de Tarefa Padrão',
        `Edição do modelo de rotina '${oldTask?.title}'`,
        JSON.stringify(oldTask),
        JSON.stringify(updated),
        () => onUpdateTask(updated),
        { hasStandardCohort: true }
      );
      resetTaskForm();
    } else {
      // Create new standard task
      const newId = 't_' + Date.now();
      const newT: StandardTask = {
        id: newId,
        title: taskForm.title,
        frequency: taskForm.frequency,
        description: taskForm.description,
        priority: taskForm.priority,
        applicationType: taskForm.applicationType,
        applicableUnits: taskForm.applicableUnits,
        isRequired: taskForm.isRequired,
        suggestedTime: taskForm.suggestedTime,
        active: taskForm.active,
        recurrenceRule: taskForm.recurrenceRule
      };

      triggerChangeLogFlow(
        'Criar Novo Modelo de Tarefa Padrão',
        `Nova rotina cadastrada de categoria '${taskForm.frequency}': '${taskForm.title}'`,
        'Rotina inexistente',
        JSON.stringify(newT),
        () => onAddTask(newT.title, newT.frequency, newT.description),
        { hasStandardCohort: true }
      );
      resetTaskForm();
    }
  };

  const handleTaskDeleteClick = (t: StandardTask) => {
    if (confirm(`Tem certeza que deseja excluir o modelo de rotina '${t.title}'?`)) {
      triggerChangeLogFlow(
        'Remover Modelo de Tarefa',
        `Remoção do modelo de rotina '${t.title}'`,
        JSON.stringify(t),
        'Removido',
        () => onDeleteTask(t.id),
        { hasTaskRemoval: true }
      );
    }
  };

  const handleTaskCohortSelect = (unitId: string) => {
    const current = taskForm.applicableUnits || [];
    const updated = current.includes(unitId)
      ? current.filter(id => id !== unitId)
      : [...current, unitId];
    setTaskForm({ ...taskForm, applicableUnits: updated });
  };


  // -------------------------------------------------------------
  // STATES TAB 4: REGRAS OPERACIONAIS POR UNIDADE (Requirement 4)
  // -------------------------------------------------------------
  const [selectedRuleUnitId, setSelectedRuleUnitId] = useState<string>(units[0]?.id || '');
  const selectedUnitWithRules = units.find(u => u.id === selectedRuleUnitId);

  const handleToggleRuleBoolean = (key: keyof Unit) => {
    if (!selectedUnitWithRules) return;
    const oldValue = selectedUnitWithRules[key];
    const newValue = !oldValue;
    
    const updated = {
      ...selectedUnitWithRules,
      [key]: newValue
    };

    triggerChangeLogFlow(
      `Atualizar Diretriz de Regra: ${String(key)}`,
      `Alterado indicador '${String(key)}' na unidade '${selectedUnitWithRules.name}'`,
      `${String(key)}: ${oldValue ? 'Ativo' : 'Inativo'}`,
      `${String(key)}: ${newValue ? 'Ativo' : 'Inativo'}`,
      () => onUpdateUnit(updated)
    );
  };

  const handleUpdateUnitInternalNotes = (notes: string) => {
    if (!selectedUnitWithRules) return;
    const updated = {
      ...selectedUnitWithRules,
      notes: notes
    };
    onUpdateUnit(updated);
  };

  // Manage extra/custom tasks and excluded tasks of selected unit
  const handleToggleExcludedTask = (taskId: string) => {
    if (!selectedUnitWithRules) return;
    const currentExcluded = selectedUnitWithRules.removedTasks || [];
    const updatedExcluded = currentExcluded.includes(taskId)
      ? currentExcluded.filter(id => id !== taskId)
      : [...currentExcluded, taskId];

    const updated = {
      ...selectedUnitWithRules,
      removedTasks: updatedExcluded
    };

    triggerChangeLogFlow(
      'Remover Tarefa Específica por Filial',
      `Alterada lista de exclusões de tarefas na unidade '${selectedUnitWithRules.name}'`,
      `Excluídas: ${JSON.stringify(currentExcluded)}`,
      `Excluídas: ${JSON.stringify(updatedExcluded)}`,
      () => onUpdateUnit(updated),
      { hasTaskRemoval: true }
    );
  };

  const handleTogglePausedTask = (taskId: string) => {
    if (!selectedUnitWithRules) return;
    const currentPaused = selectedUnitWithRules.pausedTasks || [];
    const updatedPaused = currentPaused.includes(taskId)
      ? currentPaused.filter(id => id !== taskId)
      : [...currentPaused, taskId];

    const updated = {
      ...selectedUnitWithRules,
      pausedTasks: updatedPaused
    };

    triggerChangeLogFlow(
      'Pausar Tarefa Temporariamente',
      `Alterada lista de suspensões de tarefas na unidade '${selectedUnitWithRules.name}'`,
      `Pausadas: ${JSON.stringify(currentPaused)}`,
      `Pausadas: ${JSON.stringify(updatedPaused)}`,
      () => onUpdateUnit(updated)
    );
  };

  const handleToggleExtraTask = (taskId: string) => {
    if (!selectedUnitWithRules) return;
    const currentExtra = selectedUnitWithRules.extraTasks || [];
    const updatedExtra = currentExtra.includes(taskId)
      ? currentExtra.filter(id => id !== taskId)
      : [...currentExtra, taskId];

    const updated = {
      ...selectedUnitWithRules,
      extraTasks: updatedExtra
    };

    triggerChangeLogFlow(
      'Adicionar Tarefa Extra por Filial',
      `Alteradas tarefas extras autorizadas na unidade '${selectedUnitWithRules.name}'`,
      `Extras: ${JSON.stringify(currentExtra)}`,
      `Extras: ${JSON.stringify(updatedExtra)}`,
      () => onUpdateUnit(updated)
    );
  };


  // -------------------------------------------------------------
  // STATES TAB 5: CRITÉRIOS DE STATUS & COORDENAÇÃO (Requirement 5 & 6)
  // -------------------------------------------------------------
  const [statusForm, setStatusForm] = useState({
    verde: datesForm.criteriosStatusVerde || globalConfig.criteriosStatusVerde || '',
    amarelo: datesForm.criteriosStatusAmarelo || globalConfig.criteriosStatusAmarelo || '',
    vermelho: datesForm.criteriosStatusVermelho || globalConfig.criteriosStatusVermelho || ''
  });

  const [sociaNameInput, setSociaNameInput] = useState(datesForm.sociaOperadora || globalConfig.sociaOperadora || 'Fritz TráfegON');
  const [sociaRoleInput, setSociaRoleInput] = useState(datesForm.sociaOperadoraCargo || globalConfig.sociaOperadoraCargo || 'Controlador de Tráfego');

  const handleSaveSociaInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...datesForm,
      sociaOperadora: sociaNameInput,
      sociaOperadoraCargo: sociaRoleInput
    };

    triggerChangeLogFlow(
      'Atualizar Sócio(a) Operador(a)',
      'Edição do nome e cargo do(a) Sócio(a) Operador(a) responsável pelo sistema',
      JSON.stringify(globalConfig),
      JSON.stringify(updated),
      () => {
        setDatesForm(updated);
        onUpdateGlobalConfig(updated);
        showNotice('Informações de Sócio(a) Operador(a) salvas com sucesso!', 'success');
      }
    );
  };

  const handleSaveStatusCriteria = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...datesForm,
      criteriosStatusVerde: statusForm.verde,
      criteriosStatusAmarelo: statusForm.amarelo,
      criteriosStatusVermelho: statusForm.vermelho
    };

    triggerChangeLogFlow(
      'Atualizar Critérios de Status Rápido',
      'Alteração das regras de preenchimento dos status de visualização do Dashboard',
      JSON.stringify(globalConfig),
      JSON.stringify(updated),
      () => {
        setDatesForm(updated);
        onUpdateGlobalConfig(updated);
      }
    );
  };


  // -------------------------------------------------------------
  // RENDER CORRESPONDING CONTENT
  // -------------------------------------------------------------

  return (
    <div className="space-y-6">
      
      {/* 0. PRIMARY HEADER NOTIFICATION */}
      {notice && (
        <div className={`p-4 rounded-xl text-xs font-bold font-mono tracking-wide flex items-center gap-2.5 shadow-md animate-fadeIn ${
          notice.type === 'success' 
            ? 'bg-emerald-950/70 border border-emerald-900/60 text-emerald-400' 
            : notice.type === 'error'
            ? 'bg-rose-955 border border-red-900/40 text-red-400'
            : 'bg-indigo-950/70 border border-indigo-900/40 text-indigo-400'
        }`}>
          <CheckCircle className="w-4 h-4 shrink-0 animate-bounce" />
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} className="ml-auto text-gray-400 hover:text-white font-black text-xs font-mono uppercase">FECHAR</button>
        </div>
      )}

      {/* OPERATIONAL BANNER */}
      <div className="bg-[#141414] border border-[#212121] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-display font-black text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" /> Painel Geral de Configuração
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xl leading-relaxed">
            Ajuste as diretrizes táticas, controle calendários de feriados, altere rituais da reunião quinzenal e configure as regras de tarefas por unidade sem alterar código fonte.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => {
              if (confirm('Atenção: isto apagará todas as customizações salvas neste navegador, restaurando as 13 filiais e o checklist original do Grupo ONE. Deseja redefinir?')) {
                onResetDatabase();
                showNotice('Tabelas operacionais restauradas com sucesso!', 'info');
              }
            }}
            className="px-3.5 py-2 bg-rose-950/30 hover:bg-rose-955 text-rose-400 border border-red-900/40 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Redefinir Sistema
          </button>
        </div>
      </div>

      {/* 2. SUB-SECTION BUTTONS ROW (6 tabs) */}
      <div className="flex flex-wrap md:flex-nowrap bg-[#141414] p-1 border border-[#212121] rounded-xl overflow-x-auto gap-1">
        <button
          onClick={() => setActiveSubTab('unidades')}
          className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'unidades' ? 'bg-[#1C1C1C] text-white shadow-sm border border-[#2B2B2B]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Building className="w-3.5 h-3.5" /> 1. Unidades 
        </button>

        <button
          onClick={() => setActiveSubTab('datas')}
          className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'datas' ? 'bg-[#1C1C1C] text-white shadow-sm border border-[#2B2B2B]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> 2. Datas & Recorrências
        </button>

        <button
          onClick={() => setActiveSubTab('tarefas')}
          className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'tarefas' ? 'bg-[#1C1C1C] text-white shadow-sm border border-[#2B2B2B]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" /> 3. Modelos de Tarefas
        </button>

        <button
          onClick={() => setActiveSubTab('regras')}
          className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'regras' ? 'bg-[#1C1C1C] text-white shadow-sm border border-[#2B2B2B]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> 4. Regras por Filial
        </button>

        <button
          onClick={() => setActiveSubTab('status')}
          className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'status' ? 'bg-[#1C1C1C] text-white shadow-sm border border-[#2B2B2B]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-gray-500" /> 5. Critérios de Status
        </button>

        <button
          onClick={() => setActiveSubTab('sugestoes')}
          className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'sugestoes' ? 'bg-[#1C1C1C] text-white shadow-sm border border-[#2B2B2B]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 6. Sugestões Rápidas
        </button>

        <button
          onClick={() => setActiveSubTab('backup')}
          className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ml-auto ${
            activeSubTab === 'backup' ? 'bg-[#1C1C1C] text-white shadow-sm border border-[#2B2B2B]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-indigo-400" /> 7. Backup e Integração
        </button>

        <button
          onClick={() => setActiveSubTab('historico')}
          className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'historico' ? 'bg-[#1C1C1C] text-white shadow-sm border border-[#2B2B2B]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" /> 8. Histórico ({changeLogs.length})
        </button>
      </div>

      {/* 3. SUB-TAB VIEWPORT CONTENTS */}

      {/* ========================================== */}
      {/* SUB-TAB 1: UNIDADES (Requirements 1 & 7) */}
      {/* ========================================== */}
      {activeSubTab === 'unidades' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Cadastrar/Editar Formulário */}
          <div className="bg-[#141414] p-5 rounded-2xl border border-[#212121] lg:col-span-4 h-fit space-y-4">
            <div className="border-b border-[#212121] pb-3.5">
              <span className="text-[10px] uppercase font-mono text-indigo-400 font-bold block">Painel Operativo</span>
              <h3 className="font-display font-extrabold text-[15px] text-white mt-0.5">
                {editingUnitId ? 'Editar Cadastro de Filial' : 'Adicionar Nova Filial'}
              </h3>
            </div>

            <form onSubmit={handleSaveUnitSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-gray-450 mb-1">Nome da Unidade *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 14 - Petrolina Centro"
                    value={unitForm.name}
                    onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                    className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-450 mb-1">Sigla Curta (3 letras)</label>
                  <input
                    type="text"
                    placeholder="Ex: PET"
                    maxLength={5}
                    value={unitForm.sigla}
                    onChange={(e) => setUnitForm({ ...unitForm, sigla: e.target.value.toUpperCase() })}
                    className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-center font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-450 mb-1">Região/UF *</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    placeholder="PE, BA, RJ"
                    value={unitForm.region}
                    onChange={(e) => setUnitForm({ ...unitForm, region: e.target.value.toUpperCase() })}
                    className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-center font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-450 mb-1">Cidade / UF Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Petrolina/PE"
                  value={unitForm.cidadeUf}
                  onChange={(e) => setUnitForm({ ...unitForm, cidadeUf: e.target.value })}
                  className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-450 mb-1">Gerente Responsável</label>
                  <input
                    type="text"
                    placeholder="Ex: Aline Ramos"
                    value={unitForm.gerente}
                    onChange={(e) => setUnitForm({ ...unitForm, gerente: e.target.value })}
                    className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-450 mb-1">Sócia Responsável</label>
                  <select
                    value={unitForm.socia}
                    onChange={(e) => setUnitForm({ ...unitForm, socia: e.target.value })}
                    className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Cristina ONE">Cristina ONE</option>
                    <option value="Simone Vasconcelos">Simone Vasconcelos</option>
                    <option value="Mariana Vasconcelos">Mariana Vasconcelos</option>
                    <option value="Outra Sócia">Outra Sócia</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 bg-[#181818] p-3 rounded-xl border border-[#252525]">
                <strong className="text-[10px] tracking-wider uppercase text-gray-400 font-mono block">Canais Sociais locais</strong>
                <div>
                  <label className="text-[10px] text-gray-450 flex items-center gap-1 mb-0.5">
                    <Link className="w-3 h-3 text-indigo-400" /> Link Perfil Instagram
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.instagram.com/espacolaser_sigla"
                    value={unitForm.instagramUrl}
                    onChange={(e) => setUnitForm({ ...unitForm, instagramUrl: e.target.value })}
                    className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-450 flex items-center gap-1 mb-0.5">
                    <Link className="w-3 h-3 text-indigo-400" /> Link Perfil TikTok
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.tiktok.com/@espacolaser_sigla"
                    value={unitForm.tiktokUrl}
                    onChange={(e) => setUnitForm({ ...unitForm, tiktokUrl: e.target.value })}
                    className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-455 mb-1">Observações Internas</label>
                <textarea
                  rows={2}
                  placeholder="Rituais locais, collabs ou focos..."
                  value={unitForm.notes}
                  onChange={(e) => setUnitForm({ ...unitForm, notes: e.target.value })}
                  className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* INTEGRATION PROMPT CHECKBOX (Requirements 1 & 7) */}
              {!editingUnitId && (
                <div className="p-3 bg-indigo-950/20 rounded-xl border border-indigo-900/45 space-y-2 select-none">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="applyStandardChecklist"
                      checked={unitForm.applyStandardChecklist}
                      onChange={(e) => setUnitForm({ ...unitForm, applyStandardChecklist: e.target.checked })}
                      className="mt-0.5 cursor-pointer accent-indigo-500"
                    />
                    <label htmlFor="applyStandardChecklist" className="cursor-pointer">
                      <strong className="text-white text-[11px] leading-tight block">
                        Deseja aplicar o checklist padrão a esta unidade?
                      </strong>
                      <span className="text-[10px] text-gray-400 mt-1 block leading-normal">
                        Ativa automaticamente o controle de 3 stories diários, notas, postagem do feed principal, pendências, Modo Reunião e inclusão nos relatórios inteligentes de tráfego.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#232323]">
                {editingUnitId && (
                  <button
                    type="button"
                    onClick={resetUnitForm}
                    className="px-3.5 py-1.5 bg-[#252525] hover:bg-[#303030] text-gray-300 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md hover:scale-[1.01]"
                >
                  {editingUnitId ? 'Salvar Edição' : 'Cadastrar Unidade'}
                </button>
              </div>
            </form>
          </div>

          {/* List of units on the right */}
          <div className="lg:col-span-8 bg-[#141414] p-5 rounded-2xl border border-[#212121] space-y-4">
            <div className="border-b border-[#212121] pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-[15px] text-cyber-green text-white">
                  Franquias Cadastradas ({units.length})
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Gerenciamento cadastral e status sob análise operacional.</p>
              </div>
              <span className="text-[10px] font-mono bg-indigo-950/40 text-indigo-300 border border-indigo-900/30 px-2 py-0.5 rounded font-black uppercase">
                Grupo ONE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[580px] overflow-y-auto pr-1">
              {units.map(u => (
                <div 
                  key={u.id}
                  className={`border p-4 rounded-xl flex flex-col justify-between gap-4 transition-all ${
                    u.active 
                      ? 'bg-[#181818]/60 border-[#232323] hover:border-[#353535]' 
                      : 'bg-[#121212]/30 border-[#1B1B1B] opacity-50'
                  }`}
                >
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-950/60 border border-indigo-900/40 text-indigo-350 font-mono font-bold rounded text-[9.5px]">
                          {u.sigla || u.region}
                        </span>
                        <strong className="font-display font-bold text-white text-sm">{u.name}</strong>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] uppercase font-bold border ${
                        u.active 
                          ? 'bg-emerald-950/40 border-emerald-900/30 text-emerald-400' 
                          : 'bg-[#202020] border-[#2E2E2E] text-gray-500'
                      }`}>
                        {u.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>

                    <div className="space-y-1 bg-[#121212] p-2.5 rounded-lg border border-[#1E1E1E]">
                      <p className="text-gray-400"><span className="text-gray-550 font-bold uppercase font-mono text-[9px] mr-1 block sm:inline">Cidade/UF:</span> {u.cidadeUf}</p>
                      <p className="text-gray-400"><span className="text-gray-550 font-bold uppercase font-mono text-[9px] mr-1 block sm:inline">Gerente local:</span> {u.gerente}</p>
                      <p className="text-gray-400"><span className="text-gray-550 font-bold uppercase font-mono text-[9px] mr-1 block sm:inline">Sócia Liderança:</span> {u.socia}</p>
                    </div>

                    {u.notes && (
                      <p className="text-[11px] text-gray-400 italic bg-[#151515] p-2 rounded border border-[#202020] max-h-12 overflow-hidden text-ellipsis">
                        "{u.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 border-t border-[#232323] pt-3 text-xs justify-end">
                    <button
                      onClick={() => handleUnitActiveToggle(u)}
                      className={`px-3 py-1.5 rounded-lg text-[10.5px] font-extrabold cursor-pointer border transition-colors ${
                        u.active
                          ? 'bg-[#1C1C1C] hover:bg-[#252525] border-[#2D2D2D] text-gray-150'
                          : 'bg-indigo-950/30 text-indigo-400 hover:bg-indigo-950/65 border-indigo-900/40'
                      }`}
                    >
                      {u.active ? 'Desativar' : 'Reativar'}
                    </button>

                    <button
                      onClick={() => handleEditUnitClick(u)}
                      className="p-1.5 bg-[#1C1C1C] hover:bg-[#252525] border border-[#2D2D2D] text-gray-300 hover:text-white rounded-lg cursor-pointer"
                      title="Editar cadastro"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleUnitDelete(u)}
                      className="p-1.5 bg-[#1C1C1C] hover:bg-red-955 border border-[#2D2D2D] text-gray-400 hover:text-red-400 rounded-lg cursor-pointer"
                      title="Excluir Unidade"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SUB-TAB 2: DATAS E OPERAÇÃO (Requirement 2) */}
      {/* ========================================== */}
      {activeSubTab === 'datas' && (
        <form onSubmit={handleSaveDatesAndRecurrence} className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          
          {/* Main Operational Settings Controls */}
          <div className="bg-[#141414] p-5 rounded-2xl border border-[#212121] lg:col-span-7 space-y-5 text-xs">
            <div className="border-b border-[#212121] pb-3">
              <h3 className="font-display font-extrabold text-[15px] text-white">Calendários, Horários & Frequências Operacionais</h3>
              <p className="text-xs text-gray-400 mt-0.5">Defina as datas e regras de recorrência de postagens integradas.</p>
            </div>

            {/* Weekdays checkboxes for main posts */}
            <div className="space-y-2 bg-[#181818] p-4 rounded-xl border border-[#252525]">
              <label className="block text-[11px] font-extrabold text-gray-300 uppercase tracking-wide font-mono">
                Dias Úteis de Postagem Principal (Feed Instagram)
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sexta (Sáb)'].map((dayName, idx) => {
                  const dayValue = idx; // 1 = Seg, 3 = Qua, 5 = Sex
                  const isChecked = (datesForm.postagemPrincipalDays || []).includes(dayValue);
                  return (
                    <button
                      type="button"
                      key={dayName}
                      onClick={() => handleWeekdayToggle(dayValue)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        isChecked 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
                          : 'bg-[#111] border-[#2D2D2D] text-gray-400 hover:text-white'
                      }`}
                    >
                      {dayName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Frequencies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">Frequência Padrão de Stories</label>
                <input
                  type="text"
                  required
                  value={datesForm.storiesFrequency}
                  onChange={(e) => setDatesForm({ ...datesForm, storiesFrequency: e.target.value })}
                  className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ex: 3 por dia"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">Controle de Notas no Instagram</label>
                <input
                  type="text"
                  required
                  value={datesForm.instagramNotesFrequency}
                  onChange={(e) => setDatesForm({ ...datesForm, instagramNotesFrequency: e.target.value })}
                  className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ex: 1 por dia"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">Rotina Esperada de TikTok</label>
                <input
                  type="text"
                  required
                  value={datesForm.tiktokFrequency}
                  onChange={(e) => setDatesForm({ ...datesForm, tiktokFrequency: e.target.value })}
                  className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ex: 3 vezes por semana"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">Meta de Lives Gravadas / Reels</label>
                <input
                  type="text"
                  required
                  value={datesForm.livesFrequency}
                  onChange={(e) => setDatesForm({ ...datesForm, livesFrequency: e.target.value })}
                  className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ex: Quinzenal"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">Data/Horário Próxima Reunião Quinzenal</label>
                <input
                  type="datetime-local"
                  required
                  value={datesForm.reuniaoQuinzenal}
                  onChange={(e) => setDatesForm({ ...datesForm, reuniaoQuinzenal: e.target.value })}
                  className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">Prazo Envio Cronograma Mensal</label>
                <input
                  type="date"
                  required
                  value={datesForm.cronogramaMensalPrazo}
                  onChange={(e) => setDatesForm({ ...datesForm, cronogramaMensalPrazo: e.target.value })}
                  className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs font-mono"
                />
              </div>
            </div>

            {/* Suggested publish hours list management */}
            <div className="space-y-3 bg-[#181818] p-4 rounded-xl border border-[#252525]">
              <label className="block text-[11px] font-extrabold text-gray-300 uppercase tracking-wider font-mono">
                Horários Sugeridos de Publicação
              </label>
              
              <div className="flex gap-2 text-xs">
                <input
                  type="time"
                  value={newSuggestedTime}
                  onChange={(e) => setNewSuggestedTime(e.target.value)}
                  className="bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-28 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddSuggestedTime}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Incluir Horário
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {(datesForm.suggestedPublishTimes || []).map(time => (
                  <span 
                    key={time} 
                    className="pl-3 pr-1.5 py-1 bg-[#111] border border-[#2E2E2E] text-white font-mono text-xs font-bold rounded-lg flex items-center gap-1"
                  >
                    {time}
                    <button
                      type="button"
                      onClick={() => handleRemoveSuggestedTime(time)}
                      className="text-gray-500 hover:text-rose-400 p-0.5 rounded cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#232323]">
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg font-bold transition-all shadow-md cursor-pointer hover:scale-[1.01]"
              >
                Salvar Configurações de Calendário
              </button>
            </div>
          </div>

          {/* Feriados, Datas especiais, pausa temporária (Requirement 2) */}
          <div className="bg-[#141414] p-5 rounded-2xl border border-[#212121] lg:col-span-5 space-y-4">
            <div className="border-b border-[#212121] pb-3">
              <h3 className="font-display font-extrabold text-[15px] text-white">Datas Especiais, Feriados & Pausas Operacionais</h3>
              <p className="text-xs text-gray-400 mt-0.5">Cadastre recessos, feriados regionais ou suspensão por reforma.</p>
            </div>

            {/* Quick add form */}
            <div className="bg-[#1A1A1A] p-3.5 rounded-xl border border-[#252525] space-y-3 text-xs">
              <strong className="text-[10px] uppercase font-mono text-indigo-400 font-bold block">Adicionar Data de Controle</strong>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Descrição/Motivo</label>
                  <input
                    type="text"
                    placeholder="Ex: Feriado de São João"
                    value={newSpecialLabel}
                    onChange={(e) => setNewSpecialLabel(e.target.value)}
                    className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-lg p-1.5 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Data Ocorrência</label>
                  <input
                    type="date"
                    value={newSpecialDate}
                    onChange={(e) => setNewSpecialDate(e.target.value)}
                    className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-lg p-1.5 focus:outline-none text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Categoria do Movimento</label>
                <select
                  value={newSpecialType}
                  onChange={(e) => setNewSpecialType(e.target.value as any)}
                  className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-lg p-1.5 focus:outline-none text-xs cursor-pointer"
                >
                  <option value="feriado">Feriado Municipal ou Nacional</option>
                  <option value="pausa">Pausa Temporária de Operação</option>
                  <option value="evento">Evento Especial / Campanha regional</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddSpecialDate}
                className="w-full py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg text-xs font-bold cursor-pointer font-sans"
              >
                Gravar Registro de Calendário
              </button>
            </div>

            {/* List Special Dates */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {(datesForm.specialDates || []).length === 0 ? (
                <div className="text-center p-8 bg-[#181818]/45 border border-[#202020] rounded-xl text-gray-500 text-xs">
                  Nenhuma data especial ou feriado regional registrado.
                </div>
              ) : (
                (datesForm.specialDates || []).map(sd => (
                  <div 
                    key={sd.id}
                    className="p-3 bg-[#181818]/70 border border-[#242424] rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-gray-100 font-display font-bold">{sd.label}</strong>
                        <span className={`px-1.5 py-0.2 rounded text-[8.5px] uppercase font-bold font-mono tracking-wide ${
                          sd.type === 'feriado' ? 'bg-red-955 text-red-400' :
                          sd.type === 'pausa' ? 'bg-amber-955/40 text-amber-400' : 'bg-blue-955 border border-indigo-900/10 text-indigo-300'
                        }`}>
                          {sd.type}
                        </span>
                      </div>
                      <p className="text-gray-450 font-mono text-[10px] mt-0.5">{sd.date.split('-').reverse().join('/')}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSpecialDate(sd.id)}
                      className="p-1 text-gray-500 hover:text-red-400 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </form>
      )}

      {/* ============================================== */}
      {/* SUB-TAB 3: MODELOS TAREFAS (Requirement 3 & 7) */}
      {/* ============================================== */}
      {activeSubTab === 'tarefas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Add / Edit Form */}
          <div className="bg-[#141414] p-5 rounded-2xl border border-[#212121] lg:col-span-4 h-fit space-y-4 text-xs">
            <div className="border-b border-[#212121] pb-3.5">
              <span className="text-[10px] uppercase font-mono text-indigo-400 font-bold block">Tática do Sistema</span>
              <h3 className="font-display font-extrabold text-[15px] text-white mt-0.5">
                {editingTaskId ? 'Editar Modelo de Rotina' : 'Cadastrar Novo Modelo Padrão'}
              </h3>
            </div>

            <form onSubmit={handleSaveTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-450 mb-1">Nome Completo da Tarefa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nota Informativa da Clinica"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-450 mb-1">Categoria de Rotina *</label>
                  <select
                    value={taskForm.frequency}
                    onChange={(e) => setTaskForm({ ...taskForm, frequency: e.target.value as any })}
                    className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="diario">Diária</option>
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="mensal">Mensal</option>
                    <option value="pontual">Pontual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-455 mb-1">Nível de Prioridade</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-xs"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">🚨 Crítica</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-450 mb-1">Horário Sugerido (Opcional)</label>
                  <input
                    type="time"
                    value={taskForm.suggestedTime}
                    onChange={(e) => setTaskForm({ ...taskForm, suggestedTime: e.target.value })}
                    className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-450 mb-1">Exigida ou Opcional</label>
                  <select
                    value={taskForm.isRequired ? 'true' : 'false'}
                    onChange={(e) => setTaskForm({ ...taskForm, isRequired: e.target.value === 'true' })}
                    className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="true">Obrigatória</option>
                    <option value="false">Opcional tática</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-450 mb-1">Regra Descritiva de Recorrência</label>
                <input
                  type="text"
                  placeholder="Ex: Segundas, Quartas e Sextas ao meio dia"
                  value={taskForm.recurrenceRule}
                  onChange={(e) => setTaskForm({ ...taskForm, recurrenceRule: e.target.value })}
                  className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-450 mb-1">Descrição Detalhada / Observações</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Instruções claras para a equipe de controle e gerentes..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Scope of Application Selection */}
              <div className="space-y-2 bg-[#181818] p-3 rounded-xl border border-[#232323]">
                <label className="block text-[11px] font-bold text-gray-350 uppercase tracking-wide font-mono">
                  Escopo de Aplicação
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="appType"
                      checked={taskForm.applicationType === 'all'}
                      onChange={() => setTaskForm({ ...taskForm, applicationType: 'all', applicableUnits: [] })}
                      className="cursor-pointer"
                    />
                    <span>Todas unidades</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="appType"
                      checked={taskForm.applicationType === 'specific'}
                      onChange={() => setTaskForm({ ...taskForm, applicationType: 'specific' })}
                      className="cursor-pointer"
                    />
                    <span>Unidades específicas</span>
                  </label>
                </div>

                {taskForm.applicationType === 'specific' && (
                  <div className="pt-2 border-t border-[#262626] max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {units.map(u => {
                      const isCohortChecked = (taskForm.applicableUnits || []).includes(u.id);
                      return (
                        <label key={u.id} className="flex items-center gap-2 cursor-pointer text-gray-300">
                          <input
                            type="checkbox"
                            checked={isCohortChecked}
                            onChange={() => handleTaskCohortSelect(u.id)}
                            className="cursor-pointer rounded accent-indigo-500"
                          />
                          <span>[{u.sigla}] {u.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Status active boolean switcher */}
              <div className="flex items-center justify-between p-2.5 bg-[#171717] rounded-xl border border-[#252525]">
                <span className="font-bold text-gray-400">Ativar modelo de rotina?</span>
                <button
                  type="button"
                  onClick={() => setTaskForm({ ...taskForm, active: !taskForm.active })}
                  className="cursor-pointer transition-colors"
                >
                  {taskForm.active ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold"><CheckCircle className="w-5 h-5" /> Ativo</span>
                  ) : (
                    <span className="text-gray-500 flex items-center gap-1 font-bold"><XCircle className="w-5 h-5" /> Inativo</span>
                  )}
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#232323]">
                <button
                  type="button"
                  onClick={resetTaskForm}
                  className="px-3.5 py-1.5 bg-[#252525] text-gray-450 rounded-lg font-semibold cursor-pointer"
                >
                  Limpar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg font-bold transition-all shadow-md cursor-pointer hover:scale-[1.01]"
                >
                  {editingTaskId ? 'Salvar Rotina' : 'Concluir Cadastro'}
                </button>
              </div>
            </form>
          </div>

          {/* List of custom and standard task templates */}
          <div className="lg:col-span-8 bg-[#141414] p-5 rounded-2xl border border-[#212121] space-y-4">
            <div className="border-b border-[#212121] pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-[15px] text-white">Prontuário de Rotinas Ativas ({tasks.length})</h3>
                <p className="text-xs text-gray-400 mt-0.5 font-sans">Visualização dos checklists padrão e pontuais gerenciados.</p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {tasks.map(t => (
                <div 
                  key={t.id}
                  className={`p-4 border rounded-xl flex flex-col sm:flex-row justify-between items-start gap-4 transition-all bg-[#181818]/60 ${
                    t.active !== false ? 'border-[#232323]' : 'border-[#1E1E1E] opacity-50'
                  }`}
                >
                  <div className="space-y-1.5 text-xs text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm font-display font-extrabold text-white">{t.title}</strong>
                      <span className="font-mono text-[9px] uppercase font-bold tracking-wider px-2 py-0.2 bg-indigo-950/50 border border-indigo-900/35 text-indigo-300 rounded">
                        {t.frequency}
                      </span>
                      {t.priority && (
                        <span className={`font-mono text-[9.5px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          t.priority === 'critica' ? 'bg-red-955 text-red-400' :
                          t.priority === 'alta' ? 'bg-orange-955/40 text-orange-400' :
                          t.priority === 'media' ? 'bg-indigo-955' : 'bg-blue-955 text-blue-300'
                        }`}>
                          {t.priority}
                        </span>
                      )}
                      {t.isRequired !== false ? (
                        <span className="text-[8.5px] font-black uppercase text-emerald-450 bg-emerald-950 px-1 rounded">Obrigatória</span>
                      ) : (
                        <span className="text-[8.5px] uppercase text-gray-500 bg-gray-900 px-1 rounded">Opcional</span>
                      )}
                    </div>

                    <p className="text-gray-300 leading-snug text-[11.5px]">{t.description}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-gray-450">
                      {t.suggestedTime && <span>🕒 Horário Sugestório: {t.suggestedTime}</span>}
                      {t.recurrenceRule && <span>🔄 Recorrência: {t.recurrenceRule}</span>}
                      <span>👥 Aplicação: {t.applicationType === 'specific' ? `${t.applicableUnits?.length || 0} filiais específicas` : 'Geral (Grupo ONE)'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => handleEditTaskClick(t)}
                      className="p-1.5 bg-[#111] hover:bg-[#252525] border border-[#2D2D2D] text-gray-300 hover:text-white rounded-lg cursor-pointer"
                      title="Editar rotina"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleTaskDeleteClick(t)}
                      className="p-1.5 bg-[#111] hover:bg-[#252525] border border-[#2D2D2D] text-gray-400 hover:text-rose-455 rounded-lg cursor-pointer"
                      title="Excluir rotina"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================= */}
      {/* SUB-TAB 4: REGRAS OPERACIONAIS (Requirement 4) */}
      {/* ============================================= */}
      {activeSubTab === 'regras' && (
        <div className="space-y-6 animate-fadeIn text-xs">
          {/* Top selection bar */}
          <div className="bg-[#141414] p-4.5 rounded-2xl border border-[#212121] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-display font-extrabold text-[15px] text-white">Editar Regras e Exceções Operacionais</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Determine suspensões, pausas e tarefas adicionais específicas por franquia.</p>
              </div>
            </div>

            <div className="w-full sm:w-72">
              <label className="block text-[10px] uppercase font-mono text-gray-500 font-bold mb-1">Selecione a Filial que deseja configurar</label>
              <select
                value={selectedRuleUnitId}
                onChange={(e) => setSelectedRuleUnitId(e.target.value)}
                className="w-full bg-[#111] text-white border border-[#2A2A2A] rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {units.map(u => (
                  <option key={u.id} value={u.id}>[{u.sigla}] - {u.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedUnitWithRules ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Switch Rules Toggles */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Meta Flag Toggles */}
                <div className="bg-[#141414] p-5 rounded-2xl border border-[#212121] space-y-4 shadow-sm">
                  <div className="border-b border-[#212121] pb-2.5">
                    <strong className="text-[10px] tracking-wider uppercase text-indigo-400 font-mono block">Alertas de Atenção & Status</strong>
                    <h4 className="font-display font-bold text-white mt-0.5">Indicativos de Status Extraordinários</h4>
                  </div>

                  {/* Especial Campanha Switch */}
                  <div className="flex items-center justify-between p-3.5 bg-[#171717] rounded-xl border border-[#242424]">
                    <div className="space-y-0.5 max-w-[70%]">
                      <strong className="text-gray-200 text-xs flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse-slow" /> Em Campanha Especial
                      </strong>
                      <span className="text-[10px] text-gray-400 block leading-normal">
                        Ativa indicador de esforço máximo de divulgação regional (ex: aniversário ou inauguração).
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleRuleBoolean('inSpecialCampaign')}
                      className="cursor-pointer"
                    >
                      {selectedUnitWithRules.inSpecialCampaign ? (
                        <ToggleRight className="w-10 h-10 text-indigo-500" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-gray-500" />
                      )}
                    </button>
                  </div>

                  {/* Atenção Switch */}
                  <div className="flex items-center justify-between p-3.5 bg-[#171717] rounded-xl border border-[#242424]">
                    <div className="space-y-0.5 max-w-[70%]">
                      <strong className="text-gray-250 text-xs flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Unidade em Alerta (Atenção)
                      </strong>
                      <span className="text-[10px] text-gray-400 block leading-normal">
                        Sinaliza queda de consistência ou problemas crônicos para supervisão ativa das sócias.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleRuleBoolean('isAttentionUnit')}
                      className="cursor-pointer"
                    >
                      {selectedUnitWithRules.isAttentionUnit ? (
                        <ToggleRight className="w-10 h-10 text-amber-500" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-gray-500" />
                      )}
                    </button>
                  </div>

                  {/* Standard checklist usage rules (Requirement 1 & 4) */}
                  <div className="flex items-center justify-between p-3.5 bg-[#171717] rounded-xl border border-[#242424]">
                    <div className="space-y-0.5 max-w-[70%]">
                      <strong className="text-gray-200 text-xs flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-450" /> Usar Checklist Padrão
                      </strong>
                      <span className="text-[10px] text-gray-400 block leading-normal">
                        Se inativo, as tarefas de checklist do sistema serão desconsideradas para esta unidade específica.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleRuleBoolean('useStandardChecklist')}
                      className="cursor-pointer"
                    >
                      {selectedUnitWithRules.useStandardChecklist ?? true ? (
                        <ToggleRight className="w-10 h-10 text-indigo-500" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Internal notes input field */}
                <div className="bg-[#141414] p-5 rounded-2xl border border-[#212121] space-y-3 shadow-sm">
                  <div className="border-b border-[#212121] pb-2">
                    <h4 className="font-display font-bold text-white">Observações Internas da Filial</h4>
                    <p className="text-[10px] text-gray-400">Rituais de acompanhamento e anotações técnicas salvos automaticamente.</p>
                  </div>
                  <textarea
                    rows={4}
                    value={selectedUnitWithRules.notes || ''}
                    onChange={(e) => handleUpdateUnitInternalNotes(e.target.value)}
                    className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs leading-relaxed"
                    placeholder="Escreva anotações específicas (Ex: Foco no stories gravados pela fisioterapeuta Joyce às terças...)"
                  />
                </div>
              </div>

              {/* Right Column: Custom exception checklists per Task Standard (Requirement 4) */}
              <div className="lg:col-span-7 bg-[#141414] p-5 rounded-2xl border border-[#212121] space-y-4">
                <div className="border-b border-[#212121] pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-extrabold text-[15px] text-white">Customização de Rotinas e Exceções</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Determine quais tarefas estão ativas, suspensas temporariamente ou adicionais para esta clínica.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-950/40 text-indigo-305 font-mono text-[10px] rounded font-bold border border-indigo-900/35 uppercase">
                    [{selectedUnitWithRules.sigla}]
                  </span>
                </div>

                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                  
                  {/* Standard Tasks List to toggle rules */}
                  <div className="space-y-2 text-left">
                    <strong className="text-[10px] uppercase font-mono text-indigo-400 font-bold block mb-1">Rotinas de Controle Operacional Diárias/Semanais</strong>
                    
                    {tasks.map(t => {
                      const isExcluded = (selectedUnitWithRules.removedTasks || []).includes(t.id);
                      const isPaused = (selectedUnitWithRules.pausedTasks || []).includes(t.id);
                      const isExtra = (selectedUnitWithRules.extraTasks || []).includes(t.id);

                      // Determine state badge
                      let stateBadge = <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-950 px-1.5 rounded border border-emerald-900/30">Habilitada</span>;
                      if (isExcluded) {
                        stateBadge = <span className="text-[9px] uppercase font-bold text-rose-455 bg-rose-955 px-1.5 rounded border border-red-900/30">Excluída</span>;
                      } else if (isPaused) {
                        stateBadge = <span className="text-[9px] uppercase font-bold text-amber-450 bg-amber-955/30 px-1.5 rounded border border-amber-900/20">Pausada</span>;
                      } else if (isExtra) {
                        stateBadge = <span className="text-[9px] uppercase font-bold text-indigo-400 bg-indigo-950 px-1.5 rounded border border-indigo-900/30">Extra Ativa</span>;
                      }

                      return (
                        <div 
                          key={t.id}
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-all ${
                            isExcluded 
                              ? 'bg-[#121212]/30 border-[#1C1C1C]' 
                              : 'bg-[#181818]/70 border-[#222]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className={`font-bold ${isExcluded ? 'line-through text-gray-500' : 'text-gray-100'}`}>{t.title}</strong>
                              {stateBadge}
                            </div>
                            <p className="text-[10.5px] text-gray-450 mt-0.5 line-clamp-1">{t.description}</p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Toggle pause state */}
                            <button
                              onClick={() => handleTogglePausedTask(t.id)}
                              disabled={isExcluded}
                              className={`px-2 py-1 text-[10px] font-bold rounded-lg border cursor-pointer transition-colors ${
                                isExcluded
                                  ? 'bg-[#1C1C1C] text-gray-600 border-transparent cursor-not-allowed'
                                  : isPaused
                                  ? 'bg-amber-605 text-white border-amber-500'
                                  : 'bg-[#121212] hover:bg-[#1E1E1E] text-gray-400 hover:text-white border-[#2A2A2A]'
                              }`}
                            >
                              {isPaused ? 'Retomar' : 'Pausar'}
                            </button>

                            {/* Toggle Excluded state */}
                            <button
                              onClick={() => handleToggleExcludedTask(t.id)}
                              className={`px-2 py-1 text-[10px] font-bold rounded-lg border cursor-pointer transition-colors ${
                                isExcluded
                                  ? 'bg-[#1C1C1C] text-indigo-400 border-[#2A2A2A]'
                                  : 'bg-rose-950/30 hover:bg-rose-955 text-rose-400 hover:text-white border-red-905'
                              }`}
                            >
                              {isExcluded ? 'Reativar' : 'Excluir'}
                            </button>

                            {/* Enable as extra toggle */}
                            <button
                              onClick={() => handleToggleExtraTask(t.id)}
                              className={`px-2 py-1 text-[10px] font-bold rounded-lg border cursor-pointer transition-colors ${
                                isExtra
                                  ? 'bg-indigo-600 text-white border-indigo-500'
                                  : 'bg-[#121212] hover:bg-[#1E1E1E] text-gray-400 hover:text-white border-[#2A2A2A]'
                              }`}
                            >
                              Extra: {isExtra ? 'Sim' : 'Não'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-[#141414] border border-[#212121] rounded-2xl text-gray-500">
              Nenhuma unidade cadastrada para regras individuais.
            </div>
          )}
        </div>
      )}

      {/* ============================================== */}
      {/* SUB-TAB 5: STATUS & DETALHAMENTO (Requirement 5) */}
      {/* ============================================== */}
      {activeSubTab === 'status' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-xs">
          {/* Status color criteria descriptions (Requirement 1 & 5) */}
          <form onSubmit={handleSaveStatusCriteria} className="lg:col-span-8 bg-[#141414] p-5 rounded-2xl border border-[#212121] space-y-4">
            <div className="border-b border-[#212121] pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-[15px] text-white">Critérios de Status do Dashboard</h3>
                <p className="text-xs text-gray-400 mt-0.5">Determine as descrições dos níveis de conformidade para o painel de leitura rápida.</p>
              </div>
              <Save className="w-5 h-5 text-indigo-400" />
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-emerald-400 font-extrabold font-mono uppercase tracking-wide text-[10px] flex items-center gap-1.5 bg-emerald-950/20 p-2 border border-emerald-900/30 rounded-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span> Verde (Alta Performace / Em Conformidade)
                </label>
                <textarea
                  rows={3}
                  required
                  value={statusForm.verde}
                  onChange={(e) => setStatusForm({ ...statusForm, verde: e.target.value })}
                  className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-xl p-3 focus:outline-none text-xs leading-relaxed"
                  placeholder="Critérios para status verde..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-amber-400 font-extrabold font-mono uppercase tracking-wide text-[10px] flex items-center gap-1.5 bg-amber-955/25 p-2 border border-amber-900/25 rounded-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span> Amarelo (Atenção / Risco Operacional)
                </label>
                <textarea
                  rows={3}
                  required
                  value={statusForm.amarelo}
                  onChange={(e) => setStatusForm({ ...statusForm, amarelo: e.target.value })}
                  className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-xl p-3 focus:outline-none text-xs leading-relaxed"
                  placeholder="Critérios para status amarelo..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-rose-455 font-extrabold font-mono uppercase tracking-wide text-[10px] flex items-center gap-1.5 bg-rose-955/35 p-2 border border-rose-900/30 rounded-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span> Vermelho (Bloqueio Crítico / Descumprimento Severo)
                </label>
                <textarea
                  rows={3}
                  required
                  value={statusForm.vermelho}
                  onChange={(e) => setStatusForm({ ...statusForm, vermelho: e.target.value })}
                  className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-xl p-3 focus:outline-none text-xs leading-relaxed"
                  placeholder="Critérios para status vermelho..."
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#232323]">
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg font-bold transition-all shadow-md cursor-pointer hover:scale-[1.01]"
              >
                Gravar Critérios de Status
              </button>
            </div>
          </form>

          {/* Editable Sócio(a) Operador(a) & Quick presets (Requirement 3) */}
          <div className="lg:col-span-4 bg-[#141414] p-5 rounded-2xl border border-[#212121] space-y-4">
            <div className="border-b border-[#212121] pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-[15px] text-white">Sócio(a) Operador(a)</h3>
                <p className="text-[10px] text-gray-400 mt-0.5 font-sans mr-2">Edite as informações do operador do sistema.</p>
              </div>
              <User className="w-5 h-5 text-indigo-400 shrink-0" />
            </div>

            <form onSubmit={handleSaveSociaInfo} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={sociaNameInput}
                  onChange={(e) => setSociaNameInput(e.target.value)}
                  className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-xl p-2.5 focus:outline-none focus:border-indigo-500 text-xs"
                  placeholder="Nome do Sócio(a) Operador(a)"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Cargo / Função</label>
                <input
                  type="text"
                  required
                  value={sociaRoleInput}
                  onChange={(e) => setSociaRoleInput(e.target.value)}
                  className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-xl p-2.5 focus:outline-none focus:border-indigo-500 text-xs"
                  placeholder="Cargo ou Função"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer text-center"
              >
                Salvar Sócio(a) Operador(a)
              </button>
            </form>

            <div className="border-t border-[#212121] pt-3 mt-4 space-y-3">
              <h4 className="font-display font-bold text-[11px] text-gray-300 uppercase tracking-wider">Metodologia Vigente</h4>
              
              <div className="space-y-2">
                <div className="p-3 bg-[#181818] rounded-xl border border-[#222] space-y-1.5">
                  <span className="font-bold text-gray-205 text-gray-200 block text-[10px]">Reunião Quinzenal</span>
                  <p className="text-gray-405 leading-snug text-gray-400 text-[10px]">Metodologia de cobrança de rotinas e notas com base nas métricas.</p>
                </div>

                <div className="p-3 bg-[#181818] rounded-xl border border-[#222] space-y-1.5">
                  <span className="font-bold text-gray-205 text-gray-200 block text-[10px]">Checklist Automático</span>
                  <p className="text-gray-455 leading-snug text-gray-400 text-[10px]">Incentiva metas Stories (Até 08h00) e Insira Nota (Até 08h00), exceto domingos.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ============================================= */}
      {/* SUB-TAB 6: HISTÓRICO DE MUDANÇAS (Requirement 6) */}
      {/* ============================================= */}
      {activeSubTab === 'historico' && (
        <div className="bg-[#141414] p-5 rounded-2xl border border-[#212121] space-y-4 animate-fadeIn text-xs">
          <div className="border-b border-[#212121] pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-display font-extrabold text-[15px] text-cyber-green text-white">Histórico de Alterações de Configurações ({changeLogs.length})</h3>
              <p className="text-xs text-gray-400 mt-0.5 font-sans">Registro de todas as mutações cadastrais, regras e recorrências operadas.</p>
            </div>
            <History className="w-5 h-5 text-indigo-400" />
          </div>

          {changeLogs.length === 0 ? (
            <div className="p-16 text-center text-gray-500 bg-[#121212]/30 rounded-xl border border-[#1E1E1E]">
              <Database className="w-8 h-8 mx-auto text-indigo-450 mb-2" />
              <p className="font-bold text-white">Nenhum registro de mutação ainda salvo.</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Sempre que você alterar um cadastro ou regra, o painel solicitará sua justificativa e gravará nesta lista.</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[620px] overflow-y-auto pr-1">
              {changeLogs.map(log => (
                <div 
                  key={log.id}
                  className="p-4 bg-[#181818]/70 border border-[#242424] rounded-xl text-left text-xs space-y-2.5 hover:border-[#333] transition-all"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#202020] pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] text-indigo-455 font-bold">
                        📅 {new Date(log.date).toLocaleString('pt-BR')}
                      </span>
                      <span className={`px-2 py-0.2 rounded font-mono text-[8.5px] uppercase font-bold tracking-wider ${
                        log.origin === 'reuniao_quinzenal' ? 'bg-indigo-950 border border-indigo-900/25 text-indigo-300' :
                        log.origin === 'ajuste_interno' ? 'bg-amber-955/30 text-amber-400' :
                        log.origin === 'demanda_pontual' ? 'bg-rose-955 text-red-400' : 'bg-gray-800 text-gray-300'
                      }`}>
                        Origem: {log.origin.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-gray-500 font-bold uppercase">ID: {log.id}</span>
                  </div>

                  <div className="space-y-1.5 leading-normal">
                    <h5 className="font-bold text-white text-[13px]">{log.description}</h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#111] p-3 rounded-xl border border-[#1C1C1C] text-[11px] font-mono">
                      <div>
                        <strong className="text-gray-500 uppercase text-[9px] block mb-0.5">Valor Anterior:</strong>
                        <span className="text-gray-400 block break-all max-h-12 overflow-y-auto pr-1">{log.oldValue}</span>
                      </div>
                      <div className="border-t md:border-t-0 md:border-l border-[#1F1F1F] pt-2 md:pt-0 md:pl-3">
                        <strong className="text-indigo-400 uppercase text-[9px] block mb-0.5">Novo Valor Aplicado:</strong>
                        <span className="text-gray-300 block break-all max-h-12 overflow-y-auto pr-1">{log.newValue}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-indigo-950/20 border border-indigo-900/15 rounded-xl flex gap-1.5 items-start mt-2">
                      <Info className="w-3.5 h-3.5 mt-0.5 text-indigo-400 shrink-0" />
                      <div>
                        <span className="font-black font-sans uppercase text-[9.5px] text-indigo-400 tracking-wide block mb-0.5">Motivação da Mudança</span>
                        <p className="text-gray-200 italic font-medium leading-relaxed font-sans mt-0.5 font-sans">
                          "{log.reason}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================= */}
      {/* SUB-TAB: GERENCIAR SUGESTÕES RÁPIDAS (Config) */}
      {/* ============================================= */}
      {activeSubTab === 'sugestoes' && (() => {
        return (
          <div className="bg-[#141414] p-5 rounded-2xl border border-[#212121] space-y-4 animate-fadeIn text-xs">
            <div className="border-b border-[#212121] pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-[15px] text-white">Gerenciar Banco de Sugestões Rápidas ({suggestions.length})</h3>
                <p className="text-xs text-gray-400 mt-0.5">Adicione, edite ou exclua os modelos de Notas Diárias, Stories e ganchos de Reels que abastecem as unidades.</p>
              </div>
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>

            {/* Inline generator / create standard suggestion */}
            <div className="p-4 bg-[#1A1A1A] border border-[#282828] rounded-xl space-y-3">
              <h4 className="text-[11px] font-black uppercase text-amber-400 tracking-wider font-mono">Adicionar Nova Sugestão de Sistema</h4>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const textInput = form.elements.namedItem('txt') as HTMLInputElement;
                  const typeSelect = form.elements.namedItem('tipo') as HTMLSelectElement;
                  const catSelect = form.elements.namedItem('cat') as HTMLSelectElement;
                  
                  const txt = textInput.value.trim();
                  if (!txt) return;

                  const newSug: QuickSuggestion = {
                    id: `sug_custom_${Date.now()}`,
                    text: txt,
                    type: typeSelect.value as any,
                    category: (typeSelect.value === 'nota' ? catSelect.value : (typeSelect.value === 'story' ? 'story' : 'reels')) as any,
                    isFavorite: false
                  };
                  
                  onUpdateSuggestions([...suggestions, newSug]);
                  form.reset();
                  showNotice('Nova sugestão adicionada com êxito!', 'success');
                }}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
              >
                <div className="md:col-span-3">
                  <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase">Tipo</label>
                  <select 
                    name="tipo"
                    id="tipo-select-config"
                    className="w-full bg-[#111] border border-[#2B2B2B] p-2 text-xs rounded text-gray-200"
                    defaultValue="nota"
                    onChange={(e) => {
                      const catEl = document.getElementById('cat-select-config') as HTMLSelectElement;
                      if (catEl) {
                        catEl.disabled = e.target.value !== 'nota';
                      }
                    }}
                  >
                    <option value="nota">Nota Diária (Instagram)</option>
                    <option value="story">Ideia de Story</option>
                    <option value="reels">Gancho para Reels</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase">Categoria (Apenas p/ Nota)</label>
                  <select 
                    name="cat"
                    id="cat-select-config"
                    className="w-full bg-[#111] border border-[#2B2B2B] p-2 text-xs rounded text-gray-200"
                    defaultValue="comerciais"
                  >
                    <option value="comerciais">Comercial / Agenda</option>
                    <option value="laser">Depilação / Lâmina</option>
                    <option value="pele">Cuidado & Pele</option>
                    <option value="proximidade">Proximidade</option>
                    <option value="cta">Chamada para Direct</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase">Texto</label>
                  <input 
                    name="txt"
                    type="text" 
                    placeholder="Sugestão de até 45-55 caracteres..."
                    maxLength={120}
                    className="w-full bg-[#111] border border-[#2B2B2B] p-2 text-xs rounded text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <button 
                    type="submit"
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[10px] rounded cursor-pointer"
                  >
                    Gravar Item
                  </button>
                </div>
              </form>
            </div>

            {/* List and manage existing suggestions */}
            <div className="border border-[#1F1F1F] rounded-xl overflow-hidden bg-[#1A1A1A]/20">
              <div className="grid grid-cols-12 gap-2 bg-[#1A1A1A] p-2 px-3 font-bold border-b border-[#212121] text-gray-400 uppercase text-[9px] tracking-wide">
                <div className="col-span-2">Tipo / Categoria</div>
                <div className="col-span-7">Texto de Sugestão</div>
                <div className="col-span-3 text-right">Ações</div>
              </div>
              <div className="divide-y divide-[#1D1D1D] max-h-[380px] overflow-y-auto">
                {suggestions.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 p-2.5 px-3 items-center hover:bg-[#1A1A1A]/40 transition-all font-sans text-xs">
                    <div className="col-span-2 flex flex-col gap-0.5">
                      <span className="px-1.5 py-0.2 bg-[#2D2D2D] text-gray-300 rounded text-[9px] font-bold uppercase tracking-wider self-start">
                        {item.type}
                      </span>
                      {item.type === 'nota' && (
                        <span className="text-[9px] text-amber-500/80 font-semibold lowercase">
                          {item.category}
                        </span>
                      )}
                    </div>
                    
                    <div className="col-span-7 text-gray-100 font-medium">
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const updated = suggestions.map(s => s.id === item.id ? { ...s, text: e.target.value } : s);
                          onUpdateSuggestions(updated);
                        }}
                        className="w-full bg-transparent hover:bg-[#111] focus:bg-[#111] border-none focus:ring-1 focus:ring-amber-500 rounded p-1 px-1.5 text-xs text-white"
                      />
                    </div>

                    <div className="col-span-3 text-right flex items-center justify-end gap-1.5 font-sans">
                      <button
                        title={item.isFavorite ? 'Remover Favorito' : 'Marcar Favorito'}
                        onClick={() => {
                          const updated = suggestions.map(s => s.id === item.id ? { ...s, isFavorite: !s.isFavorite } : s);
                          onUpdateSuggestions(updated);
                        }}
                        className={`p-1.5 rounded transition-all ${item.isFavorite ? 'text-pink-500 hover:text-pink-400' : 'text-gray-500 hover:text-gray-300'}`}
                        type="button"
                      >
                        <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        title="Remover Sugestão"
                        onClick={() => {
                          if (confirm('Deseja excluir esta sugestão definitivamente?')) {
                            const updated = suggestions.filter(s => s.id !== item.id);
                            onUpdateSuggestions(updated);
                          }
                        }}
                        className="p-1.5 text-gray-500 hover:text-rose-400 transition-all rounded hover:bg-rose-950/20"
                        type="button"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ====================================================================== */}
      {/* SUB-TAB: BACKUP / IMPORTAR / EXPORTAR DADOS OPERACIONAIS               */}
      {/* ====================================================================== */}
      {activeSubTab === 'backup' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Informative Header Banner */}
          <div className="bg-[#141414] border border-[#212121] p-5 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="space-y-1 text-left">
              <span className="text-[10px] font-bold font-mono text-indigo-400 uppercase tracking-widest block">Sincronização entre Dispositivos</span>
              <h3 className="text-lg font-display font-black text-white">Importar e Exportar Informações</h3>
              <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
                Transfira instantaneamente suas clínicas, roteiros operacionais, registros de reuniões quinzenais, cronogramas de lives e históricos de justificativas para outro computador, celular ou tablet.
              </p>
            </div>
            <Database className="w-8 h-8 text-indigo-400 shrink-0" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* 1. EXPORT COLUMN */}
            <div className="bg-[#141414] border border-[#212121] rounded-2xl p-5 space-y-4 text-left">
              <div className="border-b border-[#212121] pb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-display font-extrabold text-[15px] text-white">1. Exportar Backup do Sistema</h4>
                  <p className="text-gray-400 text-xs mt-0.5 font-sans">Baixe ou copie o estado atual completo do seu app.</p>
                </div>
                <Download className="w-4 h-4 text-emerald-400 font-sans" />
              </div>

              <div className="text-xs text-gray-400 leading-relaxed bg-[#191919]/60 p-3.5 rounded-xl border border-[#232323] space-y-2">
                <span className="font-bold text-gray-300 block uppercase font-mono text-[9px] tracking-wider">📦 O que está incluído no backup:</span>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-gray-400">
                  <li>Todas as <strong>franquias cadastradas</strong> e suas regras de filial</li>
                  <li>Checklists de Stories 1, Notas e Feed Principal por unidade</li>
                  <li><strong>Histórico completo de alterações</strong> e justificativas</li>
                  <li>Logs de reuniões operacionais, lives e calendários táticos</li>
                  <li>Configurações globais e banco de sugestões criativas</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const data: Record<string, string | null> = {};
                      const keys = [
                        'trafegon_units',
                        'trafegon_tasks',
                        'trafegon_executions',
                        'trafegon_pendencias',
                        'trafegon_global_config',
                        'trafegon_change_history',
                        'trafegon_suggestions',
                        'trafegon_cronograma_v2',
                        'trafegon_lives_v2',
                        'trafegon_reunioes_v2',
                        'trafegon_units_v2'
                      ];
                      keys.forEach(k => {
                        data[k] = localStorage.getItem(k);
                      });
                      
                      const jsonStr = JSON.stringify(data, null, 2);
                      const blob = new Blob([jsonStr], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      
                      const a = document.createElement('a');
                      const today = new Date().toISOString().split('T')[0];
                      a.href = url;
                      a.download = `trafegon_backup_${today}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      
                      showNotice('Arquivo de backup (.json) gerado e baixado com sucesso!', 'success');
                    } catch (err) {
                      showNotice('Erro ao gerar arquivo de backup.', 'error');
                    }
                  }}
                  className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md text-xs"
                >
                  <Download className="w-4 h-4" /> Baixar Arquivo JSON
                </button>

                <button
                  type="button"
                  onClick={() => {
                    try {
                      const data: Record<string, string | null> = {};
                      const keys = [
                        'trafegon_units',
                        'trafegon_tasks',
                        'trafegon_executions',
                        'trafegon_pendencias',
                        'trafegon_global_config',
                        'trafegon_change_history',
                        'trafegon_suggestions',
                        'trafegon_cronograma_v2',
                        'trafegon_lives_v2',
                        'trafegon_reunioes_v2',
                        'trafegon_units_v2'
                      ];
                      keys.forEach(k => {
                        data[k] = localStorage.getItem(k);
                      });
                      
                      const rawText = JSON.stringify(data);
                      const b64 = utf8_to_b64(rawText);
                      
                      navigator.clipboard.writeText(b64);
                      setIsCopied(true);
                      showNotice('Código de backup copiado para a área de transferência!', 'success');
                      setTimeout(() => setIsCopied(false), 3000);
                    } catch (err) {
                      showNotice('Erro ao gerar código de backup.', 'error');
                    }
                  }}
                  className="flex-1 py-3 bg-[#1C1C1C] hover:bg-[#252525] border border-[#2D2D2D] text-gray-200 hover:text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-400 animate-bounce" /> : <Copy className="w-4 h-4 text-indigo-400" />}
                  {isCopied ? 'Copiado para Clipboard!' : 'Copiar Token de backup'}
                </button>
              </div>

              {/* Invisible/constrained visual representation of backup data */}
              <div className="space-y-1 text-xs">
                <label className="text-[10px] text-gray-500 font-bold uppercase font-mono">Prévia do Token de Transferência (Base64 compactado)</label>
                <div className="relative rounded-xl border border-[#212121] bg-[#111] p-3 h-28 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/80 to-transparent z-10 pointer-events-none" />
                  <p className="font-mono text-[9px] text-gray-600 break-all leading-normal select-all">
                    {(() => {
                      try {
                        const data: Record<string, string | null> = {};
                        const keys = ['trafegon_units', 'trafegon_tasks', 'trafegon_global_config'];
                        keys.forEach(k => { data[k] = localStorage.getItem(k); });
                        return utf8_to_b64(JSON.stringify(data));
                      } catch { return 'carregando_token_de_backup...'; }
                    })()}
                  </p>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 text-[9px] bg-[#1A1A1A] border border-[#2D2D2D] text-gray-400 px-2.5 py-1 rounded-full font-black uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
                    Mais de 10.000 caracteres no total
                  </span>
                </div>
              </div>
            </div>

            {/* 2. IMPORT COLUMN */}
            <div className="bg-[#141414] border border-[#212121] rounded-2xl p-5 space-y-4 text-left">
              <div className="border-b border-[#212121] pb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-display font-extrabold text-[15px] text-white">2. Importar Backup no Dispositivo</h4>
                  <p className="text-gray-400 text-xs mt-0.5 font-sans">Carregue o arquivo salvo ou cole o token completo.</p>
                </div>
                <Upload className="w-4 h-4 text-indigo-400 font-sans" />
              </div>

              {/* Drag and Drop JSON area */}
              <div 
                className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer relative ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-950/20 text-white shadow-inner scale-[0.99]' 
                    : 'border-[#2D2D2D] hover:border-indigo-500/40 bg-[#121212] hover:bg-[#181818]/60 text-gray-400'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target?.result as string;
                      if (text) handleImportData(text);
                    };
                    reader.readAsText(file);
                  }
                }}
                onClick={() => {
                  document.getElementById('file-upload-input')?.click();
                }}
              >
                <input 
                  type="file" 
                  id="file-upload-input" 
                  accept=".json" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const text = event.target?.result as string;
                        if (text) handleImportData(text);
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
                <div className="flex flex-col items-center justify-center space-y-2 py-3">
                  <FileCode className="w-8 h-8 text-indigo-500/70 shrink-0" />
                  <span className="font-sans font-black text-xs text-gray-300 block">Arraste seu arquivo .json de backup aqui</span>
                  <span className="text-[10px] text-gray-500 font-sans">ou clique aqui para selecionar do computador</span>
                </div>
              </div>

              <div className="relative flex py-2 items-center text-xs">
                <div className="flex-grow border-t border-[#212121]"></div>
                <span className="flex-shrink mx-3 text-gray-500 font-mono text-[10px] uppercase font-bold tracking-wider">ou entre com código token</span>
                <div className="flex-grow border-t border-[#212121]"></div>
              </div>

              {/* Paste Base64 or JSON area */}
              <div className="space-y-1.5 text-xs text-left">
                <label className="block text-[10px] text-gray-400 font-mono font-bold uppercase">Código Token Base64 ou conteúdo JSON:</label>
                <textarea
                  rows={3}
                  placeholder="Cole o longo código token que você copiou do outro dispositivo..."
                  value={pastedBackupText}
                  onChange={(e) => setPastedBackupText(e.target.value)}
                  className="w-full bg-[#111] text-xs font-mono text-white placeholder-gray-700 border border-[#2D2D2D] rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 select-text"
                />
              </div>

              <button
                type="button"
                disabled={!pastedBackupText.trim()}
                onClick={() => {
                  if (pastedBackupText.trim()) {
                    handleImportData(pastedBackupText.trim());
                  }
                }}
                className={`w-full py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                  pastedBackupText.trim()
                    ? 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] text-white'
                    : 'bg-indigo-950/20 text-gray-500 border border-indigo-950/20 cursor-not-allowed'
                }`}
              >
                <Upload className="w-4 h-4" /> Validar e Restaurar Backup de Texto
              </button>

              {/* Attention Warning */}
              <div className="flex gap-3 bg-red-950/10 border border-red-900/10 p-3 rounded-xl text-xs text-left align-top leading-tight">
                <AlertTriangle className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5 font-sans" />
                <div className="space-y-1.5 text-gray-400 leading-relaxed font-sans text-[11px]">
                  <strong className="text-red-400 block font-black uppercase font-mono tracking-wider text-[10px]">⚠️ ATENÇÃO: OPERAÇÃO DE SUBSTITUIÇÃO</strong>
                  <p>
                    A restauração substituirá <strong>completamente</strong> clínicas, checklists e relatórios locais deste navegador actual. Este processo não pode ser desfeito.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 4. MODAL DETALHE JUSTIFICATIVA DA ALTERAÇÃO (Requirements 5, 6 & 7)   */}
      {/* ====================================================================== */}
      {justificationModal.isOpen && (
        <div className="fixed inset-0 bg-[#000]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn select-none">
          <div className="bg-[#141414] border border-[#2C2C2C] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative text-xs text-left leading-normal">
            
            <div className="flex justify-between items-center border-b border-[#222] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <h3 className="font-display font-extrabold text-[15px] text-white">CONFIRMAR E JUSTIFICAR ALTERAÇÃO</h3>
              </div>
              <button 
                onClick={() => setJustificationModal({ ...justificationModal, isOpen: false })}
                className="text-gray-500 hover:text-white"
                type="button"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#181818] p-3 rounded-xl border border-[#212121] space-y-1 text-gray-300">
              <span className="text-[10px] font-bold text-indigo-400 uppercase font-mono block">Alteração sob análise:</span>
              <strong className="text-white font-medium text-[13px]">{justificationModal.title}</strong>
              <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{justificationModal.description}</p>
            </div>

            <div className="space-y-4 pt-1">
              
              {/* Question 5 apply date picker */}
              <div>
                <label className="block text-[11px] font-extrabold text-gray-350 uppercase font-mono tracking-wider mb-1">
                  A partir de quando deseja aplicar a alteração? (Req. 5)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { value: 'hoje', label: 'Hoje' },
                    { value: 'amanha', label: 'Amanhã' },
                    { value: 'semana', label: 'Semana' },
                    { value: 'mes', label: 'Mês' },
                    { value: 'customizada', label: 'Outro' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setJustificationModal({ ...justificationModal, applyFrom: opt.value as any })}
                      className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer text-center ${
                        justificationModal.applyFrom === opt.value
                          ? 'bg-indigo-650 border-indigo-500 text-white font-black'
                          : 'bg-[#111] border-[#202020] text-gray-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {justificationModal.applyFrom === 'customizada' && (
                  <div className="mt-2 text-left">
                    <label className="block text-[10px] text-gray-400 mb-0.5">Selecione data personalizada:</label>
                    <input
                      type="date"
                      value={justificationModal.customDate}
                      onChange={(e) => setJustificationModal({ ...justificationModal, customDate: e.target.value })}
                      className="bg-[#111] text-white border border-[#2D2D2D] rounded-lg p-1.5 focus:outline-none text-xs font-mono w-44"
                    />
                  </div>
                )}
              </div>

              {/* Requirement 7 prompt if standard tasks update */}
              {justificationModal.applyStandardChecklist !== undefined || justificationModal.standardTaskOption !== undefined ? (
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-350 uppercase font-mono tracking-wider mb-1">
                    Como deseja aplicar esta alteração operacional? (Req. 7)
                  </label>
                  <select
                    value={justificationModal.standardTaskOption}
                    onChange={(e) => setJustificationModal({ ...justificationModal, standardTaskOption: e.target.value as any })}
                    className="w-full bg-[#111] text-white border border-[#2D2D2D] rounded-lg p-2 focus:outline-none font-mono cursor-pointer"
                  >
                    <option value="all">Aplicar a TODAS as unidades ativas</option>
                    <option value="specific">Apenas a unidades que usam checklist específico</option>
                    <option value="new">Aplicar apenas a NOVAS unidades daqui em diante</option>
                  </select>
                </div>
              ) : null}

              {/* Requirement 5 Removal Prompt if applicable */}
              {justificationModal.taskRemovalOption !== undefined && (
                <div>
                  <label className="block text-[11px] font-extrabold text-[#D16969] uppercase font-mono tracking-wider mb-1">
                    Uma tarefa de monitoria foi excluída. O que fazer? (Req. 5)
                  </label>
                  <div className="space-y-1.5 bg-red-950/10 border border-red-900/10 p-2.5 rounded-lg">
                    {[
                      { value: 'hoje_tambem', label: 'Remover também do checklist de HOJE agora' },
                      { value: 'apenas_proximos', label: 'Manter hoje preenchido e remover apenas dos Próximos dias' },
                      { value: 'escolher_data', label: 'Escolher data de aplicação personalizada...' }
                    ].map(it => (
                      <label key={it.value} className="flex items-center gap-2 cursor-pointer text-gray-300">
                        <input
                          type="radio"
                          name="remOpt"
                          checked={justificationModal.taskRemovalOption === it.value}
                          onChange={() => setJustificationModal({ ...justificationModal, taskRemovalOption: it.value as any })}
                          className="cursor-pointer"
                        />
                        <span>{it.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Origin of change */}
              <div>
                <label className="block text-[11px] font-extrabold text-gray-350 uppercase font-mono tracking-wider mb-1">
                  Origem / Motivação da Mudança (Req. 6)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'reuniao_quinzenal', label: '👥 Reunião Quinzenal' },
                    { value: 'ajuste_interno', label: '⚙️ Ajuste Interno' },
                    { value: 'demanda_pontual', label: '🔥 Demanda Pontual' },
                    { value: 'outro', label: '☕ Outra Origem' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setJustificationModal({ ...justificationModal, origin: opt.value as any })}
                      className={`p-2 rounded-lg border text-[11px] font-bold text-left transition-all cursor-pointer ${
                        justificationModal.origin === opt.value
                          ? 'bg-[#1C1C1C] border-[#3F3F3F] text-white font-black'
                          : 'bg-[#111] border-[#222] text-gray-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Justification textual reason */}
              <div>
                <label className="block text-[11px] font-extrabold text-gray-350 uppercase font-mono tracking-wider mb-1">
                  Justificativa / Motivo detalhado da alteração *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alinhamento das sócias na ata de 25/05 para reforçar gravação de stories locais."
                  value={justificationModal.reason}
                  onChange={(e) => setJustificationModal({ ...justificationModal, reason: e.target.value })}
                  className="w-full bg-[#111] border border-[#2D2D2D] text-white rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#222]">
              <button
                type="button"
                onClick={() => setJustificationModal({ ...justificationModal, isOpen: false })}
                className="px-4 py-2 bg-[#252525] hover:bg-[#303030] text-gray-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Voltar / Cancelar
              </button>
              <button
                type="button"
                disabled={!justificationModal.reason.trim()}
                onClick={() => {
                  justificationModal.onConfirm({
                    reason: justificationModal.reason,
                    origin: justificationModal.origin,
                    applyFrom: justificationModal.applyFrom,
                    taskRemovalOption: justificationModal.taskRemovalOption,
                    standardTaskOption: justificationModal.standardTaskOption
                  });
                  setJustificationModal({ ...justificationModal, isOpen: false });
                }}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all shadow-md text-white cursor-pointer ${
                  justificationModal.reason.trim()
                    ? 'bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.01]'
                    : 'bg-emerald-950/20 text-gray-500 cursor-not-allowed border border-emerald-950/25'
                }`}
              >
                Confirmar e Registrar Alteração!
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
