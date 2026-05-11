import { useState, useEffect, useCallback } from 'react';
import { api, type File } from '../lib/api';

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
  return /\.(pdf|doc|docx|txt|md)$/i.test(file.name);
}

function getIconForType(file: File): string {
  if (isImage(file)) {
    return '<svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
  }
  if (isDocument(file)) {
    return '<svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>';
  }
  if (file.mime_type.startsWith('video/')) {
    return '<svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>';
  }
  if (file.mime_type.startsWith('audio/')) {
    return '<svg class="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>';
  }
  return '<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>';
}

const FILTERS = ['all', 'images', 'documents', 'other'] as const;
type Filter = typeof FILTERS[number];
const FILTER_LABELS: Record<Filter, string> = { all: 'Todos', images: 'Imágenes', documents: 'Documentos', other: 'Otros' };

export default function FileGallery() {
  const [files, setFiles] = useState<File[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  function getProfileId(): number {
    return Number(localStorage.getItem('nas_profile_id') || '0');
  }

  const applyFilter = useCallback((f: File[], fl: Filter) => {
    if (fl === 'all') { setFilteredFiles(f); return; }
    if (fl === 'images') { setFilteredFiles(f.filter(x => isImage(x))); return; }
    if (fl === 'documents') { setFilteredFiles(f.filter(x => isDocument(x))); return; }
    setFilteredFiles(f.filter(x => !isImage(x) && !isDocument(x)));
  }, []);

  async function fetchFiles() {
    const profileId = getProfileId();
    if (!profileId) {
      setLoading(false);
      setError('Selecciona un perfil primero');
      return;
    }

    try {
      const data = await api.files.list(profileId);
      setFiles(data);
      applyFilter(data, filter);
      setError('');
    } catch {
      setError('Error al cargar archivos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFiles();
    const handler = () => fetchFiles();
    window.addEventListener('files-uploaded', handler);
    return () => window.removeEventListener('files-uploaded', handler);
  }, []);

  function handleFilterClick(f: Filter) {
    setFilter(f);
    applyFilter(files, f);
  }

  async function deleteFile(file: File) {
    if (!confirm(`¿Eliminar "${file.name}"?`)) return;
    try {
      await api.files.delete(file.id);
      const updated = files.filter(x => x.id !== file.id);
      setFiles(updated);
      applyFilter(updated, filter);
    } catch {
      setError('Error al eliminar archivo');
    }
  }

  function downloadFile(file: File) {
    window.open(api.files.getDownloadUrl(file.id), '_blank');
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => handleFilterClick(f)}
            className={`px-4 py-2 text-sm rounded-lg transition-all ${filter === f ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:text-white'}`}
          >
            {FILTER_LABELS[f]}
            {f === 'all' && ` (${files.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-[#1a1a2e] rounded-2xl border border-gray-800">
          <p className="text-red-400">{error}</p>
          <button onClick={fetchFiles} className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
            Reintentar
          </button>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-16 bg-[#1a1a2e] rounded-2xl border border-gray-800">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-400 text-lg">No hay archivos aún</p>
          <p className="text-gray-600 text-sm mt-1">Arrastra archivos arriba para empezar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredFiles.map(file => (
            <div key={file.id} className="group relative bg-[#1a1a2e] rounded-xl overflow-hidden border border-gray-800 hover:border-indigo-500/30 transition-all duration-300">
              <div className="aspect-square flex items-center justify-center bg-[#0a0a1a] overflow-hidden">
                {isImage(file) && file.thumbnail ? (
                  <img
                    src={api.files.getThumbnailUrl(file.id)}
                    alt={file.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-center" dangerouslySetInnerHTML={{ __html: getIconForType(file) }} />
                )}
              </div>

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                <button
                  onClick={() => downloadFile(file)}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                  title="Descargar"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                <button
                  onClick={() => deleteFile(file)}
                  className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center hover:bg-red-500/40 transition-colors"
                  title="Eliminar"
                >
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="p-2">
                <p className="text-xs text-gray-300 truncate">{file.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                  <span className="text-xs text-gray-600">{formatDate(file.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
