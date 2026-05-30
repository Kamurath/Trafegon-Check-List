import React, { useState, useMemo } from 'react';
import { QuickSuggestion } from '../types';
import { Sparkles, Copy, Check, Heart, RefreshCw, Edit2, Trash2, Plus, Search, Filter, ListCollapse, Star, Wand2, CalendarDays, Loader2, AlertTriangle, Inbox } from 'lucide-react';

interface SugestoesRapidasViewProps {
  suggestions: QuickSuggestion[];
  onUpdateSuggestions: (updated: QuickSuggestion[]) => void;
}

export default function SugestoesRapidasView({ suggestions, onUpdateSuggestions }: SugestoesRapidasViewProps) {
  // Tabs: 'gerador' | 'ia' | 'todos' | 'favoritos'
  const [activeTab, setActiveTab] = useState<'gerador' | 'ia' | 'todos' | 'favoritos'>('gerador');
  
  // AI Generator states
  const [iaSelectedTheme, setIaSelectedTheme] = useState<string>('dia_namorados');
  const [iaCustomTheme, setIaCustomTheme] = useState<string>('');
  const [iaLoading, setIaLoading] = useState<boolean>(false);
  const [iaLoadingStep, setIaLoadingStep] = useState<string>('');
  const [iaError, setIaError] = useState<string>('');
  const [iaResult, setIaResult] = useState<{ notas: string[]; stories: string[]; reels: string[] } | null>(null);
  const [iaSuccessMessage, setIaSuccessMessage] = useState<string>('');
  const [importedStatus, setImportedStatus] = useState<Record<string, boolean>>({});

  // Search and Filtering inside 'todos' and 'favoritos'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');
  const [filterCategory, setFilterCategory] = useState<string>('todos');

  // Generator states
  const [genType, setGenType] = useState<'nota' | 'story' | 'reels'>('nota');
  const [genCategory, setGenCategory] = useState<string>('comerciais'); // 'comerciais' | 'laser' | 'pele' | 'proximidade' | 'cta' | 'any'
  const [generatedItem, setGeneratedItem] = useState<QuickSuggestion | null>(() => {
    // Pick an initial random suggestion
    const defaultSuggestions = suggestions.filter(s => s.type === 'nota' && s.category === 'comerciais');
    if (defaultSuggestions.length > 0) {
      return defaultSuggestions[Math.floor(Math.random() * defaultSuggestions.length)];
    }
    return suggestions.length > 0 ? suggestions[0] : null;
  });

  // State for temporary custom edit in generator
  const [isEditingGen, setIsEditingGen] = useState(false);
  const [editTextGen, setEditTextGen] = useState('');

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New suggestion inline form
  const [newText, setNewText] = useState('');
  const [newType, setNewType] = useState<'nota' | 'story' | 'reels'>('nota');
  const [newCategory, setNewCategory] = useState<'comerciais' | 'laser' | 'pele' | 'proximidade' | 'cta' | 'story' | 'reels'>('comerciais');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState('');

  // Handle drawing a suggestion
  const handleDrawSuggestion = (type: 'nota' | 'story' | 'reels', category: string) => {
    let pool = suggestions.filter(s => s.type === type);
    if (type === 'nota' && category !== 'any') {
      pool = pool.filter(s => s.category === category);
    }
    
    if (pool.length === 0) {
      // Fallback to any of the same type
      pool = suggestions.filter(s => s.type === type);
    }

    if (pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      setGeneratedItem(pool[idx]);
      setIsEditingGen(false);
    } else {
      setGeneratedItem(null);
    }
  };

  // Toggle favorite suggestion helper
  const handleToggleFavorite = (id: string) => {
    const updated = suggestions.map(s => {
      if (s.id === id) {
        return { ...s, isFavorite: !s.isFavorite };
      }
      return s;
    });
    onUpdateSuggestions(updated);
    
    // Update active generated item if it's the one modified
    if (generatedItem && generatedItem.id === id) {
      setGeneratedItem(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  // Delete custom suggestion
  const handleDeleteSuggestion = (id: string) => {
    const updated = suggestions.filter(s => s.id !== id);
    onUpdateSuggestions(updated);
    if (generatedItem && generatedItem.id === id) {
      setGeneratedItem(updated.length > 0 ? updated[0] : null);
    }
  };

  // Handle editing the suggestion text (within generator or master list)
  const handleSaveEditGenText = () => {
    if (!generatedItem) return;
    if (!editTextGen.trim()) return;

    // Rules verification for notes
    if (generatedItem.type === 'nota' && editTextGen.length > 55) {
      if (!confirm('Dica: Notas diárias do Instagram são melhores quando curtas (até 45-55 caracteres). Deseja salvar mesmo assim?')) {
        return;
      }
    }

    const updated = suggestions.map(s => {
      if (s.id === generatedItem.id) {
        return { ...s, text: editTextGen.trim() };
      }
      return s;
    });
    onUpdateSuggestions(updated);
    setGeneratedItem(prev => prev ? { ...prev, text: editTextGen.trim() } : null);
    setIsEditingGen(false);
  };

  // Handle adding a new suggestion
  const handleAddSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newText.trim()) {
      setFormError('Escreva a sugestão antes de enviar.');
      return;
    }

    const trimmedText = newText.trim();

    // Check rules for Instagram notes
    if (newType === 'nota') {
      if (trimmedText.length > 55) {
        setFormError('Notas diárias devem ter tom leve e ser curtas (com até 45-55 caracteres).');
        return;
      }
      if (/[#@]/.test(trimmedText)) {
        setFormError('Lembrete: Notas diárias não podem conter hashtags ou marcações.');
        return;
      }
      // Check for emojis
      const emojiRegex = /[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/;
      if (emojiRegex.test(trimmedText)) {
        setFormError('O padrão de Notas do Instagram restringe o uso de emojis nesta versão.');
        return;
      }
    }

    const newSug: QuickSuggestion = {
      id: `sug_custom_${Date.now()}`,
      text: trimmedText,
      type: newType,
      category: newType === 'nota' ? newCategory : (newType === 'story' ? 'story' : 'reels'),
      isFavorite: false
    };

    const updated = [...suggestions, newSug];
    onUpdateSuggestions(updated);
    setNewText('');
    setShowAddForm(false);
  };

  // -------------------------------------------------------------
  // AI SUGGESTION GENERATOR SYSTEM (Gemini-3.5-Flash)
  // -------------------------------------------------------------
  const getThemeText = (themeKey: string) => {
    switch (themeKey) {
      case 'dia_namorados': return 'Dia dos Namorados';
      case 'copa_mundo': return 'Copa do Mundo';
      case 'festa_junina': return 'Festa Junina';
      case 'natal': return 'Natal';
      case 'ano_novo': return 'Ano Novo';
      case 'dia_maes': return 'Dia das Mães';
      case 'dia_pais': return 'Dia dos Pais';
      case 'black_friday': return 'Black Friday';
      case 'dia_cliente': return 'Dia do Cliente';
      default: return iaCustomTheme || 'Sazonal';
    }
  };

  const handleGenerateAISuggestions = async () => {
    setIaError('');
    setIaLoading(true);
    setIaResult(null);
    setImportedStatus({});
    
    const theme = iaSelectedTheme === 'custom' ? iaCustomTheme.trim() : getThemeText(iaSelectedTheme);
    if (iaSelectedTheme === 'custom' && !iaCustomTheme.trim()) {
      setIaError('Escreva um tema ou palavra-chave para a IA gerar.');
      setIaLoading(false);
      return;
    }

    // Step indicators to enrich user loading experience
    const steps = [
      'Contatando o cérebro criativo da Agência TráfegON...',
      'Invocando a IA do Gemini (rápido e econômico)...',
      'Estudando o calendário de marketing da Espaçolaser...',
      'Formatando copywriting com ganchos persuasivos...',
      'Refinando limites de caracteres para Instagram Notas...',
      'Finalizando empacotamento das sugestões diárias...'
    ];

    let currentStepIdx = 0;
    setIaLoadingStep(steps[currentStepIdx]);
    const stepInterval = setInterval(() => {
      if (currentStepIdx < steps.length - 1) {
        currentStepIdx++;
        setIaLoadingStep(steps[currentStepIdx]);
      }
    }, 1200);

    try {
      const response = await fetch('/api/generate-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Erro de rede ao processar sugestão (código: ${response.status})`);
      }

      const data = await response.json();
      if (!data || !data.notas || !data.stories || !data.reels) {
        throw new Error('Retorno do servidor está incompleto ou inválido. Tente novamente.');
      }

      setIaResult(data);
    } catch (err: any) {
      clearInterval(stepInterval);
      setIaError(err.message || 'Houve um erro ao se conectar com o serviço de IA. Verifique as configurações de secrets.');
    } finally {
      setIaLoading(false);
      setIaLoadingStep('');
    }
  };

  const handleImportAISuggestion = (text: string, type: 'nota' | 'story' | 'reels', uniqueKey: string) => {
    const category = type === 'nota' ? 'comerciais' : (type === 'story' ? 'story' : 'reels');
    
    const newSug: QuickSuggestion = {
      id: `sug_custom_ia_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      text: text,
      type: type,
      category: category,
      isFavorite: false
    };

    const updated = [...suggestions, newSug];
    onUpdateSuggestions(updated);

    setImportedStatus(prev => ({ ...prev, [uniqueKey]: true }));
    setIaSuccessMessage('Adicionado ao seu Banco local!');
    setTimeout(() => setIaSuccessMessage(''), 2500);
  };

  const handleImportAllAISuggestions = () => {
    if (!iaResult) return;
    
    const newItems: QuickSuggestion[] = [];
    
    iaResult.notas.forEach((text, i) => {
      newItems.push({
        id: `sug_custom_ia_bulk_${Date.now()}_n${i}`,
        text: text,
        type: 'nota',
        category: 'comerciais',
        isFavorite: false
      });
    });

    iaResult.stories.forEach((text, i) => {
      newItems.push({
        id: `sug_custom_ia_bulk_${Date.now()}_s${i}`,
        text: text,
        type: 'story',
        category: 'story',
        isFavorite: false
      });
    });

    iaResult.reels.forEach((text, i) => {
      newItems.push({
        id: `sug_custom_ia_bulk_${Date.now()}_r${i}`,
        text: text,
        type: 'reels',
        category: 'reels',
        isFavorite: false
      });
    });

    const updated = [...suggestions, ...newItems];
    onUpdateSuggestions(updated);

    const statusMap: Record<string, boolean> = {};
    iaResult.notas.forEach((_, i) => statusMap[`nota-${i}`] = true);
    iaResult.stories.forEach((_, i) => statusMap[`story-${i}`] = true);
    iaResult.reels.forEach((_, i) => statusMap[`reels-${i}`] = true);
    
    setImportedStatus(statusMap);
    setIaSuccessMessage('Todas as sugestões foram importadas ao seu Banco local!');
    setTimeout(() => setIaSuccessMessage(''), 3000);
  };

  // Copy action helper
  const triggerCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Filtered lists
  const filteredSuggestions = useMemo(() => {
    return suggestions.filter(s => {
      // Active tab check
      if (activeTab === 'favoritos' && !s.isFavorite) return false;

      // Type filter
      if (filterType !== 'todos' && s.type !== filterType) return false;

      // Category filter
      if (filterCategory !== 'todos' && s.category !== filterCategory) return false;

      // Text search
      if (searchTerm.trim() && !s.text.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      return true;
    });
  }, [suggestions, activeTab, filterType, filterCategory, searchTerm]);

  // Translate labels for layout elegance
  const translateType = (type: string) => {
    switch (type) {
      case 'nota': return 'Nota Diária';
      case 'story': return 'Ideia de Story';
      case 'reels': return 'Gancho Reels';
      default: return type;
    }
  };

  const translateCategory = (cat: string) => {
    switch (cat) {
      case 'comerciais': return 'Comerciais';
      case 'laser': return 'Laser & Depilação';
      case 'pele': return 'Cuidado & Pele';
      case 'proximidade': return 'Proximidade';
      case 'cta': return 'Sugestões de CTA';
      case 'story': return 'Stories';
      case 'reels': return 'Reels';
      default: return cat;
    }
  };

  return (
    <div id="sugestoes-view-root" className="space-y-6">
      
      {/* Header Info */}
      <div className="bg-gradient-to-r from-amber-600/10 to-indigo-700/10 p-6 rounded-2xl border border-amber-900/20 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-display font-black text-2xl text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              Sugestões Rápidas
            </h2>
            <p className="text-xs text-gray-400 max-w-2xl">
              Copie frases validadas e estruturadas para o Instagram da clinicamente.
              Modelos prontos de <strong>Notas Diárias</strong> curtas, <strong>stories interativos</strong>, agendas abertas e <strong>ganchos de Reels</strong> para engajar e capturar leads sem esforço.
            </p>
          </div>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setNewType('nota');
              setNewCategory('comerciais');
              setNewText('');
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-505/20 transition-all cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Criar Nova Sugestão
          </button>
        </div>
      </div>

      {/* Dynamic inline add form */}
      {showAddForm && (
        <form onSubmit={handleAddSuggestionSubmit} className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-wider text-white">Adicionar Nova Sugestão ao Banco</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tipo de Conteúdo</label>
              <select
                value={newType}
                onChange={(e) => {
                  const t = e.target.value as 'nota' | 'story' | 'reels';
                  setNewType(t);
                  if (t === 'nota') setNewCategory('comerciais');
                }}
                className="w-full bg-[#1A1A1A] border border-[#2B2B2B] rounded-xl text-xs text-gray-300 py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="nota">Nota Diária (Instagram)</option>
                <option value="story">Ideia de Story</option>
                <option value="reels">Gancho para Reels</option>
              </select>
            </div>

            {newType === 'nota' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Categoria da Nota</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#1A1A1A] border border-[#2B2B2B] rounded-xl text-xs text-gray-300 py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="comerciais">Comercial / Agenda</option>
                  <option value="laser">Laser & Depilação</option>
                  <option value="pele">Cuidado & Pele</option>
                  <option value="proximidade">Proximidade</option>
                  <option value="cta">CTA Direto</option>
                </select>
              </div>
            )}

            <div className={newType !== 'nota' ? 'md:col-span-2' : ''}>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                Texto {newType === 'nota' ? '(Máx. 55 caracteres, sem emojis ou tags)' : ''}
              </label>
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                maxLength={newType === 'nota' ? 55 : 200}
                placeholder={newType === 'nota' ? 'Ex: Menos lâmina, mais liberdade' : 'Ex: Mostre a recepção limpa e convide para agendar'}
                className="w-full bg-[#1A1A1A] border border-[#2B2B2B] rounded-xl text-xs text-white py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {formError && (
            <p className="text-[11px] text-rose-400 font-bold bg-rose-950/20 px-3 py-1.5 rounded-lg border border-rose-900/30">
              ⚠️ {formError}
            </p>
          )}

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-[11px] text-gray-400 bg-transparent hover:bg-[#1C1C1C] rounded-lg transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-[11px] bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition-all border border-indigo-500"
            >
              Adicionar Sugestão
            </button>
          </div>
        </form>
      )}

      {/* Main Nav Sub-Tabs */}
      <div className="flex border-b border-[#1F1F1F] gap-2 select-none overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('gerador')}
          className={`px-4 py-2 text-xs font-black border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'gerador'
              ? 'border-amber-500 text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          🎰 Sorteador Rápido
        </button>
        <button
          onClick={() => setActiveTab('ia')}
          className={`px-4 py-2 text-xs font-black border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ia'
              ? 'border-violet-500 text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          ✨ Gerador de IA (Sazonal)
        </button>
        <button
          onClick={() => setActiveTab('todos')}
          className={`px-4 py-2 text-xs font-black border-b-2 transition-all cursor-pointer ${
            activeTab === 'todos'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          📂 Banco Completo ({suggestions.length})
        </button>
        <button
          onClick={() => setActiveTab('favoritos')}
          className={`px-4 py-2 text-xs font-black border-b-2 transition-all cursor-pointer ${
            activeTab === 'favoritos'
              ? 'border-pink-500 text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          💖 Favoritas ({suggestions.filter(s => s.isFavorite).length})
        </button>
      </div>

      {/* TAB 1: GERADOR DINÂMICO DE MODELO */}
      {activeTab === 'gerador' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Controls column */}
          <div className="lg:col-span-5 bg-[#141414] border border-[#212121] rounded-2xl p-5 space-y-5 shadow-lg">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#B0B0B0] flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-400" /> Parâmetros de Sorteio
            </h3>
            
            <div className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-[10px] font-black text-gray-505 uppercase tracking-wide mb-1.5">Tipo de Sugestão</label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#1A1A1A] border border-[#262626] p-1 rounded-xl">
                  <button
                    onClick={() => {
                      setGenType('nota');
                      handleDrawSuggestion('nota', genCategory);
                    }}
                    className={`py-2 text-[10px] font-black uppercase rounded-lg text-center transition-all cursor-pointer ${
                      genType === 'nota' ? 'bg-[#27272A] border border-[#3A3A3C] text-white shadow' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Notas Instagram
                  </button>
                  <button
                    onClick={() => {
                      setGenType('story');
                      handleDrawSuggestion('story', 'story');
                    }}
                    className={`py-2 text-[10px] font-black uppercase rounded-lg text-center transition-all cursor-pointer ${
                      genType === 'story' ? 'bg-[#27272A] border border-[#3A3A3C] text-white shadow' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Stories
                  </button>
                  <button
                    onClick={() => {
                      setGenType('reels');
                      handleDrawSuggestion('reels', 'reels');
                    }}
                    className={`py-2 text-[10px] font-black uppercase rounded-lg text-center transition-all cursor-pointer ${
                      genType === 'reels' ? 'bg-[#27272A] border border-[#3A3A3C] text-white shadow' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Reels Hooks
                  </button>
                </div>
              </div>

              {/* Sub-Category for Notes */}
              {genType === 'nota' && (
                <div>
                  <label className="block text-[10px] font-black text-gray-505 uppercase tracking-wide mb-1.5">Categoria de Notas</label>
                  <div className="space-y-1">
                    {[
                      { id: 'comerciais', value: 'comerciais', label: 'Commercial / Agenda' },
                      { id: 'laser', value: 'laser', label: 'Lâmina & Depilação' },
                      { id: 'pele', value: 'pele', label: 'Cuidado & Pele' },
                      { id: 'proximidade', value: 'proximidade', label: 'Proximidade / Equipe' },
                      { id: 'cta', value: 'cta', label: 'Chamada para Direct/Bio' },
                      { id: 'any', value: 'any', label: '🎲 Sortear Qualquer Categoria' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setGenCategory(opt.value);
                          handleDrawSuggestion('nota', opt.value);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left ${
                          genCategory === opt.value
                            ? 'bg-[#1C1917] hover:bg-[#26221E] text-amber-400 border-amber-900/40'
                            : 'bg-transparent text-gray-400 border-transparent hover:bg-[#1A1A1A] hover:text-white'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {genCategory === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Story Details Card */}
              {genType === 'story' && (
                <div className="p-3 bg-indigo-950/20 rounded-xl border border-indigo-900/20 text-[11px] text-gray-400">
                  ⚡ <strong>Sobre ideias de Stories:</strong> Use para engajar a audiência local mostrando os bastidores da clínica, as especialistas, as salas limpas e estimule respostas no direct.
                </div>
              )}

              {/* Reels Details Card */}
              {genType === 'reels' && (
                <div className="p-3 bg-[#1C161D] rounded-xl border border-purple-900/20 text-[11px] text-gray-400 font-medium">
                  🔥 <strong>Ganchos para Reels:</strong> Frases fortes de até 3 segundos para colocar na tela ou falar no início do vídeo para reter o público e prender atenção.
                </div>
              )}
            </div>

            {/* Quick Draw Trigger Button */}
            <button
              onClick={() => handleDrawSuggestion(genType, genCategory)}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-505/10 transition-all cursor-pointer border border-amber-400/20"
            >
              <RefreshCw className="w-4 h-4" />
              Sorteador de Sugestão
            </button>
          </div>

          {/* Sorteado / Suggestion Card block */}
          <div className="lg:col-span-7 space-y-4">
            {generatedItem ? (
              <div className="bg-[#141414] border border-[#212121] rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                
                {/* Visual Background Glow Decor */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 blur-3xl rounded-full" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-505/5 blur-2xl rounded-full" />

                {/* Card header meta */}
                <div className="flex justify-between items-center border-b border-[#212121] pb-3 shrink-0 relative z-10">
                  <span className="px-2.5 py-0.5 bg-amber-955/20 text-amber-400 border border-amber-900/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {translateType(generatedItem.type)}
                  </span>
                  
                  {generatedItem.type === 'nota' && (
                    <span className="text-[10px] text-gray-500 font-semibold uppercase">
                      Categoria: <strong>{translateCategory(generatedItem.category)}</strong>
                    </span>
                  )}
                </div>

                {/* Big Suggestion Display Text */}
                <div className="flex-1 flex flex-col justify-center relative z-10 py-6">
                  {isEditingGen ? (
                    <div className="space-y-3 w-full">
                      <textarea
                        value={editTextGen}
                        onChange={(e) => setEditTextGen(e.target.value)}
                        placeholder="Edite a sugestão..."
                        rows={3}
                        className="w-full bg-[#1C1C1C] border border-[#313131] rounded-xl text-white text-base py-3 px-4 focus:outline-none focus:ring-1 focus:ring-amber-500 font-display font-medium leading-relaxed resize-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingGen(false)}
                          className="px-3 py-1.5 bg-[#1F1F1F] rounded-lg text-xs text-gray-300 font-bold hover:bg-[#252525]"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEditGenText}
                          className="px-3.5 py-1.5 bg-amber-500 text-black rounded-lg text-xs font-black hover:bg-amber-400 flex items-center gap-1.5"
                        >
                          Salvar Alteração
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-display font-black text-xl md:text-2xl text-white leading-tight tracking-tight select-all">
                        "{generatedItem.text}"
                      </p>
                      
                      {generatedItem.type === 'nota' && (
                        <p className={`text-[10px] font-bold font-mono ${generatedItem.text.length <= 45 ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {generatedItem.text.length} caracteres {generatedItem.text.length <= 45 ? '(Tamanho ideal < 45)' : '(Aceitável < 55)'}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action buttons footer */}
                <div className="border-t border-[#212121] pt-4 flex flex-wrap gap-2 items-center justify-between relative z-10 shrink-0">
                  <div className="flex gap-2">
                    {/* Copy suggestion */}
                    <button
                      onClick={() => triggerCopy(generatedItem.text, generatedItem.id)}
                      className="px-4 py-2.5 bg-[#1C1C1C] hover:bg-[#262626] text-white font-bold rounded-xl text-xs flex items-center gap-2 border border-[#2D2D2D] transition-all cursor-pointer"
                    >
                      {copiedId === generatedItem.id ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-450" />
                          <span className="text-emerald-400 font-black">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-gray-400" />
                          <span>Copiar Texto</span>
                        </>
                      )}
                    </button>

                    {/* Edit inline button */}
                    <button
                      onClick={() => {
                        setEditTextGen(generatedItem.text);
                        setIsEditingGen(true);
                      }}
                      className="px-3 py-2.5 bg-[#1C1C1C] hover:bg-[#262626] text-gray-300 font-bold rounded-xl text-xs flex items-center gap-2 border border-[#2D2D2D] transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-gray-405" />
                      <span>Editar</span>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {/* Favorite toggle */}
                    <button
                      onClick={() => handleToggleFavorite(generatedItem.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        generatedItem.isFavorite
                          ? 'bg-pink-950/20 text-pink-400 border-pink-900/40 hover:bg-pink-905/30'
                          : 'bg-[#1C1C1C] hover:bg-[#262626] text-gray-405 border-[#2D2D2D]'
                      }`}
                      title={generatedItem.isFavorite ? 'Remover dos favoritos' : 'Favoritar sugestão'}
                    >
                      <Star className={`w-4 h-4 ${generatedItem.isFavorite ? 'fill-current' : ''}`} />
                    </button>

                    {/* Delete item if customized */}
                    {generatedItem.id.startsWith('sug_custom_') && (
                      <button
                        onClick={() => handleDeleteSuggestion(generatedItem.id)}
                        className="p-2.5 rounded-xl bg-transparent border border-rose-900/20 text-rose-400 hover:bg-rose-900/10 transition-all cursor-pointer"
                        title="Deletar sugestão personalizada"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#141414] border border-[#212121] rounded-2xl p-12 text-center text-gray-400 shadow-lg flex flex-col items-center justify-center">
                <span className="text-4xl">🎲</span>
                <p className="font-bold text-white mt-4">Nenhuma sugestão encontrada para o filtro sorteado.</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">Tente redefinir o tipo do filtro ou adicione sugestões manuais.</p>
              </div>
            )}

            {/* Note compliance rules banner */}
            <div className="bg-[#141414] border border-[#212121] rounded-2xl p-4 text-xs text-gray-400 leading-relaxed font-normal">
              <strong className="text-gray-300 block mb-1">📋 Padrão de Qualidade do Grupo ONE para Notas de Instagram:</strong>
              Use frases com até 45-55 caracteres, tom leve, direto e de proximidade com o cliente. Evite termos difíceis, hashtags, emojis e promessas miraculosas em letras garrafais.
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB: GENERATOR DE IA (SAZONAL)                                         */}
      {/* ====================================================================== */}
      {activeTab === 'ia' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Main Controls & Banner */}
          <div className="bg-[#141414] border border-[#212121] rounded-2xl p-6 relative overflow-hidden shadow-xl">
            {/* Ambient Purple glow decoration */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 blur-3xl pointer-events-none rounded-full" />
            
            <div className="relative z-10 space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-violet-950/30 border border-violet-800/30 rounded-2xl text-violet-400">
                  <Wand2 className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-bold font-mono text-violet-400 uppercase tracking-widest block">Geração Inteligente Especial de Época</span>
                  <h3 className="text-lg font-display font-black text-white">Criatividade Instantânea com Inteligência Artificial</h3>
                  <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
                    Sincronize sua comunicação com as épocas mais quentes do ano! Deixe o Gemini planejar ideias magnéticas de Notas do Instagram, frases interativas para Stories e ganchos de Reels sob medida para sua Espaçolaser.
                  </p>
                </div>
              </div>

              {/* Grid of Season Selectors */}
              <div className="space-y-3 pt-2 text-left">
                <label className="block text-[11px] font-black text-gray-450 uppercase tracking-wider mb-2">Selecione a Época do Ano / Evento Temático</label>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {[
                    { id: 'dia_namorados', label: '💝 Dia dos Namorados' },
                    { id: 'festa_junina', label: '🌽 Festa Junina' },
                    { id: 'black_friday', label: '🏷️ Black Friday' },
                    { id: 'natal', label: '🎄 Natal / Fim de Ano' },
                    { id: 'ano_novo', label: '🥂 Ano Novo' },
                    { id: 'dia_maes', label: '👩‍👧 Dia das Mães' },
                    { id: 'dia_pais', label: '👨‍👦 Dia dos Pais' },
                    { id: 'dia_cliente', label: '🤝 Dia do Cliente' },
                    { id: 'copa_mundo', label: '⚽ Copa do Mundo' },
                    { id: 'custom', label: '✏️ Outro Tema...' },
                  ].map((season) => (
                    <button
                      key={season.id}
                      type="button"
                      onClick={() => setIaSelectedTheme(season.id)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex flex-col justify-between cursor-pointer min-h-[56px] ${
                        iaSelectedTheme === season.id
                          ? 'bg-violet-950/20 border-violet-550 text-white shadow-md shadow-violet-950/20'
                          : 'bg-[#18181B]/50 border-[#27272A] hover:border-violet-900/30 text-gray-400 hover:text-white hover:bg-[#1E1E24]/50'
                      }`}
                    >
                      <span className="leading-tight">{season.label}</span>
                      {iaSelectedTheme === season.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 self-end mt-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom input details */}
              {iaSelectedTheme === 'custom' && (
                <div className="space-y-1.5 text-left animate-fadeIn">
                  <label className="block text-[10px] font-bold text-gray-405 uppercase">Escreva o Tema ou Evento Customizado</label>
                  <input
                    type="text"
                    value={iaCustomTheme}
                    onChange={(e) => setIaCustomTheme(e.target.value)}
                    placeholder="Ex: Halloween da Beleza, Dia Internacional da Mulher, Inauguração de Filial..."
                    className="w-full max-w-xl bg-[#1A1A1E] text-xs text-white border border-[#2D2D35] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              )}

              {/* Shimmer generate button */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={iaLoading}
                  onClick={handleGenerateAISuggestions}
                  className="px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-955/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-violet-500/30"
                >
                  {iaLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando com IA...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 text-violet-200" />
                      Gerar Sugestões via IA Sazonal
                    </>
                  )}
                </button>
                <span className="text-[11px] text-gray-500 font-medium">
                  {iaLoading ? 'Aguarde alguns segundos' : 'Gera de forma inteligente e armazena em cache instantâneo.'}
                </span>
              </div>

            </div>
          </div>

          {/* Success / Info Alerts */}
          {iaSuccessMessage && (
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-xl text-xs font-bold font-sans text-center animate-bounce">
              🎉 {iaSuccessMessage}
            </div>
          )}

          {/* Error notice */}
          {iaError && (
            <div className="flex gap-3 bg-rose-950/10 border border-rose-900/30 p-4 rounded-xl text-xs text-left leading-relaxed">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-gray-300">
                <strong className="text-rose-400 block font-black uppercase tracking-wider text-[10px]">Falha na Sincronização de IA</strong>
                <p>{iaError}</p>
                <p className="text-gray-500 text-[11px] font-sans mt-1">
                  Certifique-se de carregar sua chave <strong>GEMINI_API_KEY</strong> de API no painel de Segredos/Secrets no AI Studio.
                </p>
              </div>
            </div>
          )}

          {/* Interactive loading state placeholder */}
          {iaLoading && (
            <div className="bg-[#141414] border border-[#212121] rounded-2xl p-12 text-center text-gray-400 shadow-lg flex flex-col items-center justify-center space-y-4 animate-pulse">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
              <div className="space-y-1">
                <p className="font-bold text-white text-sm">Gerando sugestões sazonais...</p>
                <p className="text-xs text-violet-400 font-mono italic">{iaLoadingStep}</p>
              </div>
              <div className="w-48 h-1.5 bg-[#1C1C24] rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 animate-progress w-2/3 rounded-full" />
              </div>
            </div>
          )}

          {/* AI Generation Results Display */}
          {iaResult && !iaLoading && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Results Control and Bulk import */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-violet-950/10 border border-violet-900/10 p-4 rounded-xl">
                <div className="text-left">
                  <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest font-mono">Resultados Pronto para Uso</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5 font-sans">Foram geradas 9 sugestões temáticas personalizadas baseadas no tema selecionado.</p>
                </div>
                
                <button
                  type="button"
                  onClick={handleImportAllAISuggestions}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-extrabold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer shadow-sm shadow-violet-955/20 border border-violet-500"
                >
                  <Inbox className="w-3.5 h-3.5" />
                  Importar Tudo ao Banco Local
                </button>
              </div>

              {/* Three Column Results Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* COLUMN 1: NOTAS INSTAGRAM */}
                <div className="bg-[#141414] border border-[#212121] rounded-2xl p-5 space-y-4 text-left">
                  <div className="border-b border-[#212121] pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-black text-sm text-white">Notas de Instagram</h4>
                      <p className="text-gray-550 text-[10px] mt-0.5 font-sans">Até 45-50 caracteres, simples e diretos</p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-950/20 text-amber-400 border border-amber-900/30 rounded text-[9px] font-black uppercase">Nota</span>
                  </div>

                  <div className="space-y-3.5">
                    {iaResult.notas.map((notaStr, index) => {
                      const isValidLength = notaStr.length <= 50;
                      const uniqueKey = `nota-${index}`;
                      const isImported = importedStatus[uniqueKey];

                      return (
                        <div 
                          key={uniqueKey} 
                          className="bg-[#191919]/40 hover:bg-[#1E1E24]/30 border border-[#26262B] hover:border-violet-900/20 rounded-xl p-3.5 space-y-3 relative group transition-all"
                        >
                          <p className="text-xs font-medium text-gray-250 leading-relaxed font-sans">
                            "{notaStr}"
                          </p>

                          <div className="flex items-center justify-between text-[10px] font-mono border-t border-[#222] pt-2 text-gray-500">
                            <span className={isValidLength ? 'text-emerald-500' : 'text-amber-500'}>
                              {notaStr.length} chars {isValidLength ? '✅ OK' : '⚠️ Longo'}
                            </span>

                            <div className="flex items-center gap-2">
                              {/* Copy */}
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(notaStr);
                                  setCopiedId(uniqueKey);
                                  setTimeout(() => setCopiedId(null), 1500);
                                }}
                                className="p-1 px-1.5 hover:bg-[#25252D] rounded text-gray-400 hover:text-white transition-all cursor-pointer flex items-center gap-1 border border-transparent hover:border-[#2C2C35] font-sans text-[9px]"
                              >
                                {copiedId === uniqueKey ? <Check className="w-3 h-3 text-emerald-450" /> : <Copy className="w-3 h-3" />}
                                {copiedId === uniqueKey ? 'Pronto' : 'Copiar'}
                              </button>

                              {/* Import */}
                              <button
                                disabled={isImported}
                                onClick={() => handleImportAISuggestion(notaStr, 'nota', uniqueKey)}
                                className={`p-1 px-1.5 rounded transition-all flex items-center gap-1 font-sans text-[9px] cursor-pointer ${
                                  isImported 
                                    ? 'text-gray-650 opacity-40 cursor-default' 
                                    : 'text-violet-400 hover:text-violet-300 hover:bg-[#25252D] border border-transparent hover:border-[#2C2C35]'
                                }`}
                              >
                                {isImported ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                {isImported ? 'Importada' : 'Salvar'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* COLUMN 2: IDEIAS DE STORIES */}
                <div className="bg-[#141414] border border-[#212121] rounded-2xl p-5 space-y-4 text-left">
                  <div className="border-b border-[#212121] pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-black text-sm text-white">Ideias para Stories</h4>
                      <p className="text-gray-550 text-[10px] mt-0.5 font-sans">Estimula enquetes e respostas de direct</p>
                    </div>
                    <span className="px-2 py-0.5 bg-[#1c182d] text-[#a486ff] border border-violet-900/30 rounded text-[9px] font-black uppercase">Story</span>
                  </div>

                  <div className="space-y-3.5">
                    {iaResult.stories.map((storyStr, index) => {
                      const uniqueKey = `story-${index}`;
                      const isImported = importedStatus[uniqueKey];

                      return (
                        <div 
                          key={uniqueKey} 
                          className="bg-[#191919]/40 hover:bg-[#1E1E24]/30 border border-[#26262B] hover:border-violet-900/20 rounded-xl p-3.5 space-y-3 relative group transition-all"
                        >
                          <p className="text-xs font-semibold text-gray-250 leading-normal font-sans">
                            {storyStr}
                          </p>

                          <div className="flex items-center justify-end text-[10px] font-mono border-t border-[#222] pt-2 text-gray-500 gap-2">
                            {/* Copy */}
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(storyStr);
                                setCopiedId(uniqueKey);
                                  setTimeout(() => setCopiedId(null), 1500);
                              }}
                              className="p-1 px-1.5 hover:bg-[#25252D] rounded text-gray-400 hover:text-white transition-all cursor-pointer flex items-center gap-1 border border-transparent hover:border-[#2C2C35] font-sans text-[9px]"
                            >
                              {copiedId === uniqueKey ? <Check className="w-3 h-3 text-emerald-450" /> : <Copy className="w-3 h-3" />}
                              {copiedId === uniqueKey ? 'Pronto' : 'Copiar'}
                            </button>

                            {/* Import */}
                            <button
                              disabled={isImported}
                              onClick={() => handleImportAISuggestion(storyStr, 'story', uniqueKey)}
                              className={`p-1 px-1.5 rounded transition-all flex items-center gap-1 font-sans text-[9px] cursor-pointer ${
                                isImported 
                                  ? 'text-gray-650 opacity-40 cursor-default' 
                                  : 'text-violet-400 hover:text-violet-300 hover:bg-[#25252D] border border-transparent hover:border-[#2C2C35]'
                              }`}
                            >
                              {isImported ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                              {isImported ? 'Importada' : 'Salvar'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* COLUMN 3: REELS HOOKS */}
                <div className="bg-[#141414] border border-[#212121] rounded-2xl p-5 space-y-4 text-left">
                  <div className="border-b border-[#212121] pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-black text-sm text-white">Temas de Reels</h4>
                      <p className="text-gray-550 text-[10px] mt-0.5 font-sans">Ganchos curtos para segurar público</p>
                    </div>
                    <span className="px-2 py-0.5 bg-[#25122b]/40 text-[#f55fff] border border-pink-900/30 rounded text-[9px] font-black uppercase">Reels</span>
                  </div>

                  <div className="space-y-3.5">
                    {iaResult.reels.map((reelsStr, index) => {
                      const uniqueKey = `reels-${index}`;
                      const isImported = importedStatus[uniqueKey];

                      return (
                        <div 
                          key={uniqueKey} 
                          className="bg-[#191919]/40 hover:bg-[#1E1E24]/30 border border-[#26262B] hover:border-violet-900/20 rounded-xl p-3.5 space-y-3 relative group transition-all"
                        >
                          <p className="text-xs font-semibold text-gray-250 leading-normal font-sans">
                            {reelsStr}
                          </p>

                          <div className="flex items-center justify-end text-[10px] font-mono border-t border-[#222] pt-2 text-gray-500 gap-2">
                            {/* Copy */}
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(reelsStr);
                                setCopiedId(uniqueKey);
                                  setTimeout(() => setCopiedId(null), 1500);
                              }}
                              className="p-1 px-1.5 hover:bg-[#25252D] rounded text-[#A0A0B0] hover:text-white transition-all cursor-pointer flex items-center gap-1 border border-transparent hover:border-[#2C2C35] font-sans text-[9px]"
                            >
                              {copiedId === uniqueKey ? <Check className="w-3 h-3 text-emerald-450" /> : <Copy className="w-3 h-3" />}
                              {copiedId === uniqueKey ? 'Pronto' : 'Copiar'}
                            </button>

                            {/* Import */}
                            <button
                              disabled={isImported}
                              onClick={() => handleImportAISuggestion(reelsStr, 'reels', uniqueKey)}
                              className={`p-1 px-1.5 rounded transition-all flex items-center gap-1 font-sans text-[9px] cursor-pointer ${
                                isImported 
                                  ? 'text-gray-650 opacity-40 cursor-default' 
                                  : 'text-violet-400 hover:text-violet-300 hover:bg-[#25252D] border border-transparent hover:border-[#2C2C35]'
                              }`}
                            >
                              {isImported ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                              {isImported ? 'Importada' : 'Salvar'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* TAB 2 & 3: MASTER LISTS ('todos' and 'favoritos') */}
      {(activeTab === 'todos' || activeTab === 'favoritos') && (
        <div className="space-y-4">
          
          {/* Internal filters toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[#141414] border border-[#212121] p-3 rounded-2xl shadow">
            
            {/* Live Search text */}
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar por trechos ou termos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#1C1C1C] text-xs border border-[#2B2B2B] rounded-xl text-white placeholder-gray-505 focus:outline-none focus:ring-1 focus:ring-indigo-505"
              />
            </div>

            {/* Type selector */}
            <div className="sm:col-span-4 flex items-center gap-1.5">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider shrink-0">Tipo:</span>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setFilterCategory('todos');
                }}
                className="w-full bg-[#1C1C1C] border border-[#2B2B2B] rounded-xl text-[11px] text-gray-300 py-2 px-3"
              >
                <option value="todos">Todos os tipos</option>
                <option value="nota">Apenas Notas Diárias</option>
                <option value="story">Apenas Stories</option>
                <option value="reels">Apenas Ganchos Reels</option>
              </select>
            </div>

            {/* Category selector */}
            <div className="sm:col-span-3 flex items-center gap-1.5">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider shrink-0">Categ:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                disabled={filterType !== 'todos' && filterType !== 'nota'}
                className="w-full bg-[#1C1C1C] border border-[#2B2B2B] rounded-xl text-[11px] text-gray-300 py-2 px-3 disabled:opacity-40"
              >
                <option value="todos">Todas as categorias</option>
                <option value="comerciais">Comerciais</option>
                <option value="laser">Laser & Depilação</option>
                <option value="pele">Cuidado & Pele</option>
                <option value="proximidade">Proximidade</option>
                <option value="cta">Sugestões de CTA</option>
              </select>
            </div>

          </div>

          {/* List display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuggestions.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-500 bg-[#141414] border border-[#212121] rounded-2xl shadow">
                📂 Nenhuma sugestão encontrada correspondente aos filtros.
              </div>
            ) : (
              filteredSuggestions.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#141414] border border-[#212121] rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow hover:border-indigo-900/30 transition-all group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-[#212121] pb-1.5">
                      <span className="text-[9px] font-black px-2 py-0.2 bg-[#1C1C1C] border border-[#272727] text-gray-400 rounded-md uppercase">
                        {translateType(item.type)}
                      </span>
                      {item.type === 'nota' && (
                        <span className="text-[9px] text-[#A0A0A0] font-bold">
                          {translateCategory(item.category)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-100 leading-snug">
                      "{item.text}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1D1D1D] text-[10px] text-gray-500">
                    <span className="font-mono text-[9px]">
                      {item.text.length} chars
                    </span>

                    <div className="flex items-center gap-1 opacity-100 group-hover:opacity-100 transition-all">
                      {/* Copy */}
                      <button
                        onClick={() => triggerCopy(item.text, item.id)}
                        className="p-1 px-2 hover:bg-[#1E1E1E] text-gray-300 hover:text-white rounded border border-transparent hover:border-[#303030] transition-all flex items-center gap-1 cursor-pointer"
                        title="Copiar texto"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-gray-450" />
                        )}
                        <span>{copiedId === item.id ? 'Pronto' : 'Copiar'}</span>
                      </button>

                      {/* Favorite star */}
                      <button
                        onClick={() => handleToggleFavorite(item.id)}
                        className={`p-1.5 rounded transition-all cursor-pointer ${
                          item.isFavorite
                            ? 'text-pink-400 hover:text-pink-300'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                        title={item.isFavorite ? 'Desfavoritar' : 'Favoritar'}
                      >
                        <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
                      </button>

                      {/* Custom delete option */}
                      {item.id.startsWith('sug_custom_') && (
                        <button
                          onClick={() => handleDeleteSuggestion(item.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-450 rounded hover:bg-rose-950/10 cursor-pointer"
                          title="Deletar sugestão personalizada"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
