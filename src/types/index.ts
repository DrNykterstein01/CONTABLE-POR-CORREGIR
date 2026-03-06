export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  cedula: string;
  address: string;
  email: string;
  phone: string;
  position: string;
  salary: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'ACTIVO' | 'PASIVO' | 'CAPITAL' | 'INGRESO' | 'GASTO';
  subType: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reference: string;
  status: 'DRAFT' | 'ANOTADO' | 'VOID';
  createdBy: string;
  lines: JournalLine[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  customerCedula: string;
  subtotal: number;
  iva: number;
  total: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  items: InvoiceItem[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  iva: number;
  total: number;
}

export interface FixedAsset {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  purchasePrice: number;
  depreciationRate: number;
  usefulLife: number;
  currentValue: number;
  accumulatedDepreciation: number;
  status: 'ACTIVE' | 'DISPOSED' | 'FULLY_DEPRECIATED';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  recordId: string;
  changes: string;
  ipAddress?: string;
}

export interface Customer {
  id: string;
  name: string;
  cedula: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  rif: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  budget: number;
  spent: number;
}

export interface Budget {
  id: string;
  year: number;
  month: number;
  accountId: string;
  accountName: string;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'CONTADOR' | 'ESPECTADOR';
  permissions: string[];
  isActive: boolean;
}
