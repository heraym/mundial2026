import { useEffect, useState } from 'react';
import { 
  Box, AppBar, Toolbar, Typography, Avatar, Button, 
  CircularProgress, Alert, AlertTitle, Card, CardContent, 
  TextField, Chip, IconButton, useTheme, Container 
} from '@mui/material';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import GoogleIcon from '@mui/icons-material/Google';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ChatIcon from '@mui/icons-material/Chat';
import TabsContainer from './TabsContainer';
import { auth, googleProvider } from '../firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';

interface User {
  nombre: string;
  apellido: string;
  usuario: string;
  email: string;
  puntos: number;
}

export default function Layout() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [email, setEmail] = useState<string>('');
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Firebase Auth State
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  // Development simulation state
  const isDev = import.meta.env.DEV;
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [mockEmailInput, setMockEmailInput] = useState(localStorage.getItem('mockEmail') || 'usuario1');

  const checkUserStatus = async (firebaseUser: FirebaseUser | null, mockEmailToUse?: string) => {
    setLoading(true);
    setError(null);
    try {
      const userEmail = firebaseUser?.email || mockEmailToUse || localStorage.getItem('mockEmail') || '';
      
      if (!userEmail) {
        setRegistered(false);
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      // Consultar la lista de todos los usuarios desde el servicio de backend (leaderboard para calcular puntos)
      const response = await fetch('/leaderboard');
      
      if (!response.ok) {
        throw new Error('No se pudo verificar el estado del usuario en el servidor.');
      }
      
      const usuarios: any[] = await response.json();
      
      // Buscar el email en el atributo 'usuario' o 'email' de la lista
      const match = usuarios.find(u => 
        (u.usuario && u.usuario.toLowerCase() === userEmail.toLowerCase()) || 
        (u.email && u.email.toLowerCase() === userEmail.toLowerCase())
      );
      
      setEmail(userEmail);
      
      if (match) {
        // El usuario está registrado en Firestore
        setRegistered(true);
        setCurrentUser({
          nombre: match.nombre || '',
          apellido: match.apellido || '',
          usuario: match.usuario || userEmail,
          email: match.email || userEmail,
          puntos: typeof match.puntos === 'number' ? match.puntos : parseInt(String(match.puntos ?? 0), 10)
        });
      } else {
        // El usuario está autenticado pero no registrado en Firestore (Acceso Denegado)
        setRegistered(false);
        setCurrentUser(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFbUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          setIdToken(token);
        } catch (err) {
          console.error("Error al obtener el idToken de Firebase:", err);
        }
        await checkUserStatus(user);
      } else {
        setIdToken(null);
        const mockEmail = localStorage.getItem('mockEmail');
        if (isDev && mockEmail) {
          await checkUserStatus(null, mockEmail);
        } else {
          setCurrentUser(null);
          setRegistered(false);
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al iniciar sesión con Google.');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      localStorage.removeItem('mockEmail');
      setMockEmailInput('');
      setCurrentUser(null);
      setRegistered(false);
    } catch (err: any) {
      console.error(err);
      setError('Error al cerrar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateLogin = () => {
    if (mockEmailInput.trim()) {
      localStorage.setItem('mockEmail', mockEmailInput.trim());
      checkUserStatus(fbUser, mockEmailInput.trim());
    } else {
      localStorage.removeItem('mockEmail');
      checkUserStatus(fbUser);
    }
  };

  const handleLogoutMock = () => {
    localStorage.removeItem('mockEmail');
    setMockEmailInput('');
    setCurrentUser(null);
    setRegistered(false);
    checkUserStatus(fbUser, '');
  };

  // 1. Pantalla de Carga Inicial
  if (loading && !fbUser && !(isDev && localStorage.getItem('mockEmail'))) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: 'radial-gradient(circle, #1a2035 0%, #0a0e1a 100%)',
          color: '#fff'
        }}
      >
        <CircularProgress size={60} thickness={4} sx={{ mb: 3, color: '#1976d2' }} />
        <Typography variant="h6" sx={{ fontWeight: 500, letterSpacing: '1px' }}>
          Validando Credenciales...
        </Typography>
      </Box>
    );
  }

  // 2. Pantalla de Bienvenida / Login (Si no está autenticado en Firebase y no hay bypass mock)
  if (!fbUser && !(isDev && localStorage.getItem('mockEmail'))) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          background: 'radial-gradient(circle at center, #151a30 0%, #070a14 100%)',
          color: '#fff',
          px: 2
        }}
      >
        <Card 
          sx={{ 
            maxWidth: 450, 
            width: '100%',
            borderRadius: 4, 
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(22, 28, 45, 0.8)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ height: 6, background: 'linear-gradient(90deg, #1976d2, #42a5f5, #1976d2)' }} />
          <CardContent sx={{ p: { xs: 4, md: 5 } }}>
            <Avatar sx={{ bgcolor: '#1976d2', width: 64, height: 64, mx: 'auto', mb: 2, boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)' }}>
              <SportsSoccerIcon sx={{ fontSize: 36 }} />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '0.5px' }}>
              MUNDIAL 2026
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#42a5f5', fontWeight: 700, letterSpacing: '2px', mb: 3 }}>
              PRODE OFICIAL
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 4, lineHeight: 1.6 }}>
              Ingresa para pronosticar partidos, seguir tus aciertos en tiempo real, consultar las tablas y competir por el podio global con tus amigos.
            </Typography>
            
            {error && <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>{error}</Alert>}

            <Button 
              variant="contained" 
              size="large" 
              fullWidth
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              sx={{ 
                py: 1.8, 
                borderRadius: 2.5, 
                fontWeight: 700, 
                fontSize: '1rem',
                textTransform: 'none',
                background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
                boxShadow: '0 4px 20px rgba(25, 118, 210, 0.4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 25px rgba(25, 118, 210, 0.6)',
                }
              }}
            >
              Iniciar Sesión con Google
            </Button>

            {isDev && (
              <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', display: 'block', mb: 1.5, fontWeight: 600 }}>
                  MODO DESARROLLO LOCAL ACTIVADO
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  color="warning"
                  onClick={() => {
                    localStorage.setItem('mockEmail', 'usuario1');
                    window.location.reload();
                  }}
                  startIcon={<LockOpenIcon />}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                >
                  Bypass con Usuario Mock
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  // 3. Pantalla de la Aplicación Principal Autenticada
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#0f1220' }}>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 18, 32, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: theme.zIndex.drawer + 1
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#1976d2', width: 42, height: 42 }}>
              <SportsSoccerIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, background: 'linear-gradient(90deg, #1976d2, #42a5f5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                MUNDIAL 2026
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, letterSpacing: '0.5px' }}>
                PRODE OFICIAL
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {currentUser && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {currentUser.nombre} {currentUser.apellido}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#42a5f5', fontWeight: 700 }}>
                    {currentUser.puntos} Puntos
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#42a5f5', fontWeight: 700, fontSize: '0.9rem' }}>
                  {currentUser.nombre[0].toUpperCase()}
                </Avatar>
              </Box>
            )}

            {fbUser && (
              <Button 
                variant={showChat ? "contained" : "outlined"}
                color={showChat ? "primary" : "inherit"}
                size="small" 
                onClick={() => setShowChat(!showChat)}
                startIcon={<ChatIcon />}
                sx={{ 
                  textTransform: 'none', 
                  borderRadius: 2,
                  fontWeight: 700,
                  borderColor: showChat ? 'transparent' : 'rgba(255,255,255,0.15)',
                  background: showChat ? 'linear-gradient(90deg, #1976d2, #42a5f5)' : 'transparent',
                  color: '#fff',
                  boxShadow: showChat ? '0 2px 10px rgba(25, 118, 210, 0.4)' : 'none',
                  '&:hover': { 
                    borderColor: showChat ? 'transparent' : 'rgba(255,255,255,0.3)', 
                    bgcolor: showChat ? 'rgba(25,118,210,0.9)' : 'rgba(255,255,255,0.05)' 
                  }
                }}
              >
                {showChat ? 'Cerrar Asistente' : 'Asistente IA'}
              </Button>
            )}

            {fbUser && (
              <Button 
                variant="outlined" 
                color="inherit" 
                size="small" 
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{ 
                  textTransform: 'none', 
                  borderColor: 'rgba(255,255,255,0.15)',
                  '&:hover': { borderColor: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(255,255,255,0.05)' }
                }}
              >
                Cerrar Sesión
              </Button>
            )}

            {isDev && (
              <IconButton 
                color="inherit" 
                onClick={() => setShowDevPanel(!showDevPanel)}
                sx={{ 
                  bgcolor: showDevPanel ? 'rgba(25, 118, 210, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                }}
              >
                <SettingsIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Dev Simulation Panel */}
      {isDev && showDevPanel && (
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: '#161a2e', 
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex', 
            flexWrap: 'wrap', 
            alignItems: 'center', 
            gap: 2,
            justifyContent: 'center'
          }}
        >
          <Chip label="DEVELOPMENT MODE" color="warning" size="small" sx={{ fontWeight: 700 }} />
          <TextField
            size="small"
            label="Simular Email"
            value={mockEmailInput}
            onChange={(e) => setMockEmailInput(e.target.value)}
            sx={{ input: { color: 'white' }, width: 250 }}
            placeholder="usuario1 o mail@google.com"
          />
          <Button variant="contained" size="small" onClick={handleSimulateLogin}>
            Simular Login
          </Button>
          <Button variant="outlined" size="small" color="error" startIcon={<LogoutIcon />} onClick={handleLogoutMock}>
            Cerrar Sesión Mock
          </Button>
        </Box>
      )}

      {/* Main Content Space */}
      <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
        {error && (
          <Container maxWidth="md" sx={{ mb: 3 }}>
            <Alert severity="error">
              <AlertTitle>Error de Conexión</AlertTitle>
              {error} — Por favor, asegúrate de que los microservicios estén activos localmente.
            </Alert>
          </Container>
        )}

        {loading ? (
          <Container 
            maxWidth="sm" 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '70vh' 
            }}
          >
            <CircularProgress size={50} thickness={4} sx={{ color: '#1976d2' }} />
            <Typography variant="body1" sx={{ mt: 2, color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>
              Verificando autorización...
            </Typography>
          </Container>
        ) : !registered ? (
          /* UNREGISTERED ACCESS DENIED OVERLAY */
          <Container 
            maxWidth="sm" 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '70vh' 
            }}
          >
            <Card 
              sx={{ 
                borderRadius: 4, 
                border: '1px solid rgba(244, 67, 54, 0.3)',
                background: 'linear-gradient(135deg, #2a1115 0%, #150508 100%)',
                boxShadow: '0 8px 32px rgba(244, 67, 54, 0.15)',
                textAlign: 'center',
                overflow: 'hidden'
              }}
            >
              <CardContent sx={{ p: { xs: 4, md: 5 } }}>
                <ErrorOutlineIcon color="error" sx={{ fontSize: 75, mb: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: '#f44336' }}>
                  Acceso Denegado
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600, mb: 3 }}>
                  No estás registrado en la plataforma
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 4, lineHeight: 1.6 }}>
                  Tu correo de Google (<strong>{email || fbUser?.email || 'No identificado'}</strong>) no se encuentra cargado en el backend como un usuario autorizado. Contacta al administrador del Prode para que te registre.
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3, mb: isDev ? 4 : 0 }}>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<LogoutIcon />} 
                    onClick={handleLogout}
                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                  >
                    Probar con otra cuenta
                  </Button>
                </Box>

                {isDev && (
                  <Alert severity="info" sx={{ textAlign: 'left', bgcolor: 'rgba(2, 136, 209, 0.1)', color: '#4fc3f7' }}>
                    <strong>Tip de Desarrollo:</strong> Utiliza el panel de configuración arriba para simular el login con un usuario válido cargado en tu Firestore (ej. <code>usuario1</code>).
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Container>
        ) : (
          /* REGISTERED LOGGED-IN MAIN TABS PANEL */
          currentUser && <TabsContainer currentUser={currentUser} />
        )}
      </Box>
   
      {/* ces-messenger chat widget */}
      {idToken && fbUser && showChat && (
        <ces-messenger
          deployment-id="projects/651874636910/locations/us/apps/01e2f4e5-0367-4a92-91ee-bebb2fad8aa4/deployments/ee3db550-2ec8-442b-aa9b-6b83fe3d3748"
          api-uri="https://us-dialogflow.googleapis.com"
          location-id="us"
          project-id="651874636910"
          agent-id="01e2f4e5-0367-4a92-91ee-bebb2fad8aa4"
          token-broker-url="MANAGED"
          chat-title="Asistente de Apuestas"
          chat-title-icon="https://gstatic.com/dialogflow-console/common/assets/ccai-favicons/conversational_agents.png"
          initial-message={`Hola, soy ${fbUser.displayName || currentUser?.nombre || ''} y mi usuario es ${fbUser.email || currentUser?.email || ''}`}
          user-id-token={idToken}
          wait-for-auth="true"
          auto-open-chat="true"
          show-error-messages="true"
        />
      )}
    </Box>
  );
}
