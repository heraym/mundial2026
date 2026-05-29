import { useEffect, useState } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Button, 
  TextField, CircularProgress, Alert, Badge, ToggleButton, 
  ToggleButtonGroup, FormControl, InputLabel, Select, MenuItem,
  FormHelperText, Chip 
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface User {
  nombre: string;
  apellido: string;
  usuario: string;
  email: string;
  puntos: number;
}

interface Match {
  equipo1: string;
  equipo2: string;
  golesLocal?: number;
  golesVisitante?: number;
  resultado?: string;
  jugado: boolean;
  dia: string;
  partido: string; // ID of the match
  fase?: string;
}

interface Bet {
  partido: string;
  golesLocal: number;
  golesVisitante: number;
  resultado: string;
  usuario: string;
  ganadorPenales?: string;
}

interface MatchesProps {
  currentUser: User;
}

export default function Matches({ currentUser }: MatchesProps) {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [bets, setBets] = useState<Record<string, Bet>>({});
  const [submitting, setSubmitting] = useState<Record<string, 'idle' | 'saving' | 'saved'>>({});
  const [formState, setFormFormState] = useState<Record<string, { golesLocal: string; golesVisitante: string; ganadorPenales?: string }>>({});
  const [filter, setFilter] = useState<'all' | 'unplayed' | 'played'>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch matches
      const matchesRes = await fetch('/partidos');
      if (!matchesRes.ok) throw new Error('No se pudieron cargar los partidos.');
      const matchesData: Match[] = await matchesRes.json();
      
      // 2. Fetch user's bets
      const betsRes = await fetch(`/apuestas?usuario=${encodeURIComponent(currentUser.email)}`);
      let betsData: Bet[] = [];
      if (betsRes.ok) {
        betsData = await betsRes.json();
      }

      // Convert bets array to a map for easy lookup
      const betsMap: Record<string, Bet> = {};
      betsData.forEach(bet => {
        betsMap[bet.partido] = bet;
      });

      // Initialize forms state with user bets or empty
      const initialFormState: Record<string, { golesLocal: string; golesVisitante: string; ganadorPenales?: string }> = {};
      matchesData.forEach(match => {
        const userBet = betsMap[match.partido];
        initialFormState[match.partido] = {
          golesLocal: userBet ? String(userBet.golesLocal) : '',
          golesVisitante: userBet ? String(userBet.golesVisitante) : '',
          ganadorPenales: userBet?.ganadorPenales || ''
        };
      });

      setMatches(matchesData);
      setBets(betsMap);
      setFormFormState(initialFormState);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al conectar con los servicios de datos.');
    } finally {
      setLoading(false);
    }
  };

  const getFaseInfo = (match: Match) => {
    const matchNum = parseInt(match.partido);
    const phaseName = (match.fase || '').toLowerCase();

    if (phaseName.includes('octavos') || (!isNaN(matchNum) && matchNum >= 49 && matchNum <= 56)) {
      return { label: 'Octavos de Final', base: 2, exact: 4 };
    }
    if (phaseName.includes('cuartos') || (!isNaN(matchNum) && matchNum >= 57 && matchNum <= 60)) {
      return { label: 'Cuartos de Final', base: 3, exact: 6 };
    }
    if (phaseName.includes('semi') || phaseName.includes('final') || phaseName.includes('tercer') || (!isNaN(matchNum) && matchNum >= 61)) {
      return { label: 'Semifinales / Finales', base: 4, exact: 8 };
    }
    return { label: 'Fase de Grupos', base: 1, exact: 2 };
  };

  const calculatePoints = (bet: Bet, match: Match) => {
    if (!match || !match.jugado || !bet) return 0;

    const actualL = typeof match.golesLocal === 'number' ? match.golesLocal : parseInt(String(match.golesLocal ?? 0), 10);
    const actualV = typeof match.golesVisitante === 'number' ? match.golesVisitante : parseInt(String(match.golesVisitante ?? 0), 10);
    const predictedL = typeof bet.golesLocal === 'number' ? bet.golesLocal : parseInt(String(bet.golesLocal ?? 0), 10);
    const predictedV = typeof bet.golesVisitante === 'number' ? bet.golesVisitante : parseInt(String(bet.golesVisitante ?? 0), 10);

    const actualOutcome = actualL > actualV ? 'L' : actualL === actualV ? 'E' : 'V';
    const predictedOutcome = predictedL > predictedV ? 'L' : predictedL === predictedV ? 'E' : 'V';

    const rules = getFaseInfo(match);

    const isExactScore = actualL === predictedL && actualV === predictedV;
    const isCorrectOutcome = actualOutcome === predictedOutcome;

    let points = 0;
    if (isCorrectOutcome) {
      points += rules.base;
    }
    if (isExactScore) {
      points += rules.exact;
      const totalGoals = actualL + actualV;
      if (totalGoals > 3) {
        points += 1;
      }
    }
    return points;
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleInputChange = (matchId: string, field: 'golesLocal' | 'golesVisitante' | 'ganadorPenales', value: string) => {
    setFormFormState(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value
      }
    }));
    
    // Reset submit button state back to idle if they type again after saving
    if (submitting[matchId] === 'saved') {
      setSubmitting(prev => ({ ...prev, [matchId]: 'idle' }));
    }
  };

  const handleSaveBet = async (match: Match) => {
    const matchId = match.partido;
    const { golesLocal, golesVisitante, ganadorPenales } = formState[matchId] || {};

    if (golesLocal === '' || golesVisitante === '') {
      alert('Por favor ingresa un pronóstico de goles válido.');
      return;
    }

    const gL = parseInt(golesLocal);
    const gV = parseInt(golesVisitante);

    if (isNaN(gL) || isNaN(gV) || gL < 0 || gV < 0) {
      alert('Los goles deben ser números mayores o iguales a 0.');
      return;
    }

    // Determine prediction outcome
    let ganador = 'Empate';
    if (gL > gV) ganador = match.equipo1;
    else if (gV > gL) ganador = match.equipo2;
    else if (ganadorPenales) {
      ganador = ganadorPenales;
    }

    setSubmitting(prev => ({ ...prev, [matchId]: 'saving' }));

    try {
      const response = await fetch('/apuesta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: currentUser.email,
          partido: matchId,
          golesLocal: gL,
          golesVisitante: gV,
          ganador: ganador,
          ganadorPenales: gL === gV ? ganadorPenales : undefined
        })
      });

      if (!response.ok) throw new Error('Error al guardar la apuesta.');
      
      setSubmitting(prev => ({ ...prev, [matchId]: 'saved' }));
      
      // Update local bets state
      const updatedBet: Bet = {
        partido: matchId,
        golesLocal: gL,
        golesVisitante: gV,
        resultado: gL > gV ? 'L' : gL === gV ? 'E' : 'V',
        usuario: currentUser.email,
        ganadorPenales: gL === gV ? ganadorPenales : undefined
      };
      
      setBets(prev => ({
        ...prev,
        [matchId]: updatedBet
      }));

      // Return button status to idle after 3 seconds
      setTimeout(() => {
        setSubmitting(prev => {
          if (prev[matchId] === 'saved') {
            return { ...prev, [matchId]: 'idle' };
          }
          return prev;
        });
      }, 3000);

    } catch (err) {
      console.error(err);
      alert('Error de servidor al registrar apuesta. Por favor intenta de nuevo.');
      setSubmitting(prev => ({ ...prev, [matchId]: 'idle' }));
    }
  };

  const isKnockoutMatch = (match: Match) => {
    // Check if match is post group stage (Match ID higher than 48, or explicit phase)
    const matchNum = parseInt(match.partido);
    if (!isNaN(matchNum) && matchNum > 48) return true;
    
    const nameLower = (match.fase || '').toLowerCase();
    return nameLower.includes('octavos') || 
           nameLower.includes('cuartos') || 
           nameLower.includes('semi') || 
           nameLower.includes('final') || 
           nameLower.includes('tercer');
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const filteredMatches = matches.filter(m => {
    if (filter === 'unplayed') return !m.jugado;
    if (filter === 'played') return m.jugado;
    return true;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SportsSoccerIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Calendario de Partidos y Pronósticos
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_e, val) => val && setFilter(val)}
          size="small"
          color="primary"
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
        >
          <ToggleButton value="unplayed" sx={{ px: 2, fontWeight: 700 }}>Por Jugar</ToggleButton>
          <ToggleButton value="played" sx={{ px: 2, fontWeight: 700 }}>Jugados</ToggleButton>
          <ToggleButton value="all" sx={{ px: 2, fontWeight: 700 }}>Todos</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {filteredMatches.length === 0 ? (
        <Alert severity="info" sx={{ py: 3 }}>
          No hay partidos que coincidan con el filtro seleccionado.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredMatches.map(match => {
            const matchId = match.partido;
            const hasBet = !!bets[matchId];
            const isUnplayed = !match.jugado;
            const matchForm = formState[matchId] || { golesLocal: '', golesVisitante: '', ganadorPenales: '' };
            const isTied = matchForm.golesLocal !== '' && matchForm.golesLocal === matchForm.golesVisitante;
            const showPenalties = isKnockoutMatch(match) && isTied;
            const btnState = submitting[matchId] || 'idle';

            return (
              <Grid size={12} key={matchId}>
                <Card 
                  sx={{ 
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: isUnplayed 
                      ? 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0) 100%)'
                      : 'rgba(255, 255, 255, 0.01)',
                    borderRadius: 3,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      borderColor: 'rgba(25, 118, 210, 0.3)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                      
                      {/* Match Meta (ID, Phase, Date) */}
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1 }}>
                          <CalendarTodayIcon sx={{ fontSize: 16 }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            {match.fase || `Partido ${matchId}`}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                          {formatDate(match.dia)}
                        </Typography>
                        {hasBet && isUnplayed && (
                          <Badge color="success" badgeContent="Pronosticado" sx={{ '& .MuiBadge-badge': { py: 1.5, px: 1, fontWeight: 700, fontSize: '0.7rem' } }} />
                        )}
                        {!isUnplayed && (
                          <Chip label="FINALIZADO" color="default" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                        )}
                      </Grid>

                      {/* Teams & Real Scores */}
                      <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', alignItems: 'center', justifySelf: 'center', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end', gap: 1.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'right' }}>
                            {match.equipo1}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.5, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: isUnplayed ? 'rgba(255,255,255,0.2)' : '#ffb74d' }}>
                            {isUnplayed ? '-' : match.golesLocal}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                            VS
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: isUnplayed ? 'rgba(255,255,255,0.2)' : '#ffb74d' }}>
                            {isUnplayed ? '-' : match.golesVisitante}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-start', gap: 1.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'left' }}>
                            {match.equipo2}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Prediction Inputs Form (If unplayed) or prediction review (If played) */}
                      <Grid size={{ xs: 12, md: 4 }} sx={{ borderLeft: { md: '1px solid rgba(255, 255, 255, 0.08)' }, pl: { md: 3 } }}>
                        {isUnplayed ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: '0.5px' }}>
                              TU PRONÓSTICO
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <TextField
                                size="small"
                                type="number"
                                label="Goles Local"
                                value={matchForm.golesLocal}
                                onChange={(e) => handleInputChange(matchId, 'golesLocal', e.target.value)}
                                sx={{ width: 100 }}
                                inputProps={{ min: 0 }}
                              />
                              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.3)' }}>-</Typography>
                              <TextField
                                size="small"
                                type="number"
                                label="Goles Visitante"
                                value={matchForm.golesVisitante}
                                onChange={(e) => handleInputChange(matchId, 'golesVisitante', e.target.value)}
                                sx={{ width: 100 }}
                                inputProps={{ min: 0 }}
                              />

                              <Button
                                variant="contained"
                                color={btnState === 'saved' ? 'success' : 'primary'}
                                startIcon={btnState === 'saved' ? <CheckCircleIcon /> : <SaveIcon />}
                                onClick={() => handleSaveBet(match)}
                                disabled={btnState === 'saving'}
                                sx={{ 
                                  height: 40,
                                  px: 2.5,
                                  fontWeight: 700,
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    transform: 'scale(1.05)'
                                  }
                                }}
                              >
                                {btnState === 'saving' ? <CircularProgress size={20} color="inherit" /> : btnState === 'saved' ? '¡Apuesta Guardada!' : 'Apostar'}
                              </Button>
                            </Box>

                            {showPenalties && (
                              <FormControl size="small" fullWidth sx={{ mt: 0.5 }}>
                                <InputLabel id={`penalties-label-${matchId}`}>Gana por penales</InputLabel>
                                <Select
                                  labelId={`penalties-label-${matchId}`}
                                  value={matchForm.ganadorPenales || ''}
                                  label="Gana por penales"
                                  onChange={(e) => handleInputChange(matchId, 'ganadorPenales', e.target.value as string)}
                                >
                                  <MenuItem value=""><em>Ninguno</em></MenuItem>
                                  <MenuItem value={match.equipo1}>{match.equipo1}</MenuItem>
                                  <MenuItem value={match.equipo2}>{match.equipo2}</MenuItem>
                                </Select>
                                <FormHelperText sx={{ color: '#ffb74d' }}>Empate en fase eliminatoria requiere ganador por penales.</FormHelperText>
                              </FormControl>
                            )}
                          </Box>
                        ) : (
                          /* Match was played: show user's prediction and calculate points */
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.5px' }}>
                              TU APUESTA REALIZADA
                            </Typography>
                            {hasBet ? (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                  Resultado Pronosticado: {bets[matchId].golesLocal} - {bets[matchId].golesVisitante} 
                                  {bets[matchId].ganadorPenales && ` (P: Gana ${bets[matchId].ganadorPenales})`}
                                </Typography>
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {match.golesLocal != null && match.golesVisitante != null ? (
                                    (() => {
                                      const pts = calculatePoints(bets[matchId], match);
                                      return (
                                        <Chip 
                                          label={pts === 1 ? `+1 Punto obtenido` : `+${pts} Puntos obtenidos`} 
                                          size="small" 
                                          color={pts > 0 ? "success" : "default"} 
                                          variant={pts > 0 ? "filled" : "outlined"}
                                          sx={{ fontWeight: 700 }}
                                        />
                                      );
                                    })()
                                  ) : (
                                    <Chip 
                                      label="Calculando Puntos..." 
                                      size="small" 
                                      color="info" 
                                      variant="outlined"
                                      sx={{ fontWeight: 700 }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            ) : (
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', mt: 1, fontStyle: 'italic' }}>
                                No realizaste ninguna apuesta para este partido.
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Grid>

                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
