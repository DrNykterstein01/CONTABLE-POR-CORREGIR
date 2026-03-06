import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users, FileText, AlertCircle, Calendar } from 'lucide-react';
import { storage } from '../services/storage';
import type { Account, Invoice, Employee, JournalEntry } from '../types';

export function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAccounts(storage.getAccounts());
    setInvoices(storage.getInvoices());
    setEmployees(storage.getEmployees());
    setJournalEntries(storage.getJournalEntries());
  };

  const getTotalByType = (type: string) => {
    return accounts
      .filter(acc => acc.type === type && acc.isActive)
      .reduce((sum, acc) => sum + acc.balance, 0);
  };

  const totalActivos = getTotalByType('ACTIVO');
  const totalPasivos = getTotalByType('PASIVO');
  const totalCapital = getTotalByType('CAPITAL');
  const totalIngresos = getTotalByType('INGRESO');
  const totalGastos = getTotalByType('GASTO');
  const utilidadNeta = totalIngresos - totalGastos;

  const totalFacturasPendientes = invoices
    .filter(inv => inv.status === 'SENT' || inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + inv.total, 0);

  const facturasVencidas = invoices.filter(inv => {
    if (inv.status !== 'SENT' && inv.status !== 'OVERDUE') return false;
    return new Date(inv.dueDate) < new Date();
  });

  const empleadosActivos = employees.filter(emp => emp.isActive).length;

  const nominaMensual = employees
    .filter(emp => emp.isActive)
    .reduce((sum, emp) => sum + emp.salary, 0);

  const facturasDelMes = invoices.filter(inv => {
    const invDate = new Date(inv.date);
    const now = new Date();
    return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
  });

  const ingresosDelMes = facturasDelMes
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.total, 0);

  const ratioLiquidez = totalPasivos > 0 ? (totalActivos / totalPasivos).toFixed(2) : 'N/A';
  const margenNeto = totalIngresos > 0 ? ((utilidadNeta / totalIngresos) * 100).toFixed(2) : '0.00';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Ejecutivo</h2>
        <p className="text-gray-600">Resumen financiero</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <DollarSign size={24} />
            </div>
            <TrendingUp size={20} className="opacity-75" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Activos</h3>
          <p className="text-2xl font-bold">${totalActivos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className={`bg-gradient-to-br ${utilidadNeta >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} rounded-lg shadow-lg p-6 text-white`}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              {utilidadNeta >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Utilidad Neta</h3>
          <p className="text-2xl font-bold">${Math.abs(utilidadNeta).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs opacity-75 mt-1">Margen: {margenNeto}%</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <FileText size={24} />
            </div>
            {facturasVencidas.length > 0 && (
              <AlertCircle size={20} className="text-yellow-300" />
            )}
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Cuentas por Cobrar</h3>
          <p className="text-2xl font-bold">${totalFacturasPendientes.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
          {facturasVencidas.length > 0 && (
            <p className="text-xs opacity-75 mt-1">{facturasVencidas.length} facturas vencidas</p>
          )}
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Users size={24} />
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Empleados Activos</h3>
          <p className="text-2xl font-bold">{empleadosActivos}</p>
          <p className="text-xs opacity-75 mt-1">Nómina: ${nominaMensual.toLocaleString('es-ES', { minimumFractionDigits: 2 })}/mes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Resumen Patrimonial</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Activos</span>
              <span className="font-bold text-blue-600">${totalActivos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Pasivos</span>
              <span className="font-bold text-red-600">${totalPasivos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Patrimonio</span>
              <span className="font-bold text-green-600">${totalCapital.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-3 border-t-2 border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Ratio de Liquidez</span>
                <span className="font-bold text-gray-900">{ratioLiquidez}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Estado de Resultados (Mes Actual)</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Ingresos</span>
              <span className="font-bold text-green-600">${totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Gastos</span>
              <span className="font-bold text-red-600">${totalGastos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className={`flex items-center justify-between p-3 rounded-lg ${utilidadNeta >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <span className="text-sm font-medium text-gray-700">
                {utilidadNeta >= 0 ? 'Utilidad' : 'Pérdida'}
              </span>
              <span className={`font-bold ${utilidadNeta >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ${Math.abs(utilidadNeta).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="pt-3 border-t-2 border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Ingresos del Mes</span>
                <span className="font-bold text-gray-900">${ingresosDelMes.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-blue-600" size={24} />
            <h3 className="text-lg font-bold text-gray-800">Actividad Reciente</h3>
          </div>
          <div className="space-y-2">
            {journalEntries.slice(-5).reverse().map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{entry.description}</p>
                  <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString('es-ES')}</p>
                </div>
                <span className="text-sm font-bold text-gray-700">
                  ${entry.lines.reduce((sum, line) => sum + line.debit, 0).toFixed(2)}
                </span>
              </div>
            ))}
            {journalEntries.length === 0 && (
              <p className="text-center text-gray-500 py-4">No hay actividad reciente</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-orange-600" size={24} />
            <h3 className="text-lg font-bold text-gray-800">Alertas y Pendientes</h3>
          </div>
          <div className="space-y-2">
            {facturasVencidas.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">
                  {facturasVencidas.length} factura{facturasVencidas.length > 1 ? 's' : ''} vencida{facturasVencidas.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Total: ${facturasVencidas.reduce((sum, inv) => sum + inv.total, 0).toFixed(2)}
                </p>
              </div>
            )}

            {facturasDelMes.filter(inv => inv.status === 'DRAFT').length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">
                  {facturasDelMes.filter(inv => inv.status === 'DRAFT').length} factura{facturasDelMes.filter(inv => inv.status === 'DRAFT').length > 1 ? 's' : ''} en borrador
                </p>
                <p className="text-xs text-yellow-600 mt-1">Pendiente de envío</p>
              </div>
            )}

            {nominaMensual > totalIngresos * 0.4 && totalIngresos > 0 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-800">Nómina alta</p>
                <p className="text-xs text-orange-600 mt-1">
                  Representa {((nominaMensual / totalIngresos) * 100).toFixed(1)}% de los ingresos
                </p>
              </div>
            )}

            {facturasVencidas.length === 0 && facturasDelMes.filter(inv => inv.status === 'DRAFT').length === 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">Todo en orden</p>
                <p className="text-xs text-green-600 mt-1">No hay alertas pendientes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600 text-center">
          Los datos se actualizan en tiempo real. Última actualización: {new Date().toLocaleString('es-ES')}
        </p>
      </div>
    </div>
  );
}
