import React, { useState, useEffect, useMemo } from 'react';
import { Unit, UnitMetricData } from '../types';
import { 
  BarChart3, 
  Coins, 
  Eye, 
  Users, 
  MousePointer, 
  MessageSquare, 
  HelpCircle, 
  RefreshCw, 
  Edit2, 
  Check, 
  X, 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  Info,
  Calendar,
  AlertCircle,
  FileCheck2,
  ChevronDown,
  Download
} from 'lucide-react';

const METRICS_SHEETS: Record<string, string> = {
  '1': '1XxorSEspVwY-VAa8XeR2YleixguDwGwVaumu3rQS9OI',
  '2': '1xkhRGEhHMyntv2DcGtZPovX3vAzKglqEnbIRAFPxx10',
  '3': '1XPFZn437dv9wzMG7jX9kZVpPhsuzlRkWPlhmSC19DYY',
  '4': '12eWifNFUc5gVLGdPG48OUgWXzgiKnCxckNz2bXT3e_Q',
  '5': '1bZYM4-lw-7TWMtNcgX1apj5jrSpR1pBPXKAVxciSOWo',
  '6': '1NOeinp7l0oiXKb5zdjzmJ6C1YwMmwrsAqBrfGgnJ0cU',
  '7': '12kkXFpvxDbn-iOAEph1BW6kVJCed2C41ht37rPt6ZJM',
  '8': '19XhgdbWXFZLM3WbNASowzuBhKEhBxXHw2erhZwrHaY0',
  '9': '1eK26sKMqm_B8jyVXBeMJ9XYp1lK94yDsI8vk4xkv95k',
  '10': '197SLVpeuz1Bt3W9oLmnto_MyFU5fijUcGo-OjKzhN6c',
  '11': '1oVNAUdxSa1v-54QfAOLP7lyq0s-NYunU24sItzolrBw',
  '12': '15A37s0jyQEsLK5KTlRHkOPO1Hu1Bc3I-xQV1nWUiIZM',
  '13': '12XNNZnOJza65yNGagTXQEIwfwcPwf1gklaIW8pFHDlU'
};

function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

interface MetricasViewProps {
  units: Unit[];
}

interface OverridesMap {
  [unitId: string]: {
    spend?: number;
    impressions?: number;
    reach?: number;
    engagement?: number;
    clicks?: number;
    conversations?: number;
    useManual?: boolean;
  };
}

