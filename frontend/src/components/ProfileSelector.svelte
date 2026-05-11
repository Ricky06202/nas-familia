<script lang="ts">
  import { api, type Profile } from '../lib/api';
  import { onMount } from 'svelte';

  let profiles: Profile[] = [];
  let loading = true;
  let showAddForm = false;
  let newName = '';
  let newColor = '#818cf8';
  let error = '';

  const colors = [
    '#818cf8', '#f472b6', '#34d399', '#fbbf24',
    '#f87171', '#60a5fa', '#a78bfa', '#fb923c',
  ];

  onMount(async () => {
    try {
      profiles = await api.profiles.list();
    } catch (e) {
      error = 'Error al cargar perfiles';
    } finally {
      loading = false;
    }
  });

  function getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  async function selectProfile(profile: Profile) {
    localStorage.setItem('nas_profile_id', String(profile.id));
    localStorage.setItem('nas_profile_name', profile.name);
    localStorage.setItem('nas_profile_color', profile.color);
    localStorage.setItem('nas_profile_avatar', profile.avatar);
    window.location.href = '/dashboard';
  }

  async function addProfile() {
    if (!newName.trim()) return;
    try {
      const profile = await api.profiles.create({ name: newName.trim(), color: newColor });
      profiles = [...profiles, profile];
      newName = '';
      showAddForm = false;
    } catch (e) {
      error = 'Error al crear perfil';
    }
  }

  async function deleteProfile(id: number) {
    const profile = profiles.find(p => p.id === id);
    if (!profile) return;
    const confirmed = confirm(`¿Eliminar perfil "${profile.name}"? Los archivos se mantendrán.`);
    if (!confirmed) return;

    try {
      await api.profiles.delete(id);
      profiles = profiles.filter(p => p.id !== id);
    } catch (e) {
      error = 'Error: el perfil tiene archivos, elimínalos primero';
    }
  }
</script>

<div class="text-center">
  <div class="mb-12">
    <h1 class="text-4xl md:text-5xl font-bold mb-4">
      <span class="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
        ¿Quién eres?
      </span>
    </h1>
    <p class="text-gray-400 text-lg">Elige tu perfil para entrar</p>
  </div>

  {#if loading}
    <div class="flex justify-center items-center h-48">
      <div class="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  {:else}
    <div class="flex flex-wrap justify-center gap-8 mb-12">
      {#each profiles as profile (profile.id)}
        <button
          on:click={() => selectProfile(profile)}
          class="group flex flex-col items-center gap-3 transition-all duration-300 hover:scale-110"
        >
          <div
            class="relative w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center text-3xl md:text-4xl font-bold text-white transition-all duration-300 group-hover:shadow-2xl group-hover:ring-4 group-hover:ring-white/50"
            style="background: linear-gradient(135deg, {profile.color}, {profile.color}dd);"
          >
            <span class="drop-shadow-lg">{getInitials(profile.name)}</span>
            <button
              on:click|stopPropagation={() => deleteProfile(profile.id)}
              class="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <span class="text-gray-300 text-lg font-medium group-hover:text-white transition-colors">
            {profile.name}
          </span>
        </button>
      {/each}

      <!-- Add profile button -->
      <button
        on:click={() => showAddForm = !showAddForm}
        class="group flex flex-col items-center gap-3 transition-all duration-300 hover:scale-110"
      >
        <div class="w-28 h-28 md:w-32 md:h-32 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center transition-all duration-300 group-hover:border-indigo-400 group-hover:bg-indigo-400/10">
          <svg class="w-12 h-12 text-gray-500 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <span class="text-gray-500 text-lg font-medium group-hover:text-indigo-400 transition-colors">
          Añadir Perfil
        </span>
      </button>
    </div>

    <!-- Add profile form -->
    {#if showAddForm}
      <div class="max-w-md mx-auto bg-[#1a1a2e] rounded-2xl p-6 shadow-xl border border-gray-800">
        <h3 class="text-xl font-semibold text-white mb-4">Nuevo Perfil</h3>

        <input
          type="text"
          placeholder="Nombre del perfil"
          bind:value={newName}
          on:keydown={(e) => e.key === 'Enter' && addProfile()}
          class="w-full px-4 py-3 bg-[#0a0a1a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
        />

        <div class="flex gap-3 mb-4">
          {#each colors as color}
            <button
              on:click={() => newColor = color}
              class="w-8 h-8 rounded-full transition-all duration-200"
              class:ring-2={newColor === color}
              class:ring-white={newColor === color}
              class:scale-110={newColor === color}
              style="background-color: {color};"
            ></button>
          {/each}
        </div>

        <div class="flex gap-3">
          <button
            on:click={addProfile}
            class="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Crear Perfil
          </button>
          <button
            on:click={() => showAddForm = false}
            class="px-6 py-3 bg-gray-800 text-gray-300 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    {/if}
  {/if}

  {#if error}
    <p class="mt-4 text-red-400">{error}</p>
  {/if}
</div>
