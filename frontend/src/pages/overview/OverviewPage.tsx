import { Grid, Skeleton } from '@mantine/core';
import { useEffect, useState } from 'react';
import { api, getCurrentSchedule, type ActivityEvent, type Nurse, type Rules, type Schedule, type ShiftType } from '../../api';
import { computeStats } from '../../api/stats';
import { mondayOf, todayIso } from '../../format';
import { notifyError, notifySuccess } from '../../notify';
import { unsolvedMessage } from '../schedule/unsolved';
import { ActivityCard } from './ActivityCard';
import { FairnessCard } from './FairnessCard';
import { NightsCard } from './NightsCard';
import { ShiftMixCard } from './ShiftMixCard';
import { SummaryCard } from './SummaryCard';

interface Loaded {
  nurses: Nurse[];
  rules: Rules;
  shiftTypes: ShiftType[];
  activity: ActivityEvent[];
  schedule: Schedule;
}

export function OverviewPage({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [data, setData] = useState<Loaded | null>(null);
  const [solving, setSolving] = useState(false);

  useEffect(() => {
    // Hiç çizelge yoksa bu haftanın dönemi için bir tane oluşturulur.
    const schedule = getCurrentSchedule(todayIso()).then(
      (s) => s ?? api.generateSchedule(mondayOf(todayIso())),
    );
    Promise.all([
      api.getNurses(),
      api.getRules(),
      api.getShiftTypes(),
      schedule.then((s) => api.getActivity(s.startDate)),
      schedule,
    ])
      .then(([nurses, rules, shiftTypes, activity, schedule]) =>
        setData({ nurses, rules, shiftTypes, activity, schedule }),
      )
      .catch(notifyError);
  }, []);

  if (!data) return <OverviewSkeleton />;

  const solve = async () => {
    setSolving(true);
    try {
      const schedule = await api.generateSchedule(data.schedule.startDate);
      if (schedule.assignments.length === 0) {
        notifyError(new Error(unsolvedMessage(schedule.status)));
        return;
      }
      const activity = await api.getActivity(schedule.startDate);
      setData((d) => d && { ...d, schedule, activity });
      notifySuccess('Çizelge yeniden oluşturuldu.');
    } catch (e) {
      notifyError(e);
    } finally {
      setSolving(false);
    }
  };

  const current = data.schedule;
  const stats = computeStats(current, data.nurses, data.rules);

  return (
    <Grid gutter={20}>
      <Grid.Col span={{ base: 12, md: 7 }}>
        <SummaryCard
          schedule={current}
          stats={stats}
          nurses={data.nurses}
          rules={data.rules}
          shiftTypes={data.shiftTypes}
          solving={solving}
          onSolve={solve}
          onNavigate={onNavigate}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 5 }}>
        <FairnessCard stats={stats} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
        <ShiftMixCard stats={stats} days={current.days} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
        <NightsCard stats={stats} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, lg: 4 }}>
        <ActivityCard events={data.activity} />
      </Grid.Col>
    </Grid>
  );
}

function OverviewSkeleton() {
  return (
    <Grid gutter={20}>
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Skeleton h={300} radius={28} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Skeleton h={300} radius={28} />
      </Grid.Col>
      {[0, 1, 2].map((i) => (
        <Grid.Col key={i} span={{ base: 12, sm: 6, lg: 4 }}>
          <Skeleton h={360} radius={28} />
        </Grid.Col>
      ))}
    </Grid>
  );
}
