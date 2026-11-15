import {
  Avatar,
  Badge,
  Button,
  Group,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Switch,
  Text,
  TextInput,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconPencil, IconStarFilled, IconTrash, IconUserPlus, IconUsers } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { api, type Nurse, type NurseInput } from '../../api';
import { todayIso } from '../../format';
import { notifyError, notifySuccess } from '../../notify';
import classes from './Staff.module.css';

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toLocaleUpperCase('tr');

const shortDate = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** "7–8 Kas, 11 Kas": ardışık günleri birleştirir. */
function leaveLabel(days: string[]): string {
  if (days.length === 0) return '—';
  const sorted = [...days].sort();
  const parts: string[] = [];
  let from = sorted[0];
  let prev = sorted[0];
  const next = (d: string) => new Date(Date.parse(d) + 86_400_000).toISOString().slice(0, 10);
  for (const d of [...sorted.slice(1), '']) {
    if (d && d === next(prev)) {
      prev = d;
      continue;
    }
    const a = new Date(from);
    parts.push(
      from === prev ? shortDate.format(a) : `${a.getUTCDate()}–${shortDate.format(new Date(prev))}`,
    );
    from = prev = d;
  }
  return parts.join(', ');
}

type Editing = { mode: 'new' } | { mode: 'edit'; nurse: Nurse } | null;

/** K19: personel tablosu + sağda düzenleme paneli (ad, kıdemli, çoklu izin günü). */
export function StaffPage() {
  const [nurses, setNurses] = useState<Nurse[] | null>(null);
  const [editing, setEditing] = useState<Editing>(null);

  useEffect(() => {
    api.getNurses().then(setNurses).catch(notifyError);
  }, []);

  if (!nurses) return <Skeleton h={820} radius={28} />;

  const today = todayIso();
  const upcomingLeave = nurses.reduce((s, n) => s + n.leaveDays.filter((d) => d >= today).length, 0);

  return (
    <Group align="stretch" gap={20} wrap="nowrap" className={classes.layout}>
      <Paper p={24} style={{ flex: 1, minWidth: 0 }}>
        <Group justify="space-between" mb="md">
          <Stack gap={2}>
            <Text fz={22} fw={600}>
              Personel
            </Text>
            <Text c="dimmed" fz="sm">
              {nurses.length} hemşire · {nurses.filter((n) => n.senior).length} kıdemli · bugünden
              sonra {upcomingLeave} izin günü
            </Text>
          </Stack>
          <Button
            color="forest.8"
            c="lime.3"
            leftSection={<IconUserPlus size={18} />}
            onClick={() => setEditing({ mode: 'new' })}
          >
            Personel Ekle
          </Button>
        </Group>

        <Group className={classes.headRow} wrap="nowrap">
          <span className={classes.colAvatar} />
          <Text className={classes.colName}>Ad Soyad</Text>
          <Text className={classes.colSenior}>Kıdem</Text>
          <Text className={classes.colLeave}>İzin günleri</Text>
          <span className={classes.colEdit} />
        </Group>
        <ScrollArea.Autosize mah="calc(100vh - 260px)">
          {nurses.map((n) => (
            <UnstyledButton
              key={n.id}
              className={classes.row}
              data-active={(editing?.mode === 'edit' && editing.nurse.id === n.id) || undefined}
              onClick={() => setEditing({ mode: 'edit', nurse: n })}
            >
              <Group wrap="nowrap">
                <Avatar
                  className={classes.colAvatar}
                  radius="xl"
                  variant="filled"
                  color={n.senior ? 'forest.8' : 'forest.3'}
                  c={n.senior ? 'lime.3' : 'white'}
                >
                  {initials(n.name)}
                </Avatar>
                <Stack gap={0} className={classes.colName}>
                  <Text fw={600}>{n.name}</Text>
                  <Text fz="sm" c="dimmed">
                    {n.title}
                  </Text>
                </Stack>
                <div className={classes.colSenior}>
                  {n.senior && (
                    <Badge color="lime.1" c="forest.8" leftSection={<IconStarFilled size={10} />}>
                      Kıdemli
                    </Badge>
                  )}
                </div>
                <Text fz="sm" c="dimmed" className={classes.colLeave}>
                  {leaveLabel(n.leaveDays)}
                </Text>
                <IconPencil size={16} className={classes.colEdit} color="#999" />
              </Group>
            </UnstyledButton>
          ))}
        </ScrollArea.Autosize>
      </Paper>

      <Paper p={24} w={420} className={classes.panel}>
        {editing ? (
          <NurseForm
            key={editing.mode === 'edit' ? editing.nurse.id : 'new'}
            nurse={editing.mode === 'edit' ? editing.nurse : null}
            onCancel={() => setEditing(null)}
            onSaved={(saved) => {
              setNurses((list) =>
                list!.some((n) => n.id === saved.id)
                  ? list!.map((n) => (n.id === saved.id ? saved : n))
                  : [...list!, saved],
              );
              setEditing({ mode: 'edit', nurse: saved });
            }}
            onDeleted={(id) => {
              setNurses((list) => list!.filter((n) => n.id !== id));
              setEditing(null);
            }}
          />
        ) : (
          <Stack align="center" justify="center" h="100%" ta="center" gap="sm">
            <ThemeIcon size={72} radius={999} color="lime.4" c="forest.9">
              <IconUsers size={34} />
            </ThemeIcon>
            <Text fw={600} fz={18}>
              Bir personel seçin
            </Text>
            <Text c="dimmed" fz="sm" maw={280}>
              Düzenlemek için listeden birine tıklayın ya da "Personel Ekle"ye basın.
            </Text>
          </Stack>
        )}
      </Paper>
    </Group>
  );
}

