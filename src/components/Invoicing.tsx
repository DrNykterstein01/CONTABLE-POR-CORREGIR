import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, FileText, X } from 'lucide-react';
import { storage } from '../services/storage';
import type { Invoice, InvoiceItem, Customer } from '../types';
import { useAuth } from '../contexts/AuthContext';

const IVA_RATE = 0.16;

export function Invoicing() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'CONTADOR';
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    customerId: '',
    customerName: '',
    customerCedula: '',
    notes: ''
  });

  const [items, setItems] = useState<Omit<InvoiceItem, 'id'>[]>([
    { description: '', quantity: 1, unitPrice: 0, subtotal: 0, iva: 0, total: 0 }
  ]);

  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    cedula: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setInvoices(storage.getInvoices());
    setCustomers(storage.getCustomers());
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customerId: customer.id,
        customerName: customer.name,
        customerCedula: customer.cedula
      });
    }
  };

  const calculateItemTotals = (quantity: number, unitPrice: number) => {
    const subtotal = quantity * unitPrice;
    const iva = subtotal * IVA_RATE;
    const total = subtotal + iva;
    return { subtotal, iva, total };
  };

  const updateItem = (index: number, field: keyof Omit<InvoiceItem, 'id'>, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      const { subtotal, iva, total } = calculateItemTotals(
        field === 'quantity' ? Number(value) : newItems[index].quantity,
        field === 'unitPrice' ? Number(value) : newItems[index].unitPrice
      );
      newItems[index].subtotal = subtotal;
      newItems[index].iva = iva;
      newItems[index].total = total;
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, subtotal: 0, iva: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const getInvoiceTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const iva = items.reduce((sum, item) => sum + item.iva, 0);
    const total = items.reduce((sum, item) => sum + item.total, 0);
    return { subtotal, iva, total };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId) {
      alert('Debe seleccionar un cliente');
      return;
    }

    const totals = getInvoiceTotals();
    const itemsWithIds: InvoiceItem[] = items.map(item => ({
      ...item,
      id: crypto.randomUUID()
    }));

    if (editingInvoice) {
      const updated = invoices.map(inv =>
        inv.id === editingInvoice.id
          ? {
              ...inv,
              ...formData,
              ...totals,
              items: itemsWithIds,
              updatedAt: new Date().toISOString()
            }
          : inv
      );
      storage.saveInvoices(updated);
    } else {
      const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
      const newInvoice: Invoice = {
        id: crypto.randomUUID(),
        invoiceNumber,
        ...formData,
        ...totals,
        status: 'DRAFT',
        items: itemsWithIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      storage.saveInvoices([...invoices, newInvoice]);

      storage.addAuditLog({
        userId: 'admin',
        userName: 'Administrador',
        action: 'CREATE',
        module: 'INVOICES',
        recordId: newInvoice.id,
        changes: JSON.stringify(newInvoice)
      });
    }

    resetForm();
    loadData();
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      ...customerFormData,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    storage.saveCustomers([...customers, newCustomer]);
    setCustomers([...customers, newCustomer]);
    setCustomerFormData({ name: '', cedula: '', email: '', phone: '', address: '' });
    setShowCustomerForm(false);

    setFormData({
      ...formData,
      customerId: newCustomer.id,
      customerName: newCustomer.name,
      customerCedula: newCustomer.cedula
    });
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerId: '',
      customerName: '',
      customerCedula: '',
      notes: ''
    });
    setItems([{ description: '', quantity: 1, unitPrice: 0, subtotal: 0, iva: 0, total: 0 }]);
    setEditingInvoice(null);
    setShowForm(false);
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      date: invoice.date,
      dueDate: invoice.dueDate,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      customerCedula: invoice.customerCedula,
      notes: invoice.notes
    });
    setItems(invoice.items.map(({ id, ...rest }) => rest));
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta factura?')) {
      const updated = invoices.filter(inv => inv.id !== id);
      storage.saveInvoices(updated);
      loadData();
    }
  };

  const updateStatus = (id: string, status: Invoice['status']) => {
    const updated = invoices.map(inv =>
      inv.id === id ? { ...inv, status, updatedAt: new Date().toISOString() } : inv
    );
    storage.saveInvoices(updated);
    loadData();
  };

  const totals = getInvoiceTotals();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Facturación</h2>
        {canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Nueva Factura
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full my-8">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {editingInvoice ? 'Editar Factura' : 'Nueva Factura'}
              </h3>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Vencimiento</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex gap-2">
                      <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                      <select
                        required
                        value={formData.customerId}
                        onChange={(e) => handleCustomerChange(e.target.value)}
                        disabled={!canEdit}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar cliente...</option>
                        {customers.filter(c => c.isActive).map(customer => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} - {customer.cedula}
                          </option>
                        ))}
                      </select>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setShowCustomerForm(true)}
                        className="mt-7 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        + Cliente
                      </button>
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">Ítems</h4>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Agregar Ítem
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Descripción</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Cantidad</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Precio Unit.</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Subtotal</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">IVA (16%)</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              required
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              disabled={!canEdit}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              required
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                              disabled={!canEdit}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              required
                              step="0.01"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                              disabled={!canEdit}
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-sm">
                            ${item.subtotal.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right text-sm">
                            ${item.iva.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right text-sm font-medium">
                            ${item.total.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                              disabled={items.length === 1 || !canEdit}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 bg-gray-50">
                      <tr className="font-medium">
                        <td colSpan={3} className="px-3 py-2 text-right">Subtotal:</td>
                        <td className="px-3 py-2 text-right">${totals.subtotal.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">${totals.iva.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-lg">${totals.total.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="flex gap-3">
                {canEdit ? (
                  <>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      {editingInvoice ? 'Actualizar' : 'Guardar'}
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
                  <div className="text-sm text-gray-600">No tiene permisos para crear o editar facturas.</div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {showCustomerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Nuevo Cliente</h3>
              <button onClick={() => setShowCustomerForm(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCustomerSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                  <input
                    type="text"
                    required
                    value={customerFormData.name}
                    onChange={(e) => setCustomerFormData({...customerFormData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cédula/RIF</label>
                  <input
                    type="text"
                    required
                    value={customerFormData.cedula}
                    onChange={(e) => setCustomerFormData({...customerFormData, cedula: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={customerFormData.email}
                    onChange={(e) => setCustomerFormData({...customerFormData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    required
                    value={customerFormData.phone}
                    onChange={(e) => setCustomerFormData({...customerFormData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                  <input
                    type="text"
                    required
                    value={customerFormData.address}
                    onChange={(e) => setCustomerFormData({...customerFormData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomerForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition font-medium"
                >
                  Cancelar
                </button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">IVA</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(invoice.date).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {invoice.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ${invoice.subtotal.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ${invoice.iva.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    ${invoice.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <select
                      value={invoice.status}
                      onChange={(e) => updateStatus(invoice.id, e.target.value as Invoice['status'])}
                      disabled={!canEdit}
                      className={`px-2 py-1 text-xs font-semibold rounded border-0 cursor-pointer ${
                        invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                        invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                        invoice.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      <option value="DRAFT">BORRADOR</option>
                      <option value="SENT">ENVIADA</option>
                      <option value="PAID">PAGADA</option>
                      <option value="OVERDUE">VENCIDA</option>
                      <option value="CANCELLED">CANCELADA</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex gap-2 justify-center">
                      {canEdit ? (
                        <>
                          <button
                            onClick={() => handleEdit(invoice)}
                            className="text-blue-600 hover:text-blue-800 transition"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            className="text-red-600 hover:text-red-800 transition"
                            title="Eliminar"
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
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No hay facturas registradas
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
