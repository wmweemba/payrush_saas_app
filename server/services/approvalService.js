/**
 * Invoice Approval Service
 * Handles approval workflows, routing, and status management for invoices
 */

const { supabase } = require('../config/database');
const { logger } = require('../middleware/logger');
const EmailService = require('./emailService');

class ApprovalService {
  // Create approval workflow
  async createWorkflow(workflowData) {
    try {
      logger.info('Creating approval workflow:', workflowData);

      const workflow = {
        name: workflowData.name,
        description: workflowData.description,
        approval_steps: workflowData.approval_steps || [],
        require_all_approvers: workflowData.require_all_approvers || false,
        auto_approve_threshold: workflowData.auto_approve_threshold,
        is_active: workflowData.is_active !== false,
        user_id: workflowData.user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('invoice_approval_workflows')
        .insert(workflow)
        .select()
        .single();

      if (error) {
        logger.error('Error creating approval workflow:', error);
        throw new Error(`Failed to create workflow: ${error.message}`);
      }

      logger.info('Successfully created approval workflow:', data.id);
      return data;
    } catch (error) {
      logger.error('Error in createWorkflow:', error);
      throw error;
    }
  }

  // Get user's workflows
  async getUserWorkflows(userId) {
    try {
      const { data, error } = await supabase
        .from('invoice_approval_workflows')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching workflows:', error);
        throw new Error(`Failed to fetch workflows: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('Error in getUserWorkflows:', error);
      throw error;
    }
  }

  // Get workflow by ID
  async getWorkflowById(workflowId, userId) {
    try {
      const { data, error } = await supabase
        .from('invoice_approval_workflows')
        .select('*')
        .eq('id', workflowId)
        .eq('user_id', userId)
        .single();

      if (error) {
        logger.error('Error fetching workflow:', error);
        throw new Error(`Failed to fetch workflow: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('Error in getWorkflowById:', error);
      throw error;
    }
  }

  // Update workflow
  async updateWorkflow(workflowId, userId, updates) {
    try {
      logger.info('Updating workflow:', workflowId);

      const allowedUpdates = {
        name: updates.name,
        description: updates.description,
        approval_steps: updates.approval_steps,
        require_all_approvers: updates.require_all_approvers,
        auto_approve_threshold: updates.auto_approve_threshold,
        is_active: updates.is_active,
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(allowedUpdates).forEach(key => {
        if (allowedUpdates[key] === undefined) {
          delete allowedUpdates[key];
        }
      });

      const { data, error } = await supabase
        .from('invoice_approval_workflows')
        .update(allowedUpdates)
        .eq('id', workflowId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating workflow:', error);
        throw new Error(`Failed to update workflow: ${error.message}`);
      }

      logger.info('Successfully updated workflow:', workflowId);
      return data;
    } catch (error) {
      logger.error('Error in updateWorkflow:', error);
      throw error;
    }
  }

  // Delete workflow
  async deleteWorkflow(workflowId, userId) {
    try {
      logger.info('Deleting workflow:', workflowId);

      // Check if workflow is being used
      const { data: approvals } = await supabase
        .from('invoice_approvals')
        .select('id')
        .eq('workflow_id', workflowId)
        .eq('status', 'pending')
        .limit(1);

      if (approvals && approvals.length > 0) {
        throw new Error('Cannot delete workflow with pending approvals');
      }

      const { error } = await supabase
        .from('invoice_approval_workflows')
        .delete()
        .eq('id', workflowId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error deleting workflow:', error);
        throw new Error(`Failed to delete workflow: ${error.message}`);
      }

      logger.info('Successfully deleted workflow:', workflowId);
      return { success: true };
    } catch (error) {
      logger.error('Error in deleteWorkflow:', error);
      throw error;
    }
  }

  // Submit invoice for approval
  async submitForApproval(invoiceId, userId, workflowId, notes = '') {
    try {
      logger.info('Submitting invoice for approval:', { invoiceId, workflowId });

      // Get workflow details
      const workflow = await this.getWorkflowById(workflowId, userId);
      if (!workflow || !workflow.is_active) {
        throw new Error('Invalid or inactive workflow');
      }

      // Check if invoice exists and belongs to user
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('id, status, total_amount')
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .single();

      if (invoiceError || !invoice) {
        throw new Error('Invoice not found or access denied');
      }

      // Check auto-approval threshold
      if (workflow.auto_approve_threshold && invoice.total_amount <= workflow.auto_approve_threshold) {
        return await this.autoApproveInvoice(invoiceId, userId, workflowId, 'Auto-approved based on amount threshold');
      }

      // Create approval request
      const approval = {
        invoice_id: invoiceId,
        workflow_id: workflowId,
        status: 'pending',
        current_step: 0,
        submitted_by: userId,
        submitted_at: new Date().toISOString(),
        notes: notes,
        approval_data: {
          steps_completed: [],
          approvers_contacted: [],
          approval_history: []
        }
      };

      const { data: approvalData, error } = await supabase
        .from('invoice_approvals')
        .insert(approval)
        .select()
        .single();

      if (error) {
        logger.error('Error creating approval:', error);
        throw new Error(`Failed to submit for approval: ${error.message}`);
      }

      // Update invoice status to pending approval
      await supabase
        .from('invoices')
        .update({ 
          status: 'pending_approval',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      // Send notifications to first approver(s)
      await this.notifyNextApprovers(approvalData.id, workflow, 0);

      logger.info('Successfully submitted invoice for approval:', approvalData.id);
      return approvalData;
    } catch (error) {
      logger.error('Error in submitForApproval:', error);
      throw error;
    }
  }

  // Auto-approve invoice
  async autoApproveInvoice(invoiceId, userId, workflowId, reason) {
    try {
      const approval = {
        invoice_id: invoiceId,
        workflow_id: workflowId,
        status: 'approved',
        current_step: -1, // Indicates auto-approval
        submitted_by: userId,
        submitted_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        approved_by: 'system',
        notes: reason,
        approval_data: {
          auto_approved: true,
          approval_reason: reason,
          approval_history: [{
            step: 0,
            action: 'auto_approved',
            by: 'system',
            at: new Date().toISOString(),
            reason: reason
          }]
        }
      };

      const { data, error } = await supabase
        .from('invoice_approvals')
        .insert(approval)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to auto-approve: ${error.message}`);
      }

      // Update invoice status to approved
      await supabase
        .from('invoices')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      return data;
    } catch (error) {
      logger.error('Error in autoApproveInvoice:', error);
      throw error;
    }
  }

  // Process approval action
  async processApproval(approvalId, userId, action, comments = '') {
    try {
      logger.info('Processing approval action:', { approvalId, action, userId });

      // Get approval details
      const { data: approval, error: approvalError } = await supabase
        .from('invoice_approvals')
        .select(`
          *,
          invoice_approval_workflows (*)
        `)
        .eq('id', approvalId)
        .single();

      if (approvalError || !approval) {
        throw new Error('Approval not found');
      }

      if (approval.status !== 'pending') {
        throw new Error('Approval is not in pending status');
      }

      const workflow = approval.invoice_approval_workflows;
      const currentStep = approval.current_step;
      const approvalSteps = workflow.approval_steps || [];

      // Validate that user is authorized to approve at current step
      if (!this.isUserAuthorizedForStep(userId, approvalSteps[currentStep])) {
        throw new Error('User not authorized to approve at this step');
      }

      // Update approval data
      const approvalData = approval.approval_data || { steps_completed: [], approval_history: [] };
      const historyEntry = {
        step: currentStep,
        action: action,
        by: userId,
        at: new Date().toISOString(),
        comments: comments
      };

      approvalData.approval_history.push(historyEntry);

      let newStatus = approval.status;
      let newStep = currentStep;
      let approvedAt = null;
      let approvedBy = null;

      if (action === 'approve') {
        approvalData.steps_completed.push(currentStep);
        
        // Check if this is the final step or if all required approvals are complete
        if (this.isApprovalComplete(approvalData.steps_completed, approvalSteps, workflow.require_all_approvers)) {
          newStatus = 'approved';
          approvedAt = new Date().toISOString();
          approvedBy = userId;
          
          // Update invoice status
          await supabase
            .from('invoices')
            .update({ 
              status: 'approved',
              updated_at: new Date().toISOString()
            })
            .eq('id', approval.invoice_id);
        } else {
          // Move to next step
          newStep = currentStep + 1;
          
          // Notify next approvers
          await this.notifyNextApprovers(approvalId, workflow, newStep);
        }
      } else if (action === 'reject') {
        newStatus = 'rejected';
        
        // Update invoice status
        await supabase
          .from('invoices')
          .update({ 
            status: 'draft',
            updated_at: new Date().toISOString()
          })
          .eq('id', approval.invoice_id);
      } else {
        throw new Error('Invalid action. Must be "approve" or "reject"');
      }

      // Update approval record
      const updates = {
        status: newStatus,
        current_step: newStep,
        approval_data: approvalData,
        updated_at: new Date().toISOString()
      };

      if (approvedAt) {
        updates.approved_at = approvedAt;
        updates.approved_by = approvedBy;
      }

      const { data: updatedApproval, error: updateError } = await supabase
        .from('invoice_approvals')
        .update(updates)
        .eq('id', approvalId)
        .select()
        .single();

      if (updateError) {
        logger.error('Error updating approval:', updateError);
        throw new Error(`Failed to update approval: ${updateError.message}`);
      }

      // Send notification about approval result
      try {
        // Get approver details
        const { data: approverProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', userId)
          .single();

        const approverName = approverProfile?.full_name || approverProfile?.email || 'Approver';

        // Get invoice and workflow details for notification
        const { data: fullApprovalData, error: fetchError } = await supabase
          .from('invoice_approvals')
          .select(`
            *,
            invoices (
              id,
              custom_invoice_number,
              customer_name,
              total_amount,
              currency
            ),
            invoice_approval_workflows (
              name
            )
          `)
          .eq('id', approvalId)
          .single();

        if (!fetchError && fullApprovalData) {
          await EmailService.sendApprovalResultNotification(
            fullApprovalData,
            action,
            approverName,
            comments
          );
        }
      } catch (emailError) {
        logger.error('Error sending approval result notification:', emailError);
        // Don't fail the approval process if email fails
      }

      logger.info('Successfully processed approval action:', { approvalId, action, newStatus });
      return updatedApproval;
    } catch (error) {
      logger.error('Error in processApproval:', error);
      throw error;
    }
  }

  // Get pending approvals for user
  async getPendingApprovals(userId) {
    try {
      // Get workflows where user is an approver
      const { data: workflows } = await supabase
        .from('invoice_approval_workflows')
        .select('*')
        .eq('is_active', true);

      const userWorkflows = workflows?.filter(workflow => 
        this.isUserInWorkflow(userId, workflow.approval_steps)
      ) || [];

      const workflowIds = userWorkflows.map(w => w.id);

      if (workflowIds.length === 0) {
        return [];
      }

      // Get pending approvals for these workflows
      const { data: approvals, error } = await supabase
        .from('invoice_approvals')
        .select(`
          *,
          invoices (
            custom_invoice_number,
            customer_name,
            total_amount,
            currency
          ),
          invoice_approval_workflows (
            name,
            approval_steps
          )
        `)
        .in('workflow_id', workflowIds)
        .eq('status', 'pending');

      if (error) {
        throw new Error(`Failed to fetch pending approvals: ${error.message}`);
      }

      // Filter approvals where user can approve at current step
      const userApprovals = approvals?.filter(approval => {
        const workflow = approval.invoice_approval_workflows;
        const currentStep = approval.current_step;
        const approvalSteps = workflow.approval_steps || [];
        
        return this.isUserAuthorizedForStep(userId, approvalSteps[currentStep]);
      }) || [];

      return userApprovals;
    } catch (error) {
      logger.error('Error in getPendingApprovals:', error);
      throw error;
    }
  }

  // Get approval history for invoice
  async getApprovalHistory(invoiceId, userId) {
    try {
      const { data, error } = await supabase
        .from('invoice_approvals')
        .select(`
          *,
          invoice_approval_workflows (
            name,
            approval_steps
          )
        `)
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch approval history: ${error.message}`);
      }

      // Verify user has access to this invoice
      const { data: invoice } = await supabase
        .from('invoices')
        .select('user_id')
        .eq('id', invoiceId)
        .single();

      if (!invoice || invoice.user_id !== userId) {
        throw new Error('Access denied');
      }

      return data;
    } catch (error) {
      logger.error('Error in getApprovalHistory:', error);
      throw error;
    }
  }

  // Helper methods
  isUserAuthorizedForStep(userId, stepConfig) {
    if (!stepConfig || !stepConfig.approvers) return false;
    return stepConfig.approvers.includes(userId);
  }

  isUserInWorkflow(userId, approvalSteps) {
    if (!approvalSteps || !Array.isArray(approvalSteps)) return false;
    return approvalSteps.some(step => 
      step.approvers && step.approvers.includes(userId)
    );
  }

  isApprovalComplete(completedSteps, approvalSteps, requireAll) {
    if (!approvalSteps || approvalSteps.length === 0) return true;
    
    if (requireAll) {
      return completedSteps.length === approvalSteps.length;
    } else {
      return completedSteps.length > 0;
    }
  }

  async notifyNextApprovers(approvalId, workflow, stepIndex) {
    try {
      const approvalSteps = workflow.approval_steps || [];
      const step = approvalSteps[stepIndex];
      
      if (!step || !step.approvers) return;

      // Get approval details with invoice information
      const { data: approval, error } = await supabase
        .from('invoice_approvals')
        .select(`
          *,
          invoices (
            id,
            custom_invoice_number,
            customer_name,
            total_amount,
            currency
          )
        `)
        .eq('id', approvalId)
        .single();

      if (error || !approval) {
        logger.error('Error fetching approval for notification:', error);
        return;
      }

      // Get company name for the user who submitted the approval
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('company_name, full_name')
        .eq('id', approval.submitted_by)
        .single();

      // Prepare approval data for email
      const approvalData = {
        ...approval,
        workflow: workflow,
        company_name: userProfile?.company_name || 'Your Company',
        submitted_by_name: userProfile?.full_name || 'User'
      };

      // Send email notifications to all approvers in this step
      for (const approverEmail of step.approvers) {
        try {
          await EmailService.sendApprovalNotification(
            approvalData,
            approverEmail,
            approverEmail.split('@')[0] // Use email prefix as name fallback
          );
          
          logger.info('Approval notification sent:', {
            approvalId,
            step: stepIndex,
            approver: approverEmail
          });
        } catch (emailError) {
          logger.error('Error sending approval notification email:', {
            approvalId,
            approver: approverEmail,
            error: emailError.message
          });
        }
      }
    } catch (error) {
      logger.error('Error in notifyNextApprovers:', error);
    }
  }

  // Send approval reminders
  async sendApprovalReminders(userId) {
    try {
      logger.info('Sending approval reminders for user:', userId);
      
      const result = await EmailService.sendApprovalReminders(userId);
      
      logger.info('Approval reminders sent:', result.data);
      return result;
    } catch (error) {
      logger.error('Error in sendApprovalReminders:', error);
      throw error;
    }
  }

  // Get approval statistics
  async getApprovalStats(userId, startDate, endDate) {
    try {
      const { data: stats, error } = await supabase
        .rpc('get_approval_statistics', {
          user_id: userId,
          start_date: startDate,
          end_date: endDate
        });

      if (error) {
        logger.error('Error fetching approval stats:', error);
        // Return default stats if RPC function doesn't exist
        return {
          total_approvals: 0,
          pending_approvals: 0,
          approved_count: 0,
          rejected_count: 0,
          average_approval_time: 0
        };
      }

      return stats[0] || {
        total_approvals: 0,
        pending_approvals: 0,
        approved_count: 0,
        rejected_count: 0,
        average_approval_time: 0
      };
    } catch (error) {
      logger.error('Error in getApprovalStats:', error);
      throw error;
    }
  }
}

module.exports = new ApprovalService();