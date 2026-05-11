import { useState, useEffect } from 'react';

export default function Navbar() {
  const [profileName, setProfileName] = useState('Perfil');
  const [profileColor, setProfileColor] = useState('#818cf8');
  const [initials, setInitials] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem('nas_profile_name') || 'Perfil';
    const color = localStorage.getItem('nas_profile_color') || '#818cf8';
    setProfileName(name);
    setProfileColor(color);
    setInitials(name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2));
  }, []);

  useEffect(() => {
    const close = () => setMenuOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => window.location.href = '/'} className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors hidden sm:block">
              La Familia Sanjur
            </span>
          </button>

          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => window.location.href = '/dashboard'} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              Dashboard
            </button>
            <button onClick={() => window.location.href = '/files'} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              Archivos
            </button>
          </div>

          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="flex items-center gap-3 group">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white transition-transform group-hover:scale-110"
                style={{ background: profileColor }}
              >
                {initials}
              </div>
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors hidden sm:block">{profileName}</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1a1a2e] rounded-xl shadow-2xl border border-gray-800 py-2">
                <button onClick={() => window.location.href = '/profiles'} className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                  Cambiar Perfil
                </button>
                <button onClick={() => window.location.href = '/profiles'} className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
