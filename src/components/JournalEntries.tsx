import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Save, X } from 'lucide-react';
import { storage } from '../services/storage';
import type { JournalEntry, JournalLine, Account } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function JournalEntries() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'CONTADOR';
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
  });

  const [lines, setLines] = useState<Omit<JournalLine, 'id'>[]>([
    { accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setEntries(storage.getJournalEntries());
    setAccounts(storage.getAccounts());
  };

  const handleAccountChange = (index: number, accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      const newLines = [...lines];
      newLines[index] = {
        ...newLines[index],
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name
      };
      setLines(newLines);
    }
  };

  const addLine = () => {
    setLines([...lines, { accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof Omit<JournalLine, 'id'>, value: string | number) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const getTotalDebits = () => lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const getTotalCredits = () => lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  const isBalanced = () => Math.abs(getTotalDebits() - getTotalCredits()) < 0.01;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isBalanced()) {
      alert('El asiento debe estar balanceado. Los débitos deben igualar los créditos.');
      return;
    }

    const linesWithIds: JournalLine[] = lines.map(line => ({
      ...line,
      id: crypto.randomUUID()
    }));

    if (editingEntry) {
      const updated = entries.map(entry =>
        entry.id === editingEntry.id
          ? { ...entry, ...formData, lines: linesWithIds, updatedAt: new Date().toISOString() }
          : entry
      );
      storage.saveJournalEntries(updated);

      updateAccountBalances(editingEntry.lines, linesWithIds);

      storage.addAuditLog({
        userId: 'admin',
        userName: 'Administrador',
        action: 'UPDATE',
        module: 'JOURNAL_ENTRIES',
        recordId: editingEntry.id,
        changes: JSON.stringify({ formData, lines: linesWithIds })
      });
    } else {
      const newEntry: JournalEntry = {
        id: crypto.randomUUID(),
        ...formData,
        status: 'ANOTADO',
        createdBy: 'admin',
        lines: linesWithIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      storage.saveJournalEntries([...entries, newEntry]);

      updateAccountBalances([], linesWithIds);

      storage.addAuditLog({
        userId: 'admin',
        userName: 'Administrador',
        action: 'CREATE',
        module: 'JOURNAL_ENTRIES',
        recordId: newEntry.id,
        changes: JSON.stringify(newEntry)
      });
    }

    resetForm();
    loadData();
  };

  const updateAccountBalances = (oldLines: JournalLine[], newLines: JournalLine[]) => {
    const accountsToUpdate = storage.getAccounts();

    oldLines.forEach(line => {
      const account = accountsToUpdate.find(a => a.id === line.accountId);
      if (account) {
        if (account.type === 'ACTIVO' || account.type === 'GASTO') {
          account.balance -= (line.debit - line.credit);
        } else {
          account.balance -= (line.credit - line.debit);
        }
      }
    });

    newLines.forEach(line => {
      const account = accountsToUpdate.find(a => a.id === line.accountId);
      if (account) {
        if (account.type === 'ACTIVO' || account.type === 'GASTO') {
          account.balance += (line.debit - line.credit);
        } else {
          account.balance += (line.credit - line.debit);
        }
      }
    });

    storage.saveAccounts(accountsToUpdate);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      reference: ''
    });
    setLines([{ accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' }]);
    setEditingEntry(null);
    setShowForm(false);
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      description: entry.description,
      reference: entry.reference
    });
    setLines(entry.lines.map(({ id, ...rest }) => rest));
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este asiento?')) {
      const entry = entries.find(e => e.id === id);
      if (entry) {
        updateAccountBalances(entry.lines, []);
        const updated = entries.filter(e => e.id !== id);
        storage.saveJournalEntries(updated);
        storage.addAuditLog({
          userId: 'admin',
          userName: 'Administrador',
          action: 'DELETE',
          module: 'JOURNAL_ENTRIES',
          recordId: id,
          changes: 'Asiento eliminado'
        });
        loadData();
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Libro Diario</h2>
        {canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Nuevo Asiento
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full my-8">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {editingEntry ? 'Editar Asiento' : 'Nuevo Asiento'}
              </h3>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Referencia</label>
                  <input
                    type="text"
                    required
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">Líneas del Asiento</h4>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={addLine}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Agregar Línea
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Cuenta</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Descripción</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Débito</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Crédito</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">
                              <select
                                required
                                value={line.accountId}
                                onChange={(e) => handleAccountChange(index, e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                disabled={!canEdit}
                              >
                              <option value="">Seleccionar...</option>
                              {accounts.filter(a => a.isActive).map(account => (
                                <option key={account.id} value={account.id}>
                                  {account.code} - {account.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={line.description}
                              onChange={(e) => updateLine(index, 'description', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                              disabled={!canEdit}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.debit || ''}
                              onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-blue-500"
                              disabled={!canEdit}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.credit || ''}
                              onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-blue-500"
                              disabled={!canEdit}
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeLine(index)}
                              className="text-red-600 hover:text-red-800"
                              disabled={lines.length === 1 || !canEdit}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t bg-gray-50 font-medium">
                        <td colSpan={2} className="px-3 py-2 text-right">Totales:</td>
                        <td className="px-3 py-2 text-right">${getTotalDebits().toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">${getTotalCredits().toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">
                          {isBalanced() ? (
                            <span className="text-green-600 text-xs">Balanceado</span>
                          ) : (
                            <span className="text-red-600 text-xs">Desbalanceado</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3">
                {canEdit ? (
                  <>
                    <button
                      type="submit"
                      disabled={!isBalanced()}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Save size={18} />
                      {editingEntry ? 'Actualizar' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition font-medium"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <div className="text-sm text-gray-600">No tiene permisos para modificar asientos.</div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry) => {
                const total = entry.lines.reduce((sum, line) => sum + line.debit, 0);
                return (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.date).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {entry.reference}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {entry.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      ${total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.status === 'ANOTADO' ? 'bg-green-100 text-green-800' :
                        entry.status === 'VOID' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex gap-2 justify-center">
                        {canEdit ? (
                          <>
                            <button
                              onClick={() => handleEdit(entry)}
                              className="text-blue-600 hover:text-blue-800 transition"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="text-red-600 hover:text-red-800 transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No hay asientos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
