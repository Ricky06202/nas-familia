import { useState } from 'react';
import { api, type Folder } from '../lib/api';

export default function FolderSidebar({
  folders,
  currentFolderId,
  profileId,
  onSelect,
  onRefresh,
}: {
  folders: Folder[];
  currentFolderId: number | null;
  profileId: number;
  onSelect: (id: number | null) => void;
  onRefresh: () => void;
}) {
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  async function createFolder() {
    if (!newName.trim()) return;
    try {
      await api.folders.create({ name: newName.trim(), profile_id: profileId });
      setNewName('');
      setAdding(false);
      onRefresh();
    } catch {}
  }

  async function renameFolder(id: number) {
    if (!renameValue.trim()) return;
    try {
      await api.folders.rename(id, renameValue.trim());
      setRenaming(null);
      onRefresh();
    } catch {}
  }

  async function deleteFolder(id: number) {
    const folder = folders.find(f => f.id === id);
    if (!folder || !confirm(`¿Eliminar carpeta "${folder.name}"? Los archivos se moverán a la carpeta padre.`)) return;
    try {
      await api.folders.delete(id);
      if (currentFolderId === id) onSelect(null);
      onRefresh();
    } catch {}
  }

  function buildTree(items: Folder[], parentId: number | null = null, depth = 0): Folder[] {
    const result: Folder[] = [];
    for (const item of items) {
      if (item.parent_id === parentId) {
        result.push(item);
        result.push(...buildTree(items, item.id, depth + 1));
      }
    }
    return result;
  }

  const folderDepths = new Map<number, number>();
  function computeDepths(items: Folder[], parentId: number | null = null, depth = 0) {
    for (const item of items) {
      if (item.parent_id === parentId) {
        folderDepths.set(item.id, depth);
        computeDepths(items, item.id, depth + 1);
      }
    }
  }
  computeDepths(folders);

  return (
    <div className="bg-[#1a1a2e] rounded-2xl border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Carpetas</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      {/* Root */}
      <button
        onClick={() => onSelect(null)}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all mb-1 flex items-center gap-2 ${currentFolderId === null ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        Todos los archivos
      </button>

      {/* Folder tree */}
      <div className="space-y-0.5">
        {folders
          .filter(f => f.parent_id === null)
          .map(root => renderFolder(root, 0))}
      </div>

      {folders.length === 0 && !adding && (
        <p className="text-xs text-gray-600 text-center py-4">Sin carpetas</p>
      )}

      {/* Add folder inline */}
      {adding && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            placeholder="Nombre"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') setAdding(false); }}
            className="flex-1 px-2 py-1.5 text-sm bg-[#0a0a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autoFocus
          />
          <button onClick={createFolder} className="px-2 py-1.5 text-xs bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
            OK
          </button>
        </div>
      )}
    </div>
  );

  function renderFolder(folder: Folder, depth: number) {
    const children = folders.filter(f => f.parent_id === folder.id);
    const isCurrent = currentFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${isCurrent ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => onSelect(folder.id)}
        >
          <span className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 flex-shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            {renaming === folder.id ? (
              <input
                type="text"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') renameFolder(folder.id);
                  if (e.key === 'Escape') setRenaming(null);
                  e.stopPropagation();
                }}
                onClick={e => e.stopPropagation()}
                className="flex-1 min-w-0 px-1 py-0.5 text-sm bg-[#0a0a1a] border border-gray-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
            ) : (
              <span className="truncate">{folder.name}</span>
            )}
          </span>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={e => { e.stopPropagation(); setRenaming(folder.id); setRenameValue(folder.name); }}
              className="p-1 text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={e => { e.stopPropagation(); deleteFolder(folder.id); }}
              className="p-1 text-gray-500 hover:text-red-400 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {children.map(child => renderFolder(child, depth + 1))}
      </div>
    );
  }
}
