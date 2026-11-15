import { ActionIcon, Button, Group, Paper, Popover, SimpleGrid, Skeleton, Stack, Text } from '@mantine/core';
import { IconAlertTriangle, IconCheck, IconMinus, IconPlus } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { api, periodDays, type Nurse, type Rules, type RulesUpdate, type ShiftType } from '../../api';
import { ShiftPill } from '../../components/ShiftPill';
import { mondayOf, periodLabel, todayIso } from '../../format';
import { notifyError, notifySuccess } from '../../notify';
import { shiftColors } from '../../theme';
import classes from './Rules.module.css';

const DEFAULTS: RulesUpdate = { minStaff: { S: 3, A: 2, G: 2 }, maxShiftsPerWeek: 5 };

/** K8'deki değişmeyen kurallar ve sade gerekçeleri. */
const FIXED = [
  {
    title: 'Günde en fazla bir vardiya',
    text: 'Kimse aynı gün iki vardiyada çalışmaz.',
    why: 'Arka arkaya iki vardiya 16 saat kesintisiz çalışma demektir; yorgunluk hasta güvenliğini doğrudan etkiler.',
  },
  {
    title: 'Dinlenme süresi',
    text: 'Geceden sonra Sabah veya Akşam yok, Akşamdan sonra Sabah yok.',
    why: 'İki vardiya arasında en az 11 saat kalır. AB çalışma süresi direktifindeki günlük dinlenme süresine ve INRC-II kıyaslama setindeki "yasak ardışıklık" kuralına dayanır.',
  },
  {
    title: 'İzin günlerinde atama yok',
    text: 'Personel ekranında girilen izinler.',
    why: 'Onaylanmış izin, çizelgeden önce gelir. Çözücü izinli kişiyi o gün hiçbir vardiyaya yazamaz.',
  },
  {
    title: 'Her vardiyada en az bir kıdemli',
    text: 'Deneyimli personel olmadan vardiya bırakılmaz.',
    why: 'Acil durumda karar verebilecek deneyimli biri her vardiyada bulunmalı. Bu, "yetkinlik eşleşmesi"nin ilk adımıdır.',
  },
  {
    title: 'Adil gece dağılımı (her zaman açık)',
    text: 'En çok ve en az gece alan arasındaki fark küçültülür, sonra toplam vardiya farkı.',
    why: 'Gece vardiyası en yorucu vardiyadır. Çözücü önce bu yükü olabildiğince eşit böler; eşitlik varsa toplam vardiyaları da dengeler.',
  },
];

interface Loaded {
  rules: Rules;
  shiftTypes: ShiftType[];
  nurses: Nurse[];
  /** Kapasite hesabının yapıldığı dönem: son çizelgenin dönemi. */
  start: string;
}

/** K19: vardiya kartları (+/−), haftalık sınır, değişmeyen kurallar, kapasite kontrolü. */
export function RulesPage() {
  const [data, setData] = useState<Loaded | null>(null);
  const [draft, setDraft] = useState<RulesUpdate | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.getRules(), api.getShiftTypes(), api.getNurses(), api.getSchedule()])
      .then(([rules, shiftTypes, nurses, schedule]) => {
        setData({ rules, shiftTypes, nurses, start: schedule?.startDate ?? mondayOf(todayIso()) });
        setDraft({ minStaff: rules.minStaff, maxShiftsPerWeek: rules.maxShiftsPerWeek });
      })
      .catch(notifyError);
  }, []);

  if (!data || !draft) return <Skeleton h={700} radius={28} />;

  const dirty =
    draft.maxShiftsPerWeek !== data.rules.maxShiftsPerWeek ||
    data.shiftTypes.some((s) => draft.minStaff[s.code] !== data.rules.minStaff[s.code]);

  const save = async () => {
    setSaving(true);
    try {
      const rules = await api.updateRules(draft);
      setData({ ...data, rules });
      notifySuccess('Kurallar kaydedildi. Yeni kurallar bir sonraki "Oluştur"da kullanılır.');
    } catch (e) {
      notifyError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap={20}>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={20}>
        {data.shiftTypes.map((s) => (
          <Paper
            key={s.code}
            p={24}
            style={{ background: `color-mix(in srgb, ${shiftColors[s.code]} 14%, white)` }}
          >
            <Group gap="sm">
              <ShiftPill code={s.code} size="lg" />
              <Stack gap={0}>
                <Text fz={20} fw={600}>
                  {s.name}
                </Text>
                <Text fz="sm" c="dimmed">
                  {s.start}–{s.end}
                </Text>
              </Stack>
            </Group>
            <Text fz="sm" c="dimmed" mt={24}>
              Vardiya başına kişi
            </Text>
            <Stepper
              value={draft.minStaff[s.code]}
              min={1}
              max={10}
              onChange={(v) => setDraft({ ...draft, minStaff: { ...draft.minStaff, [s.code]: v } })}
            />
          </Paper>
        ))}
        <Paper p={24} bg="lime.4">
          <Text fz={20} fw={600}>
            Haftalık sınır
          </Text>
          <Text fz="sm" c="forest.8">
            Pazartesi–Pazar arası
          </Text>
          <Text fz="sm" c="forest.8" mt={24}>
            Kişi başına en fazla vardiya
          </Text>
          <Stepper
            value={draft.maxShiftsPerWeek}
            min={1}
            max={7}
            light
            onChange={(v) => setDraft({ ...draft, maxShiftsPerWeek: v })}
          />
        </Paper>
      </SimpleGrid>

      <Group align="stretch" gap={20} className={classes.bottom}>
        <Paper p={24} style={{ flex: 2, minWidth: 0 }}>
          <Text fz={20} fw={600}>
            Değişmeyen kurallar
          </Text>
          <Text fz="sm" c="dimmed" mb="xs">
            Her çizelgede uygulanır, kapatılamaz.
          </Text>
          {FIXED.map((r) => (
            <Group key={r.title} className={classes.rule} wrap="nowrap">
              <IconCheck size={18} color="var(--mantine-color-forest-6)" style={{ flexShrink: 0 }} />
              <Stack gap={0} style={{ flex: 1 }}>
                <Text fw={600}>{r.title}</Text>
                <Text fz="sm" c="dimmed">
                  {r.text}
                </Text>
              </Stack>
              <Popover width={320} position="left" withArrow shadow="md" radius="lg">
                <Popover.Target>
                  <Button variant="subtle" color="forest.6" size="compact-sm">
                    neden?
                  </Button>
                </Popover.Target>
                <Popover.Dropdown>
                  <Text fz="sm">{r.why}</Text>
                </Popover.Dropdown>
              </Popover>
            </Group>
          ))}
        </Paper>

        <Paper p={24} style={{ flex: 1, minWidth: 320 }}>
          <Capacity data={data} draft={draft} />
          <Group mt="lg" gap="sm">
            <Button
              color="forest.8"
              c={dirty ? 'lime.3' : undefined}
              style={{ flex: 1 }}
              disabled={!dirty}
              loading={saving}
              onClick={save}
            >
              Kaydet
            </Button>
            <Button variant="default" onClick={() => setDraft(DEFAULTS)}>
              Varsayılana dön
            </Button>
          </Group>
        </Paper>
      </Group>
    </Stack>
  );
}

