import { useEffect, useState } from 'react';
import { 
  Box, Typography, Card, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, 
  CircularProgress, Alert, Tooltip, Zoom 
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';

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
  resultado?: string; // "L", "E", "V"
  jugado: boolean;
  dia: string;
  partido: string; // ID
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

interface MyBetsProps {
  currentUser: User;
}

export default function MyBets({ currentUser }: MyBetsProps) {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Record<string, Match>>({});
  const [bets, setBets] = useState<Bet[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch matches
        const matchesRes = await fetch('/partidos');
        if (!matchesRes.ok) throw new Error('No se pudieron cargar los partidos.');
        const matchesData: Match[] = await matchesRes.json();
        
        const matchesMap: Record<string, Match> = {};
        matchesData.forEach(m => {
          matchesMap[m.partido] = m;
        });

        // Fetch user's bets
        const betsRes = await fetch(`/apuestas?usuario=${encodeURIComponent(currentUser.email)}`);
        let betsData: Bet[] = [];
        if (betsRes.ok) {
          betsData = await betsRes.json();
        }

        setMatches(matchesMap);
        setBets(betsData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error al conectar con el servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Determine stage rules for point calculations according to Reglas.MD
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

  // Calculate points for a specific bet based on match outcome
  const calculatePoints = (bet: Bet, match: Match) => {
    if (!match || !match.jugado || !bet) return { points: 0, reason: 'Partido no jugado' };

    const actualL = typeof match.golesLocal === 'number' ? match.golesLocal : parseInt(String(match.golesLocal ?? 0), 10);
    const actualV = typeof match.golesVisitante === 'number' ? match.golesVisitante : parseInt(String(match.golesVisitante ?? 0), 10);
    const predictedL = typeof bet.golesLocal === 'number' ? bet.golesLocal : parseInt(String(bet.golesLocal ?? 0), 10);
    const predictedV = typeof bet.golesVisitante === 'number' ? bet.golesVisitante : parseInt(String(bet.golesVisitante ?? 0), 10);

    const actualOutcome = actualL > actualV ? 'L' : actualL === actualV ? 'E' : 'V';
    const predictedOutcome = predictedL > predictedV ? 'L' : predictedL === predictedV ? 'E' : 'V';

    const rules = getFaseInfo(match);

    const isExactScore = actualL === predictedL && actualV === predictedV;
    const isCorrectOutcome = actualOutcome === predictedOutcome;

    if (isExactScore) {
      const totalGoals = actualL + actualV;
      const extraPoint = totalGoals > 3;
      const totalPoints = rules.exact + (extraPoint ? 1 : 0);
      return { 
        points: totalPoints, 
        reason: `Resultado Exacto (${rules.exact} pts)${extraPoint ? ' + 1 pt Extra (>3 goles)' : ''}` 
      };
    } else if (isCorrectOutcome) {
      return { 
        points: rules.base, 
        reason: `Tendencia Acertada (${rules.base} pts)` 
      };
    } else {
      return { 
        points: 0, 
        reason: 'Sin puntos acumulados' 
      };
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const totalPointsEarned = bets.reduce((acc, bet) => {
    const match = matches[bet.partido];
    if (match && match.jugado) {
      return acc + calculatePoints(bet, match).points;
    }
    return acc;
  }, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Mis Apuestas Cargadas
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
            Historial y cálculo en tiempo real de tus puntos según las reglas de Reglas.MD.
          </Typography>
        </Box>

        <Card 
          sx={{ 
            bgcolor: 'rgba(25, 118, 210, 0.1)', 
            border: '1px solid rgba(25, 118, 210, 0.3)',
            borderRadius: 3,
            px: 3,
            py: 1.5
          }}
        >
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: '0.5px' }}>
            TOTAL PUNTOS ACUMULADOS
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#42a5f5', textAlign: 'center' }}>
            {totalPointsEarned}
          </Typography>
        </Card>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {bets.length === 0 ? (
        <Alert severity="info" sx={{ py: 3 }}>
          Aún no has cargado ningún pronóstico. Ve a la pestaña de "Próximos Partidos" para comenzar.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.08)', bgcolor: 'rgba(255,255,255,0.01)' }}>
          <Table sx={{ minWidth: 650 }} aria-label="tabla de apuestas">
            <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Partido</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Fase</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Tu Pronóstico</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Resultado Real</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Puntos Ganados</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bets.map((bet) => {
                const match = matches[bet.partido];
                if (!match) return null;
                
                const calc = calculatePoints(bet, match);
                const isPlayed = match.jugado;

                return (
                  <TableRow 
                    key={bet.partido}
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      transition: 'background-color 0.3s ease',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      {match.equipo1} vs {match.equipo2}
                    </TableCell>
                    
                    <TableCell align="center">
                      <Chip 
                        label={getFaseInfo(match).label} 
                        size="small" 
                        variant="outlined" 
                        sx={{ fontSize: '0.75rem', fontWeight: 600 }} 
                      />
                    </TableCell>

                    <TableCell align="center" sx={{ fontWeight: 800 }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#90caf9' }}>
                          {bet.golesLocal} - {bet.golesVisitante}
                        </Typography>
                        {bet.ganadorPenales && (
                          <Tooltip title={`Ganador por Penales: ${bet.ganadorPenales}`} arrow TransitionComponent={Zoom}>
                            <HelpOutlineIcon sx={{ fontSize: 14, color: '#ffb74d', cursor: 'pointer' }} />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell align="center">
                      {isPlayed ? (
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#ffb74d' }}>
                          {match.golesLocal} - {match.golesVisitante}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                          Por jugar
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell align="center">
                      {isPlayed ? (
                        calc.points > 0 ? (
                          <Chip 
                            icon={<CheckIcon style={{ color: '#4caf50' }} />} 
                            label="Acertado" 
                            color="success" 
                            variant="outlined" 
                            size="small" 
                            sx={{ fontWeight: 700 }}
                          />
                        ) : (
                          <Chip 
                            icon={<CloseIcon style={{ color: '#f44336' }} />} 
                            label="Errado" 
                            color="error" 
                            variant="outlined" 
                            size="small" 
                            sx={{ fontWeight: 700 }}
                          />
                        )
                      ) : (
                        <Chip 
                          label="Pendiente" 
                          color="warning" 
                          variant="outlined" 
                          size="small" 
                          sx={{ fontWeight: 700 }}
                        />
                      )}
                    </TableCell>

                    <TableCell align="center">
                      {isPlayed ? (
                        <Tooltip title={calc.reason} arrow TransitionComponent={Zoom}>
                          <Chip 
                            label={`+${calc.points} Puntos`} 
                            color={calc.points > 0 ? "success" : "default"} 
                            sx={{ fontWeight: 800, px: 1 }} 
                          />
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                          -
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
