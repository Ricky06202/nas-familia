import { useState, useMemo } from 'react';
import { api, type File } from '../lib/api';

const SORT_OPTIONS = [
  { value: 'date', label: 'Fecha' },
  { value: 'name', label: 'Nombre' },
  { value: 'size', label: 'Tamaño' },
] as const;

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) { value /= 1024; unitIndex++; }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isImage(file: File): boolean {
  return file.mime_type.startsWith('image/') && !file.mime_type.includes('svg');
}

function isDocument(file: File): boolean {
  return /\.(pdf|doc|docx|txt|md)$/i.test(file.name);
}

function isVideo(file: File): boolean {
  return file.mime_type.startsWith('video/');
}

function isAudio(file: File): boolean {
  return file.mime_type.startsWith('audio/');
}

function getIconForType(file: File): string {
  if (isImage(file)) {
    return '<svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
  }
  if (isVideo(file)) {
    return '<svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>';
  }
  if (isAudio(file)) {
    return '<svg class="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>';
  }
  if (isDocument(file)) {
    return '<svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>';
  }
  return '<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>';
}

const TYPE_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'images', label: 'Imágenes' },
  { key: 'videos', label: 'Videos' },
  { key: 'documents', label: 'Documentos' },
  { key: 'audio', label: 'Audio' },
  { key: 'other', label: 'Otros' },
] as const;
type TypeFilter = typeof TYPE_FILTERS[number]['key'];

export default function FileGallery({
  files,
  loading,
  search,
  sort,
  order,
  onSearchChange,
  onSortChange,
  onOrderToggle,
  onDelete,
  onView,
}: {
  files: File[];
  search: string;
  sort: string;
  order: string;
  onSearchChange: (v: string) => void;
  onSortChange: (v: string) => void;
  onOrderToggle: () => void;
  onDelete: (f: File) => void;
  onView: (f: File) => void;
}) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const filteredFiles = useMemo(() => {
    let result = files;

    if (typeFilter === 'images') result = result.filter(f => isImage(f));
    else if (typeFilter === 'videos') result = result.filter(f => isVideo(f));
    else if (typeFilter === 'audio') result = result.filter(f => isAudio(f));
    else if (typeFilter === 'documents') result = result.filter(f => isDocument(f));
    else if (typeFilter === 'other') result = result.filter(f => !isImage(f) && !isVideo(f) && !isAudio(f) && !isDocument(f));

    return result;
  }, [files, typeFilter]);

  return (
    <div>
      {/* Search + Sort bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar archivos..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0a0a1a] border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={e => onSortChange(e.target.value)}
            className="px-3 py-2 bg-[#0a0a1a] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={onOrderToggle}
            className="p-2 bg-[#0a0a1a] border border-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            {order === 'asc' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {TYPE_FILTERS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setTypeFilter(opt.key)}
            className={`px-4 py-2 text-sm rounded-lg transition-all ${typeFilter === opt.key ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:text-white'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Files grid */}
      {loading ? (
        <div className="flex justify-center items-center h-48 bg-[#1a1a2e] rounded-2xl border border-gray-800">
          <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
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
            <div
              key={file.id}
              className="group relative bg-[#1a1a2e] rounded-xl overflow-hidden border border-gray-800 hover:border-indigo-500/30 transition-all duration-300 cursor-pointer"
              onClick={() => onView(file)}
            >
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
                  onClick={e => { e.stopPropagation(); onView(file); }}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                  title="Ver"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  onClick={e => { e.stopPropagation(); window.open(api.files.getDownloadUrl(file.id), '_blank'); }}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                  title="Descargar"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(file); }}
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
