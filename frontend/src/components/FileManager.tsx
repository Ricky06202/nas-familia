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
    </div>
  );
}
