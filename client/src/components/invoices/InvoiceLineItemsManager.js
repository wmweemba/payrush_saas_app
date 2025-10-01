/**
 * Invoice Line Items Manager Component
 * 
 * React component for managing invoice line items with add, edit, delete, and reorder functionality
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/currency/currencies";
import { Trash2, Edit, Plus, GripVertical, Calculator } from "lucide-react";

// Line Item Form Component
const LineItemForm = ({ item, onSave, onCancel, currency = "USD" }) => {
  const [formData, setFormData] = useState({
    description: item?.description || "",
    quantity: item?.quantity || 1,
    unit_price: item?.unit_price || 0,
    sort_order: item?.sort_order || 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving line item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const lineTotal = (parseFloat(formData.quantity) || 0) * (parseFloat(formData.unit_price) || 0);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          {item ? 'Edit Line Item' : 'Add New Line Item'}
        </CardTitle>
        <CardDescription>
          {item ? 'Update the line item details' : 'Add a new item to this invoice'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Description - takes most space */}
            <div className="md:col-span-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter item description"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Quantity */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Unit Price */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unit Price ({currency}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-slate-800 text-gray-900 dark:text-white 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Line Total (calculated) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Line Total
              </label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(lineTotal, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
              disabled={isSubmitting || !formData.description.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Main Line Items Manager Component
const InvoiceLineItemsManager = ({ 
  invoiceId, 
  currency = "USD", 
  onTotalChange,
  initialLineItems = [],
  readOnly = false 
}) => {
  const [lineItems, setLineItems] = useState(initialLineItems);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Calculate total whenever line items change
  useEffect(() => {
    const total = lineItems.reduce((sum, item) => sum + (item.line_total || 0), 0);
    if (onTotalChange) {
      onTotalChange(total);
    }
  }, [lineItems, onTotalChange]);

  // Load line items on component mount
  useEffect(() => {
    if (invoiceId && initialLineItems.length === 0) {
      loadLineItems();
    }
  }, [invoiceId]);

  const loadLineItems = async () => {
    if (!invoiceId) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/invoices/${invoiceId}/line-items`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load line items');
      }

      const data = await response.json();
      setLineItems(data.data.lineItems || []);
    } catch (error) {
      console.error('Error loading line items:', error);
      setMessage(`Error loading line items: ${error.message}`);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveItem = async (formData) => {
    const token = localStorage.getItem('authToken');
    
    try {
      let response;
      if (editingItem) {
        // Update existing item
        response = await fetch(`http://localhost:5000/api/line-items/${editingItem.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
      } else {
        // Create new item
        response = await fetch(`http://localhost:5000/api/invoices/${invoiceId}/line-items`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save line item');
      }

      const data = await response.json();
      
      if (editingItem) {
        // Update existing item in state
        setLineItems(items => 
          items.map(item => 
            item.id === editingItem.id ? data.data.lineItem : item
          )
        );
        setMessage('Line item updated successfully!');
      } else {
        // Add new item to state
        setLineItems(items => [...items, data.data.lineItem]);
        setMessage('Line item added successfully!');
      }

      setIsError(false);
      setShowForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving line item:', error);
      setMessage(`Error saving line item: ${error.message}`);
      setIsError(true);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this line item?')) return;

    const token = localStorage.getItem('authToken');
    
    try {
      const response = await fetch(`http://localhost:5000/api/line-items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete line item');
      }

      setLineItems(items => items.filter(item => item.id !== itemId));
      setMessage('Line item deleted successfully!');
      setIsError(false);
    } catch (error) {
      console.error('Error deleting line item:', error);
      setMessage(`Error deleting line item: ${error.message}`);
      setIsError(true);
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.line_total || 0), 0);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading line items...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Invoice Line Items
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {lineItems.length} {lineItems.length === 1 ? 'item' : 'items'} • Total: {formatCurrency(calculateTotal(), currency)}
          </p>
        </div>
        {!readOnly && (
          <Button
            onClick={handleAddNew}
            disabled={showForm}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Line Item
          </Button>
        )}
      </div>

      {/* Messages */}
      {message && (
        <Alert className={isError ? "border-red-200 bg-red-50 dark:bg-red-900/20" : "border-green-200 bg-green-50 dark:bg-green-900/20"}>
          <AlertDescription className={isError ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"}>
            {message}
          </AlertDescription>
        </Alert>
      )}

      {/* Line Item Form */}
      {showForm && (
        <LineItemForm
          item={editingItem}
          currency={currency}
          onSave={handleSaveItem}
          onCancel={handleCancel}
        />
      )}

      {/* Line Items List */}
      {lineItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No line items yet
            </h4>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Add line items to break down your invoice into detailed items with quantities and prices.
            </p>
            {!readOnly && (
              <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add First Line Item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {lineItems.map((item, index) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {!readOnly && (
                      <div className="cursor-grab text-gray-400 hover:text-gray-600">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {item.description}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300 mt-1">
                        <span>Qty: {item.quantity}</span>
                        <span>×</span>
                        <span>{formatCurrency(item.unit_price, currency)}</span>
                        <span>=</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(item.line_total, currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!readOnly && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        disabled={showForm}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Total Summary */}
          <Card className="bg-gray-50 dark:bg-slate-700 border-2 border-dashed border-gray-300 dark:border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-900 dark:text-white">
                  Invoice Total:
                </span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(calculateTotal(), currency)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InvoiceLineItemsManager;