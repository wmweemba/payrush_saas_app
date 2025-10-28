/**
 * Enhanced Invoice Creation Form
 * 
 * React component for creating invoices with line items support
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencySelect, CurrencyInput } from "@/components/ui/CurrencySelect";
import { getDefaultCurrency, formatCurrency } from "@/lib/currency/currencies";
import { clientService } from "@/lib/clientService";
import { getAvailableTemplates } from "@/lib/pdf/templateService";
import InvoiceLineItemsManager from "./InvoiceLineItemsManager";
import { Calculator, Receipt, FileText, Users, Palette, Plus, Trash2, Edit } from "lucide-react";

// Pre-Creation Line Items Component (for entering line items before invoice creation)
const PreCreationLineItems = ({ items, currency, onItemsChange, onTotalChange }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    quantity: 1,
    unit_price: 0
  });

  useEffect(() => {
    const total = items.reduce((sum, item) => sum + item.line_total, 0);
    if (onTotalChange) {
      onTotalChange(total);
    }
  }, [items, onTotalChange]);

  const handleAddItem = () => {
    setEditingIndex(null);
    setFormData({ description: '', quantity: 1, unit_price: 0 });
    setShowForm(true);
  };

  const handleEditItem = (index) => {
    setEditingIndex(index);
    setFormData(items[index]);
    setShowForm(true);
  };

  const handleSaveItem = () => {
    // Validate required fields
    if (!formData.description.trim()) {
      return;
    }
    
    const lineTotal = parseFloat(formData.quantity) * parseFloat(formData.unit_price);
    const itemToSave = {
      ...formData,
      quantity: parseFloat(formData.quantity),
      unit_price: parseFloat(formData.unit_price),
      line_total: lineTotal
    };

    if (editingIndex !== null) {
      // Update existing item
      const newItems = [...items];
      newItems[editingIndex] = itemToSave;
      onItemsChange(newItems);
    } else {
      // Add new item
      onItemsChange([...items, itemToSave]);
    }

    setShowForm(false);
    setFormData({ description: '', quantity: 1, unit_price: 0 });
    setEditingIndex(null);
  };

  const handleDeleteItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onItemsChange(newItems);
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({ description: '', quantity: 1, unit_price: 0 });
    setEditingIndex(null);
  };

  return (
    <div className="space-y-3">
      {/* Add New Item Button */}
      {!showForm && (
        <Button
          type="button"
          onClick={handleAddItem}
          variant="outline"
          className="w-full border-dashed border-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Line Item
        </Button>
      )}

      {/* Line Item Form */}
      {showForm && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Description */}
                <div className="md:col-span-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Website Design"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Quantity */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Qty *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Unit Price */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Line Total */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total
                  </label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency((parseFloat(formData.quantity) || 0) * (parseFloat(formData.unit_price) || 0), currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCancel} size="sm">
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSaveItem} 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!formData.description.trim()}
                >
                  {editingIndex !== null ? 'Update' : 'Add'} Item
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Line Items List */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <Card key={index} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {item.description}
                    </h4>
                    <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <span>Qty: {item.quantity}</span>
                      <span>×</span>
                      <span>{formatCurrency(item.unit_price, currency)}</span>
                      <span>=</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.line_total, currency)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditItem(index)}
                      disabled={showForm}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && !showForm && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-300 mb-3">
            No line items added yet
          </p>
          <Button
            type="button"
            onClick={handleAddItem}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Item
          </Button>
        </div>
      )}
    </div>
  );
};

