import { Box } from '@mantine/core';
import { useState } from 'react';
import { AppHeader, type NavTab, type Role } from './components/AppHeader';
import { ComingSoon } from './components/ComingSoon';
import { OverviewPage } from './pages/overview/OverviewPage';

const tabs: (NavTab & { soon: string })[] = [
  { id: 'overview', label: 'Genel Bakış', ready: true, soon: '' },
  {
    id: 'schedule',
    label: 'Çizelge',
    ready: false,
    soon: 'Personel × gün tablosu ve "Oluştur" düğmesi çözücü bağlanınca burada olacak.',
  },
  {
    id: 'staff',
    label: 'Personel',
    ready: false,
    soon: 'Personel listesi, kıdemli işareti ve izin günleri burada yönetilecek.',
  },
  {
    id: 'rules',
    label: 'Kurallar',
    ready: false,
    soon: 'Vardiya başına asgari kişi ve haftalık sınır burada ayarlanacak.',
  },
  {
    id: 'fairness',
    label: 'Adalet',
    ready: false,
    soon: 'Kişi başına gece vardiyası dağılımı burada ayrıntılı gösterilecek.',
  },
];

export default function App() {
  const [active, setActive] = useState('overview');
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
      ) : tab.ready ? (
        <OverviewPage onNavigate={setActive} />
      ) : (
        <ComingSoon title={tab.label} description={tab.soon} />
      )}
    </Box>
  );
}
