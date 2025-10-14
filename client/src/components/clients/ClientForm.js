'use client';

import { useState, useEffect } from 'react';
import { clientValidation } from '@/lib/clientService';
import { SUPPORTED_CURRENCIES } from '@/lib/currency/currencies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, User, Mail, Phone, Globe, MapPin, CreditCard, Tags, FileText } from 'lucide-react';

export default function ClientForm({ client = null, onSubmit, onCancel, isLoading = false }) {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    taxNumber: '',
    website: '',
    notes: '',
    tags: [],
    defaultCurrency: 'USD',
    paymentTerms: 30,
    discountRate: 0
  });

  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');

  // Populate form when editing existing client
  useEffect(() => {
    if (client) {
      setFormData({
        companyName: client.company_name || '',
        contactPerson: client.contact_person || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        country: client.country || '',
        postalCode: client.postal_code || '',
        taxNumber: client.tax_number || '',
        website: client.website || '',
        notes: client.notes || '',
        tags: client.tags || [],
        defaultCurrency: client.default_currency || 'USD',
        paymentTerms: client.payment_terms || 30,
        discountRate: client.discount_rate || 0
      });
    }
  }, [client]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    const validation = clientValidation.validateClientData(formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Submit form
    onSubmit(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8" suppressHydrationWarning>
        
        {/* Company Information Card */}
        <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Company Information
              </CardTitle>
            </div>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Essential business details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div className="space-y-2" suppressHydrationWarning>
                <Label htmlFor="companyName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className={`h-11 ${errors.companyName ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter company name"
                  suppressHydrationWarning
                />
                {errors.companyName && (
                  <p className="text-xs text-red-600 mt-1">{errors.companyName}</p>
                )}
              </div>

              {/* Contact Person */}
              <div className="space-y-2" suppressHydrationWarning>
                <Label htmlFor="contactPerson" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <User className="h-4 w-4 inline mr-1" />
                  Contact Person
                </Label>
                <Input
                  id="contactPerson"
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  className="h-11"
                  placeholder="Primary contact name"
                  suppressHydrationWarning
                />
              </div>

              {/* Email */}
              <div className="space-y-2" suppressHydrationWarning>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`h-11 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="contact@company.com"
                  suppressHydrationWarning
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2" suppressHydrationWarning>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`h-11 ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="+260 xxx xxx xxx"
                  suppressHydrationWarning
                />
                {errors.phone && (
                  <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Website */}
              <div className="space-y-2" suppressHydrationWarning>
                <Label htmlFor="website" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Globe className="h-4 w-4 inline mr-1" />
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className={`h-11 ${errors.website ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="https://company.com"
                  suppressHydrationWarning
                />
                {errors.website && (
                  <p className="text-xs text-red-600 mt-1">{errors.website}</p>
                )}
              </div>

              {/* Tax Number */}
              <div className="space-y-2">
                <Label htmlFor="taxNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Tax Number
                </Label>
                <Input
                  id="taxNumber"
                  type="text"
                  value={formData.taxNumber}
                  onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                  className="h-11"
                  placeholder="TPIN or tax registration number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information Card */}
        <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Address Information
              </CardTitle>
            </div>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Physical location and mailing address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Street Address */}
            <div className="space-y-2" suppressHydrationWarning>
              <Label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Street Address
              </Label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="h-11"
                placeholder="Street name and number"
                suppressHydrationWarning
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  City
                </Label>
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="h-11"
                  placeholder="Lusaka"
                />
              </div>

              {/* State/Province */}
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  State/Province
                </Label>
                <Input
                  id="state"
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="h-11"
                  placeholder="Lusaka Province"
                />
              </div>

              {/* Postal Code */}
              <div className="space-y-2">
                <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Postal Code
                </Label>
                <Input
                  id="postalCode"
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  className="h-11"
                  placeholder="10101"
                />
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Country
                </Label>
                <Input
                  id="country"
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="h-11"
                  placeholder="Zambia"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Settings Card */}
        <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Business Settings
              </CardTitle>
            </div>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Payment preferences and business configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Default Currency */}
              <div className="space-y-2">
                <Label htmlFor="defaultCurrency" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default Currency
                </Label>
                <Select value={formData.defaultCurrency} onValueChange={(value) => handleInputChange('defaultCurrency', value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SUPPORTED_CURRENCIES).map(([code, currency]) => (
                      <SelectItem key={code} value={code}>
                        <div className="flex items-center space-x-2">
                          <span>{currency.symbol}</span>
                          <span>{currency.name} ({code})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Terms */}
              <div className="space-y-2">
                <Label htmlFor="paymentTerms" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Payment Terms (days)
                </Label>
                <Input
                  id="paymentTerms"
                  type="number"
                  min="0"
                  max="365"
                  value={formData.paymentTerms}
                  onChange={(e) => handleInputChange('paymentTerms', parseInt(e.target.value))}
                  className={`h-11 ${errors.paymentTerms ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="30"
                />
                {errors.paymentTerms && (
                  <p className="text-xs text-red-600 mt-1">{errors.paymentTerms}</p>
                )}
              </div>

              {/* Discount Rate */}
              <div className="space-y-2">
                <Label htmlFor="discountRate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default Discount (%)
                </Label>
                <Input
                  id="discountRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discountRate}
                  onChange={(e) => handleInputChange('discountRate', parseFloat(e.target.value))}
                  className={`h-11 ${errors.discountRate ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="0"
                />
                {errors.discountRate && (
                  <p className="text-xs text-red-600 mt-1">{errors.discountRate}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Tags Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Tags className="h-4 w-4 text-gray-600" />
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Client Tags
                </Label>
              </div>
              
              <div className="flex space-x-2">
                <Input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="h-11 flex-1"
                  placeholder="Add a tag (e.g., VIP, Retail, Wholesale)"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  variant="outline"
                  className="h-11 px-6"
                >
                  Add
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      {tag}
                      <span className="ml-2 text-blue-600 hover:text-blue-800">×</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes Card */}
        <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Additional Notes
              </CardTitle>
            </div>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Any special instructions or additional information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="resize-none"
                placeholder="Enter any additional notes about this client, special requirements, or important information..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700">
          <CardContent className="pt-6">
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                variant="outline"
                className="px-8 py-2 h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="px-8 py-2 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{client ? 'Updating...' : 'Creating...'}</span>
                  </div>
                ) : (
                  client ? 'Update Client' : 'Create Client'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}