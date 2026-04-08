import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const STATUS_COLORS = {
  Open: { bg: 'rgba(239,68,68,0.85)', border: '#ef4444' },
  'In Progress': { bg: 'rgba(245,158,11,0.85)', border: '#f59e0b' },
  Closed: { bg: 'rgba(34,197,94,0.85)', border: '#22c55e' },
};

const StatusChart = ({ data, loading }) => {
  if (loading) return <ChartSkeleton />;

  const labels = data.map((d) => d.label);
  const counts = data.map((d) => d.count);
  const total = counts.reduce((a, b) => a + b, 0);

  const chartData = {
    labels,
    datasets: [
      {
        data: counts,
        backgroundColor: labels.map((l) => STATUS_COLORS[l]?.bg || 'rgba(100,116,139,0.8)'),
        borderColor: labels.map((l) => STATUS_COLORS[l]?.border || '#64748b'),
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { size: 12, family: "'Syne', sans-serif" },
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
        },
      },
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
            return `  ${ctx.label}: ${ctx.raw} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="st-chart-card card st-card">
      <div className="card-header st-chart-header">
        <i className="bi bi-pie-chart-fill text-primary me-2" />
        Issues by Status
      </div>
      <div className="card-body" style={{ position: 'relative', height: 260 }}>
        {total === 0 ? (
          <EmptyChart message="No issues tracked yet" />
        ) : (
          <>
            <Doughnut data={chartData} options={options} />
            {/* Center total label */}
            <div className="st-donut-center">
              <div className="st-donut-num">{total}</div>
              <div className="st-donut-label">Total</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const PriorityChart = ({ data, loading }) => {
  if (loading) return <ChartSkeleton />;

  const PRIORITY_COLORS = {
    Critical: 'rgba(239,68,68,0.8)',
    High: 'rgba(245,158,11,0.8)',
    Medium: 'rgba(59,130,246,0.8)',
    Low: 'rgba(100,116,139,0.8)',
  };

  const PRIORITY_BORDERS = {
    Critical: '#ef4444',
    High: '#f59e0b',
    Medium: '#3b82f6',
    Low: '#64748b',
  };

  const labels = data.map((d) => d.label);
  const counts = data.map((d) => d.count);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Issues',
        data: counts,
        backgroundColor: labels.map((l) => PRIORITY_COLORS[l] || 'rgba(100,116,139,0.8)'),
        borderColor: labels.map((l) => PRIORITY_BORDERS[l] || '#64748b'),
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
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
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#64748b', font: { size: 11 }, stepSize: 1 },
        beginAtZero: true,
      },
    },
  };

  const total = counts.reduce((a, b) => a + b, 0);

  return (
    <div className="st-chart-card card st-card">
      <div className="card-header st-chart-header">
        <i className="bi bi-bar-chart-fill text-warning me-2" />
        Issues by Priority
      </div>
      <div className="card-body" style={{ position: 'relative', height: 260 }}>
        {total === 0 ? (
          <EmptyChart message="No issues tracked yet" />
        ) : (
          <ChartWrapper>
            <Bar data={chartData} options={options} />
          </ChartWrapper>
        )}
      </div>
    </div>
  );
};

/* ─── Shared helpers ────────────────────────────────────────────────────────── */
const ChartSkeleton = () => (
  <div className="card st-card" style={{ height: '100%' }}>
    <div className="card-header st-chart-header">
      <div className="st-skeleton" style={{ width: 160, height: 14 }} />
    </div>
    <div className="card-body d-flex align-items-center justify-content-center" style={{ height: 260 }}>
      <div className="st-skeleton" style={{ width: '80%', height: '80%', borderRadius: 12 }} />
    </div>
  </div>
);

const EmptyChart = ({ message }) => (
  <div className="d-flex flex-column align-items-center justify-content-center h-100">
    <i className="bi bi-bar-chart" style={{ fontSize: 36, color: '#334155', marginBottom: 8 }} />
    <span style={{ color: '#475569', fontSize: 12 }}>{message}</span>
  </div>
);

// Needed for Bar imported separately
const ChartWrapper = ({ children }) => (
  <div style={{ position: 'relative', width: '100%', height: '100%' }}>{children}</div>
);

export { StatusChart, PriorityChart, ChartSkeleton, EmptyChart };
export default StatusChart;
