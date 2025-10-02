/**
 * Invoice Approval Workflow Routes
 * API endpoints for managing approval workflows and processing approvals
 */

const express = require('express');
const authMiddleware = require('../middleware/auth');
const { logger } = require('../middleware/logger');
const approvalService = require('../services/approvalService');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Workflow Management Routes

// Create approval workflow
router.post('/workflows', async (req, res) => {
  try {
    const userId = req.user.id;
    const workflowData = { ...req.body, user_id: userId };

    // Validate required fields
    if (!workflowData.name) {
      return res.status(400).json({
        success: false,
        error: 'Workflow name is required'
      });
    }

    if (!workflowData.approval_steps || !Array.isArray(workflowData.approval_steps) || workflowData.approval_steps.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one approval step is required'
      });
    }

    // Validate approval steps structure
    for (const step of workflowData.approval_steps) {
      if (!step.name || !step.approvers || !Array.isArray(step.approvers) || step.approvers.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Each approval step must have a name and at least one approver'
        });
      }
    }

    const workflow = await approvalService.createWorkflow(workflowData);

    res.status(201).json({
      success: true,
      data: workflow,
      message: 'Workflow created successfully'
    });
  } catch (error) {
    logger.error('Error creating workflow:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create workflow'
    });
  }
});

// Get user's workflows
router.get('/workflows', async (req, res) => {
  try {
    const userId = req.user.id;
    const workflows = await approvalService.getUserWorkflows(userId);

    res.json({
      success: true,
      data: workflows,
      count: workflows.length
    });
  } catch (error) {
    logger.error('Error fetching workflows:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch workflows'
    });
  }
});

// Get workflow by ID
router.get('/workflows/:workflowId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { workflowId } = req.params;

    const workflow = await approvalService.getWorkflowById(workflowId, userId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    logger.error('Error fetching workflow:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch workflow'
    });
  }
});

// Update workflow
router.put('/workflows/:workflowId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { workflowId } = req.params;

    // Validate approval steps if provided
    if (req.body.approval_steps) {
      if (!Array.isArray(req.body.approval_steps) || req.body.approval_steps.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one approval step is required'
        });
      }

      for (const step of req.body.approval_steps) {
        if (!step.name || !step.approvers || !Array.isArray(step.approvers) || step.approvers.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Each approval step must have a name and at least one approver'
          });
        }
      }
    }

    const workflow = await approvalService.updateWorkflow(workflowId, userId, req.body);

    res.json({
      success: true,
      data: workflow,
      message: 'Workflow updated successfully'
    });
  } catch (error) {
    logger.error('Error updating workflow:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update workflow'
    });
  }
});

// Delete workflow
router.delete('/workflows/:workflowId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { workflowId } = req.params;

    await approvalService.deleteWorkflow(workflowId, userId);

    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting workflow:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete workflow'
    });
  }
});

// Approval Process Routes

// Submit invoice for approval
router.post('/invoices/:invoiceId/submit', async (req, res) => {
  try {
    const userId = req.user.id;
    const { invoiceId } = req.params;
    const { workflow_id, notes } = req.body;

    if (!workflow_id) {
      return res.status(400).json({
        success: false,
        error: 'Workflow ID is required'
      });
    }

    const approval = await approvalService.submitForApproval(
      invoiceId,
      userId,
      workflow_id,
      notes
    );

    res.status(201).json({
      success: true,
      data: approval,
      message: 'Invoice submitted for approval successfully'
    });
  } catch (error) {
    logger.error('Error submitting for approval:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit for approval'
    });
  }
});

// Process approval action (approve/reject)
router.post('/approvals/:approvalId/action', async (req, res) => {
  try {
    const userId = req.user.id;
    const { approvalId } = req.params;
    const { action, comments } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Valid action (approve/reject) is required'
      });
    }

    const approval = await approvalService.processApproval(
      approvalId,
      userId,
      action,
      comments
    );

    res.json({
      success: true,
      data: approval,
      message: `Invoice ${action}d successfully`
    });
  } catch (error) {
    logger.error('Error processing approval:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process approval'
    });
  }
});

// Get pending approvals for user
router.get('/pending', async (req, res) => {
  try {
    const userId = req.user.id;
    const approvals = await approvalService.getPendingApprovals(userId);

    res.json({
      success: true,
      data: approvals,
      count: approvals.length
    });
  } catch (error) {
    logger.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch pending approvals'
    });
  }
});

// Get approval history for invoice
router.get('/invoices/:invoiceId/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const { invoiceId } = req.params;

    const history = await approvalService.getApprovalHistory(invoiceId, userId);

    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    logger.error('Error fetching approval history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch approval history'
    });
  }
});

// Get approval statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    // Default to last 30 days if no date range provided
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = end_date || new Date().toISOString();

    const stats = await approvalService.getApprovalStats(userId, startDate, endDate);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching approval stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch approval statistics'
    });
  }
});

// Workflow Templates (Predefined common workflows)

// Get workflow templates
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'single_approver',
        name: 'Single Approver',
        description: 'Simple workflow with one approval step',
        approval_steps: [
          {
            name: 'Manager Approval',
            description: 'Requires approval from designated manager',
            approvers: [], // Users would fill this in
            required: true
          }
        ],
        require_all_approvers: false,
        auto_approve_threshold: null
      },
      {
        id: 'dual_approval',
        name: 'Dual Approval',
        description: 'Requires approval from two different people',
        approval_steps: [
          {
            name: 'First Approver',
            description: 'Initial approval step',
            approvers: [],
            required: true
          },
          {
            name: 'Final Approver',
            description: 'Final approval step',
            approvers: [],
            required: true
          }
        ],
        require_all_approvers: true,
        auto_approve_threshold: null
      },
      {
        id: 'amount_based',
        name: 'Amount-Based Approval',
        description: 'Different approval levels based on invoice amount',
        approval_steps: [
          {
            name: 'Department Manager',
            description: 'Department manager approval for all amounts',
            approvers: [],
            required: true
          },
          {
            name: 'Senior Manager',
            description: 'Senior manager approval for high amounts',
            approvers: [],
            required: true,
            conditions: {
              min_amount: 10000
            }
          }
        ],
        require_all_approvers: false,
        auto_approve_threshold: 1000
      }
    ];

    res.json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    logger.error('Error fetching workflow templates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch workflow templates'
    });
  }
});

// Bulk Operations

// Bulk approve invoices
router.post('/bulk/approve', async (req, res) => {
  try {
    const userId = req.user.id;
    const { approval_ids, comments } = req.body;

    if (!approval_ids || !Array.isArray(approval_ids) || approval_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Approval IDs array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const approvalId of approval_ids) {
      try {
        const approval = await approvalService.processApproval(
          approvalId,
          userId,
          'approve',
          comments
        );
        results.push({ approval_id: approvalId, success: true, data: approval });
      } catch (error) {
        errors.push({ approval_id: approvalId, error: error.message });
      }
    }

    res.json({
      success: errors.length === 0,
      data: {
        successful: results,
        failed: errors,
        total_processed: approval_ids.length,
        success_count: results.length,
        error_count: errors.length
      },
      message: `Processed ${results.length} of ${approval_ids.length} approvals`
    });
  } catch (error) {
    logger.error('Error in bulk approve:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process bulk approval'
    });
  }
});

module.exports = router;