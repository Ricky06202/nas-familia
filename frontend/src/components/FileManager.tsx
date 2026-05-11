import { useState, useEffect, useCallback } from 'react';
import { api, type File as FileType, type Folder } from '../lib/api';
import FolderSidebar from './FolderSidebar';
import FileUploader from './FileUploader';
import FileGallery from './FileGallery';
import FileViewer from './FileViewer';

export default function FileManager() {
  const [profileId, setProfileId] = useState(0);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileType[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('date');
  const [order, setOrder] = useState('desc');
  const [viewerFile, setViewerFile] = useState<FileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFile, setActionFile] = useState<FileType | null>(null);
  const [action, setAction] = useState<'move' | 'copy' | null>(null);

  useEffect(() => {
    setProfileId(Number(localStorage.getItem('nas_profile_id') || '0'));
  }, []);

  const fetchFolders = useCallback(async () => {
    if (!profileId) return;
    try {
      const data = await api.folders.list(profileId);
      setFolders(data);
    } catch {}
  }, [profileId]);

  const fetchFiles = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const data = await api.files.list({
        profile_id: profileId,
        folder_id: currentFolderId,
        root: currentFolderId === null ? true : undefined,
        search: search || undefined,
        sort: sort as 'name' | 'size' | 'date',
        order: order as 'asc' | 'desc',
      });
      setFiles(data);
    } catch {} finally {
      setLoading(false);
    }
  }, [profileId, currentFolderId, search, sort, order]);

  const handleUpload = useCallback(() => {
    fetchFiles();
    fetchFolders();
  }, [fetchFiles, fetchFolders]);

  useEffect(() => {
    if (profileId) fetchFolders();
  }, [profileId, fetchFolders]);

  useEffect(() => {
    if (profileId) fetchFiles();
  }, [profileId, fetchFiles]);

  async function deleteFile(file: FileType) {
    if (!confirm(`¿Eliminar "${file.name}"?`)) return;
    try {
      await api.files.delete(file.id);
      fetchFiles();
    } catch {}
  }

  function openMove(file: FileType) {
    setActionFile(file);
    setAction('move');
  }

  function openCopy(file: FileType) {
    setActionFile(file);
    setAction('copy');
  }

  async function handleAction(targetFolderId: number | null) {
    if (!actionFile) return;
    try {
      if (action === 'move') {
        await api.files.move(actionFile.id, targetFolderId);
      } else if (action === 'copy') {
        await api.files.copy(actionFile.id, targetFolderId);
      }
      setActionFile(null);
      setAction(null);
      fetchFiles();
      fetchFolders();
    } catch {}
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 hidden lg:block">
        <div className="sticky top-24">
          <FolderSidebar
            folders={folders}
            currentFolderId={currentFolderId}
            profileId={profileId}
            onSelect={id => setCurrentFolderId(id)}
            onRefresh={fetchFolders}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-6">
        <FileUploader folderId={currentFolderId} onUpload={handleUpload} />

        <FileGallery
          files={files}
          loading={loading}
          search={search}
          sort={sort}
          order={order}
          onSearchChange={v => setSearch(v)}
          onSortChange={v => setSort(v)}
          onOrderToggle={() => setOrder(o => o === 'asc' ? 'desc' : 'asc')}
          onDelete={deleteFile}
          onView={f => setViewerFile(f)}
          onMove={openMove}
          onCopy={openCopy}
        />
      </div>

      {/* Mobile folder selector */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <select
          value={currentFolderId ?? ''}
          onChange={e => setCurrentFolderId(e.target.value ? Number(e.target.value) : null)}
          className="px-4 py-3 bg-[#1a1a2e] border border-gray-700 rounded-xl text-white text-sm shadow-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos los archivos</option>
          {folders.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {/* File viewer modal */}
      {viewerFile && (
        <FileViewer file={viewerFile} onClose={() => setViewerFile(null)} />
      )}

      {/* Move/Copy folder picker */}
      {action && actionFile && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) { setAction(null); setActionFile(null); } }}
        >
          <div className="bg-[#1a1a2e] rounded-2xl border border-gray-800 shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-2">
              {action === 'move' ? 'Mover' : 'Copiar'} archivo
            </h3>
            <p className="text-sm text-gray-400 mb-4 truncate">{actionFile.name}</p>

            <div className="space-y-1 max-h-60 overflow-auto">
              <button
                onClick={() => handleAction(null)}
                className="w-full text-left px-4 py-3 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-3"
              >
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Raíz (sin carpeta)
              </button>
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => handleAction(folder.id)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  <span className="truncate">{folder.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => { setAction(null); setActionFile(null); }}
              className="mt-4 w-full px-4 py-3 bg-gray-800 text-gray-300 rounded-xl font-medium hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