export default function MetricasView({ units }: MetricasViewProps) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Record<string, UnitMetricData>>({});
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  
  // High fidelity UI and sorting filters
  const [regionFilter, setRegionFilter] = useState<string>('todas');
  const [sortBy, setSortBy] = useState<string>('conversations'); // conversations, spend, cpa, clicks, impressions
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Local Manual overrides to make everything fully editable (Requirement 2)
  const [overrides, setOverrides] = useState<OverridesMap>(() => {
    const saved = localStorage.getItem('trafegon_metrics_overrides');
    return saved ? JSON.parse(saved) : {};
  });

  // Inline grid edit mode per rows
  const [editingRowUnitId, setEditingRowUnitId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    spend: string;
    impressions: string;
    reach: string;
    engagement: string;
    clicks: string;
    conversations: string;
  }>({
    spend: '',
    impressions: '',
    reach: '',
    engagement: '',
    clicks: '',
    conversations: ''
  });

  // Unique list of regions
  const regions = useMemo(() => {
    return ['todas', ...Array.from(new Set(units.map(u => u.region)))];
  }, [units]);

  // Fetch metrics helper
  const fetchMetrics = async (isManualAction = false) => {
    setLoading(true);
    setErrorStatus(null);
    try {
      // Try backend endpoint first
      const response = await fetch('/api/metrics');
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
      }
      const data = await response.json();
      setMetrics(data);
      setLastRefreshed(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      if (isManualAction) {
        showGlobalSuccessToast();
      }
    } catch (err: any) {
      console.warn('Erro ao ler métricas do backend, iniciando fallback de download direto no navegador:', err);
      
      // Fallback: Fetch directly from Google Sheets from the browser
      try {
        const fallbacks: Record<string, UnitMetricData> = {};
        const promises = Object.entries(METRICS_SHEETS).map(async ([unitId, sheetId]) => {
          try {
            const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`Status HTTP ${response.status}`);
            }
            const text = await response.text();
            const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            if (lines.length < 2) {
              throw new Error('Planilha sem dados');
            }
            
            const rowValues = parseCSVRow(lines[1]);
            const rawSpend = rowValues[0] || '0';
            const spend = parseFloat(rawSpend.replace(/"/g, '').replace(/\./g, '').replace(',', '.')) || 0;
            const impressions = parseInt((rowValues[1] || '0').replace(/"/g, ''), 10) || 0;
            const reach = parseInt((rowValues[2] || '0').replace(/"/g, ''), 10) || 0;
            const engagement = parseInt((rowValues[3] || '0').replace(/"/g, ''), 10) || 0;
            const clicks = parseInt((rowValues[4] || '0').replace(/"/g, ''), 10) || 0;
            const conversations = parseInt((rowValues[5] || '0').replace(/"/g, ''), 10) || 0;
            
            fallbacks[unitId] = {
              unitId,
              success: true,
              spend,
              impressions,
              reach,
              engagement,
              clicks,
              conversations,
              updatedAt: new Date().toISOString()
            };
          } catch (unitErr: any) {
            console.error(`Falha no fallback direto da unidade ${unitId}:`, unitErr);
            fallbacks[unitId] = {
              unitId,
              success: false,
              spend: 0,
              impressions: 0,
              reach: 0,
              engagement: 0,
              clicks: 0,
              conversations: 0,
              error: unitErr.message || 'Erro de conexão no navegador'
            };
          }
        });

        await Promise.all(promises);
        setMetrics(fallbacks);
        setLastRefreshed(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (Navegador)');
        
        if (isManualAction) {
          showNotice('Métricas sincronizadas via conexão direta no seu navegador!');
        }
      } catch (fallbackErr: any) {
        console.error('Falha crítica em ambos os métodos de sincronização:', fallbackErr);
        setErrorStatus('Falha ao conectar com o servidor e nas solicitações diretas das planilhas.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Toast status feedback
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const showNotice = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const showGlobalSuccessToast = () => {
    showNotice('Métricas atualizadas com sucesso a partir do Google Sheets!');
  };

  // On mount: Auto load metrics once (always updated on page reload as requested)
  useEffect(() => {
    fetchMetrics();
  }, []);

  // Persist manual overrides anytime they change
  const saveOverrides = (newOverrides: OverridesMap) => {
    setOverrides(newOverrides);
    localStorage.setItem('trafegon_metrics_overrides', JSON.stringify(newOverrides));
  };

  // Merge synchronized payload with manual overrides per unit basis (Requirement 2)
  const resolvedMetrics = useMemo(() => {
    const list: (UnitMetricData & { unitName: string; region: string; sigla: string; useManualFlag: boolean })[] = [];
    
    units.forEach(unit => {
      // Find matching sync data
      const synced = metrics[unit.id];
      const unitOverride = overrides[unit.id];
      const isManualEnabled = unitOverride?.useManual || false;

      let spend = synced?.spend || 0;
      let impressions = synced?.impressions || 0;
      let reach = synced?.reach || 0;
      let engagement = synced?.engagement || 0;
      let clicks = synced?.clicks || 0;
      let conversations = synced?.conversations || 0;
      let success = synced ? synced.success : false;

      // Apply overrides if manual mode has been toggled
      if (isManualEnabled && unitOverride) {
        if (unitOverride.spend !== undefined) spend = unitOverride.spend;
        if (unitOverride.impressions !== undefined) impressions = unitOverride.impressions;
        if (unitOverride.reach !== undefined) reach = unitOverride.reach;
        if (unitOverride.engagement !== undefined) engagement = unitOverride.engagement;
        if (unitOverride.clicks !== undefined) clicks = unitOverride.clicks;
        if (unitOverride.conversations !== undefined) conversations = unitOverride.conversations;
        success = true; // Mark as successful since user provided manual entries
      }

      list.push({
        unitId: unit.id,
        unitName: unit.name,
        sigla: unit.sigla,
        region: unit.region,
        success,
        spend,
        impressions,
        reach,
        engagement,
        clicks,
        conversations,
        useManualFlag: isManualEnabled,
        updatedAt: synced?.updatedAt || new Date().toISOString(),
        error: synced?.error
      });
    });

    return list;
  }, [units, metrics, overrides]);

  // Aggregate metrics summary for Group ONE context cards
  const summaryStats = useMemo(() => {
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalReach = 0;
    let totalEngagement = 0;
    let totalClicks = 0;
    let totalConversations = 0;
    let countActiveAndSynced = 0;

    resolvedMetrics.forEach(m => {
      // Calculate overall counts
      totalSpend += m.spend;
      totalImpressions += m.impressions;
      totalReach += m.reach;
      totalEngagement += m.engagement;
      totalClicks += m.clicks;
      totalConversations += m.conversations;
      if (m.spend > 0 || m.conversations > 0) {
        countActiveAndSynced++;
      }
    });

    const overallCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const overallCPA = totalConversations > 0 ? totalSpend / totalConversations : 0;
    const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const overallConvRate = totalClicks > 0 ? (totalConversations / totalClicks) * 100 : 0;

    return {
      totalSpend,
      totalImpressions,
      totalReach,
      totalEngagement,
      totalClicks,
      totalConversations,
      overallCPC,
      overallCPA,
      overallCTR,
      overallConvRate,
      countActiveAndSynced
    };
  }, [resolvedMetrics]);

  // Handle Edit Action row initialization
  const startEditingRow = (item: any) => {
    setEditingRowUnitId(item.unitId);
    setEditFormData({
      spend: item.spend.toString(),
      impressions: item.impressions.toString(),
      reach: item.reach.toString(),
      engagement: item.engagement.toString(),
      clicks: item.clicks.toString(),
      conversations: item.conversations.toString()
    });
  };

  // Submit and save rows
  const saveEditedRow = (unitId: string) => {
    const updatedSpend = parseFloat(editFormData.spend.replace(',', '.')) || 0;
    const updatedImpressions = parseInt(editFormData.impressions, 10) || 0;
    const updatedReach = parseInt(editFormData.reach, 10) || 0;
    const updatedEngagement = parseInt(editFormData.engagement, 10) || 0;
    const updatedClicks = parseInt(editFormData.clicks, 10) || 0;
    const updatedConversations = parseInt(editFormData.conversations, 10) || 0;

    const updatedOverrides = {
      ...overrides,
      [unitId]: {
        spend: updatedSpend,
        impressions: updatedImpressions,
        reach: updatedReach,
        engagement: updatedEngagement,
        clicks: updatedClicks,
        conversations: updatedConversations,
        useManual: true // Enables local override mode
      }
    };

    saveOverrides(updatedOverrides);
    setEditingRowUnitId(null);
    showNotice('Edição feita localmente com sucesso! Métricas recalculadas.');
  };

  // Turn Manual Mode OFF and re-use synced Google Sheets content
  const disableManualOverride = (unitId: string) => {
    const updatedOverrides = { ...overrides };
    if (updatedOverrides[unitId]) {
      updatedOverrides[unitId].useManual = false;
    }
    saveOverrides(updatedOverrides);
    showNotice('A unidade voltou a receber dados atualizados diretamente do Google Sheets!');
  };

  // Sort and filter operation list
  const filteredAndSortedMetrics = useMemo(() => {
    let list = resolvedMetrics;

    // Filter by Region
    if (regionFilter !== 'todas') {
      list = list.filter(m => m.region === regionFilter);
    }

    // Sort entries
    list.sort((a, b) => {
      let aVal = 0;
      let bVal = 0;

      if (sortBy === 'conversations') {
        aVal = a.conversations;
        bVal = b.conversations;
      } else if (sortBy === 'spend') {
        aVal = a.spend;
        bVal = b.spend;
      } else if (sortBy === 'clicks') {
        aVal = a.clicks;
        bVal = b.clicks;
      } else if (sortBy === 'impressions') {
        aVal = a.impressions;
        bVal = b.impressions;
      } else if (sortBy === 'cpa') {
        // Handle divisions safely to prevent infinite thresholds
        const aCPA = a.conversations > 0 ? a.spend / a.conversations : 999999;
        const bCPA = b.conversations > 0 ? b.spend / b.conversations : 999999;
        aVal = aCPA;
        bVal = bCPA;
      } else if (sortBy === 'cpc') {
        const aCPC = a.clicks > 0 ? a.spend / a.clicks : 999999;
        const bCPC = b.clicks > 0 ? b.spend / b.clicks : 999999;
        aVal = aCPC;
        bVal = bCPC;
      }

      if (sortOrder === 'desc') {
        return bVal - aVal;
      } else {
        return aVal - bVal;
      }
    });

    return list;
  }, [resolvedMetrics, regionFilter, sortBy, sortOrder]);

  // Chart rankings preparation: limit to top 10 highest leads
  const chartLeadRanking = useMemo(() => {
    const list = [...resolvedMetrics];
    list.sort((a, b) => b.conversations - a.conversations);
    return list.slice(0, 10);
  }, [resolvedMetrics]);

  // CPA mapping rankings
  const averageCPA = summaryStats.overallCPA;

  return (
    <div className="space-y-6">
      
      {/* Dynamic Toast feedback panel */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141414] border border-emerald-500/40 text-emerald-400 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slideUp font-sans max-w-sm">
          <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="text-xs font-bold leading-normal">{toastMessage}</div>
        </div>
      )}

      {/* Main Title Banner row */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center p-6 bg-[#141414] rounded-2xl border border-[#212121] gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block animate-pulse"></span>
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Consolidação Operacional de Tráfego</span>
          </div>
          <h2 className="text-2xl font-display font-black text-white flex items-center gap-2 tracking-tight">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            Métricas de Anunciantes do Mês Atual
          </h2>
          <p className="text-xs text-slate-400 leading-snug">
            Extração contínua a partir de planilhas locais para monitoramento do Valor Investido (Spend), Alcance, Engajamento e Atendimentos.
          </p>
        </div>

        {/* Top Controls: Last updated timestamp + actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {lastRefreshed && (
            <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1 bg-[#0A0A0A] border border-[#1F1F1F] px-2.5 py-1.5 rounded-lg">
              <Calendar className="w-3" />
              Sincronizado: <span className="text-gray-300 font-bold">{lastRefreshed}</span>
            </div>
          )}

          <button
            onClick={() => fetchMetrics(true)}
            disabled={loading}
            className={`flex items-center gap-1.5 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer ${
              loading ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Buscando...' : 'Atualizar Métricas'}
          </button>
        </div>
      </div>

      {/* Loading bar fallback indicator */}
      {loading && Object.keys(metrics).length === 0 && (
        <div className="p-16 text-center space-y-4 bg-[#141414] rounded-2xl border border-[#212121]">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
          <p className="font-semibold text-white">Carregando planilhas de métricas de todas as 13 unidades...</p>
          <p className="text-xs text-gray-400 max-w-md mx-auto leading-normal">
            Conectando diretamente com o Google Drive para fazer download, validar dados e consolidar investimentos e custos de atendimento (CPA) em tempo real.
          </p>
        </div>
      )}

      {/* Error state alert panel */}
      {errorStatus && (
        <div className="p-4 bg-rose-950/20 border border-rose-900/45 text-rose-400 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-xs">Erro na Extração de Planilhas</h4>
            <p className="text-[11px] leading-relaxed text-gray-300">{errorStatus}</p>
          </div>
        </div>
      )}

      {/* RENDER VIEW PORTAL */}
      {(Object.keys(metrics).length > 0 || Object.keys(overrides).length > 0) && (
        <>
          {/* KPI Statistics Bento row */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            
            <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] flex flex-col justify-between">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest font-mono">Investimento Total</span>
              <div className="my-2">
                <span className="text-lg sm:text-2xl font-display font-black text-white">
                  R$ {summaryStats.totalSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-gray-500 font-mono">
                <Coins className="w-3 text-[#B0B0B0]" />
                <span>Valor acumulado</span>
              </div>
            </div>

            <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] flex flex-col justify-between">
              <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest font-mono">Conversas / Atendimentos</span>
              <div className="my-2">
                <span className="text-lg sm:text-2xl font-display font-black text-white">
                  {summaryStats.totalConversations.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-gray-500 font-mono">
                <MessageSquare className="w-3 text-violet-400" />
                <span>Atendimentos iniciados</span>
              </div>
            </div>

            <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] flex flex-col justify-between">
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest font-mono">CPA Médio</span>
              <div className="my-2">
                <span className={`text-lg sm:text-2xl font-display font-black ${summaryStats.overallCPA > 25 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  R$ {summaryStats.overallCPA.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-gray-500 font-mono">
                {summaryStats.overallCPA > 25 ? <TrendingUp className="w-3 text-amber-400" /> : <TrendingDown className="w-3 text-emerald-400" />}
                <span>Custo por atendimento</span>
              </div>
            </div>

            <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] flex flex-col justify-between">
              <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest font-mono">Cliques / Leads</span>
              <div className="my-2">
                <span className="text-lg sm:text-2xl font-display font-black text-white">
                  {summaryStats.totalClicks.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-gray-500 font-mono">
                <MousePointer className="w-3 text-sky-400" />
                <span>Cliques para atendimento</span>
              </div>
            </div>

            <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] flex flex-col justify-between">
              <span className="text-[9px] font-bold text-pink-400 uppercase tracking-widest font-mono">Impressões / Views</span>
              <div className="my-2">
                <span className="text-lg sm:text-2xl font-display font-black text-white">
                  {summaryStats.totalImpressions.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-gray-500 font-mono">
                <Eye className="w-3 text-pink-400" />
                <span>Visualizações totais</span>
              </div>
            </div>

            <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] flex flex-col justify-between">
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest font-mono">Taxa de Conversão</span>
              <div className="my-2">
                <span className="text-lg sm:text-2xl font-display font-black text-white">
                  {summaryStats.overallConvRate.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-gray-500 font-mono">
                <FileCheck2 className="w-3 text-amber-500" />
                <span>Conversão clique-conversa</span>
              </div>
            </div>

          </div>

          {/* Graphical Representation (SVG Charts & Performance Breakdown) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Leads Generated Comparison (Top 10 Units) */}
            <div className="bg-[#141414] p-5 rounded-2xl border border-[#212121] space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-display font-extrabold text-[15px] text-white">Top 10 Unidades por Volume de Atendimento</h3>
                  <p className="text-[10px] text-gray-400">Atendimentos Iniciados acumulados no mês atual</p>
                </div>
                <MessageSquare className="w-4 h-4 text-violet-400 shrink-0" />
              </div>

              {/* Responsive SVG horizontal bar representation */}
              <div className="space-y-3 pt-2">
                {chartLeadRanking.map((item, index) => {
                  const maxConversations = Math.max(...chartLeadRanking.map(i => i.conversations)) || 1;
                  const percentWidth = (item.conversations / maxConversations) * 100;
                  
                  return (
                    <div key={item.unitId} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold items-center">
                        <span className="text-gray-300">
                          <span className="text-gray-500 font-mono mr-1.5 text-[9px]">{index + 1}º</span>
                          {item.unitName.substring(5)} {/* Slice index sequence */}
                        </span>
                        <span className="font-mono text-white text-xs">{item.conversations} conversas</span>
                      </div>
                      <div className="h-2 w-full bg-[#1A1A1A] rounded-full overflow-hidden border border-[#222]">
                        <div 
                          style={{ width: `${percentWidth}%` }}
                          className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel 2: Performance analysis on CPA & Lead health checks */}
            <div className="bg-[#141414] p-5 rounded-2xl border border-[#212121] flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-display font-extrabold text-[15px] text-white">Análise e Eficiência de Atendimento (CPA)</h3>
                    <p className="text-[10px] text-gray-400">Análise de custos operacionais do funil do Grupo ONE</p>
                  </div>
                  <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>

                <div className="space-y-3.5 pr-1 text-xs">
                  
                  <div className="p-3 bg-[#181818] rounded-xl border border-emerald-950/20 flex gap-3 items-center">
                    <span className="p-2 sm:p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold font-mono text-[9px]">CPA &le; R$ 15</span>
                    <div>
                      <strong className="block font-bold text-gray-200 text-xs">Eficiência de Elite (Verde)</strong>
                      <p className="text-[10px] text-gray-400 leading-tight">Campanhas extremamente engajadas com ofertas atraentes e excelente absorção de público.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#181818] rounded-xl border border-amber-950/20 flex gap-3 items-center">
                    <span className="p-2 sm:p-2.5 rounded-lg bg-amber-500/10 text-amber-400 font-bold font-mono text-[9px]">R$ 15 - R$ 25</span>
                    <div>
                      <strong className="block font-bold text-gray-200 text-xs text-amber-300">Margem Nominal Saudável (Amarelo)</strong>
                      <p className="text-[10px] text-gray-400 leading-tight">Custo de captação padrão do mercado. Indicado manter criativos rodando com monitoramento diário dos orçamentos.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#181818] rounded-xl border border-rose-950/20 flex gap-3 items-center">
                    <span className="p-2 sm:p-2.5 rounded-lg bg-rose-500/10 text-rose-400 font-bold font-mono text-[9px]">CPA &gt; R$ 25</span>
                    <div>
                      <strong className="block font-bold text-gray-200 text-xs text-rose-300">Alerta de Saturação (Vermelho)</strong>
                      <p className="text-[10px] text-gray-400 leading-tight">CPA elevado. Recomenda-se que o Sócio Operador solicite modificação de criativos ou reestruture o funil da unidade imediatamente.</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Informative advice message based on metrics */}
              <div className="p-3.5 bg-indigo-950/15 border border-indigo-900/35 rounded-xl flex gap-2 w-full text-slate-300 text-[10.5px] leading-relaxed">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  Sócio Operador, use o <strong>Checklist Diário</strong> e <strong>Reuniões Quinzenais</strong> com gerentes para alinhar planos de melhorias nas unidades com <strong>Alerta de Saturação</strong>. Trocar criativos auxilia a resgatar a margem nominal sadia de CPA.
                </span>
              </div>

            </div>

          </div>

          {/* Interactive Metric Matrix (Datatable with filtering, sorting, and inline overrides) */}
          <div className="bg-[#141414] rounded-2xl border border-[#212121] overflow-hidden">
            
            {/* Table Filters Title Area */}
            <div className="p-5 border-b border-[#212121] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#181818]/55">
              <div>
                <h3 className="font-display font-extrabold text-[15px] text-white">Lista de Métricas por Unidade</h3>
                <p className="text-[10px] text-gray-400">Ordene, filtre e edite individualmente as métricas de cada filial</p>
              </div>

              {/* Matrix Control filters */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Region Selector */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">Região:</span>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="bg-[#111] text-xs text-gray-300 border border-[#2d2d2d] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                  >
                    {regions.map(r => (
                      <option key={r} value={r}>
                        {r === 'todas' ? 'Todas Regiões' : r.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Column Selector */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">Métrica:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-[#111] text-xs text-gray-300 border border-[#2d2d2d] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="conversations">Atendimentos</option>
                    <option value="spend">Investimento</option>
                    <option value="clicks">Cliques</option>
                    <option value="impressions">Visualizações</option>
                    <option value="cpa">CPA (Custo Conversa)</option>
                    <option value="cpc">CPC (Custo Clique)</option>
                  </select>
                </div>

                {/* Order Selector */}
                <button
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="bg-[#1C1C1C] hover:bg-[#252525] text-xs text-gray-300 border border-[#2d2d2d] px-3 py-1.5 rounded-xl cursor-pointer"
                  title="Inverter Ordem de Classificação"
                >
                  {sortOrder === 'desc' ? 'Decrescente (V&darr;)' : 'Crescente (V&uarr;)'}
                </button>
              </div>
            </div>

            {/* Matrix Sheet Container table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-sans text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[#212121] bg-[#111]/45 text-gray-400 font-extrabold tracking-wider font-mono text-[9px] uppercase">
                    <th className="py-3 px-4 text-center w-12">Pos</th>
                    <th className="py-3 px-4">Unidade</th>
                    <th className="py-3 px-3 text-right">Investido</th>
                    <th className="py-3 px-3 text-right">Cliques</th>
                    <th className="py-3 px-3 text-right">Atendimentos</th>
                    <th className="py-3 px-3 text-right">CPA</th>
                    <th className="py-3 px-3 text-right">CPC</th>
                    <th className="py-3 px-3 text-right">CTR</th>
                    <th className="py-3 px-3 text-right">Impressões</th>
                    <th className="py-3 px-3 text-right">Alcance</th>
                    <th className="py-3 px-3 text-center">Origem dados</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D1D1D]">
                  {filteredAndSortedMetrics.map((item, sortedIndex) => {
                    const cpaVal = item.conversations > 0 ? item.spend / item.conversations : 0;
                    const cpcVal = item.clicks > 0 ? item.spend / item.clicks : 0;
                    const ctrVal = item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0;
                    const isManual = item.useManualFlag;

                    // CPA styling
                    let cpaBadgeStyle = 'text-gray-400';
                    if (item.conversations > 0) {
                      if (cpaVal <= 15) {
                        cpaBadgeStyle = 'text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded-full';
                      } else if (cpaVal <= 25) {
                        cpaBadgeStyle = 'text-amber-400 font-bold bg-amber-500/5 px-2 py-0.5 rounded-full';
                      } else {
                        cpaBadgeStyle = 'text-rose-400 font-bold bg-rose-500/5 px-2 py-0.5 rounded-full';
                      }
                    }

                    const isRowEditing = editingRowUnitId === item.unitId;

                    return (
                      <tr key={item.unitId} className={`hover:bg-[#181818]/60 transition-colors ${isManual ? 'bg-[#18151f]/20' : ''}`}>
                        
                        {/* Position Rating index */}
                        <td className="py-3.5 px-4 text-center font-mono text-gray-500 font-bold">
                          {sortedIndex + 1}
                        </td>

                        {/* Title of operating shop */}
                        <td className="py-3.5 px-4">
                          <strong className="block text-white font-extrabold font-display leading-tight">{item.unitName}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">Região {item.region.toUpperCase()}</span>
                        </td>

                        {/* Spend Override Controls */}
                        <td className="py-3.5 px-3 text-right">
                          {isRowEditing ? (
                            <div className="flex gap-1 justify-end">
                              <span className="text-gray-550 mr-0.5 self-center">R$</span>
                              <input
                                type="text"
                                value={editFormData.spend}
                                onChange={(e) => setEditFormData({ ...editFormData, spend: e.target.value })}
                                className="w-20 bg-[#0A0A0A] border border-indigo-500 text-white p-1 rounded text-right font-mono text-xs focus:outline-none"
                              />
                            </div>
                          ) : (
                            <span className="font-mono text-white font-semibold">
                              R$ {item.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          )}
                        </td>

                        {/* Clicks Override controls */}
                        <td className="py-3.5 px-3 text-right font-mono">
                          {isRowEditing ? (
                            <input
                              type="number"
                              value={editFormData.clicks}
                              onChange={(e) => setEditFormData({ ...editFormData, clicks: e.target.value })}
                              className="w-16 bg-[#0A0A0A] border border-indigo-500 text-white p-1 rounded text-right font-mono text-xs focus:outline-none"
                            />
                          ) : (
                            <span className="text-slate-300">{item.clicks.toLocaleString('pt-BR')}</span>
                          )}
                        </td>

                        {/* Conversas Override Controls */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-100">
                          {isRowEditing ? (
                            <input
                              type="number"
                              value={editFormData.conversations}
                              onChange={(e) => setEditFormData({ ...editFormData, conversations: e.target.value })}
                              className="w-16 bg-[#0A0A0A] border border-indigo-500 text-white p-1 rounded text-right font-mono text-xs focus:outline-none"
                            />
                          ) : (
                            <span>{item.conversations.toLocaleString('pt-BR')}</span>
                          )}
                        </td>

                        {/* CPA */}
                        <td className="py-3.5 px-3 text-right font-mono">
                          {isRowEditing ? (
                            <span className="text-gray-500">Calculado</span>
                          ) : item.conversations > 0 ? (
                            <span className={cpaBadgeStyle}>
                              R$ {cpaVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>

                        {/* CPC */}
                        <td className="py-3.5 px-3 text-right font-mono">
                          {isRowEditing ? (
                            <span className="text-gray-500">Calculado</span>
                          ) : item.clicks > 0 ? (
                            <span className="text-slate-300">
                              R$ {cpcVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>

                        {/* CTR */}
                        <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                          {isRowEditing ? (
                            <span className="text-gray-500">Calculado</span>
                          ) : item.impressions > 0 ? (
                            <span>{ctrVal.toFixed(2)}%</span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>

                        {/* Impressions override controls */}
                        <td className="py-3.5 px-3 text-right font-mono text-[11px] text-slate-400">
                          {isRowEditing ? (
                            <input
                              type="number"
                              value={editFormData.impressions}
                              onChange={(e) => setEditFormData({ ...editFormData, impressions: e.target.value })}
                              className="w-20 bg-[#0A0A0A] border border-indigo-500 text-white p-1 rounded text-right font-mono text-xs focus:outline-none"
                            />
                          ) : (
                            <span>{item.impressions.toLocaleString('pt-BR')}</span>
                          )}
                        </td>

                        {/* Reach override controls */}
                        <td className="py-3.5 px-3 text-right font-mono text-[11px] text-slate-400">
                          {isRowEditing ? (
                            <input
                              type="number"
                              value={editFormData.reach}
                              onChange={(e) => setEditFormData({ ...editFormData, reach: e.target.value })}
                              className="w-20 bg-[#0A0A0A] border border-indigo-500 text-white p-1 rounded text-right font-mono text-xs focus:outline-none"
                            />
                          ) : (
                            <span>{item.reach.toLocaleString('pt-BR')}</span>
                          )}
                        </td>

                        {/* Sync vs override flag */}
                        <td className="py-3.5 px-3 text-center">
                          {isManual ? (
                            <span className="text-[10px] bg-indigo-950 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-900/60 uppercase">
                              ✎ Sobrescrito
                            </span>
                          ) : item.success ? (
                            <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-900/40 uppercase">
                              ✓ Sheets Live
                            </span>
                          ) : (
                            <span className="text-[10px] bg-amber-950 text-amber-500 font-bold px-2 py-0.5 rounded border border-amber-900/40 uppercase" title={item.error}>
                              ⚠️ Falha Sync
                            </span>
                          )}
                        </td>

                        {/* Column actions for edit controls */}
                        <td className="py-3.5 px-4 text-center">
                          {isRowEditing ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => saveEditedRow(item.unitId)}
                                className="p-1 px-2 bg-emerald-650 hover:bg-emerald-600 rounded text-[10px] font-bold text-white flex items-center gap-0.5"
                                title="Confirmar Alterações Locais"
                              >
                                <Check className="w-3" />
                                Salvar
                              </button>
                              <button
                                onClick={() => setEditingRowUnitId(null)}
                                className="p-1 px-2 bg-gray-650 hover:bg-gray-600 rounded text-[10px] font-bold text-white flex items-center gap-0.5"
                                title="Cancelar edição"
                              >
                                <X className="w-3" />
                                Fechar
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => startEditingRow(item)}
                                className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                                title="Editar métricas da Unidade"
                              >
                                <Edit2 className="w-3 h-3 text-indigo-400" />
                                <span className="text-[10px] hover:underline">Editar</span>
                              </button>
                              
                              {isManual && (
                                <button
                                  onClick={() => disableManualOverride(item.unitId)}
                                  className="text-[9px] text-rose-400 font-bold hover:underline cursor-pointer"
                                  title="Remover bypass manual e ler live Google Sheets"
                                >
                                  Reverter Sync
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty stats state panel */}
            {filteredAndSortedMetrics.length === 0 && (
              <div className="p-12 text-center text-gray-500 font-medium">
                Nenhuma métrica encontrada para os filtros selecionados.
              </div>
            )}

          </div>

          {/* Table of documentation & links so managers can quickly open original spreadsheets too */}
          <div className="bg-[#141414] p-5 rounded-2xl border border-[#212121] space-y-4">
            <h3 className="font-display font-extrabold text-[14px] text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" />
              Documentação das Planilhas de Origem das Unidades
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              As planilhas são alimentadas do dia 1 ao vencimento atual de forma autônoma pela equipe de tráfego. Caso necessite auditar os arquivos externos, seguem links diretos de acesso de leitura para conferência:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 text-xs">
              {units.map(u => (
                <a
                  key={u.id}
                  href={`https://docs.google.com/spreadsheets/d/${METRICS_SHEETS[u.id]}/edit?usp=sharing`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-[#181818] hover:bg-[#1f1f1f] border border-[#212121] rounded-xl text-gray-300 hover:text-white font-medium flex items-center justify-between transition-colors shadow-sm cursor-pointer"
                >
                  <span className="truncate">{u.sigla} - {u.name.substring(5)}</span>
                  <Download className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1.5" />
                </a>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
