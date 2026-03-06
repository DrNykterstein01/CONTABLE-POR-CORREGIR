import React, { useEffect, useState } from 'react';
import type { User } from '../types';
import { storage } from '../services/storage';
import { Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingRole, setEditingRole] = useState<Record<string, string>>({});
  const { user: currentUser } = useAuth();

  useEffect(() => {
    setUsers(storage.getUsers());
  }, []);

  const handleRoleChange = (id: string, role: User['role']) => {
    setEditingRole(prev => ({ ...prev, [id]: role }));
  };

  const saveRole = (id: string) => {
    const newRole = editingRole[id];
    if (!newRole) return;
    const oldUser = users.find(u => u.id === id);
    const previousRole = oldUser?.role;
    const updated = users.map(u => u.id === id ? { ...u, role: newRole as User['role'] } : u);
    storage.saveUsers(updated);
    setUsers(updated);
    const { [id]: _, ...rest } = editingRole;
    setEditingRole(rest);

    // add audit log
    storage.addAuditLog({
      userId: currentUser?.id || 'system',
      userName: currentUser?.fullName || 'Sistema',
      action: 'UPDATE',
      module: 'USERS',
      recordId: id,
      changes: JSON.stringify({ previousRole, newRole })
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
        <p className="text-sm text-gray-500">Admins pueden ver y cambiar roles (no se muestran contraseñas)</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm text-gray-600">Usuario</th>
              <th className="px-4 py-2 text-left text-sm text-gray-600">Nombre</th>
              <th className="px-4 py-2 text-left text-sm text-gray-600">Estado</th>
              <th className="px-4 py-2 text-left text-sm text-gray-600">Rol</th>
              <th className="px-4 py-2 text-center text-sm text-gray-600">Acción</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter(u => u.id !== currentUser?.id)
              .map(u => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3 text-sm text-gray-700">{u.username}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{u.fullName}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{u.isActive ? 'Activo' : 'Inactivo'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <select
                    value={editingRole[u.id] ?? u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as User['role'])}
                    className="px-2 py-1 border rounded"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="CONTADOR">CONTADOR</option>
                    <option value="ESPECTADOR">ESPECTADOR</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => saveRole(u.id)}
                    disabled={!editingRole[u.id] || editingRole[u.id] === u.role}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
                  >
                    <Save size={14} /> Guardar
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No hay usuarios registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
