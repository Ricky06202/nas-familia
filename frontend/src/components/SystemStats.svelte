<script lang="ts">
  import { api, type SystemStats } from '../lib/api';
  import { onMount, onDestroy } from 'svelte';

  let stats: SystemStats | null = null;
  let loading = true;
  let error = '';
  let interval: ReturnType<typeof setInterval>;

  onMount(() => {
    fetchStats();
    interval = setInterval(fetchStats, 5000);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });

  async function fetchStats() {
    try {
      stats = await api.system.stats();
      error = '';
    } catch (e) {
      error = 'Error al obtener estadísticas del sistema';
    } finally {
      loading = false;
    }
  }

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
    const parts = [];
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

  function getStatusText(percent: number): string {
    if (percent < 50) return 'normal';
    if (percent < 80) return 'alto';
    return 'crítico';
  }
</script>

{#if loading}
  <div class="flex justify-center items-center h-64">
    <div class="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
  </div>
{:else if error}
  <div class="text-center py-12">
    <p class="text-red-400 text-lg">{error}</p>
    <button on:click={fetchStats} class="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
      Reintentar
    </button>
  </div>
{:else if stats}
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- CPU Card -->
    <div class="bg-[#1a1a2e] rounded-2xl p-6 border border-gray-800 hover:border-indigo-500/30 transition-all duration-300">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-medium text-gray-400 uppercase tracking-wider">CPU</h3>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">{stats.cpu.model.split(' ').slice(0, 2).join(' ')}</span>
          <div class="w-2 h-2 rounded-full" style="background: {getStatusColor(stats.cpu.percent)};"></div>
        </div>
      </div>
      <div class="flex items-center gap-6">
        <svg class="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="30" fill="none" stroke="currentColor" stroke-width="4" class="text-gray-800" />
          <circle
            cx="36" cy="36" r="30" fill="none" stroke-width="4"
            stroke-dasharray="188.5"
            stroke-dashoffset={188.5 - (188.5 * stats.cpu.percent) / 100}
            stroke={getStatusColor(stats.cpu.percent)}
            stroke-linecap="round"
            class="transition-all duration-1000 ease-out"
          />
        </svg>
        <div>
          <p class="text-3xl font-bold text-white">{stats.cpu.percent.toFixed(1)}%</p>
          <p class="text-sm text-gray-400">{stats.cpu.cores} núcleos</p>
          <p class="text-xs text-gray-500 capitalize">{getStatusText(stats.cpu.percent)}</p>
        </div>
      </div>
    </div>

    <!-- RAM Card -->
    <div class="bg-[#1a1a2e] rounded-2xl p-6 border border-gray-800 hover:border-purple-500/30 transition-all duration-300">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-medium text-gray-400 uppercase tracking-wider">RAM</h3>
        <div class="w-2 h-2 rounded-full" style="background: {getStatusColor(stats.memory.used_percent)};"></div>
      </div>
      <div class="flex items-center gap-6">
        <svg class="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="30" fill="none" stroke="currentColor" stroke-width="4" class="text-gray-800" />
          <circle
            cx="36" cy="36" r="30" fill="none" stroke-width="4"
            stroke-dasharray="188.5"
            stroke-dashoffset={188.5 - (188.5 * stats.memory.used_percent) / 100}
            stroke={getStatusColor(stats.memory.used_percent)}
            stroke-linecap="round"
            class="transition-all duration-1000 ease-out"
          />
        </svg>
        <div>
          <p class="text-3xl font-bold text-white">{stats.memory.used_percent.toFixed(1)}%</p>
          <p class="text-sm text-gray-400">{formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)}</p>
          <p class="text-xs text-gray-500 capitalize">{getStatusText(stats.memory.used_percent)}</p>
        </div>
      </div>
    </div>

    <!-- Disk Card -->
    <div class="bg-[#1a1a2e] rounded-2xl p-6 border border-gray-800 hover:border-amber-500/30 transition-all duration-300">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-medium text-gray-400 uppercase tracking-wider">Disco NAS</h3>
        <div class="w-2 h-2 rounded-full" style="background: {getStatusColor(stats.disk.used_percent)};"></div>
      </div>
      <div class="flex items-center gap-6">
        <svg class="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="30" fill="none" stroke="currentColor" stroke-width="4" class="text-gray-800" />
          <circle
            cx="36" cy="36" r="30" fill="none" stroke-width="4"
            stroke-dasharray="188.5"
            stroke-dashoffset={188.5 - (188.5 * stats.disk.used_percent) / 100}
            stroke={getStatusColor(stats.disk.used_percent)}
            stroke-linecap="round"
            class="transition-all duration-1000 ease-out"
          />
        </svg>
        <div>
          <p class="text-3xl font-bold text-white">{stats.disk.used_percent.toFixed(1)}%</p>
          <p class="text-sm text-gray-400">{formatBytes(stats.disk.used)} / {formatBytes(stats.disk.total)}</p>
          <p class="text-xs text-gray-500 capitalize">{getStatusText(stats.disk.used_percent)}</p>
        </div>
      </div>
    </div>

    <!-- Info Card -->
    <div class="bg-[#1a1a2e] rounded-2xl p-6 border border-gray-800 hover:border-emerald-500/30 transition-all duration-300">
      <h3 class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Sistema</h3>
      <div class="space-y-3">
        <div>
          <p class="text-xs text-gray-500">Hostname</p>
          <p class="text-sm font-medium text-white">{stats.hostname}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">OS</p>
          <p class="text-sm font-medium text-white">{stats.os}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Actividad desde</p>
          <p class="text-sm font-medium text-white">{formatUptime(stats.uptime)}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Red</p>
          <p class="text-sm font-medium text-white">↓ {formatBytes(stats.network.bytes_recv)} / ↑ {formatBytes(stats.network.bytes_sent)}</p>
        </div>
      </div>
    </div>
  </div>
{/if}
