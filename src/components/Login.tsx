import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../services/storage';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  // registration fields
  const [regUsername, setRegUsername] = useState('');
  const [cedula, setCedula] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(username.trim(), password);
    if (!ok) {
      setError('Credenciales inválidas. Usuario por defecto: admin / admin');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // basic validation
    if (!regUsername.trim() || !cedula.trim() || !firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !regPassword) {
      setError('Por favor complete todos los campos requeridos.');
      return;
    }

    if (regPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const users = storage.getUsers();
    if (users.find(u => u.username.toLowerCase() === regUsername.trim().toLowerCase())) {
      setError('El nombre de usuario ya existe.');
      return;
    }

    const newUser = {
      id: crypto.randomUUID(),
      username: regUsername.trim(),
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      role: 'ESPECTADOR' as const,
      permissions: [] as string[],
      isActive: true,
    };

    storage.saveUsers([...users, newUser]);
    const creds = storage.getCredentials();
    creds[newUser.username] = regPassword;
    storage.saveCredentials(creds);

    setSuccessMsg('Registro exitoso. Por favor inicie sesión.');
    // reset registration fields and go back to login
    setRegUsername(''); setCedula(''); setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setRegPassword(''); setConfirmPassword('');
    setShowRegister(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {!showRegister ? (
          <>
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
              {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}
              <div className="flex items-center justify-between">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Entrar</button>
                <div className="text-sm text-gray-500">Usuario por defecto: <strong>admin</strong> / <strong>admin</strong></div>
              </div>
            </form>
            <div className="mt-4 text-sm text-center">
              ¿No tienes cuenta? <button onClick={() => { setShowRegister(true); setError(''); setSuccessMsg(''); }} className="text-blue-600 hover:underline">Regístrate</button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Registro de Usuario</h2>
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600">Nombre de usuario</label>
                <input value={regUsername} onChange={(e) => setRegUsername(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">Cédula</label>
                  <input value={cedula} onChange={(e) => setCedula(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Teléfono</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">Nombre</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Apellido</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded" required />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600">Correo</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">Contraseña</label>
                  <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Confirmar contraseña</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded" required />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded">Registrar</button>
                <button type="button" onClick={() => { setShowRegister(false); setError(''); }} className="flex-1 px-4 py-2 bg-gray-300 rounded">Cancelar</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
