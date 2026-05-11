<script lang="ts">
  import { api, type File } from '../lib/api';
  import { onMount } from 'svelte';

  let files: File[] = [];
  let loading = true;
  let error = '';
  let filter: 'all' | 'images' | 'documents' | 'other' = 'all';

  onMount(() => {
    fetchFiles();
    window.addEventListener('files-uploaded', fetchFiles);
  });

  function getProfileId(): number {
    return Number(localStorage.getItem('nas_profile_id') || '0');
  }

  async function fetchFiles() {
    const profileId = getProfileId();
    if (!profileId) {
      loading = false;
      error = 'Selecciona un perfil primero';
      return;
    }

    try {
      files = await api.files.list(profileId);
      error = '';
    } catch (e) {
      error = 'Error al cargar archivos';
    } finally {
      loading = false;
    }
  }

  function formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    return `${value.toFixed(1)} ${units[unitIndex]}`;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function isImage(file: File): boolean {
    return file.mime_type.startsWith('image/') && !file.mime_type.includes('svg');
  }

  function isDocument(file: File): boolean {
    const docTypes = ['application/pdf', 'application/msword', 'text/plain'];
    return docTypes.some(t => file.mime_type.includes(t)) ||
      /\.(pdf|doc|docx|txt|md)$/i.test(file.name);
  }

  function getFileIcon(file: File): string {
    if (isImage(file)) return 'image';
    if (isDocument(file)) return 'document';
    if (file.mime_type.startsWith('video/')) return 'video';
    if (file.mime_type.startsWith('audio/')) return 'audio';
    return 'file';
  }

  function getIconForType(file: File): string {
    const type = getFileIcon(file);
    switch (type) {
      case 'image':
        return `<svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`;
      case 'document':
        return `<svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`;
      case 'video':
        return `<svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>`;
      case 'audio':
        return `<svg class="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>`;
      default:
        return `<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>`;
    }
  }

  function getFilteredFiles(): File[] {
    switch (filter) {
      case 'images': return files.filter(f => isImage(f));
      case 'documents': return files.filter(f => isDocument(f));
      case 'other': return files.filter(f => !isImage(f) && !isDocument(f));
      default: return files;
    }
  }

  async function deleteFile(file: File) {
    if (!confirm(`¿Eliminar "${file.name}"?`)) return;
    try {
      await api.files.delete(file.id);
      files = files.filter(f => f.id !== file.id);
    } catch (e) {
      error = 'Error al eliminar archivo';
    }
  }

  function downloadFile(file: File) {
    window.open(api.files.getDownloadUrl(file.id), '_blank');
  }
</script>

<div>
  <!-- Filters -->
  <div class="flex items-center gap-2 mb-6 flex-wrap">
    {#each ['all', 'images', 'documents', 'other'] as f}
      <button
        on:click={() => filter = f}
        class="px-4 py-2 text-sm rounded-lg transition-all {filter === f ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:text-white'}"
      >
        {f === 'all' ? 'Todos' : f === 'images' ? 'Imágenes' : f === 'documents' ? 'Documentos' : 'Otros'}
        {f === 'all' ? `(${files.length})` : ''}
      </button>
    {/each}
  </div>

  {#if loading}
    <div class="flex justify-center items-center h-48">
      <div class="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  {:else if error}
    <div class="text-center py-12 bg-[#1a1a2e] rounded-2xl border border-gray-800">
      <p class="text-red-400">{error}</p>
      <button on:click={fetchFiles} class="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
        Reintentar
      </button>
    </div>
  {:else if getFilteredFiles().length === 0}
    <div class="text-center py-16 bg-[#1a1a2e] rounded-2xl border border-gray-800">
      <svg class="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p class="text-gray-400 text-lg">No hay archivos aún</p>
      <p class="text-gray-600 text-sm mt-1">Arrastra archivos arriba para empezar</p>
    </div>
  {:else}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {#each getFilteredFiles() as file (file.id)}
        <div class="group relative bg-[#1a1a2e] rounded-xl overflow-hidden border border-gray-800 hover:border-indigo-500/30 transition-all duration-300">
          <!-- Thumbnail or icon -->
          <div class="aspect-square flex items-center justify-center bg-[#0a0a1a] overflow-hidden">
            {#if isImage(file) && file.thumbnail}
              <img
                src={api.files.getThumbnailUrl(file.id)}
                alt={file.name}
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
            {:else}
              <div class="text-center">
                {@html getIconForType(file)}
              </div>
            {/if}
          </div>

          <!-- Hover overlay -->
          <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
            <button
              on:click={() => downloadFile(file)}
              class="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              title="Descargar"
            >
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button
              on:click={() => deleteFile(file)}
              class="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center hover:bg-red-500/40 transition-colors"
              title="Eliminar"
            >
              <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <!-- Info -->
          <div class="p-2">
            <p class="text-xs text-gray-300 truncate">{file.name}</p>
            <div class="flex items-center justify-between mt-1">
              <span class="text-xs text-gray-500">{formatFileSize(file.size)}</span>
              <span class="text-xs text-gray-600">{formatDate(file.created_at)}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
