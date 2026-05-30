import React, { useState, useMemo } from 'react';
import { Unit, StandardTask, TaskExecution, Pendencia } from '../types';
import { calculateCompletionRate } from '../utils';
import { 
  Building2, 
  MapPin, 
  User, 
  CheckSquare, 
  AlertTriangle, 
  Power, 
  Plus, 
  Search, 
  Filter, 
  Check, 
  ChevronRight,
  TrendingUp,
  XCircle,
  Clock,
  Instagram,
  ExternalLink,
  Edit,
  Trash2,
  Users,
  Video
} from 'lucide-react';

interface UnidadesViewProps {
  units: Unit[];
  tasks: StandardTask[];
  executions: TaskExecution[];
  pendencias: Pendencia[];
  todayDate: string;
  onNavigateToSection: (section: string, unitId?: string) => void;
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
  onUpdateUnit?: (unit: Unit) => void;
  onDeleteUnit?: (id: string) => void;
}

export default function UnidadesView({
  units,
  tasks,
  executions,
  pendencias,
  todayDate,
  onNavigateToSection,
  onAddUnit,
  onToggleUnitActive,
  onUpdateUnit,
  onDeleteUnit
}: UnidadesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('todas');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'ativas' | 'inativas'>('todas');
  
  // States for adding unit inline (no complex popups)
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitRegion, setNewUnitRegion] = useState('');
  const [newUnitContact, setNewUnitContact] = useState('');
  const [newUnitSigla, setNewUnitSigla] = useState('');
  const [newUnitCidadeUf, setNewUnitCidadeUf] = useState('');
  const [newUnitSocia, setNewUnitSocia] = useState('');
  const [newUnitInstagram, setNewUnitInstagram] = useState('');
  const [newUnitTikTok, setNewUnitTikTok] = useState('');
  const [newUnitNotes, setNewUnitNotes] = useState('');
  const [feedback, setFeedback] = useState('');

  // States for editing a unit
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editSigla, setEditSigla] = useState('');
  const [editCidadeUf, setEditCidadeUf] = useState('');
  const [editGerente, setEditGerente] = useState('');
  const [editSocia, setEditSocia] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editTikTok, setEditTikTok] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editActive, setEditActive] = useState(true);

  // Regions list
  const regions = useMemo(() => {
    return ['todas', ...Array.from(new Set(units.map(u => u.region)))];
  }, [units]);

  // Handle unit addition
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName || !newUnitRegion || !newUnitSigla) {
      setFeedback('Por favor, informe Nome, Sigla, Cidade/UF e Região.');
      return;
    }
    onAddUnit(
      newUnitName,
      newUnitRegion.toUpperCase(),
      newUnitContact,
      newUnitSigla.toUpperCase(),
      newUnitCidadeUf,
      newUnitContact, // Gerente
      newUnitSocia,
      newUnitInstagram,
      newUnitTikTok,
      newUnitNotes
    );
    setNewUnitName('');
    setNewUnitRegion('');
    setNewUnitContact('');
    setNewUnitSigla('');
    setNewUnitCidadeUf('');
    setNewUnitSocia('');
    setNewUnitInstagram('');
    setNewUnitTikTok('');
    setNewUnitNotes('');
    setFeedback('Clínica adicionada com sucesso!');
    setTimeout(() => {
      setFeedback('');
      setShowAddForm(false);
    }, 2000);
  };

  const startEditing = (unit: Unit) => {
    setEditingUnitId(unit.id);
    setEditName(unit.name);
    setEditRegion(unit.region);
    setEditSigla(unit.sigla || '');
    setEditCidadeUf(unit.cidadeUf || '');
    setEditGerente(unit.gerente || '');
    setEditSocia(unit.socia || '');
    setEditInstagram(unit.instagramUrl || '');
    setEditTikTok(unit.tiktokUrl || '');
    setEditNotes(unit.notes || '');
    setEditActive(unit.active);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnitId) return;

    if (onUpdateUnit) {
      onUpdateUnit({
        id: editingUnitId,
        name: editName,
        region: editRegion.toUpperCase(),
        sigla: editSigla.toUpperCase(),
        cidadeUf: editCidadeUf,
        active: editActive,
        gerente: editGerente,
        socia: editSocia,
        instagramUrl: editInstagram,
        tiktokUrl: editTikTok,
        notes: editNotes,
        contactName: `${editGerente} (Gerente)`
      });
    }
    setEditingUnitId(null);
  };

  // Filtered unit list
  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (u.contactName && u.contactName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRegion = regionFilter === 'todas' || u.region === regionFilter;
      const matchesStatus = statusFilter === 'todas' || 
                            (statusFilter === 'ativas' && u.active) || 
                            (statusFilter === 'inativas' && !u.active);
      return matchesSearch && matchesRegion && matchesStatus;
    });
  }, [units, searchTerm, regionFilter, statusFilter]);

  // Aggregate stats
  const unitStats = useMemo(() => {
    const total = units.length;
    const active = units.filter(u => u.active).length;
    const inactive = total - active;
    
    // Average completion rate across active units for today
    const activeUnits = units.filter(u => u.active);
    let totalPct = 0;
    activeUnits.forEach(u => {
      const rate = calculateCompletionRate(u.id, todayDate, tasks, executions);
      totalPct += rate.percentage;
    });
    const avgCompletion = activeUnits.length > 0 ? Math.round(totalPct / activeUnits.length) : 100;

    return { total, active, inactive, avgCompletion };
  }, [units, tasks, executions, todayDate]);

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-[#141414] p-5 rounded-xl border border-[#262626] shadow-md shadow-black/15 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest block font-bold mb-1">Estrutura de Franquias</span>
          <h2 className="text-2xl font-display font-extrabold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-400" /> Gestão de Unidades do Grupo
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Lista geral de unidades monitoradas pela Agência TráfegON. Configure contatos locais e veja taxas médias de conformidade.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" /> Nova Clínica Espaçolaser
        </button>
      </div>

      {/* Add Unit form panel */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-[#141414] border border-[#2D2D2D] p-5 rounded-xl space-y-4 shadow-xl animate-fadeIn">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-[#262626] pb-2">
            <Plus className="w-4 h-4 text-emerald-400" /> Cadastrar Nova Unidade Espaçolaser
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Nome da Unidade *</label>
              <input
                type="text"
                required
                value={newUnitName}
                onChange={e => setNewUnitName(e.target.value)}
                placeholder="Ex: 14 - Petrolina"
                className="w-full bg-[#1A1A1A] text-white border border-[#2D2D2D] rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Sigla * (ex: PET)</label>
              <input
                type="text"
                required
                value={newUnitSigla}
                onChange={e => setNewUnitSigla(e.target.value)}
                placeholder="Ex: PET"
                maxLength={4}
                className="w-full bg-[#1A1A1A] text-white border border-[#2D2D2D] rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Cidade/UF *</label>
              <input
                type="text"
                required
                value={newUnitCidadeUf}
                onChange={e => setNewUnitCidadeUf(e.target.value)}
                placeholder="Ex: Petrolina/PE"
                className="w-full bg-[#1A1A1A] text-white border border-[#2D2D2D] rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">UF p/ Filtros *</label>
              <input
                type="text"
                required
                value={newUnitRegion}
                onChange={e => setNewUnitRegion(e.target.value)}
                placeholder="Ex: PE"
                maxLength={4}
                className="w-full bg-[#1A1A1A] text-white border border-[#2D2D2D] rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Gerente responsável *</label>
              <input
                type="text"
                required
                value={newUnitContact}
                onChange={e => setNewUnitContact(e.target.value)}
                placeholder="Ex: Mariana Albuquerque"
                className="w-full bg-[#1A1A1A] text-white border border-[#2D2D2D] rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Sócia responsável *</label>
              <input
                type="text"
                required
                value={newUnitSocia}
                onChange={e => setNewUnitSocia(e.target.value)}
                placeholder="Ex: Simone Vasconcelos"
                className="w-full bg-[#1A1A1A] text-white border border-[#2D2D2D] rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Link do Instagram</label>
              <input
                type="url"
                value={newUnitInstagram}
                onChange={e => setNewUnitInstagram(e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full bg-[#1A1A1A] text-white border border-[#2D2D2D] rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Link do TikTok</label>
              <input
                type="url"
                value={newUnitTikTok}
                onChange={e => setNewUnitTikTok(e.target.value)}
                placeholder="https://tiktok.com/..."
                className="w-full bg-[#1A1A1A] text-white border border-[#2D2D2D] rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Observações internas</label>
              <input
                type="text"
                value={newUnitNotes}
                onChange={e => setNewUnitNotes(e.target.value)}
                placeholder="Observações ou rituais..."
                className="w-full bg-[#1A1A1A] text-white border border-[#2D2D2D] rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-amber-400 font-medium">{feedback}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all cursor-pointer"
              >
                Confirmar Cadastro
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Aggregate metrics bento style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Clínicas Cadastradas</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{unitStats.total}</span>
            <span className="text-xs text-gray-400">unidades totais</span>
          </div>
        </div>

        <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Unidades Ativas</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{unitStats.active}</span>
            <span className="text-xs text-emerald-500 font-semibold font-mono">● Online</span>
          </div>
        </div>

        <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Unidades Offline</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-500">{unitStats.inactive}</span>
            <span className="text-xs text-gray-450 font-mono">Inativas / Pausadas</span>
          </div>
        </div>

        <div className="bg-[#141414] p-4 rounded-xl border border-[#212121] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Aderência Média Diária</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-400">{unitStats.avgCompletion}%</span>
            <span className="text-xs text-gray-400">geral hoje</span>
          </div>
        </div>
      </div>

      {/* Filters and search block */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-[#141414] p-4 rounded-xl border border-[#212121] shadow-xs">
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar clínicas por nome, gerente ou contato local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#1A1A1A] border border-[#262626] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="md:col-span-3 flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
            className="w-full bg-[#1A1A1A] text-gray-300 border border-[#262626] rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="todas">Todas as Regiões</option>
            {regions.filter(r => r !== 'todas').map(r => (
              <option key={r} value={r}>Região de {r}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3 flex items-center gap-2">
          <Power className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="w-full bg-[#1A1A1A] text-gray-300 border border-[#262626] rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="todas">Todos os Status</option>
            <option value="ativas">Somente Ativas</option>
            <option value="inativas">Somente Inativas</option>
          </select>
        </div>
      </div>

      {/* Grid of Clinic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUnits.length === 0 ? (
          <div className="col-span-full bg-[#141414] border border-[#212121] rounded-xl p-12 text-center text-gray-400">
            Nenhuma clínica atende a estes critérios de pesquisa.
          </div>
        ) : (
          filteredUnits.map(unit => {
            const completion = calculateCompletionRate(unit.id, todayDate, tasks, executions);
            const unitPendenciasActive = pendencias.filter(p => p.unitId === unit.id && p.status === 'aberta');
            
            // Render Inline Editing Form inside the card itself
            if (editingUnitId === unit.id) {
              return (
                <form 
                  key={unit.id}
                  onSubmit={handleEditSave}
                  className="bg-[#141414] border-2 border-indigo-600 rounded-xl overflow-hidden shadow-2xl p-4 flex flex-col justify-between space-y-3.5 animate-fadeIn"
                >
                  <div className="border-b border-[#212121] pb-2 flex justify-between items-center">
                    <span className="text-[10px] uppercase font-mono font-bold text-indigo-400">Editar Unidade</span>
                    <span className="text-[10px] dark:text-gray-500 font-mono">ID: {unit.id}</span>
                  </div>
                  
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[10px] text-gray-400 font-semibold mb-0.5">Nome da Unidade *</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full bg-[#1A1A1A] text-white border border-[#2D2D2D] rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="block text-[10px] text-gray-400 font-semibold mb-0.5">Sigla *</label>
                        <input
                          type="text"
                          required
                          value={editSigla}
                          onChange={e => setEditSigla(e.target.value.toUpperCase())}
                          maxLength={4}
                          className="w-full bg-[#1A1A1A] text-white border border-[#2D2D2D] rounded p-2 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] text-gray-400 font-semibold mb-0.5">Cidade/UF *</label>
                        <input
                          type="text"
                          required
                          value={editCidadeUf}
                          onChange={e => setEditCidadeUf(e.target.value)}
                          className="w-full bg-[#1A1A1A] text-white border border-[#2D2D2D] rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 font-semibold mb-0.5">UF Filtro *</label>
                        <input
                          type="text"
                          required
                          value={editRegion}
                          onChange={e => setEditRegion(e.target.value.toUpperCase())}
                          maxLength={4}
                          className="w-full bg-[#1A1A1A] text-white border border-[#2D2D2D] rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-semibold mb-0.5">Status *</label>
                        <select
                          value={editActive ? "true" : "false"}
                          onChange={e => setEditActive(e.target.value === "true")}
                          className="w-full bg-[#1A1A1A] text-white border border-[#2D2D2D] rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="true">Ativa</option>
                          <option value="false">Inativa</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 font-semibold mb-0.5">Gerente *</label>
                      <input
                        type="text"
                        required
                        value={editGerente}
                        onChange={e => setEditGerente(e.target.value)}
                        className="w-full bg-[#1A1A1A] text-white border border-[#2D2D2D] rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 font-semibold mb-0.5">Sócia *</label>
                      <input
                        type="text"
                        required
                        value={editSocia}
                        onChange={e => setEditSocia(e.target.value)}
                        className="w-full bg-[#1A1A1A] text-white border border-[#2D2D2D] rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 font-semibold mb-0.5">Link Instagram</label>
                      <input
                        type="url"
                        value={editInstagram}
                        onChange={e => setEditInstagram(e.target.value)}
                        className="w-full bg-[#1A1A1A] text-indigo-300 border border-[#2D2D2D] rounded p-1.5 focus:outline-none font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 font-semibold mb-0.5">Link TikTok</label>
                      <input
                        type="url"
                        value={editTikTok}
                        onChange={e => setEditTikTok(e.target.value)}
                        className="w-full bg-[#1A1A1A] text-rose-300 border border-[#2D2D2D] rounded p-1.5 focus:outline-none font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 font-semibold mb-0.5">Obs internas</label>
                      <textarea
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        rows={2}
                        className="w-full bg-[#1A1A1A] text-white border border-[#2D2D2D] rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-[#212121]">
                    <button
                      type="button"
                      onClick={() => setEditingUnitId(null)}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-white cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs cursor-pointer"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              );
            }

            // Normal Card View with All 9 Fields
            return (
              <div 
                key={unit.id}
                className={`bg-[#141414] border rounded-xl overflow-hidden shadow-md flex flex-col justify-between transition-all ${
                  unit.active ? 'border-[#262626] hover:border-indigo-500/45' : 'border-[#262626] opacity-60'
                }`}
              >
                {/* Header structure */}
                <div className="p-4 bg-[#181818] border-b border-[#212121] flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-indigo-950/45 text-indigo-400 border border-indigo-900/40 rounded text-[9.5px] font-mono uppercase font-black">
                        [{unit.sigla || 'N/A'}]
                      </span>
                      <span className="px-1.5 py-0.5 bg-[#262626] text-gray-300 rounded text-[9.5px] font-mono font-bold">
                        {unit.region}
                      </span>
                      <span className={`w-2 h-2 rounded-full inline-block ${unit.active ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                    </div>
                    <h4 className="font-display font-extrabold text-sm text-white leading-tight">
                      {unit.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Inline edit trigger button */}
                    <button
                      onClick={() => startEditing(unit)}
                      title="Editar Unidade"
                      className="p-1.5 rounded-lg bg-[#212121] hover:bg-[#2D2D2D] text-gray-300 border border-[#2C2C2C] hover:text-white transition-all cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Inline Delete Button if allowed */}
                    {onDeleteUnit && (
                      <button
                        onClick={() => {
                          if (confirm(`Tem certeza absoluta que deseja remover a unidade "${unit.name}" e todos os seus históricos associados?`)) {
                            onDeleteUnit(unit.id);
                          }
                        }}
                        title="Remover Unidade"
                        className="p-1.5 rounded-lg bg-rose-950/15 border border-rose-900/20 text-rose-400 hover:bg-rose-900/30 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => onToggleUnitActive(unit.id)}
                      title={unit.active ? 'Desativar / Pausar Unidade' : 'Ativar Unidade'}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        unit.active 
                          ? 'bg-rose-950/20 text-rose-455 border-rose-900/30 hover:bg-rose-900/30' 
                          : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30 hover:bg-emerald-900/30'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info and counts */}
                <div className="p-4 space-y-4">
                  {/* Detailed Fields */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-gray-350">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <div>
                        <span className="text-gray-500 text-[10px] font-bold block uppercase leading-none mb-0.5">Cidade / UF</span>
                        <span className="font-semibold">{unit.cidadeUf || 'Araripina/PE'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="flex items-start gap-1.5 text-gray-350">
                        <User className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-gray-500 text-[9px] font-bold block uppercase leading-none mb-0.5">Gerente</span>
                          <span className="font-medium truncate max-w-[110px] block">{unit.gerente || 'Não informada'}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5 text-gray-350">
                        <Users className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-gray-500 text-[9px] font-bold block uppercase leading-none mb-0.5">Sócia</span>
                          <span className="font-medium truncate max-w-[110px] block">{unit.socia || 'Grupo ONE'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Social Media Links */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#1F1F1F]">
                      <a 
                        href={unit.instagramUrl || 'https://instagram.com/espacolaser'} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer bg-indigo-950/20 px-2 py-1 rounded border border-indigo-900/30"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                        Instagram <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                      <a 
                        href={unit.tiktokUrl || 'https://tiktok.com'} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[10px] font-bold text-rose-450 hover:text-rose-350 flex items-center gap-1 cursor-pointer bg-rose-950/20 px-2 py-1 rounded border border-rose-900/30"
                      >
                        <Video className="w-3.5 h-3.5 text-rose-400" />
                        TikTok <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </div>
                  </div>

                  {/* Operational adherence score bar */}
                  <div className="space-y-1 pt-1 border-t border-[#1F1F1F]">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-semibold uppercase text-[10px]">Conclusão Hoje</span>
                      <strong className="text-white font-mono">{completion.percentage}%</strong>
                    </div>
                    <div className="w-full h-1.5 bg-[#1F1F1F] rounded-full overflow-hidden border border-[#2D2D2D]">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          completion.percentage >= 80 ? 'bg-emerald-500' : completion.percentage >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${completion.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-gray-500">
                      <span>{completion.completed} executadas</span>
                      <span>{completion.total} rotinas diárias</span>
                    </div>
                  </div>

                  {/* Internal notes banner */}
                  {unit.notes && (
                    <div className="text-[10.5px] text-gray-400 bg-[#191919] p-2 rounded border border-[#212121] leading-relaxed">
                      <span className="text-gray-500 block text-[8.5px] uppercase tracking-wider font-extrabold mb-0.5">Observações Internas</span>
                      {unit.notes}
                    </div>
                  )}

                  {/* Active issues or blockages */}
                  {unitPendenciasActive.length > 0 ? (
                    <div className="bg-rose-950/10 border border-rose-900/20 p-2.5 rounded-lg flex items-start gap-2 text-xs text-rose-300">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold">{unitPendenciasActive.length} Gargalo(s) Operacional(is)</strong>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[200px]">
                          {unitPendenciasActive[0].description}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-950/10 border border-emerald-900/10 p-2.5 rounded-lg flex items-center gap-2 text-xs text-emerald-450">
                      <Check className="w-4 h-4 text-emerald-450 shrink-0" />
                      <span>Clínica operando 100% sem gargalos</span>
                    </div>
                  )}
                </div>

                {/* Footer action buttons */}
                <div className="bg-[#181818] px-4 py-3 border-t border-[#212121] grid grid-cols-2 gap-2 select-none">
                  <button
                    onClick={() => onNavigateToSection('checklist_diario', unit.id)}
                    className="py-1.5 bg-[#1C1C1C] hover:bg-[#252525] border border-[#2C2C2C] text-[11px] font-bold text-gray-300 hover:text-white rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                    Rotina Diária
                  </button>

                  <button
                    onClick={() => onNavigateToSection('pendencias', unit.id)}
                    className="py-1.5 bg-[#1C1C1C] hover:bg-[#252525] border border-[#2C2C2C] text-[11px] font-bold text-gray-300 hover:text-white rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Ver Pendências
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
