/**
 * Types defining the TráfegON Check domain.
 */

export type TaskFrequency = 'diario' | 'semanal' | 'quinzenal' | 'mensal' | 'pontual';

export type TaskStatus = 'pendente' | 'executado' | 'nao_se_aplica' | 'atrasado';

export type ResponsibleParty = 'agencia' | 'unidade' | 'colaboradora' | 'gerente';

export type TaskPriority = 'baixa' | 'media' | 'alta' | 'critica';

export interface StandardTask {
  id: string;
  title: string;
  frequency: TaskFrequency;
  description: string;
  priority?: TaskPriority;
  
  // Settings-related standard task properties
  applicationType?: 'all' | 'specific'; // todas as unidades ou unidades específicas
  applicableUnits?: string[]; // unidades específicas
  isRequired?: boolean; // obrigatória ou opcional
  suggestedTime?: string; // horário sugerido
  active?: boolean; // status ativo/inativo
  recurrenceRule?: string; // regra de recorrência
}

export interface Unit {
  id: string;
  name: string;
  sigla: string;
  cidadeUf: string;
  active: boolean;
  gerente: string;
  socia: string;
  instagramUrl: string;
  tiktokUrl: string;
  notes?: string;

  // Backward compatibility with existing UI components
  region: string; 
  contactName?: string;

  // Rule additions per unit
  useStandardChecklist?: boolean;
  extraTasks?: string[]; // Custom task ids added specifically to this unit
  removedTasks?: string[]; // Standard task ids excluded/removed from this unit
  pausedTasks?: string[]; // Task ids temporarily paused
  inSpecialCampaign?: boolean; // "em campanha especial" flag
  isAttentionUnit?: boolean; // "atenção" flag
  
  // Applied standard options from default checklist (Question 1)
  hasStoriesControle?: boolean;
  hasInstagramNota?: boolean;
  hasPostagemPrincipal?: boolean;
  hasPendenciasControle?: boolean;
  hasColaboracaoControle?: boolean;
  hasDashboardEntrada?: boolean;
  hasReuniaoEntrada?: boolean;
  hasRelatoriosEntrada?: boolean;
}

export interface TaskExecution {
  date: string; // YYYY-MM-DD
  unitId: string;
  taskId: string;
  status: TaskStatus;
  updatedBy: string; // Who did it
  notes?: string;
  updatedAt: string; // Timestamp
  priority?: TaskPriority;
  linkedPendencyId?: string;
}

export type PendenciaStatus = 'pendente' | 'em_andamento' | 'resolvido' | 'cancelado' | 'aberta' | 'resolvida';
export type PendenciaPriority = 'baixa' | 'media' | 'alta' | 'critica';
export type PendenciaOrigin = 'unidade' | 'agencia' | 'socias' | 'reuniao_quinzenal' | 'cronograma' | 'live_gravada' | 'conteudo' | 'outro';

export interface Pendencia {
  id: string;
  unitId: string;
  description: string;
  responsible: string;
  dateAdded: string; // YYYY-MM-DD
  prazo?: string; // Prazo
  status: PendenciaStatus;
  priority: PendenciaPriority;
  notes?: string; // Observações
  origin: PendenciaOrigin; // Origem da pendência
  resolvedDate?: string; // Data de resolução
  resolvedNotes?: string; // Observação final
  resolvedBy?: string; // Quem resolveu, se aplicável

  // Backward compatibility
  urgency?: 'baixa' | 'media' | 'alta' | 'critica';
}

export interface FilterOptions {
  unitId: string;
  status: string;
  urgency: string;
  period: string;
}

export interface SpecialDate {
  id: string;
  date: string;
  label: string;
  type: 'evento' | 'feriado' | 'pausa';
  active: boolean;
}

export interface GlobalConfig {
  postagemPrincipalDays: number[]; // e.g., [1, 3, 5] for Monday, Wednesday, Friday
  storiesFrequency: string;
  instagramNotesFrequency: string;
  tiktokFrequency: string;
  livesFrequency: string;
  reuniaoQuinzenal: string; // "YYYY-MM-DDTHH:mm" style
  cronogramaMensalPrazo: string; // YYYY-MM-DD
  suggestedPublishTimes: string[]; // e.g. ["09:00", "12:00", ... ]
  criteriosStatusVerde: string;
  criteriosStatusAmarelo: string;
  criteriosStatusVermelho: string;
  sociaOperadora?: string;
  sociaOperadoraCargo?: string;
}

export interface SystemChangeLog {
  id: string;
  date: string; // Timestamp ISO
  description: string;
  oldValue: string;
  newValue: string;
  reason: string;
  origin: 'reuniao_quinzenal' | 'ajuste_interno' | 'demanda_pontual' | 'outro';
}

export interface QuickSuggestion {
  id: string;
  text: string;
  type: 'nota' | 'story' | 'reels';
  category: 'comerciais' | 'laser' | 'pele' | 'proximidade' | 'cta' | 'story' | 'reels';
  isFavorite?: boolean;
}

export interface UnitMetricData {
  unitId: string;
  success: boolean;
  spend: number;
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  conversations: number;
  updatedAt?: string;
  error?: string;
}

