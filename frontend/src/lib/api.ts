const API_BASE = '/api';

export interface Profile {
  id: number;
  name: string;
  avatar: string;
  color: string;
  created_at: string;
}

export interface Folder {
  id: number;
  name: string;
  profile_id: number;
  parent_id: number | null;
  created_at: string;
}

export interface File {
  id: number;
  profile_id: number;
  folder_id: number | null;
  name: string;
  original_name: string;
  size: number;
  mime_type: string;
  path: string;
  thumbnail: string;
  created_at: string;
}

export interface SystemStats {
  cpu: { percent: number; cores: number; model: string };
  memory: { total: number; used: number; free: number; used_percent: number };
  disk: { total: number; used: number; free: number; used_percent: number; mount_point: string };
  uptime: number;
  hostname: string;
  os: string;
  network: { bytes_sent: number; bytes_recv: number };
}

export interface FileListParams {
  profile_id: number;
  folder_id?: number | null;
  root?: boolean;
  search?: string;
  sort?: 'name' | 'size' | 'date';
  order?: 'asc' | 'desc';
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-cache',
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  profiles: {
    list: () => request<Profile[]>('/profiles'),
    create: (data: { name: string; color?: string }) =>
      request<Profile>('/profiles', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`/profiles/${id}`, { method: 'DELETE' }),
    select: (profileId: number) =>
      request<Profile>('/profiles/select', {
        method: 'POST',
        body: JSON.stringify({ profile_id: profileId }),
      }),
  },

  system: {
    stats: () => request<SystemStats>('/system/stats'),
  },

  folders: {
    list: (profileId: number) =>
      request<Folder[]>(`/folders?profile_id=${profileId}`),
    create: (data: { name: string; profile_id: number; parent_id?: number | null }) =>
      request<Folder>('/folders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    rename: (id: number, name: string) =>
      request<Folder>(`/folders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      }),
    delete: (id: number) =>
      request<void>(`/folders/${id}`, { method: 'DELETE' }),
  },

  files: {
    list: (params: FileListParams) => {
      const q = new URLSearchParams();
      q.set('profile_id', String(params.profile_id));
      q.set('_', String(Date.now()));
      if (params.folder_id !== undefined && params.folder_id !== null) q.set('folder_id', String(params.folder_id));
      if (params.root) q.set('root', 'true');
      if (params.search) q.set('search', params.search);
      if (params.sort) q.set('sort', params.sort);
      if (params.order) q.set('order', params.order);
      return request<File[]>(`/files?${q}`);
    },
    upload: async (profileId: number, files: FileList | File[], folderId?: number | null) => {
      const form = new FormData();
      form.append('profile_id', String(profileId));
      if (folderId) form.append('folder_id', String(folderId));
      for (const file of files) {
        form.append('files', file);
      }
      const res = await fetch(`${API_BASE}/files/upload`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || res.statusText);
      }
      return res.json() as Promise<File[]>;
    },
    delete: (id: number) =>
      request<void>(`/files/${id}`, { method: 'DELETE' }),
    move: (id: number, folderId: number | null) =>
      request<File>(`/files/${id}/move`, {
        method: 'PUT',
        body: JSON.stringify({ folder_id: folderId }),
      }),
    copy: (id: number, folderId?: number | null) =>
      request<File>(`/files/${id}/copy`, {
        method: 'POST',
        body: JSON.stringify({ folder_id: folderId }),
      }),
    batchDelete: (ids: number[]) =>
      request<void>('/files/batch/delete', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    batchMove: (ids: number[], folderId: number | null) =>
      request<void>('/files/batch/move', {
        method: 'POST',
        body: JSON.stringify({ ids, folder_id: folderId }),
      }),
    batchCopy: (ids: number[], folderId?: number | null) =>
      request<void>('/files/batch/copy', {
        method: 'POST',
        body: JSON.stringify({ ids, folder_id: folderId }),
      }),
    getThumbnailUrl: (id: number) => `${API_BASE}/files/${id}/thumbnail`,
    getDownloadUrl: (id: number) => `${API_BASE}/files/${id}/download`,
    getViewUrl: (id: number) => `${API_BASE}/files/${id}/view`,
  },
};
