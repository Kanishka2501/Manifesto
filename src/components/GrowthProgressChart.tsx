import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AppState } from '../types';
import { calcStreak } from '../storage';

interface GrowthProgressChartProps {
  state: AppState;
  onNavigate: (view: string) => void;
}

export const GrowthProgressChart: React.FC<GrowthProgressChartProps> = ({ state, onNavigate }) => {
  const [metric, setMetric] = useState<'frequency' | 'flow'>('frequency');
  const [timeRange, setTimeRange] = useState<7 | 14>(7);

  // Generate date points for the past N days
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();

    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      // Count journal entries on this date
      const entriesCount = state.journal.filter(j => {
        try {
          const entryDate = new Date(j.at);
          if (!isNaN(entryDate.getTime())) {
            return (
              entryDate.getFullYear() === d.getFullYear() &&
              entryDate.getMonth() === d.getMonth() &&
              entryDate.getDate() === d.getDate()
            );
          }
        } catch (_) {}
        return j.at.startsWith(isoDate) || j.at.includes(d.toLocaleDateString());
      }).length;

      // Practice completed on this day
      const practiceCompleted = state.days.includes(isoDate);

      // Flow score (1 to 10 scale based on dedication, practice & reflection)
      let flowScore = 2; // base peace
      if (practiceCompleted) flowScore += 4;
      if (entriesCount > 0) flowScore += Math.min(4, entriesCount * 2);

      data.push({
        date: label,
        isoDate,
        entries: entriesCount,
        practices: practiceCompleted ? 1 : 0,
        flow: Math.min(10, flowScore),
      });
    }

    return data;
  }, [state.journal, state.days, timeRange]);

  const totalEntriesInRange = chartData.reduce((acc, curr) => acc + curr.entries, 0);
  const activeDaysCount = chartData.filter(d => d.practices > 0 || d.entries > 0).length;
  const streak = calcStreak(state.days);

  return (
    <div className="card in" style={{ margin: '18px 0', padding: '22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <div>
          <span className="eyebrow" style={{ fontSize: '0.7em' }}>Dedication &amp; Momentum</span>
          <h2 style={{ margin: '4px 0 2px' }}>📈 Growth Progress</h2>
          <p className="small" style={{ margin: 0, opacity: 0.85 }}>
            Visualize your journaling rhythm, practice completion, and mindful consistency over time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <select
            value={metric}
            onChange={e => setMetric(e.target.value as any)}
            style={{ width: 'auto', padding: '4px 10px', fontSize: '0.82em' }}
          >
            <option value="frequency">Journal &amp; Practice Activity</option>
            <option value="flow">Mindful Flow &amp; Harmony (1-10)</option>
          </select>

          <select
            value={timeRange}
            onChange={e => setTimeRange(Number(e.target.value) as any)}
            style={{ width: 'auto', padding: '4px 8px', fontSize: '0.82em' }}
          >
            <option value={7}>Past 7 Days</option>
            <option value={14}>Past 14 Days</option>
          </select>
        </div>
      </div>

      {/* Quick summary metric cards */}
      <div className="tri" style={{ margin: '14px 0' }}>
        <div className="card" style={{ margin: 0, padding: '12px 14px', background: 'rgba(255,255,255,0.06)' }}>
          <span className="small">Active Days</span>
          <h3 style={{ margin: '2px 0 0', fontSize: '1.3em' }}>{activeDaysCount} of {timeRange}</h3>
        </div>
        <div className="card" style={{ margin: 0, padding: '12px 14px', background: 'rgba(255,255,255,0.06)' }}>
          <span className="small">Journal Entries</span>
          <h3 style={{ margin: '2px 0 0', fontSize: '1.3em' }}>{totalEntriesInRange} entries</h3>
        </div>
        <div className="card" style={{ margin: 0, padding: '12px 14px', background: 'rgba(255,255,255,0.06)' }}>
          <span className="small">Current Dedication Streak</span>
          <h3 style={{ margin: '2px 0 0', fontSize: '1.3em' }}>🔥 {streak} Day(s)</h3>
        </div>
      </div>

      {/* Recharts Line Chart Container */}
      <div style={{ width: '100%', height: 260, marginTop: 10 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 16, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
            <XAxis
              dataKey="date"
              stroke="var(--ink)"
              tick={{ fontSize: 12, fill: 'var(--ink)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            />
            <YAxis
              allowDecimals={false}
              stroke="var(--ink)"
              tick={{ fontSize: 12, fill: 'var(--ink)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              domain={metric === 'flow' ? [0, 10] : [0, 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--pri)',
                color: 'var(--ink)',
                borderRadius: 6,
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                fontFamily: 'inherit',
                fontSize: '0.88em',
              }}
              labelStyle={{ fontWeight: 600, color: 'var(--pri)' }}
            />
            {metric === 'frequency' ? (
              <>
                <Line
                  type="monotone"
                  dataKey="entries"
                  name="Journal Entries"
                  stroke="var(--pri)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: 'var(--pri)' }}
                  activeDot={{ r: 6, fill: '#fff', stroke: 'var(--pri)', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="practices"
                  name="Daily Practice Done"
                  stroke="#ffe68a"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#ffe68a' }}
                />
              </>
            ) : (
              <Line
                type="natural"
                dataKey="flow"
                name="Mindful Alignment"
                stroke="var(--pri)"
                strokeWidth={3}
                dot={{ r: 4, fill: 'var(--pri)' }}
                activeDot={{ r: 7, fill: '#ffe68a', stroke: 'var(--pri)', strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="acts" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
        <span className="small" style={{ opacity: 0.75 }}>
          Log regular journal reflections or mark your daily practice to see your chart flourish.
        </span>
        <button className="btn" onClick={() => onNavigate('journal')}>
          Open Journal 📖
        </button>
      </div>
    </div>
  );
};
