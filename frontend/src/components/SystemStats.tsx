import { useState, useEffect } from 'react';
import { api, type SystemStats as Stats } from '../lib/api';

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
}

function getStatusColor(percent: number): string {
  if (percent < 50) return '#34d399';
  if (percent < 80) return '#fbbf24';
  return '#f87171';
}

function CircularProgress({ percent, size = 80 }: { percent: number; size?: number }) {
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (circumference * percent) / 100;

  return (
    <svg className={`w-${size/4} h-${size/4} -rotate-90`} viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-800" />
      <circle
        cx="36" cy="36" r={r} fill="none" strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        stroke={getStatusColor(percent)}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

function StatCard({ title, percent, value, subtitle, status }: {
  title: string; percent: number; value: string; subtitle: string; status: string;
}) {
  return (
    <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-gray-800 hover:border-indigo-500/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{subtitle}</span>
          <div className="w-2 h-2 rounded-full" style={{ background: getStatusColor(percent) }} />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <CircularProgress percent={percent} />
        <div>
          <p className="text-3xl font-bold text-white">{percent.toFixed(1)}%</p>
          <p className="text-sm text-gray-400">{value}</p>
          <p className="text-xs text-gray-500 capitalize">{status}</p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}

export default function SystemStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchStats() {
    try {
      const data = await api.system.stats();
      setStats(data);
      setError('');
    } catch {
      setError('Error al obtener estadísticas del sistema');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-lg">{error}</p>
        <button onClick={fetchStats} className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
          Reintentar
        </button>
      </div>
    );
  }

  if (!stats) return null;

  function getStatusText(p: number) {
    if (p < 50) return 'normal';
    if (p < 80) return 'alto';
    return 'crítico';
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="CPU"
        percent={stats.cpu.percent}
        value={`${stats.cpu.cores} núcleos`}
        subtitle={stats.cpu.model.split(' ').slice(0, 2).join(' ')}
        status={getStatusText(stats.cpu.percent)}
      />
      <StatCard
        title="RAM"
        percent={stats.memory.used_percent}
        value={`${formatBytes(stats.memory.used)} / ${formatBytes(stats.memory.total)}`}
        subtitle=""
        status={getStatusText(stats.memory.used_percent)}
      />
      <StatCard
        title="Disco NAS"
        percent={stats.disk.used_percent}
        value={`${formatBytes(stats.disk.used)} / ${formatBytes(stats.disk.total)}`}
        subtitle=""
        status={getStatusText(stats.disk.used_percent)}
      />
      <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-gray-800 hover:border-emerald-500/30 transition-all duration-300">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Sistema</h3>
        <div className="space-y-3">
          <InfoRow label="Hostname" value={stats.hostname} />
          <InfoRow label="OS" value={stats.os} />
          <InfoRow label="Actividad desde" value={formatUptime(stats.uptime)} />
          <InfoRow
            label="Red"
            value={`↓ ${formatBytes(stats.network.bytes_recv)} / ↑ ${formatBytes(stats.network.bytes_sent)}`}
          />
        </div>
      </div>
    </div>
  );
}
