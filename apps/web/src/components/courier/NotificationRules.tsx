import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Power, Clock, Bell, AlertTriangle } from 'lucide-react';
import { notificationRulesService } from '../../services/notificationRulesService';

interface NotificationRule {
  rule_id: string;
  merchant_id: string;
  rule_name: string;
  rule_description?: string;
  rule_type: string;
  is_active: boolean;
  priority: number;
  conditions: any;
  actions: any[];
  else_actions?: any[];
  cooldown_hours: number;
  execution_count: number;
  success_count: number;
  failure_count: number;
  last_executed_at?: string;
  created_at: string;
}

export const NotificationRules: React.FC = () => {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    loadRules();
    loadTemplates();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const data = await notificationRulesService.listRules();
      setRules(data.rules);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await notificationRulesService.getTemplates();
      setTemplates(data.templates);
    } catch (err: any) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleToggleActive = async (ruleId: string, currentStatus: boolean) => {
    try {
      await notificationRulesService.toggleRule(ruleId, !currentStatus);
      await loadRules();
    } catch (err: any) {
      alert(`Failed to toggle rule: ${err.message}`);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) {
      return;
    }

    try {
      await notificationRulesService.deleteRule(ruleId);
      await loadRules();
    } catch (err: any) {
      alert(`Failed to delete rule: ${err.message}`);
    }
  };

  const handleCreateFromTemplate = async (template: any) => {
    try {
      await notificationRulesService.createRule({
        rule_name: template.name,
        rule_description: template.description,
        rule_type: 'template',
        priority: template.priority,
        conditions: template.conditions,
        actions: template.actions,
      });
      await loadRules();
      setShowTemplates(false);
      alert('Rule created successfully!');
    } catch (err: any) {
      alert(`Failed to create rule: ${err.message}`);
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600 bg-red-100';
    if (priority >= 5) return 'text-orange-600 bg-orange-100';
    return 'text-blue-600 bg-blue-100';
  };

  const getSuccessRate = (rule: NotificationRule) => {
    if (rule.execution_count === 0) return 0;
    return Math.round((rule.success_count / rule.execution_count) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Rules</h2>
          <p className="text-gray-600 mt-1">
            Automate notifications based on courier events and conditions
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Bell className="w-5 h-5" />
            Use Template
          </button>
          <button
            onClick={() => alert('Custom rule builder coming soon!')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Custom Rule
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notification rules yet</h3>
          <p className="text-gray-600 mb-4">
            Create automated notification rules to keep your customers informed
          </p>
          <button
            onClick={() => setShowTemplates(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Bell className="w-5 h-5" />
            Browse Templates
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <div
              key={rule.rule_id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                {/* Left: Rule Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{rule.rule_name}</h3>
                    
                    {rule.is_active ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                        Inactive
                      </span>
                    )}

                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(rule.priority)}`}>
                      Priority {rule.priority}
                    </span>

                    {rule.rule_type === 'template' && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                        Template
                      </span>
                    )}
                  </div>

                  {rule.rule_description && (
                    <p className="text-gray-600 text-sm mb-4">{rule.rule_description}</p>
                  )}

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 text-xs mb-1">Executions</div>
                      <div className="font-semibold text-gray-900">{rule.execution_count}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-xs mb-1">Success Rate</div>
                      <div className="font-semibold text-green-600">{getSuccessRate(rule)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-xs mb-1">Cooldown</div>
                      <div className="font-semibold text-gray-900">{rule.cooldown_hours}h</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-xs mb-1">Actions</div>
                      <div className="font-semibold text-gray-900">{rule.actions.length}</div>
                    </div>
                  </div>

                  {rule.last_executed_at && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="w-4 h-4" />
                      Last executed: {new Date(rule.last_executed_at).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(rule.rule_id, rule.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      rule.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={rule.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <Power className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => alert('Edit functionality coming soon!')}
                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => handleDelete(rule.rule_id)}
                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h3 className="text-xl font-bold">Notification Rule Templates</h3>
              <p className="text-gray-600 text-sm mt-1">
                Choose a pre-built template to get started quickly
              </p>
            </div>

            <div className="p-6 space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{template.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(template.priority)}`}>
                      Priority {template.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {template.actions.length} action(s) • {template.conditions.conditions.length} condition(s)
                    </div>
                    <button
                      onClick={() => handleCreateFromTemplate(template)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowTemplates(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
