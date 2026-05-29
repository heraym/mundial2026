import { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  AlertCircle, 
  Search, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Award,
  Info,
  Clock,
  Check,
  TrendingUp,
  MapPin,
  PlayCircle
} from 'lucide-react';

interface Match {
  id: string;
  partido: string;
  fase: string;
  dia: string;
  equipo1: string;
  equipo2: string;
  golesLocal: number | null;
  golesVisitante: number | null;
  grupo: string;
  jugado: boolean;
  lugar: string;
  resultado: string | null;
}

interface User {
  usuario: string;
  nombre: string;
  apellido: string;
  puntos: number;
}

interface Bet {
  partido: string;
  usuario: string;
  golesLocal: number;
  golesVisitante: number;
  resultado: string;
  cargado?: boolean;
}

interface PendingBet {
  usuario: string;
  partido: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'partidos' | 'pendientes' | 'usuarios'>('partidos');
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pending, setPending] = useState<PendingBet[]>([]);
  
  // Loading & Action States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingMatch, setSubmittingMatch] = useState<Record<string, boolean>>({});
  const [successMatch, setSubmittingSuccess] = useState<Record<string, boolean>>({});
  const [recalculating, setRecalculating] = useState<boolean>(false);
  
  // Forms states
  const [matchForms, setMatchForms] = useState<Record<string, { golesLocal: string; golesVisitante: string }>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [playedFilter, setPlayedFilter] = useState<'all' | 'unplayed' | 'played'>('all');
  
  // Selected user sheets
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [userBets, setUserBets] = useState<Bet[]>([]);
  const [loadingUserBets, setLoadingUserBets] = useState<boolean>(false);

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [matchesRes, usersRes, pendingRes] = await Promise.all([
        fetch('/partidos'),
        fetch('/usuarios'),
        fetch('/pendientes')
      ]);

      if (!matchesRes.ok) throw new Error('Error al cargar partidos.');
      if (!usersRes.ok) throw new Error('Error al cargar usuarios.');
      if (!pendingRes.ok) throw new Error('Error al cargar apuestas pendientes.');

      const matchesData = await matchesRes.json();
      const usersData = await usersRes.json();
      const pendingData = await pendingRes.json();

      setMatches(matchesData);
      setUsers(usersData);
      setPending(pendingData);

      // Auto select first user if exists and none is selected
      if (usersData.length > 0 && !selectedUser) {
        setSelectedUser(usersData[0].usuario);
      }

      // Initialize match input forms
      const forms: Record<string, { golesLocal: string; golesVisitante: string }> = {};
      matchesData.forEach((m: Match) => {
        forms[m.partido] = {
          golesLocal: (m.golesLocal !== null && m.golesLocal !== undefined) ? String(m.golesLocal) : '',
          golesVisitante: (m.golesVisitante !== null && m.golesVisitante !== undefined) ? String(m.golesVisitante) : ''
        };
      });
      setMatchForms(forms);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al conectar con los servidores de datos del Mundial.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch user specific bets when user selection changes
  useEffect(() => {
    if (!selectedUser) return;
    
    const fetchUserBets = async () => {
      setLoadingUserBets(true);
      try {
        const res = await fetch(`/apuestas?usuario=${encodeURIComponent(selectedUser)}`);
        if (res.ok) {
          const data = await res.json();
          setUserBets(data);
        } else {
          setUserBets([]);
        }
      } catch (err) {
        console.error('Error fetching user bets:', err);
        setUserBets([]);
      } finally {
        setLoadingUserBets(false);
      }
    };

    fetchUserBets();
  }, [selectedUser]);

  // Handle Match Score input change
  const handleScoreChange = (matchNum: string, field: 'golesLocal' | 'golesVisitante', value: string) => {
    setMatchForms(prev => ({
      ...prev,
      [matchNum]: {
        ...prev[matchNum],
        [field]: value
      }
    }));
  };

  // Submit Match Result Update
  const handleSaveMatchResult = async (match: Match) => {
    const form = matchForms[match.partido];
    if (!form || form.golesLocal === '' || form.golesVisitante === '') {
      alert('Por favor ingresa goles para ambos equipos.');
      return;
    }

    const gL = parseInt(form.golesLocal);
    const gV = parseInt(form.golesVisitante);

    if (isNaN(gL) || isNaN(gV) || gL < 0 || gV < 0) {
      alert('Los goles deben ser números válidos mayores o iguales a 0.');
      return;
    }

    setSubmittingMatch(prev => ({ ...prev, [match.partido]: true }));

    try {
      // Structure the payload exactly as partidosService POST /partidos expects
      let resultado = 'Empate';
      if (gL > gV) resultado = 'Local';
      else if (gV > gL) resultado = 'Visitante';

      let ganador = 'Empate';
      if (gL > gV) ganador = match.equipo1;
      else if (gV > gL) ganador = match.equipo2;

      const payload = {
        Data: {
          Partido: match.partido, // e.g. "1"
          "Goles Local": gL,
          "Goles Visitante": gV,
          Resultado: resultado,
          Ganador: ganador,
          Estado: "Finalizado"
        }
      };

      const response = await fetch('/partidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Error de servidor al guardar el resultado.');

      setSubmittingSuccess(prev => ({ ...prev, [match.partido]: true }));

      // Recalculate leaderboard points automatically
      await handleRecalculatePoints();

      // Refresh data
      await fetchData();

      setTimeout(() => {
        setSubmittingSuccess(prev => ({ ...prev, [match.partido]: false }));
      }, 3000);

    } catch (err: any) {
      console.error(err);
      alert('Error al actualizar el partido: ' + err.message);
    } finally {
      setSubmittingMatch(prev => ({ ...prev, [match.partido]: false }));
    }
  };

  // Recalculate whole leaderboard point tables
  const handleRecalculatePoints = async () => {
    setRecalculating(true);
    try {
      const res = await fetch('/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error recalculating points:', err);
    } finally {
      setRecalculating(false);
    }
  };

  // Helper points calculator to show breakdown to user
  const getMatchOutcomeLabel = (gLocal: number, gVisit: number): 'L' | 'E' | 'V' => {
    if (gLocal > gVisit) return 'L';
    if (gLocal < gVisit) return 'V';
    return 'E';
  };

  const getPointsBreakdown = (bet: Bet, match: Match) => {
    if (match.golesLocal === null || match.golesVisitante === null) {
      return { total: 0, outcomeCorrect: false, scoreCorrect: false, extraCorrect: false, outcomePoints: 0, scorePoints: 0, extraPoints: 0 };
    }
    
    const betOutcome = getMatchOutcomeLabel(bet.golesLocal, bet.golesVisitante);
    const realOutcome = getMatchOutcomeLabel(match.golesLocal, match.golesVisitante);
    
    const outcomeCorrect = betOutcome === realOutcome;
    const scoreCorrect = Number(bet.golesLocal) === Number(match.golesLocal) && Number(bet.golesVisitante) === Number(match.golesVisitante);
    
    let outcomePoints = 0;
    let scorePoints = 0;
    let extraPoints = 0;

    const fase = match.fase || "Grupos";
    if (fase === "Grupos") {
      if (outcomeCorrect) outcomePoints = 1;
      if (scoreCorrect) {
        scorePoints = 2;
        if (Number(match.golesLocal) + Number(match.golesVisitante) > 3) {
          extraPoints = 1;
        }
      }
    } else if (fase.includes("Octavos")) {
      if (outcomeCorrect) outcomePoints = 2;
      if (scoreCorrect) {
        scorePoints = 4;
        if (Number(match.golesLocal) + Number(match.golesVisitante) > 3) {
          extraPoints = 1;
        }
      }
    } else if (fase.includes("Cuartos")) {
      if (outcomeCorrect) outcomePoints = 3;
      if (scoreCorrect) {
        scorePoints = 6;
        if (Number(match.golesLocal) + Number(match.golesVisitante) > 3) {
          extraPoints = 1;
        }
      }
    } else { // Finales / Semis
      if (outcomeCorrect) outcomePoints = 4;
      if (scoreCorrect) {
        scorePoints = 8;
        if (Number(match.golesLocal) + Number(match.golesVisitante) > 3) {
          extraPoints = 1;
        }
      }
    }

    return {
      total: outcomePoints + scorePoints + extraPoints,
      outcomeCorrect,
      scoreCorrect,
      extraCorrect: extraPoints > 0,
      outcomePoints,
      scorePoints,
      extraPoints
    };
  };

  // Filters calculation
  const filteredMatches = matches.filter(m => {
    const matchesSearch = 
      m.equipo1.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.equipo2.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.fase || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.lugar || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || m.fase === stageFilter;
    
    let matchesPlayed = true;
    if (playedFilter === 'unplayed') matchesPlayed = !m.jugado;
    if (playedFilter === 'played') matchesPlayed = m.jugado;

    return matchesSearch && matchesStage && matchesPlayed;
  });

  // Unique list of phases for filtering
  const phases = Array.from(new Set(matches.map(m => m.fase).filter(Boolean)));

  // Helper to format ISO dates beautifully
  const formatMatchDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString; // Fallback to raw string if standard parsing fails
      return d.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header Panel */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                MUNDIAL 2026
              </h1>
              <p className="text-xs font-semibold text-blue-500 tracking-wider uppercase">
                Panel de Administración
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={fetchData} 
              disabled={loading}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
              title="Actualizar datos"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={handleRecalculatePoints}
              disabled={recalculating}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 flex items-center gap-2 transition disabled:opacity-50"
            >
              {recalculating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
              Recalcular Tabla
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 mb-8 overflow-x-auto gap-2">
          <button 
            onClick={() => setActiveTab('partidos')}
            className={`nav-tab flex items-center gap-2 whitespace-nowrap ${activeTab === 'partidos' ? 'active' : ''}`}
          >
            <Calendar className="h-4.5 w-4.5" />
            Gestionar Partidos
          </button>
          <button 
            onClick={() => setActiveTab('pendientes')}
            className={`nav-tab flex items-center gap-2 whitespace-nowrap ${activeTab === 'pendientes' ? 'active' : ''}`}
          >
            <AlertCircle className="h-4.5 w-4.5" />
            Apuestas Pendientes
            {pending.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-2xs font-black bg-rose-500 text-white rounded-full">
                {pending.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('usuarios')}
            className={`nav-tab flex items-center gap-2 whitespace-nowrap ${activeTab === 'usuarios' ? 'active' : ''}`}
          >
            <Users className="h-4.5 w-4.5" />
            Auditoría de Usuarios
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3 mb-6 animate-fade-in">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-rose-200">Ha ocurrido un problema</h4>
              <p className="text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* LOADING SHIMMER STATE */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-12 w-full rounded-xl bg-white/5 shimmer"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 rounded-xl bg-white/5 shimmer border border-white/5"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            
            {/* VIEW A: PARTIDOS CONTROL */}
            {activeTab === 'partidos' && (
              <div>
                {/* Search & Filter Bar */}
                <div className="glass-container p-4 flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar equipo, estadio, fase..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-4 w-full md:w-auto justify-end">
                    <select 
                      value={playedFilter}
                      onChange={e => setPlayedFilter(e.target.value as any)}
                      className="admin-select py-1.5 min-w-[150px]"
                    >
                      <option value="unplayed">Por Jugar</option>
                      <option value="played">Finalizados</option>
                      <option value="all">Todos los Partidos</option>
                    </select>

                    <select 
                      value={stageFilter}
                      onChange={e => setStageFilter(e.target.value)}
                      className="admin-select py-1.5 min-w-[150px]"
                    >
                      <option value="all">Todas las fases</option>
                      {phases.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredMatches.length === 0 ? (
                  <div className="glass-container p-12 text-center text-slate-400">
                    <Calendar className="h-12 w-12 mx-auto text-slate-600 mb-3" />
                    <p className="font-semibold text-lg text-slate-300">No se encontraron partidos</p>
                    <p className="text-sm mt-1">Prueba cambiando los filtros o ajustando tu búsqueda.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMatches.map(match => {
                      const isUnplayed = !match.jugado;
                      const isSaving = submittingMatch[match.partido] || false;
                      const isSaved = successMatch[match.partido] || false;
                      const form = matchForms[match.partido] || { golesLocal: '', golesVisitante: '' };

                      return (
                        <div key={match.id || match.partido} className="glass-container p-5 card-match flex flex-col justify-between">
                          {/* Card Header Info */}
                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <span className={`badge-status ${isUnplayed ? 'badge-unplayed' : 'badge-played'}`}>
                                {isUnplayed ? (
                                  <>
                                    <Clock className="h-3 w-3" />
                                    Por Jugar
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-3 w-3" />
                                    Finalizado
                                  </>
                                )}
                              </span>
                              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/5">
                                {match.fase || `Partido ${match.partido}`}
                              </span>
                            </div>

                            {/* Teams & Scores Banner */}
                            <div className="py-4 flex items-center justify-between gap-2 border-b border-white/5">
                              <div className="w-[42%] text-right">
                                <h4 className="font-extrabold text-sm sm:text-base tracking-tight leading-tight text-white">
                                  {match.equipo1}
                                </h4>
                              </div>

                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5">
                                <span className={`text-lg font-black ${isUnplayed ? 'text-slate-600' : 'text-amber-500'}`}>
                                  {isUnplayed ? '-' : match.golesLocal}
                                </span>
                                <span className="text-3xs font-extrabold text-slate-500">VS</span>
                                <span className={`text-lg font-black ${isUnplayed ? 'text-slate-600' : 'text-amber-500'}`}>
                                  {isUnplayed ? '-' : match.golesVisitante}
                                </span>
                              </div>

                              <div className="w-[42%] text-left">
                                <h4 className="font-extrabold text-sm sm:text-base tracking-tight leading-tight text-white">
                                  {match.equipo2}
                                </h4>
                              </div>
                            </div>

                            {/* Venue & Time details */}
                            <div className="mt-3 space-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                <span className="truncate">{match.lugar || 'Sede por confirmar'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Clock className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                <span>{formatMatchDate(match.dia)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Interactive Section (Form / Result display) */}
                          <div className="mt-5 pt-4 border-t border-white/5">
                            {isUnplayed ? (
                              <div className="flex items-end justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="text-4xs font-bold text-slate-500 uppercase tracking-wider">L</span>
                                    <input 
                                      type="number"
                                      min="0"
                                      placeholder="-"
                                      value={form.golesLocal}
                                      onChange={e => handleScoreChange(match.partido, 'golesLocal', e.target.value)}
                                      className="admin-input"
                                      disabled={isSaving}
                                    />
                                  </div>
                                  <span className="text-slate-600 font-bold self-end mb-2">:</span>
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="text-4xs font-bold text-slate-500 uppercase tracking-wider">V</span>
                                    <input 
                                      type="number"
                                      min="0"
                                      placeholder="-"
                                      value={form.golesVisitante}
                                      onChange={e => handleScoreChange(match.partido, 'golesVisitante', e.target.value)}
                                      className="admin-input"
                                      disabled={isSaving}
                                    />
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleSaveMatchResult(match)}
                                  disabled={isSaving || form.golesLocal === '' || form.golesVisitante === ''}
                                  className={`btn-primary flex-1 py-1.5 px-3 text-xs tracking-wide uppercase ${isSaved ? 'btn-success' : ''}`}
                                >
                                  {isSaving ? (
                                    <>
                                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                      Guardando...
                                    </>
                                  ) : isSaved ? (
                                    <>
                                      <CheckCircle className="h-3.5 w-3.5" />
                                      ¡Actualizado!
                                    </>
                                  ) : (
                                    <>
                                      <PlayCircle className="h-3.5 w-3.5" />
                                      Finalizar
                                    </>
                                  )}
                                </button>
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle className="h-4 w-4" />
                                  Marcador Oficial Registrado
                                </span>
                                <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-2xs text-emerald-300">
                                  {match.resultado === 'L' ? 'Gana Local' : match.resultado === 'V' ? 'Gana Vis.' : 'Empate'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VIEW B: PENDING BETS */}
            {activeTab === 'pendientes' && (
              <div>
                {/* Pending Overview Card */}
                <div className="glass-container p-6 flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${pending.length > 0 ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'}`}>
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-white">Resumen de Apuestas de Hoy</h3>
                      <p className="text-sm text-slate-400 mt-0.5">
                        {pending.length > 0 
                          ? `Se han detectado ${pending.length} apuestas que aún faltan registrarse para los partidos que se jugarán hoy o mañana.`
                          : '¡Excelente! Todos los usuarios han registrado sus pronósticos para los partidos correspondientes a hoy y mañana.'}
                      </p>
                    </div>
                  </div>
                </div>

                {pending.length > 0 ? (
                  <div className="glass-container overflow-hidden">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Usuario</th>
                          <th>Nombre Completo</th>
                          <th>Partido</th>
                          <th>Fecha y Hora</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pending.map((p, idx) => {
                          // Find user details
                          const user = users.find(u => u.usuario === p.usuario);
                          const userFullName = user ? `${user.nombre} ${user.apellido}` : 'Usuario Invitado';

                          // Find match details
                          const match = matches.find(m => m.partido === p.partido);
                          const matchDetails = match 
                            ? `${match.equipo1} vs ${match.equipo2}` 
                            : `Partido N° ${p.partido}`;
                          
                          const matchDate = match ? formatMatchDate(match.dia) : '-';

                          return (
                            <tr key={`${p.usuario}-${p.partido}-${idx}`}>
                              <td className="text-blue-400 font-bold tracking-tight">{p.usuario}</td>
                              <td>{userFullName}</td>
                              <td>
                                <div className="font-bold text-white">{matchDetails}</div>
                                {match && (
                                  <div className="text-3xs text-slate-500 uppercase tracking-wider mt-0.5">
                                    {match.fase} — {match.lugar}
                                  </div>
                                )}
                              </td>
                              <td className="text-xs font-semibold text-slate-400">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                                  {matchDate}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="glass-container p-16 text-center text-slate-400">
                    <CheckCircle className="h-16 w-16 mx-auto text-emerald-500/30 mb-4" />
                    <p className="font-black text-xl text-slate-200">¡Al día!</p>
                    <p className="text-sm mt-1 max-w-md mx-auto text-slate-400">
                      No hay alertas de omisión. Todos los participantes han ingresado sus apuestas a tiempo para las fechas vigentes.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* VIEW C: USER AUDIT */}
            {activeTab === 'usuarios' && (
              <div>
                {/* User Selector Header */}
                <div className="glass-container p-5 flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <h3 className="font-extrabold text-base sm:text-lg text-white">Selecciona un Participante para Auditoría</h3>
                  </div>

                  <select 
                    value={selectedUser}
                    onChange={e => setSelectedUser(e.target.value)}
                    className="admin-select w-full sm:w-80"
                  >
                    {users.map(u => (
                      <option key={u.usuario} value={u.usuario}>
                        {u.nombre} {u.apellido} ({u.usuario})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedUser ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* User Stats Card */}
                    <div className="lg:col-span-1 glass-container p-6 flex flex-col justify-between">
                      {/* User Info Header */}
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-extrabold text-white text-lg">
                            {selectedUser.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h2 className="font-extrabold text-lg text-white leading-tight">
                              {users.find(u => u.usuario === selectedUser)?.nombre} {users.find(u => u.usuario === selectedUser)?.apellido}
                            </h2>
                            <p className="text-xs text-blue-400 font-bold mt-0.5">{selectedUser}</p>
                          </div>
                        </div>

                        {/* Point Stats */}
                        <div className="space-y-4 mb-8">
                          <div className="p-4 rounded-xl bg-white/3 border border-white/5 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Puntos Acumulados</span>
                            <span className="text-2xl font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/10">
                              {users.find(u => u.usuario === selectedUser)?.puntos || 0}
                            </span>
                          </div>

                          <div className="p-4 rounded-xl bg-white/3 border border-white/5 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pronósticos Cargados</span>
                            <span className="text-lg font-black text-white">
                              {userBets.length}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-slate-400 space-y-2">
                        <h5 className="font-bold text-blue-400 flex items-center gap-1">
                          <Info className="h-3.5 w-3.5" />
                          Regla de Desglose de Puntos
                        </h5>
                        <p className="leading-relaxed">
                          Los puntos se calculan dinámicamente según la fase. Por ejemplo, en <strong>Grupos</strong>:
                        </p>
                        <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                          <li>Acertar resultado: <strong>+1 pto</strong></li>
                          <li>Marcador exacto: <strong>+2 ptos</strong></li>
                          <li>Extra de exacto con &gt;3 goles: <strong>+1 pto</strong></li>
                        </ul>
                      </div>
                    </div>

                    {/* User Bets Sheet Details */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="glass-container p-6">
                        <h3 className="font-black text-lg text-white mb-4 flex items-center gap-2">
                          <Award className="h-5 w-5 text-indigo-500" />
                          Cálculos de Puntos por Partido Jugado
                        </h3>

                        {loadingUserBets ? (
                          <div className="py-12 text-center">
                            <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-3" />
                            <p className="text-sm text-slate-400">Cargando apuestas del participante...</p>
                          </div>
                        ) : (
                          <div>
                            {/* Played Matches with Bets */}
                            {(() => {
                              // Filter bets that correspond to played matches
                              const playedBets = userBets.filter(bet => {
                                const match = matches.find(m => m.partido === bet.partido);
                                return match && match.jugado;
                              });

                              if (playedBets.length === 0) {
                                return (
                                  <div className="py-8 text-center text-slate-500 border border-dashed border-white/10 rounded-xl p-6">
                                    <Info className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                                    <p className="font-bold">No se encontraron apuestas para partidos ya jugados</p>
                                    <p className="text-xs mt-1">Este usuario no apostó en los partidos finalizados hasta el momento.</p>
                                  </div>
                                );
                              }

                              return (
                                <div className="space-y-4">
                                  {playedBets.map(bet => {
                                    const match = matches.find(m => m.partido === bet.partido)!;
                                    const calc = getPointsBreakdown(bet, match);

                                    return (
                                      <div key={bet.partido} className="p-4 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-white/5 mb-3">
                                          <div>
                                            <div className="font-extrabold text-sm sm:text-base text-white">
                                              {match.equipo1} vs {match.equipo2}
                                            </div>
                                            <div className="text-3xs text-slate-400 uppercase tracking-wider font-bold mt-0.5">
                                              {match.fase} • Partido {match.partido}
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            <span className="text-2xs font-bold text-slate-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                                              Resultado: {match.golesLocal} - {match.golesVisitante}
                                            </span>
                                            <span className="text-xs font-black text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/10 flex items-center gap-1">
                                              {calc.total} PTS
                                            </span>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          {/* Forecast Review */}
                                          <div className="space-y-1">
                                            <div className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Pronóstico del Usuario</div>
                                            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                              <span className="bg-white/5 px-2 py-0.5 rounded text-white">
                                                {bet.golesLocal} - {bet.golesVisitante}
                                              </span>
                                              <span className="text-slate-400 font-medium">
                                                ({bet.resultado === 'L' ? 'Local' : bet.resultado === 'V' ? 'Visitante' : 'Empate'})
                                              </span>
                                            </div>
                                          </div>

                                          {/* Points Breakdown steps */}
                                          <div className="space-y-2.5">
                                            <div className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Desglose de Puntos</div>
                                            
                                            <div className="space-y-1.5">
                                              {/* Row 1: Outcome */}
                                              <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400 flex items-center gap-1.5">
                                                  {calc.outcomeCorrect ? (
                                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                  ) : (
                                                    <XCircle className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                                                  )}
                                                  Acierto de Resultado Simple
                                                </span>
                                                <span className={`font-extrabold ${calc.outcomeCorrect ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                  +{calc.outcomePoints} pt
                                                </span>
                                              </div>

                                              {/* Row 2: Exact score */}
                                              <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400 flex items-center gap-1.5">
                                                  {calc.scoreCorrect ? (
                                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                  ) : (
                                                    <XCircle className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                                                  )}
                                                  Marcador Exacto
                                                </span>
                                                <span className={`font-extrabold ${calc.scoreCorrect ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                  +{calc.scorePoints} pt
                                                </span>
                                              </div>

                                              {/* Row 3: Extra points */}
                                              {calc.extraCorrect && (
                                                <div className="flex items-center justify-between text-xs">
                                                  <span className="text-slate-400 flex items-center gap-1.5">
                                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                    Bono Extra Goles (&gt;3 goles)
                                                  </span>
                                                  <span className="font-extrabold text-emerald-400">
                                                    +{calc.extraPoints} pt
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Unplayed matches checklist preview */}
                      <div className="glass-container p-6">
                        <h3 className="font-black text-base text-white mb-4 flex items-center gap-2">
                          <Clock className="h-4.5 w-4.5 text-slate-400" />
                          Otros Pronósticos Registrados (Próximos Partidos)
                        </h3>

                        {!loadingUserBets && (
                          <div className="space-y-3">
                            {(() => {
                              const upcomingBets = userBets.filter(bet => {
                                const match = matches.find(m => m.partido === bet.partido);
                                return match && !match.jugado;
                              });

                              if (upcomingBets.length === 0) {
                                return (
                                  <p className="text-xs text-slate-500 font-medium italic">
                                    No hay apuestas registradas para partidos próximos.
                                  </p>
                                );
                              }

                              return upcomingBets.map(bet => {
                                const match = matches.find(m => m.partido === bet.partido)!;
                                return (
                                  <div key={bet.partido} className="flex justify-between items-center p-2.5 rounded bg-white/2 border border-white/5 text-xs">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                      <span className="font-bold text-slate-300">
                                        {match.equipo1} vs {match.equipo2}
                                      </span>
                                    </div>
                                    <div className="font-black text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                                      {bet.golesLocal} - {bet.golesVisitante}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="glass-container p-12 text-center text-slate-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                    <p className="font-semibold text-lg text-slate-300">Selecciona un usuario</p>
                    <p className="text-sm mt-1">Utiliza el selector superior para cargar los pronósticos y auditoría del usuario.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
