'use client';

import { useState, useEffect } from 'react';
import { Plus, MessageCircle, User, Settings, Edit, Trash2, Eye, EyeOff, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { apiClient, API_ENDPOINTS } from '@/lib/apiConfig';
import { useToast } from '@/hooks/use-toast';

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

const NOTE_TYPE_LABELS = {
  internal: 'Internal',
  customer: 'Customer Facing',
  system: 'System'
};

export default function InvoiceNotesWidget({ invoiceId, isPublicView = false }) {
  const { toast } = useToast();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [summary, setSummary] = useState(null);
  
  // Form state for creating/editing notes
  const [formData, setFormData] = useState({
    note_type: 'internal',
    content: '',
    priority: 'normal',
    is_visible_to_customer: false
  });

  // Load notes on component mount and when invoiceId changes
  useEffect(() => {
    if (invoiceId) {
      loadNotes();
      if (!isPublicView) {
        loadSummary();
      }
    }
  }, [invoiceId, isPublicView]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      
      // Use different endpoint for public view (customer notes only)
      const endpoint = isPublicView 
        ? API_ENDPOINTS.invoiceNotesCustomer(invoiceId)
        : API_ENDPOINTS.invoiceNotes(invoiceId);
      
      const params = isPublicView ? {} : { 
        includeSystem: 'true',
        sortBy: 'created_at',
        sortOrder: 'desc'
      };
      
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      
      const response = await apiClient(url);

      if (response.success) {
        setNotes(isPublicView ? response.data : response.data.notes || []);
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

  const loadSummary = async () => {
    try {
      const response = await apiClient(API_ENDPOINTS.invoiceNotesSummary(invoiceId));
      if (response.success) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Error loading summary:', error);
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

      const response = await apiClient(API_ENDPOINTS.invoiceNotes(invoiceId), {
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
        await Promise.all([loadNotes(), loadSummary()]);
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
        await Promise.all([loadNotes(), loadSummary()]);
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
        await Promise.all([loadNotes(), loadSummary()]);
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
      note_type: note.note_type,
      content: note.note_text,
      priority: note.priority,
      is_visible_to_customer: note.is_visible_to_customer
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
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

  // Filter notes by type for tabs
  const getFilteredNotes = (type) => {
    if (type === 'all') return notes;
    return notes.filter(note => note.note_type === type);
  };

  const renderNote = (note) => {
    const TypeIcon = NOTE_TYPE_ICONS[note.note_type] || MessageCircle;
    
    return (
      <div key={note.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className={`p-2 rounded-lg ${
              note.note_type === 'internal' 
                ? 'bg-blue-100 dark:bg-blue-900' 
                : note.note_type === 'customer' 
                  ? 'bg-green-100 dark:bg-green-900' 
                  : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <TypeIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Badge className={`text-xs ${PRIORITY_COLORS[note.priority]}`}>
                  {note.priority}
                </Badge>
                {note.is_visible_to_customer && (
                  <Badge variant="outline" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Customer Visible
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {note.note_text}
              </p>
            </div>
          </div>
          
          {!isPublicView && (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditDialog(note)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteNote(note.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{NOTE_TYPE_LABELS[note.note_type]}</span>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{new Date(note.created_at).toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderCreateEditDialog = (isEdit = false) => (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? 'Edit Note' : 'Add New Note'}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
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
            {isEdit ? 'Update Note' : 'Add Note'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );

  if (isPublicView && notes.length === 0) {
    return null; // Don't show anything for public view if no customer-visible notes
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>{isPublicView ? 'Comments' : 'Notes & Comments'}</span>
            </CardTitle>
            {!isPublicView && summary && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {summary.total_notes} total • {summary.customer_visible} customer visible
              </p>
            )}
          </div>
          
          {!isPublicView && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </DialogTrigger>
              {renderCreateEditDialog(false)}
            </Dialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {!isPublicView && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({notes.length})</TabsTrigger>
              <TabsTrigger value="internal">
                Internal ({getFilteredNotes('internal').length})
              </TabsTrigger>
              <TabsTrigger value="customer">
                Customer ({getFilteredNotes('customer').length})
              </TabsTrigger>
              <TabsTrigger value="system">
                System ({getFilteredNotes('system').length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <ScrollArea className="h-96">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading notes...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {isPublicView ? (
                notes.length > 0 ? (
                  notes.map(renderNote)
                ) : (
                  <p className="text-center text-gray-500 py-8">No comments available</p>
                )
              ) : (
                <TabsContent value="all" className="mt-0">
                  {notes.length > 0 ? (
                    notes.map(renderNote)
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">No notes yet</p>
                      <Button onClick={openCreateDialog} variant="link" className="mt-2">
                        Add your first note
                      </Button>
                    </div>
                  )}
                </TabsContent>
              )}
              
              {!isPublicView && ['internal', 'customer', 'system'].map(type => (
                <TabsContent key={type} value={type} className="mt-0">
                  {getFilteredNotes(type).length > 0 ? (
                    getFilteredNotes(type).map(renderNote)
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        No {NOTE_TYPE_LABELS[type].toLowerCase()} notes
                      </p>
                      {type !== 'system' && (
                        <Button onClick={openCreateDialog} variant="link" className="mt-2">
                          Add {NOTE_TYPE_LABELS[type].toLowerCase()} note
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        {renderCreateEditDialog(true)}
      </Dialog>
    </Card>
  );
}