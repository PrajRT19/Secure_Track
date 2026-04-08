import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { ChartSkeleton, EmptyChart } from './StatusChart';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const PRIORITY_META = {
  Critical: { bg: 'rgba(239,68,68,0.85)', border: '#ef4444', glow: 'rgba(239,68,68,0.2)' },
  High:     { bg: 'rgba(245,158,11,0.85)', border: '#f59e0b', glow: 'rgba(245,158,11,0.2)' },
  Medium:   { bg: 'rgba(59,130,246,0.85)',  border: '#3b82f6', glow: 'rgba(59,130,246,0.2)' },
  Low:      { bg: 'rgba(100,116,139,0.85)', border: '#64748b', glow: 'rgba(100,116,139,0.2)' },
};

const PriorityChart = ({ data, loading }) => {
  if (loading) return <ChartSkeleton />;

  const total = data.reduce((a, d) => a + d.count, 0);

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: 'Issues',
        data: data.map((d) => d.count),
        backgroundColor: data.map((d) => PRIORITY_META[d.label]?.bg || 'rgba(100,116,139,0.8)'),
        borderColor: data.map((d) => PRIORITY_META[d.label]?.border || '#64748b'),
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    indexAxis: 'y',           // Horizontal bars
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f1318',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
            return `  ${ctx.raw} issues (${pct}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
        ticks: { color: '#475569', font: { size: 11 }, precision: 0, stepSize: 1 },
        beginAtZero: true,
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 12, weight: '500', family: "'Syne', sans-serif" },
        },
      },
    },
  };

  return (
    <div className="card st-card">
      <div className="card-header st-chart-header">
        <i className="bi bi-bar-chart-horizontal-fill text-warning me-2" />
        Issues by Priority
      </div>
      <div className="card-body" style={{ height: 220, position: 'relative' }}>
        {total === 0 ? (
          <EmptyChart message="No issues tracked yet" />
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </div>

      {/* Legend pills below chart */}
      {total > 0 && (
        <div
          className="card-body pt-0 d-flex gap-2 flex-wrap"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 16px' }}
        >
          {data.map((d) => {
            const meta = PRIORITY_META[d.label];
            const pct = total > 0 ? ((d.count / total) * 100).toFixed(0) : 0;
            return (
              <div
                key={d.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: meta?.glow || 'rgba(100,116,139,0.1)',
                  border: `1px solid ${meta?.border || '#64748b'}44`,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: meta?.border || '#94a3b8' }}>
                  {d.label}
                </span>
                <span style={{ fontSize: 10, color: '#64748b' }}>
                  {d.count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PriorityChart;
