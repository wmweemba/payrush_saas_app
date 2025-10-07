'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, TrendingUp, AlertCircle, Eye, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiClient, API_ENDPOINTS } from '@/lib/apiConfig';
import { useRouter } from 'next/navigation';

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

export default function NotesSummaryCard() {
  const router = useRouter();
  const [recentNotes, setRecentNotes] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    urgent: 0,
    customerVisible: 0,
    internal: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Search for recent notes (last 10) with empty query to get all notes
      const notesResponse = await apiClient(`${API_ENDPOINTS.invoiceNotesSearch}?q=&limit=10`);
      
      if (notesResponse.success) {
        const notes = notesResponse.data.notes || [];
        setRecentNotes(notes);
        
        // Calculate stats from notes
        const stats = {
          total: notes.length,
          urgent: notes.filter(note => note.priority === 'urgent' || note.priority === 'high').length,
          customerVisible: notes.filter(note => note.is_visible_to_customer).length,
          internal: notes.filter(note => note.note_type === 'internal').length
        };
        setStats(stats);
      }
    } catch (error) {
      console.error('Error loading notes dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCompactNote = (note) => {
    return (
      <div key={note.id} className="p-3 border border-gray-100 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
           onClick={() => router.push(`/dashboard/invoices/${note.invoice_id}`)}>
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {note.note_text?.substring(0, 50) || 'Untitled Note'}{note.note_text?.length > 50 ? '...' : ''}
          </h4>
          <Badge className={`text-xs ml-2 ${PRIORITY_COLORS[note.priority]}`}>
            {note.priority}
          </Badge>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
          {note.note_text}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {note.invoices?.customer_name}
          </span>
          <div className="flex items-center space-x-1">
            {note.is_visible_to_customer && (
              <Eye className="h-3 w-3 text-green-600" />
            )}
            <span className="text-xs text-gray-500">
              {new Date(note.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Recent Notes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Notes & Comments</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/dashboard/notes')}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.total}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Total Notes
            </div>
          </div>
          
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center justify-center">
              {stats.urgent}
              {stats.urgent > 0 && <AlertCircle className="h-4 w-4 ml-1" />}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              High Priority
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center justify-center">
              {stats.customerVisible}
              <Eye className="h-4 w-4 ml-1" />
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Customer Visible
            </div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {stats.internal}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Internal Notes
            </div>
          </div>
        </div>

        {/* Recent Notes List */}
        <div>
          <h3 className="font-medium text-sm text-gray-900 dark:text-white mb-3 flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Recent Activity
          </h3>
          
          <ScrollArea className="h-64">
            {recentNotes.length > 0 ? (
              <div className="space-y-3">
                {recentNotes.map(renderCompactNote)}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">No notes yet</p>
                <Button 
                  variant="link" 
                  className="mt-2" 
                  onClick={() => router.push('/dashboard/notes')}
                >
                  Create your first note
                </Button>
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}