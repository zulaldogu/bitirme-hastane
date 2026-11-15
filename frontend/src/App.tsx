import { Box } from '@mantine/core';
import { useState } from 'react';
import { AppHeader, type NavTab, type Role } from './components/AppHeader';
import { MyCalendarPage } from './pages/me/MyCalendarPage';
import { OverviewPage } from './pages/overview/OverviewPage';
import { RulesPage } from './pages/rules/RulesPage';
import { SchedulePage } from './pages/schedule/SchedulePage';
import { StaffPage } from './pages/staff/StaffPage';

// K23: Adalet sekmesi yok.
const tabs: NavTab[] = [
  { id: 'overview', label: 'Genel Bakış', ready: true },
  { id: 'schedule', label: 'Çizelge', ready: true },
  { id: 'staff', label: 'Personel', ready: true },
  { id: 'rules', label: 'Kurallar', ready: true },
];

/** Adres çubuğundaki yer: yönetici sekmesi (#schedule) ya da personel görünümü (#me). */
function readHash(): { role: Role; tab: string } {
  const id = window.location.hash.slice(1);
  if (id === 'me') return { role: 'staff', tab: 'overview' };
  return { role: 'manager', tab: tabs.some((t) => t.id === id) ? id : 'overview' };
}

export default function App() {
  const [initial] = useState(readHash);
  const [active, setActiveState] = useState(initial.tab);
  const [role, setRoleState] = useState<Role>(initial.role);
  const [staffName, setStaffName] = useState('');

  const setActive = (id: string) => {
    setActiveState(id);
    window.history.replaceState(null, '', `#${id}`);
  };
  const setRole = (r: Role) => {
    setRoleState(r);
    window.history.replaceState(null, '', `#${r === 'staff' ? 'me' : active}`);
  };

  return (
    <Box mih="100vh" p={{ base: 16, md: 24 }}>
      <AppHeader
        tabs={tabs}
        active={active}
        onTabChange={setActive}
        role={role}
        onRoleChange={setRole}
        greetingName={role === 'manager' ? 'Sorumlu Hemşire' : staffName}
        subtitle="Dahiliye Servisi"
      />
      {role === 'staff' ? (
        <MyCalendarPage onNameChange={setStaffName} />
      ) : active === 'schedule' ? (
        <SchedulePage />
      ) : active === 'staff' ? (
        <StaffPage />
      ) : active === 'rules' ? (
        <RulesPage />
      ) : (
        <OverviewPage onNavigate={setActive} />
      )}
    </Box>
  );
}