const EnhancedInvoiceForm = ({ onSuccess, onCancel, initialData = null }) => {
  const [invoiceType, setInvoiceType] = useState('simple'); // 'simple' or 'detailed'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState(null);

  // Client management state
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [loadingClients, setLoadingClients] = useState(false);

  // Template selection state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Form data for invoice header
  const [formData, setFormData] = useState({
    customer_name: initialData?.customer_name || '',
    customer_email: initialData?.customer_email || '',
    currency: initialData?.currency || getDefaultCurrency(),
    due_date: initialData?.due_date || '',
    template_id: initialData?.template_id || '', // Add template selection
    // Simple invoice fields
    amount: initialData?.amount || '',
    // Detailed invoice will use line items
    description: initialData?.description || 'Professional Services'
  });

  // Line items total for detailed invoices
  const [lineItemsTotal, setLineItemsTotal] = useState(0);
  
  // Pre-creation line items (before invoice exists)
  const [preCreationLineItems, setPreCreationLineItems] = useState([]);

  // Set default due date (30 days from now)
  useEffect(() => {
    if (!formData.due_date) {
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);
      setFormData(prev => ({
        ...prev,
        due_date: defaultDueDate.toISOString().split('T')[0]
      }));
    }
  }, []);

  // Load clients on component mount
  useEffect(() => {
    const loadClients = async () => {
      setLoadingClients(true);
      try {
        const response = await clientService.getClients();
        if (response.success) {
          setClients(response.data.clients || []);
        } else {
          console.error('Failed to load clients:', response.error);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, []);

  // Load available templates
  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const templates = await getAvailableTemplates();
        setTemplates(templates);
        
        // Set default template if available
        const defaultTemplate = templates.find(t => t.isDefault);
        if (defaultTemplate && !formData.template_id) {
          setFormData(prev => ({
            ...prev,
            template_id: defaultTemplate.id
          }));
          setSelectedTemplateId(defaultTemplate.id);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCurrencyChange = (currency) => {
    setFormData(prev => ({
      ...prev,
      currency
    }));
  };

  const handleAmountChange = (amount) => {
    setFormData(prev => ({
      ...prev,
      amount
    }));
  };

  const handleTemplateChange = (templateId) => {
    setSelectedTemplateId(templateId);
    setFormData(prev => ({
      ...prev,
      template_id: templateId
    }));
  };

  const handleLineItemsTotalChange = (total) => {
    setLineItemsTotal(total);
  };

  // Handle client selection from dropdown
  const handleClientSelect = (clientId) => {
    setSelectedClientId(clientId);
    
    if (clientId === 'new') {
      // Allow manual entry for new client
      setFormData(prev => ({
        ...prev,
        customer_name: '',
        customer_email: '',
        currency: getDefaultCurrency()
      }));
    } else if (clientId) {
      // Auto-populate from selected client
      const selectedClient = clients.find(client => client.id === clientId);
      if (selectedClient) {
        setFormData(prev => ({
          ...prev,
          customer_name: selectedClient.name,
          customer_email: selectedClient.email || '',
          currency: selectedClient.default_currency || getDefaultCurrency()
        }));
      }
    }
  };

  const validateForm = () => {
    if (!formData.customer_name.trim()) {
      setMessage('Customer name is required');
      setIsError(true);
      return false;
    }

    if (invoiceType === 'simple') {
      if (!formData.description.trim()) {
        setMessage('Description is required for simple invoices');
        setIsError(true);
        return false;
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setMessage('Amount must be greater than 0');
        setIsError(true);
        return false;
      }
    } else {
      if (lineItemsTotal <= 0) {
        setMessage('Please add at least one line item with a positive amount');
        setIsError(true);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (!validateForm()) {
      return;
    }

    // Validate detailed invoice has line items
    if (invoiceType === 'detailed' && preCreationLineItems.length === 0) {
      setMessage('Please add at least one line item for detailed invoices');
      setIsError(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');
      
      // Create the invoice first
      const invoiceData = {
        customer_name: formData.customer_name.trim(),
        customer_email: formData.customer_email.trim() || null,
        currency: formData.currency,
        due_date: formData.due_date,
        template_id: formData.template_id || null,
        // For simple invoices, use the amount. For detailed, use line items total
        amount: invoiceType === 'simple' ? parseFloat(formData.amount) : lineItemsTotal,
        is_line_item_invoice: invoiceType === 'detailed',
        status: 'draft'
      };

      // Add client_id if a client is selected (not "new" or manual entry)
      if (selectedClientId && selectedClientId !== 'new') {
        invoiceData.client_id = selectedClientId;
      }

      const response = await fetch('http://localhost:5000/api/invoices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create invoice');
      }

      const result = await response.json();
      const newInvoiceId = result.data.invoice.id;
      setCreatedInvoiceId(newInvoiceId);

      // For simple invoices, create a single line item with the description
      if (invoiceType === 'simple') {
        try {
          await fetch(`http://localhost:5000/api/invoices/${newInvoiceId}/line-items`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              description: formData.description.trim(),
              quantity: 1,
              unit_price: parseFloat(formData.amount),
              sort_order: 0
            })
          });
          setMessage('Invoice created successfully!');
        } catch (lineItemError) {
          console.warn('Error creating line item for simple invoice:', lineItemError);
          setMessage('Invoice created successfully!');
        }
      }

      // For detailed invoices, create all the line items
      if (invoiceType === 'detailed' && preCreationLineItems.length > 0) {
        try {
          // Create line items in sequence
          for (let i = 0; i < preCreationLineItems.length; i++) {
            const item = preCreationLineItems[i];
            const lineItemResponse = await fetch(`http://localhost:5000/api/invoices/${newInvoiceId}/line-items`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                sort_order: i
              })
            });

            if (!lineItemResponse.ok) {
              console.warn(`Failed to create line item ${i + 1}`);
            }
          }
          
          setMessage(`Invoice created successfully with ${preCreationLineItems.length} line item(s)!`);
        } catch (lineItemError) {
          console.warn('Error creating line items:', lineItemError);
          setMessage('Invoice created, but some line items may not have been added');
        }
      } else {
        setMessage('Invoice created successfully!');
      }

      setIsError(false);

      // Call success callback after a short delay to show the success message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(result.data.invoice);
        }
      }, 1500);

    } catch (error) {
      console.error('Error creating invoice:', error);
      setMessage(`Error creating invoice: ${error.message}`);
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFinalAmount = () => {
    return invoiceType === 'simple' 
      ? parseFloat(formData.amount) || 0
      : lineItemsTotal;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Create New Invoice
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Choose between a simple invoice or detailed line items
        </p>
      </div>

      {/* Messages */}
      {message && (
        <Alert className={isError ? "border-red-200 bg-red-50 dark:bg-red-900/20" : "border-green-200 bg-green-50 dark:bg-green-900/20"}>
          <AlertDescription className={isError ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"}>
            {message}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Invoice Details
          </CardTitle>
          <CardDescription>
            Enter the basic information for your invoice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Users className="inline-block w-4 h-4 mr-1" />
                Select Client
              </label>
              <Select 
                value={selectedClientId} 
                onValueChange={handleClientSelect}
                disabled={isSubmitting || loadingClients}
              >
                <SelectTrigger className="w-full bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select an existing client or enter new customer details"} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 shadow-lg max-h-60 overflow-y-auto">
                  <SelectItem value="new" className="bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white cursor-pointer">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      <span>Enter New Customer Details</span>
                    </div>
                  </SelectItem>
                  {clients.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 mt-1 bg-gray-50 dark:bg-slate-700">
                        Existing Clients
                      </div>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id} className="bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white cursor-pointer">
                          <div className="flex flex-col">
                            <span className="font-medium">{client.name}</span>
                            {client.email && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">{client.email}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {clients.length === 0 && !loadingClients && (
                    <SelectItem value="" disabled className="bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                      <span className="text-gray-500 dark:text-gray-400">No clients found</span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting || (selectedClientId && selectedClientId !== 'new')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder={selectedClientId && selectedClientId !== 'new' ? "Auto-filled from selected client" : "Enter customer name"}
                />
                {selectedClientId && selectedClientId !== 'new' && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    ✓ Auto-populated from selected client
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer Email
                </label>
                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleInputChange}
                  disabled={isSubmitting || (selectedClientId && selectedClientId !== 'new')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder={selectedClientId && selectedClientId !== 'new' ? "Auto-filled from selected client" : "Enter customer email (optional)"}
                />
                {selectedClientId && selectedClientId !== 'new' && formData.customer_email && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    ✓ Auto-populated from selected client
                  </p>
                )}
              </div>
            </div>

            {/* Currency and Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Currency
                </label>
                <CurrencySelect
                  value={formData.currency}
                  onChange={handleCurrencyChange}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Palette className="inline-block w-4 h-4 mr-1" />
                Invoice Template
              </label>
              <Select 
                value={selectedTemplateId} 
                onValueChange={handleTemplateChange}
                disabled={isSubmitting || loadingTemplates}
              >
                <SelectTrigger className="w-full bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue placeholder={loadingTemplates ? "Loading templates..." : "Choose a template for your invoice"} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 shadow-lg max-h-60 overflow-y-auto">
                  {templates.length === 0 && !loadingTemplates && (
                    <SelectItem value="" disabled className="bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                      <span className="text-gray-500 dark:text-gray-400">No templates available</span>
                    </SelectItem>
                  )}
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id} className="bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white cursor-pointer">
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <span className="font-medium">{template.name}</span>
                          {template.isDefault && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                              Default
                            </span>
                          )}
                          {template.isSystem && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                              System
                            </span>
                          )}
                        </div>
                        {template.description && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{template.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Choose how your invoice will look when generated as PDF
              </p>
            </div>

            {/* Invoice Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Invoice Type
              </label>
              <Tabs value={invoiceType} onValueChange={setInvoiceType} className="w-full">
                <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100 dark:bg-slate-800">
                  <TabsTrigger 
                    value="simple" 
                    className="flex items-center justify-center data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    Simple Invoice
                  </TabsTrigger>
                  <TabsTrigger 
                    value="detailed" 
                    className="flex items-center justify-center data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Detailed Line Items
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="simple" className="mt-4 space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-300 dark:border-blue-700">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                      <Receipt className="w-5 h-5 mr-2" />
                      Simple Invoice
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Perfect for single services or products. Enter one total amount.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description / Service Name *
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="e.g., Website Design Services, Consulting Fee, Monthly Retainer"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Brief description of what you're billing for
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount ({formData.currency}) *
                    </label>
                    <CurrencyInput
                      value={formData.amount}
                      currency={formData.currency}
                      onChange={handleAmountChange}
                      disabled={isSubmitting}
                      placeholder="0.00"
                      className="w-full"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="detailed" className="mt-4 space-y-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-300 dark:border-purple-700">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center">
                      <Calculator className="w-5 h-5 mr-2" />
                      Detailed Line Items
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Add multiple items with quantities and individual prices. Perfect for detailed billing.
                    </p>
                  </div>

                  {/* Line Items Entry Component */}
                  <PreCreationLineItems
                    items={preCreationLineItems}
                    currency={formData.currency}
                    onItemsChange={setPreCreationLineItems}
                    onTotalChange={setLineItemsTotal}
                  />

                  {/* Preview of line items total */}
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300">
                        Line Items Total:
                      </span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(lineItemsTotal, formData.currency)}
                      </span>
                    </div>
                    {preCreationLineItems.length === 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        ⚠️ Please add at least one line item before creating the invoice
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Notes - Temporarily disabled until database column is added */}
            {/* 
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                disabled={isSubmitting}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Add any additional notes or terms..."
              />
            </div>
            */}

            {/* Total Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Invoice Total
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {invoiceType === 'simple' ? 'Simple invoice amount' : 'Based on line items'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(getFinalAmount(), formData.currency)}
                  </div>
                  <Badge variant="secondary" className="mt-1">
                    {invoiceType === 'simple' ? 'Simple' : 'Detailed'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (invoiceType === 'simple' && getFinalAmount() <= 0)}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
              >
                {isSubmitting ? 'Creating...' : 'Create Invoice'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedInvoiceForm;