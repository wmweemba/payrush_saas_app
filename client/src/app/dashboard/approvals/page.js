'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Plus, Edit, CheckCircle, XCircle, Clock, Users, FileText, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { API_BASE_URL } from '@/lib/apiConfig';

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [workflows, setWorkflows] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [approvalStats, setApprovalStats] = useState({});
  const [draftInvoices, setDraftInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  // Workflow form state
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [workflowForm, setWorkflowForm] = useState({
    name: '',
    description: '',
    approval_steps: [{ name: '', description: '', approvers: [] }],
    require_all_approvers: false,
    auto_approve_threshold: ''
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await Promise.all([
          fetchWorkflows(),
          fetchPendingApprovals(),
          fetchApprovalStats(),
          fetchDraftInvoices()
        ]);
      }
      setLoading(false);
    };

    getUser();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      console.log('Fetching workflows...');
      const response = await fetch(`${API_BASE_URL}/api/approvals/workflows`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Workflows response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Workflows result:', result);
        setWorkflows(result.data || []);
      } else {
        const errorResult = await response.text();
        console.error('Failed to fetch workflows:', response.status, errorResult);
        setError('Failed to load workflows');
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
      setError('Failed to load workflows');
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      console.log('Fetching pending approvals...');
      const response = await fetch(`${API_BASE_URL}/api/approvals/pending`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Pending approvals response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Pending approvals result:', result);
        setPendingApprovals(result.data || []);
      } else {
        const errorResult = await response.text();
        console.error('Failed to fetch pending approvals:', response.status, errorResult);
        setError('Failed to load pending approvals');
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      setError('Failed to load pending approvals');
    }
  };

  const fetchApprovalStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      console.log('Fetching approval stats...');
      const response = await fetch(`${API_BASE_URL}/api/approvals/stats`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Stats response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Stats result:', result);
        setApprovalStats(result.data || {});
      } else {
        const errorResult = await response.text();
        console.error('Failed to fetch stats:', response.status, errorResult);
        // Don't set error for stats failure, just use default stats
      }
    } catch (error) {
      console.error('Error fetching approval stats:', error);
      // Don't set error for stats failure, just use default stats
    }
  };

  const fetchDraftInvoices = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      console.log('Fetching draft invoices...');
      
      // Fetch draft invoices directly from Supabase
      const { data: drafts, error } = await supabase
        .from('invoices')
        .select('id, customer_name, customer_email, amount, currency, due_date, created_at, custom_invoice_number')
        .eq('user_id', session.user.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching draft invoices:', error);
      } else {
        console.log('Draft invoices found:', drafts?.length || 0);
        setDraftInvoices(drafts || []);
      }
    } catch (error) {
      console.error('Error fetching draft invoices:', error);
    }
  };

  const handleCreateWorkflow = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const workflowData = {
        ...workflowForm,
        auto_approve_threshold: workflowForm.auto_approve_threshold ? parseFloat(workflowForm.auto_approve_threshold) : null
      };

      const response = await fetch(`${API_BASE_URL}/api/approvals/workflows`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflowData)
      });

      if (response.ok) {
        setShowWorkflowDialog(false);
        resetWorkflowForm();
        await fetchWorkflows();
        setError('');
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to create workflow');
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      setError('Failed to create workflow');
    }
  };

  const handleApprovalAction = async (approvalId, action, comments = '') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${API_BASE_URL}/api/approvals/approvals/${approvalId}/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, comments })
      });

      if (response.ok) {
        await fetchPendingApprovals();
        await fetchApprovalStats();
        setError('');
      } else {
        const result = await response.json();
        setError(result.error || `Failed to ${action} approval`);
      }
    } catch (error) {
      console.error(`Error ${action}ing approval:`, error);
      setError(`Failed to ${action} approval`);
    }
  };

  const handleSubmitDraftForApproval = async (invoice) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get active workflows
      if (workflows.length === 0) {
        setError('No approval workflows found. Please create a workflow first.');
        return;
      }

      const activeWorkflow = workflows.find(w => w.is_active) || workflows[0];

      const response = await fetch(`${API_BASE_URL}/api/approvals/invoices/${invoice.id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflow_id: activeWorkflow.id,
          notes: `Invoice submitted for approval from approvals page`
        })
      });

      if (response.ok) {
        setError('');
        // Refresh all data
        await Promise.all([
          fetchPendingApprovals(),
          fetchApprovalStats(),
          fetchDraftInvoices()
        ]);
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to submit invoice for approval');
      }
    } catch (error) {
      console.error('Error submitting invoice for approval:', error);
      setError('Failed to submit invoice for approval');
    }
  };

  const resetWorkflowForm = () => {
    setWorkflowForm({
      name: '',
      description: '',
      approval_steps: [{ name: '', description: '', approvers: [] }],
      require_all_approvers: false,
      auto_approve_threshold: ''
    });
    setEditingWorkflow(null);
  };

  const addApprovalStep = () => {
    setWorkflowForm(prev => ({
      ...prev,
      approval_steps: [...prev.approval_steps, { name: '', description: '', approvers: [] }]
    }));
  };

  const removeApprovalStep = (index) => {
    setWorkflowForm(prev => ({
      ...prev,
      approval_steps: prev.approval_steps.filter((_, i) => i !== index)
    }));
  };

  const updateApprovalStep = (index, field, value) => {
    setWorkflowForm(prev => ({
      ...prev,
      approval_steps: prev.approval_steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardLayout currentTab="approvals" title="Invoice Approvals" description="Manage approval workflows and process invoice approvals">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentTab="approvals" title="Invoice Approvals" description="Manage approval workflows and process invoice approvals">
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApprovals.length}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting your review
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{draftInvoices.length}</div>
              <p className="text-xs text-muted-foreground">
                Ready for approval
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvalStats.approved_count || 0}</div>
              <p className="text-xs text-muted-foreground">
                Successfully approved
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(approvalStats.average_approval_time || 0)}h</div>
              <p className="text-xs text-muted-foreground">
                Average approval time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({draftInvoices.length})</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Pending Approvals Tab */}
          <TabsContent value="pending" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Pending Approvals</h3>
              <Badge variant="secondary">{pendingApprovals.length} pending</Badge>
            </div>
            
            {pendingApprovals.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                  <p className="text-gray-600 dark:text-gray-400">No pending approvals at the moment.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((approval) => (
                  <Card key={approval.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            Invoice {approval.invoices?.custom_invoice_number || `INV-${approval.invoice_id?.slice(-8)}`}
                          </CardTitle>
                          <CardDescription>
                            Client: {approval.invoices?.customer_name || 'Unknown Client'} • 
                            Amount: {formatCurrency(approval.invoices?.total_amount || 0, approval.invoices?.currency)} • 
                            Submitted: {formatDate(approval.submitted_at)}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">
                          Step {(approval.current_step || 0) + 1}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Workflow</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {approval.invoice_approval_workflows?.name || 'Unknown Workflow'}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approve Invoice</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to approve this invoice?
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label htmlFor="approve-comments">Comments (Optional)</Label>
                                  <Textarea
                                    id="approve-comments"
                                    placeholder="Add any comments about this approval..."
                                    rows={3}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() => {
                                    const comments = document.getElementById('approve-comments').value;
                                    handleApprovalAction(approval.id, 'approve', comments);
                                  }}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Approve Invoice
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Invoice</DialogTitle>
                                <DialogDescription>
                                  Please provide a reason for rejecting this invoice.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label htmlFor="reject-comments">Rejection Reason *</Label>
                                  <Textarea
                                    id="reject-comments"
                                    placeholder="Please explain why this invoice is being rejected..."
                                    rows={3}
                                    required
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() => {
                                    const comments = document.getElementById('reject-comments').value;
                                    if (comments.trim()) {
                                      handleApprovalAction(approval.id, 'reject', comments);
                                    }
                                  }}
                                  variant="destructive"
                                >
                                  Reject Invoice
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Draft Invoices Tab */}
          <TabsContent value="drafts" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Draft Invoices</h3>
              <Badge variant="secondary">{draftInvoices.length} drafts</Badge>
            </div>
            
            {draftInvoices.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No draft invoices</h3>
                  <p className="text-gray-600 dark:text-gray-400">Create some invoices to submit for approval.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {draftInvoices.map((invoice) => (
                  <Card key={invoice.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            Invoice {invoice.custom_invoice_number || `INV-${invoice.id?.slice(-8)}`}
                          </CardTitle>
                          <CardDescription>
                            Client: {invoice.customer_name || 'Unknown Client'} • 
                            Amount: {formatCurrency(invoice.amount || 0, invoice.currency)} • 
                            Created: {formatDate(invoice.created_at)}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          Draft
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Due Date</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(invoice.due_date)}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleSubmitDraftForApproval(invoice)}
                            className="bg-purple-600 hover:bg-purple-700"
                            disabled={workflows.length === 0}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Submit for Approval
                          </Button>
                          
                          {workflows.length === 0 && (
                            <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center">
                              ⚠️ Create a workflow first
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Approval Workflows</h3>
              <Button onClick={() => {
                console.log('Create Workflow button clicked');
                resetWorkflowForm();
                setShowWorkflowDialog(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </div>

            {workflows.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No workflows configured</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Create your first approval workflow to start managing invoice approvals.
                  </p>
                  <Button onClick={() => {
                    resetWorkflowForm();
                    setShowWorkflowDialog(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Workflow
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {workflows.map((workflow) => (
                  <Card key={workflow.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{workflow.workflow_name || workflow.name}</CardTitle>
                          <CardDescription>
                            {workflow.approval_steps?.length || 0} steps • 
                            {workflow.auto_approve_threshold ? 
                              ` Auto-approve under ${formatCurrency(workflow.auto_approve_threshold)}` : 
                              ' Manual approval required'
                            }
                          </CardDescription>
                        </div>
                        <Badge variant={workflow.is_active ? "default" : "secondary"}>
                          {workflow.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Approval Steps</Label>
                          <div className="space-y-2 mt-1">
                            {workflow.approval_steps?.map((step, index) => (
                              <div key={index} className="flex items-center text-sm">
                                <Badge variant="outline" className="mr-2">{index + 1}</Badge>
                                <span className="flex-1">{step.name}</span>
                                <Users className="h-4 w-4 ml-2 text-gray-400" />
                                <span className="text-xs text-gray-500 ml-1">
                                  {step.approvers?.length || 0}
                                </span>
                              </div>
                            )) || (
                              <p className="text-sm text-gray-500">No steps configured</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 pt-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Approval History</h3>
              <Badge variant="secondary">Recent activity</Badge>
            </div>
            
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No approval history</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Approval history will appear here once you start processing approvals.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Workflow Creation Dialog - Moved outside tabs for better rendering */}
        <Dialog open={showWorkflowDialog} onOpenChange={(open) => {
          console.log('Dialog open state changed:', open);
          setShowWorkflowDialog(open);
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-gray-600 shadow-2xl">
            <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-300">
                Set up an approval workflow for your invoices
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4 bg-white dark:bg-slate-800">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workflow-name" className="text-gray-700 dark:text-gray-300 font-medium">Workflow Name *</Label>
                  <Input
                    id="workflow-name"
                    value={workflowForm.name}
                    onChange={(e) => setWorkflowForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Standard Approval"
                    className="mt-1 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="auto-approve-threshold" className="text-gray-700 dark:text-gray-300 font-medium">Auto-approve Threshold</Label>
                  <Input
                    id="auto-approve-threshold"
                    type="number"
                    step="0.01"
                    value={workflowForm.auto_approve_threshold}
                    onChange={(e) => setWorkflowForm(prev => ({ ...prev, auto_approve_threshold: e.target.value }))}
                    placeholder="e.g., 1000"
                    className="mt-1 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="workflow-description" className="text-gray-700 dark:text-gray-300 font-medium">Description</Label>
                <Textarea
                  id="workflow-description"
                  value={workflowForm.description}
                  onChange={(e) => setWorkflowForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe when this workflow should be used..."
                  rows={3}
                  className="mt-1 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-gray-700 dark:text-gray-300 font-medium">Approval Steps</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addApprovalStep} className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {workflowForm.approval_steps.map((step, index) => (
                    <Card key={index} className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-gray-600">
                      <CardHeader className="pb-3 bg-gray-100 dark:bg-slate-600 rounded-t-lg">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">Step {index + 1}</CardTitle>
                          {workflowForm.approval_steps.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeApprovalStep(index)}
                              className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-4">
                        <div>
                          <Label className="text-gray-700 dark:text-gray-300 font-medium">Step Name *</Label>
                          <Input
                            value={step.name}
                            onChange={(e) => updateApprovalStep(index, 'name', e.target.value)}
                            placeholder="e.g., Manager Approval"
                            className="mt-1 bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-700 dark:text-gray-300 font-medium">Description</Label>
                          <Input
                            value={step.description}
                            onChange={(e) => updateApprovalStep(index, 'description', e.target.value)}
                            placeholder="e.g., Department manager review"
                            className="mt-1 bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-700 dark:text-gray-300 font-medium">Approver Email *</Label>
                          <Input
                            value={step.approvers[0] || ''}
                            onChange={(e) => updateApprovalStep(index, 'approvers', [e.target.value])}
                            placeholder="approver@company.com"
                            type="email"
                            className="mt-1 bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="border-t border-gray-200 dark:border-gray-700 pt-4 bg-gray-50 dark:bg-slate-700">
              <Button variant="outline" onClick={() => setShowWorkflowDialog(false)} className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">
                Cancel
              </Button>
              <Button onClick={handleCreateWorkflow} className="bg-blue-600 hover:bg-blue-700 text-white">
                {editingWorkflow ? 'Update' : 'Create'} Workflow
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}