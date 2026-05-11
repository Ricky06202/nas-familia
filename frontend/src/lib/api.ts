const API_BASE = '/api';

export interface Profile {
  id: number;
  name: string;
  avatar: string;
  color: string;
  created_at: string;
}

export interface File {
  id: number;
  profile_id: number;
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

  files: {
    list: (profileId: number) =>
      request<File[]>(`/files?profile_id=${profileId}&_=${Date.now()}`),
    upload: async (profileId: number, files: FileList | File[]) => {
      const form = new FormData();
      form.append('profile_id', String(profileId));
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
    getThumbnailUrl: (id: number) => `${API_BASE}/files/${id}/thumbnail`,
    getDownloadUrl: (id: number) => `${API_BASE}/files/${id}/download`,
  },
};
