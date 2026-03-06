import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(username.trim(), password);
    if (!ok) {
      setError('Credenciales inválidas. Usuario por defecto: admin / admin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Iniciar sesión</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300">Usuario o correo</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-800"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-800"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-between">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Entrar</button>
            <div className="text-sm text-gray-500">Usuario por defecto: <strong>admin</strong> / <strong>admin</strong></div>
          </div>
        </form>
      </div>
    </div>
  );
};
