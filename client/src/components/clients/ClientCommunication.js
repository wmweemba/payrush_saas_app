'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MessageCircle, 
  Plus, 
  Clock, 
  AlertCircle, 
  Calendar,
  Search,
  Filter,
  Edit,
  Trash2,
  Bell,
  CheckCircle,
  Circle,
  Tag,
  Phone,
  Mail,
  MessageSquare,
  User,
  FileText,
  Activity
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const ClientCommunication = ({ clientId }) => {
  const [notes, setNotes] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notes');
  
  // Note form state
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    note_type: 'general',
    priority: 'medium',
    tags: [],
    is_private: false
  });
  
  // Reminder form state
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    title: '',
    description: '',
    reminder_date: '',
    priority: 'medium',
    reminder_type: 'general'
  });
  
  // Filters
  const [noteFilters, setNoteFilters] = useState({
    search: '',
    note_type: 'all',
    priority: 'all',
    tags: ''
  });
  
  const [reminderFilters, setReminderFilters] = useState({
    status: 'pending',
    upcoming_only: false
  });

  const noteTypes = [
    { value: 'general', label: 'General', icon: FileText },
    { value: 'meeting', label: 'Meeting', icon: User },
    { value: 'call', label: 'Phone Call', icon: Phone },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'follow_up', label: 'Follow-up', icon: Clock },
    { value: 'important', label: 'Important', icon: AlertCircle }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' }
  ];

  const reminderTypes = [
    { value: 'general', label: 'General' },
    { value: 'payment', label: 'Payment Follow-up' },
    { value: 'contract', label: 'Contract Review' },
    { value: 'meeting', label: 'Scheduled Meeting' },
    { value: 'document', label: 'Document Request' }
  ];

  // Fetch data
  useEffect(() => {
    if (clientId) {
      fetchAllData();
    }
  }, [clientId, noteFilters, reminderFilters]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchNotes(),
        fetchTimeline(),
        fetchReminders(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching communication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const filteredParams = {
        limit: '20',
        offset: '0',
        ...noteFilters
      };
      
      // Remove "all" values as they mean no filter
      if (filteredParams.note_type === 'all') delete filteredParams.note_type;
      if (filteredParams.priority === 'all') delete filteredParams.priority;
      
      const params = new URLSearchParams(filteredParams);
      
      const response = await fetch(`/api/clients/${clientId}/notes?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotes(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const fetchTimeline = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/timeline?limit=50`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTimeline(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
    }
  };

  const fetchReminders = async () => {
    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: '0',
        ...reminderFilters
      });
      
      const response = await fetch(`/api/clients/${clientId}/reminders?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReminders(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/communication-stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || {});
      }
    } catch (error) {
      console.error('Error fetching communication stats:', error);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/clients/${clientId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...noteForm,
          tags: noteForm.tags.filter(tag => tag.trim())
        })
      });

      if (response.ok) {
        setIsAddingNote(false);
        setNoteForm({
          title: '',
          content: '',
          note_type: 'general',
          priority: 'medium',
          tags: [],
          is_private: false
        });
        await fetchNotes();
        await fetchTimeline();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/clients/${clientId}/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reminderForm)
      });

      if (response.ok) {
        setIsAddingReminder(false);
        setReminderForm({
          title: '',
          description: '',
          reminder_date: '',
          priority: 'medium',
          reminder_type: 'general'
        });
        await fetchReminders();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
    }
  };

  const getTimelineIcon = (type) => {
    switch (type) {
      case 'note': return FileText;
      case 'interaction': return MessageCircle;
      case 'reminder': return Bell;
      default: return Activity;
    }
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj?.color || 'bg-gray-100 text-gray-800';
  };

  const getNoteTypeIcon = (type) => {
    const noteType = noteTypes.find(nt => nt.value === type);
    return noteType?.icon || FileText;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Communication Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notes</p>
                <p className="text-2xl font-bold">{stats.total_notes || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Interactions</p>
                <p className="text-2xl font-bold">{stats.total_interactions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Reminders</p>
                <p className="text-2xl font-bold">{stats.pending_reminders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Last Contact</p>
                <p className="text-sm font-semibold">
                  {stats.last_contact_date 
                    ? formatDistanceToNow(new Date(stats.last_contact_date), { addSuffix: true })
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Client Communication</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
            </TabsList>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <div className="flex flex-wrap items-center space-x-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4" />
                    <Input
                      placeholder="Search notes..."
                      value={noteFilters.search}
                      onChange={(e) => setNoteFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-48"
                    />
                  </div>
                  <Select value={noteFilters.note_type} onValueChange={(value) => setNoteFilters(prev => ({ ...prev, note_type: value }))}>
                    <SelectTrigger className="w-40 bg-white border-gray-300">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                      <SelectItem value="all" className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">All Types</SelectItem>
                      {noteTypes.map(type => (
                        <SelectItem key={type.value} value={type.value} className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={noteFilters.priority} onValueChange={(value) => setNoteFilters(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger className="w-40 bg-white border-gray-300">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                      <SelectItem value="all" className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">All Priorities</SelectItem>
                      {priorities.map(priority => (
                        <SelectItem key={priority.value} value={priority.value} className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">{priority.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Note</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateNote} className="space-y-4">
                      <div>
                        <Label htmlFor="note-title">Title</Label>
                        <Input
                          id="note-title"
                          value={noteForm.title}
                          onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="note-content">Content</Label>
                        <Textarea
                          id="note-content"
                          value={noteForm.content}
                          onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                          rows={4}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="note-type">Type</Label>
                          <Select value={noteForm.note_type} onValueChange={(value) => setNoteForm(prev => ({ ...prev, note_type: value }))}>
                            <SelectTrigger className="bg-white border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                              {noteTypes.map(type => (
                                <SelectItem key={type.value} value={type.value} className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">{type.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="note-priority">Priority</Label>
                          <Select value={noteForm.priority} onValueChange={(value) => setNoteForm(prev => ({ ...prev, priority: value }))}>
                            <SelectTrigger className="bg-white border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                              {priorities.map(priority => (
                                <SelectItem key={priority.value} value={priority.value} className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">{priority.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="note-tags">Tags (comma separated)</Label>
                        <Input
                          id="note-tags"
                          value={noteForm.tags.join(', ')}
                          onChange={(e) => setNoteForm(prev => ({ 
                            ...prev, 
                            tags: e.target.value.split(',').map(tag => tag.trim()) 
                          }))}
                          placeholder="urgent, follow-up, contract"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsAddingNote(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Add Note</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {notes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No notes found. Create your first note to start tracking client communications.
                  </div>
                ) : (
                  notes.map((note) => {
                    const TypeIcon = getNoteTypeIcon(note.note_type);
                    return (
                      <Card key={note.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <TypeIcon className="h-5 w-5 text-gray-600 mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-medium">{note.title}</h4>
                                <Badge className={getPriorityColor(note.priority)}>
                                  {note.priority}
                                </Badge>
                                {note.is_private && (
                                  <Badge variant="secondary">Private</Badge>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm mb-2">{note.content}</p>
                              {note.tags && note.tags.length > 0 && (
                                <div className="flex items-center space-x-1 mb-2">
                                  <Tag className="h-3 w-3 text-gray-400" />
                                  {note.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-4">
              <div className="space-y-4">
                {timeline.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No timeline entries found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {timeline.map((entry, index) => {
                      const TimelineIcon = getTimelineIcon(entry.type);
                      return (
                        <div key={index} className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <TimelineIcon className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {entry.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(entry.created_at), 'MMM d, yyyy HH:mm')}
                              </p>
                            </div>
                            {entry.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {entry.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Reminders Tab */}
            <TabsContent value="reminders" className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <Select 
                    value={reminderFilters.status} 
                    onValueChange={(value) => setReminderFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="w-40 bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                      <SelectItem value="pending" className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">Pending</SelectItem>
                      <SelectItem value="completed" className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">Completed</SelectItem>
                      <SelectItem value="all" className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog open={isAddingReminder} onOpenChange={setIsAddingReminder}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Reminder
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Reminder</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateReminder} className="space-y-4">
                      <div>
                        <Label htmlFor="reminder-title">Title</Label>
                        <Input
                          id="reminder-title"
                          value={reminderForm.title}
                          onChange={(e) => setReminderForm(prev => ({ ...prev, title: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="reminder-description">Description</Label>
                        <Textarea
                          id="reminder-description"
                          value={reminderForm.description}
                          onChange={(e) => setReminderForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="reminder-date">Reminder Date</Label>
                        <Input
                          id="reminder-date"
                          type="datetime-local"
                          value={reminderForm.reminder_date}
                          onChange={(e) => setReminderForm(prev => ({ ...prev, reminder_date: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="reminder-type">Type</Label>
                          <Select value={reminderForm.reminder_type} onValueChange={(value) => setReminderForm(prev => ({ ...prev, reminder_type: value }))}>
                            <SelectTrigger className="bg-white border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                              {reminderTypes.map(type => (
                                <SelectItem key={type.value} value={type.value} className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">{type.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="reminder-priority">Priority</Label>
                          <Select value={reminderForm.priority} onValueChange={(value) => setReminderForm(prev => ({ ...prev, priority: value }))}>
                            <SelectTrigger className="bg-white border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                              {priorities.map(priority => (
                                <SelectItem key={priority.value} value={priority.value} className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">{priority.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsAddingReminder(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Add Reminder</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {reminders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No reminders found.
                  </div>
                ) : (
                  reminders.map((reminder) => (
                    <Card key={reminder.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <Bell className="h-5 w-5 text-orange-600 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium">{reminder.title}</h4>
                              <Badge className={getPriorityColor(reminder.priority)}>
                                {reminder.priority}
                              </Badge>
                              <Badge variant={reminder.status === 'completed' ? 'default' : 'secondary'}>
                                {reminder.status}
                              </Badge>
                            </div>
                            {reminder.description && (
                              <p className="text-gray-600 text-sm mb-2">{reminder.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Due: {format(new Date(reminder.reminder_date), 'MMM d, yyyy HH:mm')}</span>
                              <span>Type: {reminder.reminder_type}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {reminder.status === 'pending' ? (
                            <Button variant="ghost" size="sm">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm">
                              <Circle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientCommunication;