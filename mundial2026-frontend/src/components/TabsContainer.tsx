import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper, Container } from '@mui/material';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import StarIcon from '@mui/icons-material/Star';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import Matches from '../pages/Matches';
import MyBets from '../pages/MyBets';
import Users from '../pages/Users';

interface User {
  nombre: string;
  apellido: string;
  usuario: string;
  email: string;
  puntos: number;
}

interface TabsContainerProps {
  currentUser: User;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function TabsContainer({ currentUser }: TabsContainerProps) {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        elevation={4} 
        sx={{ 
          borderRadius: 3, 
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1e1e1e 0%, #121212 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            '& .MuiTab-root': {
              py: 2.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              letterSpacing: '0.5px',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                transform: 'translateY(-2px)'
              }
            }
          }}
        >
          <Tab 
            icon={<SportsSoccerIcon />} 
            iconPosition="start" 
            label="Partidos y Resultados" 
          />
          <Tab 
            icon={<StarIcon />} 
            iconPosition="start" 
            label="Tus Apuestas" 
          />
          <Tab 
            icon={<LeaderboardIcon />} 
            iconPosition="start" 
            label="Resultados Globales" 
          />
        </Tabs>
        
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <TabPanel value={activeTab} index={0}>
            <Matches currentUser={currentUser} />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <MyBets currentUser={currentUser} />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <Users currentUser={currentUser} />
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
}
