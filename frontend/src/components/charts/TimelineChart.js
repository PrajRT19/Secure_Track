import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { ChartSkeleton, EmptyChart } from './StatusChart';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

/**
 * TimelineChart — dual-line chart showing:
 * - Issues created per day (blue)
 * - Analyses (scans) per day (purple)
 * over the last 30 days
 */
const TimelineChart = ({ data, loading }) => {
  if (loading) return <ChartSkeleton />;

  const hasAnyData = data?.some((d) => d.issues > 0 || d.analyses > 0);

  // Show last 14 days labels as short "Jun 3" format for readability
  const labels = (data || []).map((d) => {
    const dt = new Date(d.date + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const issueValues = (data || []).map((d) => d.issues);
  const analysisValues = (data || []).map((d) => d.analyses);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Issues Created',
        data: issueValues,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.08)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#0f1318',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Code Scans',
        data: analysisValues,
        borderColor: '#a78bfa',
        backgroundColor: 'rgba(167,139,250,0.06)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#a78bfa',
        pointBorderColor: '#0f1318',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
        borderDash: [5, 3],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: '#94a3b8',
          font: { size: 11, family: "'Syne', sans-serif" },
          padding: 12,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#0f1318',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        titleColor: '#94a3b8',
        bodyColor: '#e2e8f0',
        padding: 12,
        callbacks: {
          title: (items) => items[0]?.label || '',
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
        ticks: {
          color: '#475569',
          font: { size: 10 },
          // Show every 5th label to avoid crowding on 30-day view
          maxTicksLimit: 8,
          maxRotation: 0,
        },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
        ticks: {
          color: '#475569',
          font: { size: 11 },
          stepSize: 1,
          precision: 0,
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="card st-card">
      <div className="card-header st-chart-header">
        <i className="bi bi-graph-up text-primary me-2" />
        Activity Over Last 30 Days
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            color: '#475569',
            fontWeight: 400,
          }}
        >
          Issues & Scans
        </span>
      </div>
      <div className="card-body" style={{ height: 240, position: 'relative' }}>
        {!hasAnyData ? (
          <EmptyChart message="No activity in the last 30 days" />
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default TimelineChart;
