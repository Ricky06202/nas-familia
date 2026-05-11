import { useEffect, useCallback } from 'react';
import { api, type File } from '../lib/api';

function getExt(file: File) { return file.name.toLowerCase().slice(file.name.lastIndexOf('.')); }
function isImage(file: File) { return file.mime_type.startsWith('image/') && !file.mime_type.includes('svg'); }
function isVideo(file: File) { return file.mime_type.startsWith('video/'); }
function isAudio(file: File) { return file.mime_type.startsWith('audio/'); }
function isPdf(file: File) { return file.mime_type === 'application/pdf' || getExt(file) === '.pdf'; }
function isWord(file: File) { return ['.doc', '.docx'].includes(getExt(file)); }
function isExcel(file: File) { return ['.xls', '.xlsx'].includes(getExt(file)); }
function isPpt(file: File) { return ['.ppt', '.pptx'].includes(getExt(file)); }
function isOffice(file: File) { return isWord(file) || isExcel(file) || isPpt(file); }

export default function FileViewer({ file, onClose }: { file: File; onClose: () => void }) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  const viewUrl = api.files.getViewUrl(file.id);
  const downloadUrl = api.files.getDownloadUrl(file.id);



  function getIcon() {
    if (isImage(file)) return '<svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
    if (isVideo(file)) return '<svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>';
    if (isAudio(file)) return '<svg class="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>';
    if (isPdf(file)) return '<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path d="M7 11l2 2 4-4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>';
    if (isWord(file)) return '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" fill="#1e40af" opacity="0.9"/><path stroke="#fff" stroke-linecap="round" stroke-width="1.5" d="M8 9l2 7 2-5 2 5 2-7"/></svg>';
    if (isExcel(file)) return '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" fill="#059669" opacity="0.9"/><path stroke="#fff" stroke-linecap="round" stroke-width="1.5" d="M8 9l3 4-3 4m8-8l-3 4 3 4"/></svg>';
    if (isPpt(file)) return '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" fill="#ea580c" opacity="0.9"/><path stroke="#fff" stroke-linecap="round" stroke-width="1.5" d="M9 9h5a2 2 0 012 2v1a2 2 0 01-2 2h-5V9z"/><path stroke="#fff" stroke-linecap="round" stroke-width="1.5" d="M12 14v3"/></svg>';
    return '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>';
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-[#1a1a2e] rounded-2xl overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0" dangerouslySetInnerHTML={{ __html: getIcon() }} />
            <p className="text-white font-medium truncate">{file.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              download
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              title="Descargar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#0a0a1a] min-h-[300px]">
          {isImage(file) && (
            <img src={viewUrl} alt={file.name} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
          )}

          {isVideo(file) && (
            <video controls autoPlay className="max-w-full max-h-[70vh] rounded-lg" key={file.id}>
              <source src={viewUrl} type={file.mime_type} />
            </video>
          )}

          {isAudio(file) && (
            <div className="text-center p-12">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-pink-500/10 flex items-center justify-center">
                <svg className="w-12 h-12 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <p className="text-gray-300 font-medium mb-4">{file.name}</p>
              <audio controls autoPlay className="w-full max-w-md" key={file.id}>
                <source src={viewUrl} type={file.mime_type} />
              </audio>
            </div>
          )}

          {isPdf(file) && (
            <iframe src={viewUrl} className="w-full h-[70vh] rounded-lg" title={file.name} />
          )}

          {isOffice(file) && (
            <div className="w-full h-[70vh] flex flex-col">
              <iframe
                src={viewUrl}
                className="w-full flex-1 rounded-lg"
                title={file.name}
              />
              <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
                <span>El navegador no puede mostrarlo? </span>
                <a
                  href={downloadUrl}
                  download
                  className="text-indigo-400 hover:text-indigo-300 underline"
                >
                  Descargar y abrir con Word/Excel/PowerPoint
                </a>
              </div>
            </div>
          )}

          {!isImage(file) && !isVideo(file) && !isAudio(file) && !isPdf(file) && !isOffice(file) && (
            <div className="text-center p-12">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 mb-2">Vista previa no disponible</p>
              <a
                href={downloadUrl}
                download
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar archivo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
