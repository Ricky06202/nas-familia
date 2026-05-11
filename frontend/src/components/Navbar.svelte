<script lang="ts">
  import { onMount } from 'svelte';

  let profileName = '';
  let profileColor = '';
  let initials = '';
  let menuOpen = false;

  onMount(() => {
    profileName = localStorage.getItem('nas_profile_name') || 'Perfil';
    profileColor = localStorage.getItem('nas_profile_color') || '#818cf8';
    initials = profileName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  });

  function goHome() {
    window.location.href = '/';
  }

  function goToDashboard() {
    window.location.href = '/dashboard';
  }

  function goToFiles() {
    window.location.href = '/files';
  }

  function changeProfile() {
    window.location.href = '/profiles';
  }
</script>

<nav class="sticky top-0 z-50 bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-gray-800/50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <button on:click={goHome} class="flex items-center gap-3 group">
        <div class="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        </div>
        <span class="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors hidden sm:block">
          La Familia Sanjur
        </span>
      </button>

      <!-- Navigation -->
      <div class="flex items-center gap-1 sm:gap-2">
        <button on:click={goToDashboard} class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all">
          Dashboard
        </button>
        <button on:click={goToFiles} class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all">
          Archivos
        </button>
      </div>

      <!-- Profile -->
      <div class="relative">
        <button on:click={() => menuOpen = !menuOpen} class="flex items-center gap-3 group">
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white transition-transform group-hover:scale-110"
            style="background: {profileColor};"
          >
            {initials}
          </div>
          <span class="text-sm text-gray-300 group-hover:text-white transition-colors hidden sm:block">{profileName}</span>
        </button>

        {#if menuOpen}
          <div class="absolute right-0 mt-2 w-48 bg-[#1a1a2e] rounded-xl shadow-2xl border border-gray-800 py-2">
            <button on:click={changeProfile} class="w-full px-4 py-2 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
              Cambiar Perfil
            </button>
            <button on:click={changeProfile} class="w-full px-4 py-2 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
              Cerrar Sesión
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</nav>

<svelte:window on:click={() => menuOpen = false} />