function NurseForm({
  nurse,
  onCancel,
  onSaved,
  onDeleted,
}: {
  nurse: Nurse | null;
  onCancel: () => void;
  onSaved: (n: Nurse) => void;
  onDeleted: (id: string) => void;
}) {
  const [form, setForm] = useState<NurseInput>({
    name: nurse?.name ?? '',
    senior: nurse?.senior ?? false,
    leaveDays: nurse?.leaveDays ?? [],
  });
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameError = form.name.trim() === '' ? 'Ad boş olamaz' : null;

  const save = async () => {
    if (nameError) return;
    setBusy(true);
    try {
      const saved = nurse ? await api.updateNurse(nurse.id, form) : await api.createNurse(form);
      notifySuccess(nurse ? 'Değişiklikler kaydedildi.' : `${saved.name} eklendi.`);
      onSaved(saved);
    } catch (e) {
      notifyError(e);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!nurse) return;
    setBusy(true);
    try {
      await api.deleteNurse(nurse.id);
      notifySuccess(`${nurse.name} silindi.`);
      onDeleted(nurse.id);
    } catch (e) {
      notifyError(e);
      setBusy(false);
    }
  };

  return (
    <Stack gap="md" h="100%">
      <Stack gap={2}>
        <Text fz={20} fw={600}>
          {nurse ? `${nurse.name} · düzenle` : 'Yeni personel'}
        </Text>
        <Text c="dimmed" fz="sm">
          Değişiklik bir sonraki "Oluştur"da kullanılır.
        </Text>
      </Stack>

      <TextInput
        label="Ad Soyad"
        radius="lg"
        value={form.name}
        error={form.name !== '' || nurse ? nameError : null}
        onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
        data-autofocus
      />

      <Switch
        size="md"
        color="forest.8"
        label="Kıdemli"
        description="Her vardiyada en az bir kıdemli hemşire bulunur."
        checked={form.senior}
        onChange={(e) => setForm({ ...form, senior: e.currentTarget.checked })}
      />

      <Stack gap={6}>
        <Text fz="sm" fw={500}>
          İzin günleri{' '}
          <Text span c="dimmed" fz="sm">
            ({form.leaveDays.length} gün seçili)
          </Text>
        </Text>
        <DatePicker
          type="multiple"
          value={form.leaveDays}
          onChange={(days) => setForm({ ...form, leaveDays: [...days].sort() })}
          defaultDate={form.leaveDays[0] ?? todayIso()}
          size="md"
          classNames={{ day: classes.day }}
        />
      </Stack>

      <Group mt="auto" gap="sm">
        <Button color="forest.8" c="lime.3" style={{ flex: 1 }} loading={busy} onClick={save} disabled={!!nameError}>
          {nurse ? 'Kaydet' : 'Ekle'}
        </Button>
        {nurse ? (
          <Button
            variant={confirmDelete ? 'filled' : 'default'}
            color="red"
            leftSection={<IconTrash size={16} />}
            disabled={busy}
            onClick={() => (confirmDelete ? remove() : setConfirmDelete(true))}
          >
            {confirmDelete ? 'Emin misiniz?' : 'Sil'}
          </Button>
        ) : (
          <Button variant="default" onClick={onCancel}>
            Vazgeç
          </Button>
        )}
      </Group>
    </Stack>
  );
}
