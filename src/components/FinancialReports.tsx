import { useState, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import { storage } from '../services/storage';
import type { Account, JournalEntry } from '../types';

type ReportType = 'balance-sheet' | 'income-statement' | 'ledger';

export function FinancialReports() {
  const [activeReport, setActiveReport] = useState<ReportType>('balance-sheet');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAccounts(storage.getAccounts());
    setJournalEntries(storage.getJournalEntries());
  };

  const getAccountsByType = (type: string, subType?: string) => {
    return accounts.filter(acc => {
      const matchesType = acc.type === type;
      const matchesSubType = subType ? acc.subType === subType : true;
      return matchesType && matchesSubType && acc.isActive;
    });
  };

  const getTotalByType = (type: string) => {
    return accounts
      .filter(acc => acc.type === type && acc.isActive)
      .reduce((sum, acc) => sum + acc.balance, 0);
  };

  const getLedgerEntries = (accountId: string) => {
    if (!accountId) return [];

    const entries: Array<{
      date: string;
      reference: string;
      description: string;
      debit: number;
      credit: number;
      balance: number;
    }> = [];

    let balance = 0;

    const filteredJournalEntries = journalEntries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        const from = dateFrom ? new Date(dateFrom) : new Date('1900-01-01');
        const to = dateTo ? new Date(dateTo) : new Date();
        return entryDate >= from && entryDate <= to && entry.status === 'ANOTADO';
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    filteredJournalEntries.forEach(entry => {
      const lines = entry.lines.filter(line => line.accountId === accountId);
      lines.forEach(line => {
        const account = accounts.find(a => a.id === accountId);
        if (account) {
          if (account.type === 'ACTIVO' || account.type === 'GASTO') {
            balance += (line.debit - line.credit);
          } else {
            balance += (line.credit - line.debit);
          }

          entries.push({
            date: entry.date,
            reference: entry.reference,
            description: line.description || entry.description,
            debit: line.debit,
            credit: line.credit,
            balance
          });
        }
      });
    });

    return entries;
  };

  const renderBalanceSheet = () => {
    const activosCirculantes = getAccountsByType('ACTIVO', 'ACTIVO CORRIENTE');
    const activosFijos = getAccountsByType('ACTIVO', 'ACTIVO NO CORRIENTE');
    const pasivosCirculantes = getAccountsByType('PASIVO', 'PASIVO CORRIENTE');
    const pasivosLargoPlazo = getAccountsByType('PASIVO', 'PASIVO NO CORRIENTE');
    const patrimonio = getAccountsByType('CAPITAL');

    const totalActivos = getTotalByType('ACTIVO');
    const totalPasivos = getTotalByType('PASIVO');
    const totalCapital = getTotalByType('CAPITAL');

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Balance General</h3>
          <p className="text-gray-600">Al {new Date(dateTo).toLocaleDateString('es-ES')}</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-bold text-blue-900 mb-4 border-b-2 border-blue-300 pb-2">ACTIVOS</h4>

            <div className="mb-4">
              <h5 className="font-semibold text-blue-800 mb-2">Activos Corrientes</h5>
              {activosCirculantes.map(acc => (
                <div key={acc.id} className="flex justify-between py-1 text-sm">
                  <span className="text-gray-700">{acc.name}</span>
                  <span className="font-medium">${acc.balance.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t mt-2 pt-1 flex justify-between font-medium text-sm">
                <span>Subtotal</span>
                <span>${activosCirculantes.reduce((s, a) => s + a.balance, 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-4">
              <h5 className="font-semibold text-blue-800 mb-2">Activos No Corrientes</h5>
              {activosFijos.map(acc => (
                <div key={acc.id} className="flex justify-between py-1 text-sm">
                  <span className="text-gray-700">{acc.name}</span>
                  <span className="font-medium">${acc.balance.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t mt-2 pt-1 flex justify-between font-medium text-sm">
                <span>Subtotal</span>
                <span>${activosFijos.reduce((s, a) => s + a.balance, 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t-2 border-blue-300 mt-4 pt-2 flex justify-between font-bold text-lg">
              <span>TOTAL ACTIVOS</span>
              <span>${totalActivos.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-red-50 p-6 rounded-lg">
              <h4 className="text-lg font-bold text-red-900 mb-4 border-b-2 border-red-300 pb-2">PASIVOS</h4>

              <div className="mb-4">
                <h5 className="font-semibold text-red-800 mb-2">Pasivos Corrientes</h5>
                {pasivosCirculantes.map(acc => (
                  <div key={acc.id} className="flex justify-between py-1 text-sm">
                    <span className="text-gray-700">{acc.name}</span>
                    <span className="font-medium">${acc.balance.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t mt-2 pt-1 flex justify-between font-medium text-sm">
                  <span>Subtotal</span>
                  <span>${pasivosCirculantes.reduce((s, a) => s + a.balance, 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-4">
                <h5 className="font-semibold text-red-800 mb-2">Pasivos No Corrientes</h5>
                {pasivosLargoPlazo.map(acc => (
                  <div key={acc.id} className="flex justify-between py-1 text-sm">
                    <span className="text-gray-700">{acc.name}</span>
                    <span className="font-medium">${acc.balance.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t mt-2 pt-1 flex justify-between font-medium text-sm">
                  <span>Subtotal</span>
                  <span>${pasivosLargoPlazo.reduce((s, a) => s + a.balance, 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t-2 border-red-300 mt-4 pt-2 flex justify-between font-bold">
                <span>TOTAL PASIVOS</span>
                <span>${totalPasivos.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h4 className="text-lg font-bold text-green-900 mb-4 border-b-2 border-green-300 pb-2">PATRIMONIO</h4>

              {patrimonio.map(acc => (
                <div key={acc.id} className="flex justify-between py-1 text-sm">
                  <span className="text-gray-700">{acc.name}</span>
                  <span className="font-medium">${acc.balance.toFixed(2)}</span>
                </div>
              ))}

              <div className="border-t-2 border-green-300 mt-4 pt-2 flex justify-between font-bold">
                <span>TOTAL PATRIMONIO</span>
                <span>${totalCapital.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-gray-800 text-white p-4 rounded-lg">
              <div className="flex justify-between font-bold text-lg">
                <span>PASIVO + PATRIMONIO</span>
                <span>${(totalPasivos + totalCapital).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderIncomeStatement = () => {
    const ingresos = getAccountsByType('INGRESO');
    const gastos = getAccountsByType('GASTO');

    const totalIngresos = getTotalByType('INGRESO');
    const totalGastos = getTotalByType('GASTO');
    const utilidadNeta = totalIngresos - totalGastos;

    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Estado de Resultados</h3>
          <p className="text-gray-600">
            Período: {dateFrom ? new Date(dateFrom).toLocaleDateString('es-ES') : 'Inicio'} - {new Date(dateTo).toLocaleDateString('es-ES')}
          </p>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            <h4 className="text-lg font-bold text-green-900 mb-3 border-b-2 border-green-300 pb-2">INGRESOS</h4>
            {ingresos.map(acc => (
              <div key={acc.id} className="flex justify-between py-2 hover:bg-green-50 px-2">
                <span className="text-gray-700">{acc.code} - {acc.name}</span>
                <span className="font-medium">${acc.balance.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t-2 border-green-300 mt-2 pt-2 flex justify-between font-bold text-green-800 px-2">
              <span>TOTAL INGRESOS</span>
              <span>${totalIngresos.toFixed(2)}</span>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-bold text-red-900 mb-3 border-b-2 border-red-300 pb-2">GASTOS</h4>
            {gastos.map(acc => (
              <div key={acc.id} className="flex justify-between py-2 hover:bg-red-50 px-2">
                <span className="text-gray-700">{acc.code} - {acc.name}</span>
                <span className="font-medium">${acc.balance.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t-2 border-red-300 mt-2 pt-2 flex justify-between font-bold text-red-800 px-2">
              <span>TOTAL GASTOS</span>
              <span>${totalGastos.toFixed(2)}</span>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${utilidadNeta >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <div className="flex justify-between font-bold text-xl">
              <span className={utilidadNeta >= 0 ? 'text-green-900' : 'text-red-900'}>
                {utilidadNeta >= 0 ? 'UTILIDAD NETA' : 'PÉRDIDA NETA'}
              </span>
              <span className={utilidadNeta >= 0 ? 'text-green-900' : 'text-red-900'}>
                ${Math.abs(utilidadNeta).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLedger = () => {
    const ledgerEntries = getLedgerEntries(selectedAccount);
    const selectedAccountData = accounts.find(a => a.id === selectedAccount);

    return (
      <div>
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Libro Mayor</h3>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cuenta</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar cuenta...</option>
                {accounts.filter(a => a.isActive).map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {selectedAccountData && (
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <div className="mb-4">
              <h4 className="text-xl font-bold text-gray-800">
                {selectedAccountData.code} - {selectedAccountData.name}
              </h4>
              <p className="text-sm text-gray-600">
                Tipo: {selectedAccountData.type} / {selectedAccountData.subType}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Débito</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Crédito</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ledgerEntries.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(entry.date).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{entry.reference}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{entry.description}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {entry.debit > 0 ? `$${entry.debit.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {entry.credit > 0 ? `$${entry.credit.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        ${entry.balance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {ledgerEntries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        {selectedAccount ? 'No hay movimientos en el período seleccionado' : 'Seleccione una cuenta para ver el libro mayor'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedAccount && ledgerEntries.length > 0 && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">Saldo Actual:</span>
                  <span className="text-xl font-bold text-gray-900">
                    ${ledgerEntries[ledgerEntries.length - 1]?.balance.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Reportes Financieros</h2>
        <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
          <Download size={20} />
          Exportar PDF
        </button>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveReport('balance-sheet')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            activeReport === 'balance-sheet'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <FileText size={18} />
          Balance General
        </button>

        <button
          onClick={() => setActiveReport('income-statement')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            activeReport === 'income-statement'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <FileText size={18} />
          Estado de Resultados
        </button>

        <button
          onClick={() => setActiveReport('ledger')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            activeReport === 'ledger'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <FileText size={18} />
          Libro Mayor
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {activeReport === 'balance-sheet' && renderBalanceSheet()}
        {activeReport === 'income-statement' && renderIncomeStatement()}
        {activeReport === 'ledger' && renderLedger()}
      </div>
    </div>
  );
}
