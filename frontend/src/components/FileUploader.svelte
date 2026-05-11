<script lang="ts">
  import { api } from '../lib/api';

  let dragging = false;
  let uploading = false;
  let success = '';
  let error = '';
  let files: File[] = [];

  function getProfileId(): number {
    return Number(localStorage.getItem('nas_profile_id') || '0');
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    dragging = true;
  }

  function handleDragLeave() {
    dragging = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      uploadFiles(droppedFiles);
    }
  }

  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      uploadFiles(input.files);
      input.value = '';
    }
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const profileId = getProfileId();
    if (!profileId) {
      error = 'Selecciona un perfil primero';
      return;
    }

    uploading = true;
    error = '';
    success = '';

    const fileArray = fileList instanceof FileList ? Array.from(fileList) : fileList;

    try {
      const uploaded = await api.files.upload(profileId, fileArray);
      success = `¡${uploaded.length} archivo(s) subido(s) correctamente!`;
      files = [...files, ...uploaded];
      window.dispatchEvent(new CustomEvent('files-uploaded', { detail: uploaded }));
    } catch (e) {
      error = 'Error al subir archivos';
    } finally {
      uploading = false;
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

  function getFileIcon(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    const videoExts = ['mp4', 'avi', 'mkv', 'mov', 'webm'];
    const audioExts = ['mp3', 'wav', 'ogg', 'flac'];
    const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];

    if (imageExts.includes(ext)) return 'image';
    if (videoExts.includes(ext)) return 'video';
    if (audioExts.includes(ext)) return 'audio';
    if (docExts.includes(ext)) return 'document';
    return 'file';
  }
</script>

<div class="bg-[#1a1a2e] rounded-2xl border border-gray-800 p-8">
  <!-- Drop zone -->
  <div
    class="relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer {dragging ? 'border-indigo-400 bg-indigo-400/5' : 'border-gray-700 bg-transparent'}"
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
    on:click={() => document.getElementById('file-input')?.click()}
    role="button"
    tabindex="0"
  >
    <input
      id="file-input"
      type="file"
      multiple
      on:change={handleFileSelect}
      class="hidden"
    />

    {#if uploading}
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-gray-400">Subiendo archivos...</p>
      </div>
    {:else}
      <div class="flex flex-col items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-indigo-400/10 flex items-center justify-center">
          <svg class="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <p class="text-lg font-medium text-gray-300">
            Arrastra tus archivos aquí
          </p>
          <p class="text-sm text-gray-500 mt-1">
            o haz clic para seleccionar archivos
          </p>
        </div>
        <span class="text-xs text-gray-600">
          Cualquier tipo de archivo, sin límite de tamaño
        </span>
      </div>
    {/if}
  </div>

  <!-- Messages -->
  {#if success}
    <div class="mt-4 p-4 bg-emerald-400/10 border border-emerald-400/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {success}
    </div>
  {/if}

  {#if error}
    <div class="mt-4 p-4 bg-red-400/10 border border-red-400/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {error}
    </div>
  {/if}
</div>
