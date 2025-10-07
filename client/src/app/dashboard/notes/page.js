'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, MessageCircle, Eye, EyeOff, AlertCircle, User, Settings, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { apiClient, API_ENDPOINTS } from '@/lib/apiConfig';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

const NOTE_TYPE_ICONS = {
  internal: User,
  customer_facing: MessageCircle,
  system: Settings
};

export default function NotesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [notes, setNotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Form state for creating/editing notes
  const [formData, setFormData] = useState({
    invoice_id: '',
    note_type: 'internal',
    content: '',
    priority: 'normal',
    is_visible_to_customer: false
  });

  // Load notes and invoices on component mount
  useEffect(() => {
    Promise.all([
      loadNotes(),
      loadInvoices()
    ]);
  }, []);

  // Filter notes based on search and filters
  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchQuery || 
      note.note_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.invoices?.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesInvoice = selectedInvoice === 'all' || note.invoice_id === selectedInvoice;
    const matchesType = selectedType === 'all' || note.note_type === selectedType;
    const matchesPriority = selectedPriority === 'all' || note.priority === selectedPriority;
    
    return matchesSearch && matchesInvoice && matchesType && matchesPriority;
  });

  const loadNotes = async () => {
    try {
      setLoading(true);
      
      // Load all notes without search query
      const response = await apiClient(`${API_ENDPOINTS.invoiceNotesSearch}?q=&limit=50`);

      if (response.success) {
        setNotes(response.data.notes || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to load notes",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const response = await apiClient('/api/invoices');
      if (response.success) {
        setInvoices(response.data || []);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const searchNotes = async () => {
    if (!searchQuery.trim()) {
      await loadNotes();
      return;
    }

    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        q: searchQuery.trim()
      });

      if (selectedType !== 'all') queryParams.append('noteType', selectedType);
      if (selectedPriority !== 'all') queryParams.append('priority', selectedPriority);
      if (selectedInvoice !== 'all') queryParams.append('invoiceId', selectedInvoice);

      const response = await apiClient(`${API_ENDPOINTS.invoiceNotesSearch}?${queryParams}`);
      
      if (response.success) {
        setNotes(response.data.notes || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to search notes",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error searching notes:', error);
      toast({
        title: "Error",
        description: "Failed to search notes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      if (!formData.content.trim()) {
        toast({
          title: "Error",
          description: "Note content is required",
          variant: "destructive"
        });
        return;
      }

      if (!formData.invoice_id) {
        toast({
          title: "Error",
          description: "Please select an invoice",
          variant: "destructive"
        });
        return;
      }

      const response = await apiClient(API_ENDPOINTS.invoiceNotes(formData.invoice_id), {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Note created successfully",
        });
        setIsCreateDialogOpen(false);
        resetForm();
        await loadNotes();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create note",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive"
      });
    }
  };

  const handleEditNote = async () => {
    try {
      const response = await apiClient(API_ENDPOINTS.note(currentNote.id), {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Note updated successfully",
        });
        setIsEditDialogOpen(false);
        setCurrentNote(null);
        resetForm();
        await loadNotes();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update note",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive"
      });
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await apiClient(API_ENDPOINTS.note(noteId), {
        method: 'DELETE'
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Note deleted successfully",
        });
        await loadNotes();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete note",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (note) => {
    setCurrentNote(note);
    setFormData({
      invoice_id: note.invoice_id,
      note_type: note.note_type,
      content: note.note_text,
      priority: note.priority,
      is_visible_to_customer: note.is_visible_to_customer
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      invoice_id: '',
      note_type: 'internal',
      content: '',
      priority: 'normal',
      is_visible_to_customer: false
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const renderNoteCard = (note) => {
    const TypeIcon = NOTE_TYPE_ICONS[note.note_type] || MessageCircle;
    
    return (
      <Card key={note.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${note.note_type === 'internal' ? 'bg-blue-100 dark:bg-blue-900' : note.note_type === 'customer_facing' ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <TypeIcon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-medium text-sm truncate">
                    {note.note_text?.substring(0, 50) || 'Untitled Note'}{note.note_text?.length > 50 ? '...' : ''}
                  </h3>
                  <Badge className={`text-xs ${PRIORITY_COLORS[note.priority]}`}>
                    {note.priority}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {note.invoices?.customer_name} • {note.invoices?.status}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {note.is_visible_to_customer && (
                <Eye className="h-4 w-4 text-green-600" />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditDialog(note)}>
                    Edit Note
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => router.push(`/dashboard/invoices/${note.invoice_id}`)}
                  >
                    View Invoice
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-red-600"
                    disabled={note.is_system_generated}
                  >
                    Delete Note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
            {note.note_text}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-500">
              {new Date(note.created_at).toLocaleDateString()}
            </span>
            <Badge variant="outline" className="text-xs">
              {note.note_type.replace('_', ' ')}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCreateEditDialog = (isEdit = false) => (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? 'Edit Note' : 'Create New Note'}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        {!isEdit && (
          <div>
            <Label htmlFor="invoice">Invoice *</Label>
            <Select value={formData.invoice_id} onValueChange={(value) => setFormData({...formData, invoice_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select an invoice" />
              </SelectTrigger>
              <SelectContent>
                {invoices.map((invoice) => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.customer_name} - {formatCurrency(invoice.amount)} ({invoice.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="note_type">Note Type</Label>
            <Select value={formData.note_type} onValueChange={(value) => setFormData({...formData, note_type: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="customer">Customer Facing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="content">Content *</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            placeholder="Enter note content"
            rows={4}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="visible_to_customer"
            checked={formData.is_visible_to_customer}
            onCheckedChange={(checked) => setFormData({...formData, is_visible_to_customer: checked})}
          />
          <Label htmlFor="visible_to_customer">Visible to customer</Label>
        </div>

        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => isEdit ? setIsEditDialogOpen(false) : setIsCreateDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={isEdit ? handleEditNote : handleCreateNote}>
            {isEdit ? 'Update Note' : 'Create Note'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );

  return (
    <DashboardLayout 
      currentTab="notes" 
      title="Invoice Notes & Comments"
      description="Manage internal business notes and customer-facing comments"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Notes Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Create and manage notes for your invoices
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Note</span>
            </Button>
          </DialogTrigger>
          {renderCreateEditDialog(false)}
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notes by content or customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchNotes()}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={selectedInvoice} onValueChange={setSelectedInvoice}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Invoices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Invoices</SelectItem>
                  {invoices.map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.customer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="customer">Customer Facing</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={searchNotes} variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No notes found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery || selectedInvoice !== 'all' || selectedType !== 'all' || selectedPriority !== 'all'
                  ? 'Try adjusting your search criteria.'
                  : 'Get started by creating your first note.'}
              </p>
              <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create First Note
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map(renderNoteCard)}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        {renderCreateEditDialog(true)}
      </Dialog>
    </DashboardLayout>
  );
}