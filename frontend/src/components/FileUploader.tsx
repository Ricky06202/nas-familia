import { useState } from 'react';
import { api } from '../lib/api';

export default function FileUploader({ folderId, onUpload }: { folderId?: number | null; onUpload?: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  function getProfileId(): number {
    return Number(localStorage.getItem('nas_profile_id') || '0');
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      uploadFiles(droppedFiles);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      uploadFiles(fileList);
    }
    e.target.value = '';
  }

  async function uploadFiles(fileList: FileList) {
    const profileId = getProfileId();
    if (!profileId) {
      setError('Selecciona un perfil primero');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      await api.files.upload(profileId, fileList, folderId ?? undefined);
      setSuccess(`¡Archivos subidos correctamente!`);
      onUpload?.();
    } catch {
      setError('Error al subir archivos');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-[#1a1a2e] rounded-2xl border border-gray-800 p-8">
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer ${dragging ? 'border-indigo-400 bg-indigo-400/5' : 'border-gray-700 bg-transparent'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input id="file-input" type="file" multiple onChange={handleFileSelect} className="hidden" />

        {uploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Subiendo archivos...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-400/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-300">Arrastra tus archivos aquí</p>
              <p className="text-sm text-gray-500 mt-1">o haz clic para seleccionar archivos</p>
            </div>
            <span className="text-xs text-gray-600">Cualquier tipo de archivo, sin límite de tamaño</span>
          </div>
        )}
      </div>

      {success && (
        <div className="mt-4 p-4 bg-emerald-400/10 border border-emerald-400/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-400/10 border border-red-400/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
