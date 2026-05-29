import { useEffect, useState } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper, 
  CircularProgress, Alert, Avatar, ToggleButton, ToggleButtonGroup 
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';

interface User {
  nombre: string;
  apellido: string;
  usuario: string;
  puntos: number;
}

interface TeamStanding {
  nombre: string;
  jugados: number;
  ganados: number;
  empatados: number;
  perdidos: number;
  golesAFavor: number;
  golesEnContra: number;
  puntos: number;
  grupo?: string; // Group A, B, etc.
}

interface UsersProps {
  currentUser: { email: string };
}

export default function Users({ currentUser: _currentUser }: UsersProps) {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [groupStandings, setGroupStandings] = useState<TeamStanding[]>([]);
  const [subView, setSubView] = useState<'leaderboard' | 'groups'>('leaderboard');
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch leaderboard / users
      const usersRes = await fetch('/leaderboard');
      if (!usersRes.ok) throw new Error('No se pudo cargar la tabla de usuarios.');
      const usersData: User[] = await usersRes.json();
      
      // 2. Fetch group results
      const groupsRes = await fetch('/grupos/resultados');
      let groupsData: TeamStanding[] = [];
      if (groupsRes.ok) {
        groupsData = await groupsRes.json();
      }

      setLeaderboard(usersData);
      setGroupStandings(groupsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al conectar con los servicios de clasificación.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);



  // Group teams by their letter/group (A, B, C, etc.)
  const getTeamsByGroup = () => {
    const groups: Record<string, TeamStanding[]> = {};
    
    // Fallback: If group stands don't specify group, let's group them evenly by 4
    groupStandings.forEach((team, idx) => {
      // Mock groups if not set
      let g = team.grupo;
      if (!g) {
        const groupIndex = Math.floor(idx / 4);
        g = `Grupo ${String.fromCharCode(65 + groupIndex)}`; // Group A, B, C...
      }
      if (!groups[g]) groups[g] = [];
      groups[g].push(team);
    });

    // Order teams in each group by points, then GD, then GF
    Object.keys(groups).forEach(g => {
      groups[g].sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        const gdA = a.golesAFavor - a.golesEnContra;
        const gdB = b.golesAFavor - b.golesEnContra;
        if (gdB !== gdA) return gdB - gdA;
        return b.golesAFavor - a.golesAFavor;
      });
    });

    return groups;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const groupedTeams = getTeamsByGroup();

  // Pick top 3 for podium
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LeaderboardIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Estadísticas y Resultados Globales
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={subView}
          exclusive
          onChange={(_, val) => val && setSubView(val)}
          size="small"
          color="primary"
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
        >
          <ToggleButton value="leaderboard" sx={{ px: 2, fontWeight: 700 }}>
            <EmojiEventsIcon sx={{ fontSize: 18, mr: 0.5 }} /> Leaderboard
          </ToggleButton>
          <ToggleButton value="groups" sx={{ px: 2, fontWeight: 700 }}>
            <SportsSoccerIcon sx={{ fontSize: 18, mr: 0.5 }} /> Grupos Mundial
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {subView === 'leaderboard' ? (
        /* USER LEADERBOARD VIEW WITH PODIUM */
        <Box>
          {/* Podium section */}
          {leaderboard.length > 0 && (
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'flex-end', 
                gap: { xs: 1.5, sm: 4 }, 
                mt: 2, 
                mb: 6,
                flexWrap: 'wrap'
              }}
            >
              {/* 2nd Place */}
              {top2 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#bdbdbd', width: 55, height: 55, border: '2px solid #757575', mb: 1, fontWeight: 700 }}>2</Avatar>
                  <Paper sx={{ width: { xs: 100, sm: 120 }, height: 80, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px 12px 0 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, px: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{top2.nombre}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#bdbdbd' }}>{top2.puntos} pts</Typography>
                  </Paper>
                </Box>
              )}

              {/* 1st Place */}
              {top1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <EmojiEventsIcon sx={{ color: '#ffd54f', fontSize: 36, mb: 0.5 }} />
                  <Avatar sx={{ bgcolor: '#ffb300', width: 70, height: 75, border: '3px solid #ffd54f', mb: 1, fontWeight: 700, fontSize: '1.5rem' }}>1</Avatar>
                  <Paper sx={{ width: { xs: 120, sm: 140 }, height: 110, bgcolor: 'rgba(25, 118, 210, 0.1)', border: '1px solid rgba(25, 118, 210, 0.3)', borderRadius: '12px 12px 0 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 15px rgba(255,179,0,0.1)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#ffb300', px: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{top1.nombre}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#ffb300' }}>{top1.puntos} pts</Typography>
                  </Paper>
                </Box>
              )}

              {/* 3rd Place */}
              {top3 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#a1887f', width: 50, height: 50, border: '2px solid #8d6e63', mb: 1, fontWeight: 700 }}>3</Avatar>
                  <Paper sx={{ width: { xs: 100, sm: 110 }, height: 60, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px 12px 0 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, px: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{top3.nombre}</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#a1887f' }}>{top3.puntos} pts</Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )}

          <Grid container spacing={4}>
            {/* Leaderboard Table */}
            <Grid size={{ xs: 12 }}>
              <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.08)', bgcolor: 'rgba(255,255,255,0.01)' }}>
                <Table aria-label="tabla de puntuaciones">
                  <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: 80 }} align="center">Puesto</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Participante</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Puntos Totales</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaderboard.map((user, idx) => {
                      const isPodium = idx < 3;
                      const podiumColors = ['#ffd54f', '#bdbdbd', '#a1887f'];
                      
                      return (
                        <TableRow 
                          key={user.usuario}
                          sx={{ 
                            transition: 'background-color 0.3s ease',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }
                          }}
                        >
                          <TableCell align="center">
                            {isPodium ? (
                              <Avatar sx={{ bgcolor: podiumColors[idx], width: 28, height: 28, fontSize: '0.8rem', fontWeight: 800, color: '#000' }}>
                                {idx + 1}
                              </Avatar>
                            ) : (
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                {idx + 1}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {user.nombre} {user.apellido}
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 800, fontSize: '1.1rem', color: idx === 0 ? '#ffb300' : 'text.primary' }}>
                            {user.puntos}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Box>
      ) : (
        /* WORLD CUP GROUPS CLASSIFICATION VIEW */
        <Box>
          <Grid container spacing={3}>
            {Object.keys(groupedTeams).sort().map(groupName => (
              <Grid size={{ xs: 12, md: 6 }} key={groupName}>
                <Card sx={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)', borderRadius: 3 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: 'primary.main', borderBottom: '1px solid rgba(255,255,255,0.08)', pb: 1 }}>
                      {groupName}
                    </Typography>
                    
                    <TableContainer component={Box}>
                      <Table size="small" aria-label={`tabla ${groupName}`}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, px: 1 }}>Equipo</TableCell>
                            <TableCell sx={{ fontWeight: 700, px: 1 }} align="center">PJ</TableCell>
                            <TableCell sx={{ fontWeight: 700, px: 1 }} align="center">PG</TableCell>
                            <TableCell sx={{ fontWeight: 700, px: 1 }} align="center">PE</TableCell>
                            <TableCell sx={{ fontWeight: 700, px: 1 }} align="center">PP</TableCell>
                            <TableCell sx={{ fontWeight: 700, px: 1 }} align="center">GF</TableCell>
                            <TableCell sx={{ fontWeight: 700, px: 1 }} align="center">GC</TableCell>
                            <TableCell sx={{ fontWeight: 700, px: 1 }} align="center">PTS</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {groupedTeams[groupName].map((team, tIdx) => {
                            const isQualified = tIdx < 2; // Usually top 2 qualify
                            
                            return (
                              <TableRow 
                                key={team.nombre}
                                sx={{ 
                                  bgcolor: isQualified ? 'rgba(76,175,80,0.02)' : 'transparent',
                                  '&:last-child td, &:last-child th': { border: 0 } 
                                }}
                              >
                                <TableCell sx={{ fontWeight: 600, px: 1, color: isQualified ? '#4caf50' : 'text.primary' }}>
                                  {team.nombre}
                                </TableCell>
                                <TableCell sx={{ px: 1 }} align="center">{team.jugados}</TableCell>
                                <TableCell sx={{ px: 1 }} align="center">{team.ganados}</TableCell>
                                <TableCell sx={{ px: 1 }} align="center">{team.empatados}</TableCell>
                                <TableCell sx={{ px: 1 }} align="center">{team.perdidos}</TableCell>
                                <TableCell sx={{ px: 1 }} align="center">{team.golesAFavor}</TableCell>
                                <TableCell sx={{ px: 1 }} align="center">{team.golesEnContra}</TableCell>
                                <TableCell sx={{ px: 1, fontWeight: 800, color: isQualified ? '#4caf50' : 'text.primary' }} align="center">
                                  {team.puntos}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}
