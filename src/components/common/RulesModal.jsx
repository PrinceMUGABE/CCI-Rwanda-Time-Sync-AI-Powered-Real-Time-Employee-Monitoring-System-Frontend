// components/common/RulesModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Search, X, Download, Eye, Calendar, User, Users,
  ChevronDown, ChevronUp, FileText, Shield, BookOpen,
  AlertCircle, Filter, Globe, CheckCircle, RefreshCw
} from 'lucide-react';

const BASE_URL = 'http://127.0.0.1:8000/rules';

const RulesModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rules, setRules] = useState([]);
  const [authToken] = useState(localStorage.getItem('access_token') || '');
  
  const [expandedRuleId, setExpandedRuleId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const messagesEndRef = useRef(null);
  
  // Colors and icons
  const RULE_TYPE_COLORS = {
    rule: 'bg-blue-100 text-blue-800',
    regulation: 'bg-purple-100 text-purple-800',
    policy: 'bg-green-100 text-green-800',
    procedure: 'bg-orange-100 text-orange-800',
    guideline: 'bg-teal-100 text-teal-800'
  };

  const RULE_TYPE_ICONS = {
    rule: BookOpen,
    regulation: Shield,
    policy: FileText,
    procedure: AlertCircle,
    guideline: AlertCircle
  };

  // Load rules for user
  const loadRules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${BASE_URL}/user/`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.data.success && response.data.data) {
        // Filter only active rules
        const activeRules = response.data.data.filter(rule => 
          rule.status === 'active'
        );
        setRules(activeRules);
      }
      
    } catch (error) {
      console.error('Error loading rules:', error);
      setError('Failed to load rules.');
    } finally {
      setLoading(false);
    }
  };

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && authToken) {
      loadRules();
    }
  }, [isOpen, authToken]);

  // Filter rules
  const filteredRules = rules.filter(rule => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!rule.title?.toLowerCase().includes(term) && 
          !rule.description?.toLowerCase().includes(term)) {
        return false;
      }
    }
    
    // Type filter
    if (typeFilter !== 'all' && rule.rule_type !== typeFilter) {
      return false;
    }
    
    return true;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Toggle rule expansion
  const toggleRule = (ruleId) => {
    setExpandedRuleId(expandedRuleId === ruleId ? null : ruleId);
    // Auto-scroll to the expanded rule
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Download rule
  const downloadRule = (rule) => {
    const content = `${rule.title}\n\n${rule.description}\n\nType: ${rule.rule_type}\nCreated: ${new Date(rule.created_at).toLocaleDateString()}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rule.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Render rule content
  const renderRuleContent = (rule) => {
    const TypeIcon = RULE_TYPE_ICONS[rule.rule_type] || FileText;
    
    return (
      <div className="space-y-3">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-700 whitespace-pre-wrap text-sm">{rule.description}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-50 p-2 rounded-lg">
            <div className="flex items-center gap-1">
              <TypeIcon className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Type</span>
            </div>
            <p className="text-xs font-semibold text-blue-900 mt-1 capitalize">{rule.rule_type}</p>
          </div>
          
          <div className="bg-green-50 p-2 rounded-lg">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-green-600" />
              <span className="text-xs font-medium text-green-700">Created</span>
            </div>
            <p className="text-xs font-semibold text-green-900 mt-1">
              {new Date(rule.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end">
        {/* Rules Modal Window */}
        <div className="bg-white rounded-2xl shadow-2xl h-[600px] w-[400px] flex flex-col overflow-hidden border border-gray-200 transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="text-lg">📜</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm">Rules & Regulations</h3>
                  <p className="text-xs opacity-90">Active rules applicable to you</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadRules}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors backdrop-blur-sm"
                  title="Refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors backdrop-blur-sm"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {/* Filters */}
            <div className="mb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search rules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="rule">Rules</option>
                <option value="regulation">Regulations</option>
                <option value="policy">Policies</option>
                <option value="procedure">Procedures</option>
                <option value="guideline">Guidelines</option>
              </select>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-red-800">{error}</p>
                    <button
                      onClick={loadRules}
                      className="text-xs text-red-600 hover:text-red-800 mt-1"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredRules.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {searchTerm || typeFilter !== 'all' 
                    ? "No rules match your search." 
                    : "No active rules available."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Rules Count */}
                <div className="text-xs text-gray-500 flex items-center justify-between">
                  <span>{filteredRules.length} active rules</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    All active
                  </span>
                </div>
                
                {/* Rules List */}
                {filteredRules.map((rule) => {
                  const isExpanded = expandedRuleId === rule.id;
                  const TypeIcon = RULE_TYPE_ICONS[rule.rule_type] || FileText;
                  
                  return (
                    <div key={rule.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      {/* Rule Header */}
                      <div 
                        className="p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleRule(rule.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${RULE_TYPE_COLORS[rule.rule_type] || 'bg-gray-100 text-gray-800'}`}>
                                <TypeIcon className="w-2 h-2 mr-1" />
                                {rule.rule_type.charAt(0).toUpperCase() + rule.rule_type.slice(1)}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-gray-900">{rule.title}</h4>
                          </div>
                          <div className="ml-2">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Rule Content */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 p-3 bg-gray-50">
                          {renderRuleContent(rule)}
                          <div className="flex justify-end mt-3 pt-3 border-t border-gray-200">
                            <button
                              onClick={() => downloadRule(rule)}
                              className="inline-flex items-center px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </>
  );
};

export default RulesModal;