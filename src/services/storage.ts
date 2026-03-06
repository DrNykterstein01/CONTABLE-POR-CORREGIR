import type { Employee, Account, JournalEntry, Invoice, FixedAsset, AuditLog, Customer, Vendor, CostCenter, Budget, User } from '../types';

class StorageService {
  private getItem<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private setItem<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  getEmployees(): Employee[] {
    return this.getItem<Employee>('employees');
  }

  saveEmployees(employees: Employee[]): void {
    this.setItem('employees', employees);
  }

  getAccounts(): Account[] {
    return this.getItem<Account>('accounts');
  }

  saveAccounts(accounts: Account[]): void {
    this.setItem('accounts', accounts);
  }

  getJournalEntries(): JournalEntry[] {
    return this.getItem<JournalEntry>('journalEntries');
  }

  saveJournalEntries(entries: JournalEntry[]): void {
    this.setItem('journalEntries', entries);
  }

  getInvoices(): Invoice[] {
    return this.getItem<Invoice>('invoices');
  }

  saveInvoices(invoices: Invoice[]): void {
    this.setItem('invoices', invoices);
  }

  getFixedAssets(): FixedAsset[] {
    return this.getItem<FixedAsset>('fixedAssets');
  }

  saveFixedAssets(assets: FixedAsset[]): void {
    this.setItem('fixedAssets', assets);
  }

  getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog>('auditLogs');
  }

  saveAuditLogs(logs: AuditLog[]): void {
    this.setItem('auditLogs', logs);
  }

  getCustomers(): Customer[] {
    return this.getItem<Customer>('customers');
  }

  saveCustomers(customers: Customer[]): void {
    this.setItem('customers', customers);
  }

  getVendors(): Vendor[] {
    return this.getItem<Vendor>('vendors');
  }

  saveVendors(vendors: Vendor[]): void {
    this.setItem('vendors', vendors);
  }

  getCostCenters(): CostCenter[] {
    return this.getItem<CostCenter>('costCenters');
  }

  saveCostCenters(centers: CostCenter[]): void {
    this.setItem('costCenters', centers);
  }

  getBudgets(): Budget[] {
    return this.getItem<Budget>('budgets');
  }

  saveBudgets(budgets: Budget[]): void {
    this.setItem('budgets', budgets);
  }

  getUsers(): User[] {
    return this.getItem<User>('users');
  }

  saveUsers(users: User[]): void {
    this.setItem('users', users);
  }

  // Simple credentials storage separate from `users` (passwords stored in localStorage for demo only)
  getCredentials(): Record<string, string> {
    const data = localStorage.getItem('auth_credentials');
    return data ? JSON.parse(data) : {};
  }

  saveCredentials(creds: Record<string, string>): void {
    localStorage.setItem('auth_credentials', JSON.stringify(creds));
  }

  initializeDefaultUsers(): void {
    const users = this.getUsers();
    const creds = this.getCredentials();
    if (users.length === 0) {
      const admin: User = {
        id: 'u-1',
        username: 'admin',
        fullName: 'Administrador',
        role: 'ADMIN',
        permissions: [],
        isActive: true,
      };
      this.saveUsers([admin]);
      creds['admin'] = 'admin';
      this.saveCredentials(creds);
    }
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...log
    };
    logs.push(newLog);
    this.saveAuditLogs(logs);
  }

  initializeDefaultAccounts(): void {
    const existingAccounts = this.getAccounts();
    if (existingAccounts.length === 0) {
      const defaultAccounts: Account[] = [
        { id: '1', code: '1000', name: 'Caja', type: 'ACTIVO', subType: 'ACTIVO CORRIENTE', balance: 0, isActive: true, createdAt: new Date().toISOString() },
        { id: '2', code: '1100', name: 'Banco', type: 'ACTIVO', subType: 'ACTIVO CORRIENTE', balance: 0, isActive: true, createdAt: new Date().toISOString() },
        { id: '3', code: '1200', name: 'Cuentas por Cobrar', type: 'ACTIVO', subType: 'ACTIVO CORRIENTE', balance: 0, isActive: true, createdAt: new Date().toISOString() },
        { id: '4', code: '1300', name: 'Inventario', type: 'ACTIVO', subType: 'ACTIVO CORRIENTE', balance: 0, isActive: true, createdAt: new Date().toISOString() },
        { id: '5', code: '1500', name: 'Activos Fijos', type: 'ACTIVO', subType: 'ACTIVO NO CORRIENTE', balance: 0, isActive: true, createdAt: new Date().toISOString() },
        { id: '6', code: '1510', name: 'Depreciación Acumulada', type: 'ACTIVO', subType: 'ACTIVO NO CORRIENTE', balance: 0, isActive: true, createdAt: new Date().toISOString() },
        { id: '7', code: '2000', name: 'Cuentas por Pagar', type: 'PASIVO', subType: 'PASIVO CORRIENTE', balance: 0, isActive: true, createdAt: new Date().toISOString() },
        { id: '8', code: '2100', name: 'IVA por Pagar', type: 'PASIVO', subType: 'PASIVO CORRIENTE', balance: 0, isActive: true, createdAt: new Date().toISOString() },
        { id: '9', code: '2200', name: 'Sueldos por Pagar', type: 'PASIVO', subType: 'PASIVO CORRIENTE', balance: 0, isActive: true, createdAt: new Date().toISOString() },
        { id: '10', code: '2500', name: 'Préstamos Bancarios', type: 'PASIVO', subType: 'PASIVO NO CORRIENTE', balance: 0, isActive: true, createdAt: new Date().toISOString() },
        { id: '11', code: '3000', name: 'Capital Social', type: 'CAPITAL', subType: 'PATRIMONIO', balance: 0, isActive: true, createdAt: new Date().toISOString() },
        { id: '12', code: '3100', name: 'Utilidades Retenidas', type: 'CAPITAL', subType: 'PATRIMONIO', balance: 0, isActive: true, createdAt: new Date().toISOString() },
        { id: '13', code: '4000', name: 'Ventas', type: 'INGRESO', subType: 'INGRESOS OPERACIONALES', balance: 0, isActive: true, createdAt: new Date().toISOString() },
        { id: '14', code: '4100', name: 'Ingresos por Servicios', type: 'INGRESO', subType: 'INGRESOS OPERACIONALES', balance: 0, isActive: true, createdAt: new Date().toISOString() },
        { id: '15', code: '5000', name: 'Costo de Ventas', type: 'GASTO', subType: 'COSTOS OPERACIONALES', balance: 0, isActive: true, createdAt: new Date().toISOString() },
        { id: '16', code: '6000', name: 'Gastos de Nómina', type: 'GASTO', subType: 'GASTOS OPERACIONALES', balance: 0, isActive: true, createdAt: new Date().toISOString() },
        { id: '17', code: '6100', name: 'Gastos de Alquiler', type: 'GASTO', subType: 'GASTOS OPERACIONALES', balance: 0, isActive: true, createdAt: new Date().toISOString() },
        { id: '18', code: '6200', name: 'Gastos de Servicios', type: 'GASTO', subType: 'GASTOS OPERACIONALES', balance: 0, isActive: true, createdAt: new Date().toISOString() },
        { id: '19', code: '6300', name: 'Depreciación', type: 'GASTO', subType: 'GASTOS OPERACIONALES', balance: 0, isActive: true, createdAt: new Date().toISOString() },
      ];
      this.saveAccounts(defaultAccounts);
    }
  }
}

export const storage = new StorageService();