function Stepper(props: {
  value: number;
  min: number;
  max: number;
  light?: boolean;
  onChange: (v: number) => void;
}) {
  const variant = props.light ? 'white' : 'default';
  return (
    <Group gap="md" mt={8}>
      <ActionIcon
        size={40}
        radius={999}
        variant={variant}
        c="dark"
        aria-label="Azalt"
        disabled={props.value <= props.min}
        onClick={() => props.onChange(props.value - 1)}
      >
        <IconMinus size={18} />
      </ActionIcon>
      <Text fz={44} fw={600} w={36} ta="center" className="num">
        {props.value}
      </Text>
      <ActionIcon
        size={40}
        radius={999}
        variant={variant}
        c="dark"
        aria-label="Artır"
        disabled={props.value >= props.max}
        onClick={() => props.onChange(props.value + 1)}
      >
        <IconPlus size={18} />
      </ActionIcon>
    </Group>
  );
}

/**
 * Kaba kapasite denetimi: gereken vardiya sayısı ile personelin haftalık sınır ve izinler
 * içinde verebileceği en fazla vardiya karşılaştırılır. Dinlenme kuralı hesaba katılmaz;
 * bu yüzden "yetiyor" kesin değil, "yetmiyor" ise kesindir.
 */
function Capacity({ data, draft }: { data: Loaded; draft: RulesUpdate }) {
  const days = periodDays(data.start);
  const perDay = data.shiftTypes.reduce((s, t) => s + draft.minStaff[t.code], 0);
  const required = days.length * perDay;
  const seniorRequired = days.length * data.shiftTypes.length * data.rules.minSeniorPerShift;

  const capacityOf = (n: Nurse) =>
    [days.slice(0, 7), days.slice(7)].reduce(
      (s, week) =>
        s + Math.min(draft.maxShiftsPerWeek, week.filter((d) => !n.leaveDays.includes(d)).length),
      0,
    );
  const capacity = data.nurses.reduce((s, n) => s + capacityOf(n), 0);
  const seniorCapacity = data.nurses.filter((n) => n.senior).reduce((s, n) => s + capacityOf(n), 0);
  const ok = required <= capacity && seniorRequired <= seniorCapacity;

  return (
    <>
      <Text fz={20} fw={600}>
        Kapasite kontrolü
      </Text>
      <Text fz="sm" c="dimmed" mb="xs">
        {periodLabel(days)} dönemi için, kurallar değişince anında hesaplanır.
      </Text>
      <Row label={`Gereken vardiya (${days.length} gün)`} value={required} />
      <Row label="Personel kapasitesi (izinler düşülmüş)" value={capacity} />
      <Row label="Kıdemli gereken / kapasite" value={`${seniorRequired} / ${seniorCapacity}`} />
      <Group
        mt="md"
        p={14}
        gap="xs"
        wrap="nowrap"
        className={classes.verdict}
        data-ok={ok || undefined}
      >
        {ok ? <IconCheck size={18} /> : <IconAlertTriangle size={18} />}
        <Text fw={600} fz="sm">
          {ok
            ? 'Kurallar bu kadroyla karşılanabilir görünüyor'
            : 'Kadro yetmiyor: çözücü bu kurallarla çizelge bulamaz'}
        </Text>
      </Group>
    </>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <Group justify="space-between" className={classes.rule}>
      <Text>{label}</Text>
      <Text fw={600} className="num">
        {value}
      </Text>
    </Group>
  );
}
