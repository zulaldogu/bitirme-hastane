import { Box } from '@mantine/core';
import { useState } from 'react';
import { AppHeader, type NavTab, type Role } from './components/AppHeader';
import { ComingSoon } from './components/ComingSoon';
import { OverviewPage } from './pages/overview/OverviewPage';
import { SchedulePage } from './pages/schedule/SchedulePage';
import { StaffPage } from './pages/staff/StaffPage';

const tabs: (NavTab & { soon: string })[] = [
  { id: 'overview', label: 'Genel Bakış', ready: true, soon: '' },
  {
    id: 'schedule',
    label: 'Çizelge',
    ready: true,
    soon: 'Personel × gün tablosu ve "Oluştur" düğmesi çözücü bağlanınca burada olacak.',
  },
  {
    id: 'staff',
    label: 'Personel',
    ready: true,
    soon: 'Personel listesi, kıdemli işareti ve izin günleri burada yönetilecek.',
  },
  {
    id: 'rules',
    label: 'Kurallar',
    ready: false,
    soon: 'Vardiya başına asgari kişi ve haftalık sınır burada ayarlanacak.',
  },
];

export default function App() {
  // Seçili sekme adres çubuğunda tutulur (#schedule); yenileyince aynı sekme açılır.
  const [active, setActiveState] = useState(() => {
    const id = window.location.hash.slice(1);
    return tabs.some((t) => t.id === id) ? id : 'overview';
  });
  const setActive = (id: string) => {
    setActiveState(id);
    window.history.replaceState(null, '', `#${id}`);
  };
  const [role, setRole] = useState<Role>('manager');
  const tab = tabs.find((t) => t.id === active)!;

  return (
    <Box mih="100vh" p={{ base: 16, md: 24 }}>
      <AppHeader
        tabs={tabs}
        active={active}
        onTabChange={setActive}
        role={role}
        onRoleChange={setRole}
        greetingName={role === 'manager' ? 'Sorumlu Hemşire' : 'Ayşe Kaya'}
        subtitle="Dahiliye Servisi"
      />
      {role === 'staff' ? (
        <ComingSoon
          title="Personel görünümü"
          description="Sıradaki vardiyan, bu dönemki gece sayın ve 14 günlük takvimin burada olacak."
        />
      ) : active === 'overview' ? (
        <OverviewPage onNavigate={setActive} />
      ) : active === 'schedule' ? (
        <SchedulePage />
      ) : active === 'staff' ? (
        <StaffPage />
      ) : (
        <ComingSoon title={tab.label} description={tab.soon} />
      )}
    </Box>
  );
}
