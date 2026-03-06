import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const UserDropdown: React.FC = () => {
  const { user, logout, toggleTheme, theme, updateProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');

  const handleSave = () => {
    updateProfile({ fullName });
    setEditing(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(s => !s)} className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">{user?.fullName?.charAt(0) || 'U'}</button>

      {open && (
        <div className={`absolute right-0 mt-2 w-56 rounded shadow z-20 p-2 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          <button onClick={() => { setEditing(true); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Personalizar perfil</button>
          <button onClick={() => { toggleTheme(); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">{theme === 'light' ? 'Modo oscuro' : 'Modo claro'}</button>
          <button onClick={() => { logout(); setOpen(false); }} className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Cerrar sesión</button>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 flex items-center justify-center z-30">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setEditing(false)} />
          <div className="bg-white dark:bg-gray-800 rounded p-6 z-40 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-100">Editar perfil</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 dark:text-gray-300">Nombre completo</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-800" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="px-3 py-1 rounded border">Cancelar</button>
              <button onClick={handleSave} className="px-3 py-1 bg-blue-600 text-white rounded">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
