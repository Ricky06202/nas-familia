import { useEffect, useCallback } from 'react';
import { api, type File } from '../lib/api';

const OFFICE_EXTS = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];

function isOffice(file: File) {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  return OFFICE_EXTS.includes(ext);
}

function isImage(file: File) {
  return file.mime_type.startsWith('image/') && !file.mime_type.includes('svg');
}

function isVideo(file: File) {
  return file.mime_type.startsWith('video/');
}

function isAudio(file: File) {
  return file.mime_type.startsWith('audio/');
}

function isPdf(file: File) {
  return file.mime_type === 'application/pdf' || file.name.endsWith('.pdf');
}

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

  function getOfficeOnlineUrl() {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(origin + viewUrl)}`;
  }

  const isOfficeDoc = isOffice(file);

  function getIcon(type: string) {
    switch (type) {
      case 'image': return '<svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
      case 'video': return '<svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>';
      case 'audio': return '<svg class="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>';
      case 'pdf': return '<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>';
      case 'office': return '<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>';
      default: return '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>';
    }
  }

  let iconType = 'file';
  if (isImage(file)) iconType = 'image';
  else if (isVideo(file)) iconType = 'video';
  else if (isAudio(file)) iconType = 'audio';
  else if (isPdf(file)) iconType = 'pdf';
  else if (isOfficeDoc) iconType = 'office';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-[#1a1a2e] rounded-2xl overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0" dangerouslySetInnerHTML={{ __html: getIcon(iconType) }} />
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

          {isOfficeDoc && (
            <div className="w-full h-[70vh] flex flex-col">
              <iframe
                src={getOfficeOnlineUrl()}
                className="w-full flex-1 rounded-lg"
                title={file.name}
              />
              <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
                <span>¿No se ve? </span>
                <a
                  href={getOfficeOnlineUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline"
                >
                  Abrir en Microsoft Office Online
                </a>
                <span>·</span>
                <a
                  href={downloadUrl}
                  download
                  className="text-indigo-400 hover:text-indigo-300 underline"
                >
                  Descargar
                </a>
              </div>
            </div>
          )}

          {!isImage(file) && !isVideo(file) && !isAudio(file) && !isPdf(file) && !isOfficeDoc && (
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
