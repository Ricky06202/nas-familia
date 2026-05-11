import { useState, useEffect } from 'react';
import { api, type Profile } from '../lib/api';

const COLORS = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa', '#fb923c'];

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function ProfileSelector() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#818cf8');
  const [error, setError] = useState('');

  useEffect(() => {
    api.profiles.list()
      .then(setProfiles)
      .catch(() => setError('Error al cargar perfiles'))
      .finally(() => setLoading(false));
  }, []);

  function selectProfile(profile: Profile) {
    localStorage.setItem('nas_profile_id', String(profile.id));
    localStorage.setItem('nas_profile_name', profile.name);
    localStorage.setItem('nas_profile_color', profile.color);
    localStorage.setItem('nas_profile_avatar', profile.avatar);
    window.location.href = '/dashboard';
  }

  async function addProfile() {
    if (!newName.trim()) return;
    try {
      const profile = await api.profiles.create({ name: newName.trim(), color: newColor });
      setProfiles([...profiles, profile]);
      setNewName('');
      setShowAddForm(false);
    } catch {
      setError('Error al crear perfil');
    }
  }

  async function deleteProfile(id: number) {
    const profile = profiles.find(p => p.id === id);
    if (!profile) return;
    if (!confirm(`¿Eliminar perfil "${profile.name}"? Los archivos se mantendrán.`)) return;
    try {
      await api.profiles.delete(id);
      setProfiles(profiles.filter(p => p.id !== id));
    } catch {
      setError('Error: el perfil tiene archivos, elimínalos primero');
    }
  }

  return (
    <div className="text-center">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
            ¿Quién eres?
          </span>
        </h1>
        <p className="text-gray-400 text-lg">Elige tu perfil para entrar</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            {profiles.map(profile => (
              <button
                key={profile.id}
                onClick={() => selectProfile(profile)}
                className="group flex flex-col items-center gap-3 transition-all duration-300 hover:scale-110"
              >
                <div className="relative">
                  <div
                    className="w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center text-3xl md:text-4xl font-bold text-white transition-all duration-300 group-hover:shadow-2xl group-hover:ring-4 group-hover:ring-white/50"
                    style={{ background: `linear-gradient(135deg, ${profile.color}, ${profile.color}dd)` }}
                  >
                    <span className="drop-shadow-lg">{getInitials(profile.name)}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteProfile(profile.id); }}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <span className="text-gray-300 text-lg font-medium group-hover:text-white transition-colors">
                  {profile.name}
                </span>
              </button>
            ))}

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="group flex flex-col items-center gap-3 transition-all duration-300 hover:scale-110"
            >
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center transition-all duration-300 group-hover:border-indigo-400 group-hover:bg-indigo-400/10">
                <svg className="w-12 h-12 text-gray-500 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-gray-500 text-lg font-medium group-hover:text-indigo-400 transition-colors">
                Añadir Perfil
              </span>
            </button>
          </div>

          {showAddForm && (
            <div className="max-w-md mx-auto bg-[#1a1a2e] rounded-2xl p-6 shadow-xl border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-4">Nuevo Perfil</h3>
              <input
                type="text"
                placeholder="Nombre del perfil"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addProfile()}
                className="w-full px-4 py-3 bg-[#0a0a1a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              />
              <div className="flex gap-3 mb-4">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className="w-8 h-8 rounded-full transition-all duration-200"
                    style={{
                      backgroundColor: color,
                      ...(newColor === color ? { ring: '2px solid white', transform: 'scale(1.1)' } : {}),
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={addProfile}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Crear Perfil
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 bg-gray-800 text-gray-300 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {error && <p className="mt-4 text-red-400">{error}</p>}
    </div>
  );
}
