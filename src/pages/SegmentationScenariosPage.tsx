import { useState, useEffect } from 'react';
import { Search, Trash2, ChevronRight, X, ChevronLeft } from 'lucide-react';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { TableBadge } from '../components/ui/Table';
import { PrimaryNavigation } from '../components/ui/PrimaryNavigation';
import { AIAgentPanel } from '../components/AIAgentPanel';
import { Toast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';

interface SegmentationScenariosPageProps {
  segmentationName: string;
  businessUnit: string;
  onBack: () => void;
  onBackToProjects: () => void;
  projectName: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onCreateScenario: (timePeriod: string) => void;
  onOpenScenario?: (scenarioId: string, currentStep: number) => void;
  projectId?: string;
  showSavedToast?: boolean;
  onToastClose?: () => void;
}

interface Scenario {
  id: string;
  name: string;
  type: string;
  customerType: string;
  level: string;
  levelName: string;
  modifiedBy: string;
  lastModified: string;
  currentStep: number;
  status: string;
}

export function SegmentationScenariosPage({
  segmentationName,
  businessUnit,
  onBack,
  onBackToProjects,
  projectName,
  sidebarCollapsed,
  onToggleSidebar,
  onCreateScenario,
  onOpenScenario,
  projectId,
  showSavedToast = false,
  onToastClose
}: SegmentationScenariosPageProps) {
  const [activeTab, setActiveTab] = useState<'draft' | 'published'>('draft');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [draftScenarios, setDraftScenarios] = useState<Scenario[]>([]);
  const [publishedScenarios, setPublishedScenarios] = useState<Scenario[]>([]);

  const timePeriods = [
    'Q4 2025  Oct 01 - Dec 31',
    'Q1 2026  Jan 01 - Mar 31',
    'Q2 2026  Apr 01 - May 30',
    'Q3 2026  Jun 01 - Sep 30',
    'Q4 2026  Oct 01 - Dec 31',
    'H1 2025'
  ];

  useEffect(() => {
    loadScenarios();
  }, [projectId, segmentationName, businessUnit]);

  const loadScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('project_id', projectId)
        .eq('segmentation_name', segmentationName)
        .eq('business_unit', businessUnit)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map(scenario => ({
        id: scenario.id,
        name: scenario.name,
        type: scenario.type,
        customerType: scenario.customer_type,
        level: scenario.level,
        levelName: scenario.level_name,
        modifiedBy: scenario.modified_by,
        lastModified: new Date(scenario.updated_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        currentStep: scenario.current_step,
        status: scenario.status
      }));

      setDraftScenarios(formatted.filter(s => s.status === 'draft'));
      setPublishedScenarios(formatted.filter(s => s.status === 'published'));
    } catch (error) {
      console.error('Error loading scenarios:', error);
    }
  };

  const handleScenarioClick = (scenario: Scenario) => {
    if (onOpenScenario) {
      onOpenScenario(scenario.id, scenario.currentStep);
    }
  };

  const scenarios = activeTab === 'draft' ? draftScenarios : publishedScenarios;


  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Toast Notification */}
      {showSavedToast && (
        <div
          className="fixed bottom-8 left-8 z-50 animate-slide-up"
          style={{
            animation: 'slideUp 0.3s ease-out'
          }}
        >
          <style>
            {`
              @keyframes slideUp {
                from {
                  transform: translateY(100px);
                  opacity: 0;
                }
                to {
                  transform: translateY(0);
                  opacity: 1;
                }
              }
            `}
          </style>
          <Toast
            message="Scenario saved successfully"
            variant="success"
            style="solid"
            onClose={onToastClose}
          />
        </div>
      )}

      {/* Project Breadcrumb Bar - Full Width */}
      <div className="border-b border-gray-200 bg-white px-6 py-3 relative z-40">
        <Breadcrumb
          items={[
            { label: 'Projects', onClick: onBackToProjects },
            { label: projectName, isActive: true }
          ]}
          size="normal"
          theme="light"
        />
      </div>

      {/* Main Layout with Sidebar */}
      <div className="flex-1 flex bg-white">
        {/* Primary Navigation */}
        <PrimaryNavigation variant="collapsed" />

        {/* AI Agent Panel - Left Side - Only for 3.0 projects */}
        {projectName.includes('3.0') && (
          <AIAgentPanel
            onNavigateToSegment={(segmentName) => {
              console.log('Navigate to segment:', segmentName);
            }}
            onCreateSegment={() => {
              setIsDrawerOpen(true);
            }}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
        {/* Top Header Bar */}
        <div className="bg-white border-b border-gray-200 pr-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="bg-[#EC7200] text-white px-4 py-1.5 font-semibold text-sm uppercase tracking-wide">
                SEGMENTATION
              </span>
              <span className="text-gray-900 font-medium">
                {segmentationName} - {businessUnit}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 transition-colors">
                <Search className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Breadcrumb and Actions */}
        <div className="border-b border-gray-200 bg-white px-8 py-4">
          <div className="flex items-center justify-between">
            <Breadcrumb
              items={[
                { label: 'Segmentation', onClick: onBack },
                { label: 'Scenarios', isActive: true }
              ]}
              size="normal"
              theme="light"
            />

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="px-4 py-2 bg-[indigo-600] text-white hover:bg-[indigo-700] transition-colors font-medium flex items-center gap-2"
            >
              + Create Scenario
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('draft')}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'draft'
                  ? 'border-[indigo-600] text-[indigo-600]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Draft ({draftScenarios.length})
            </button>
            <button
              onClick={() => setActiveTab('published')}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'published'
                  ? 'border-[indigo-600] text-[indigo-600]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Published ({publishedScenarios.length})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-8 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Scenario Name
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Customer Type
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Level
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Level Name
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Modified By
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Last Modified
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {scenarios.map((scenario, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-8 py-4">
                    <button
                      className="text-[indigo-600] hover:text-[indigo-700] font-medium transition-colors"
                      onClick={() => handleScenarioClick(scenario)}
                    >
                      {scenario.name}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <TableBadge variant="info">{scenario.type}</TableBadge>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{scenario.customerType}</td>
                  <td className="px-6 py-4">
                    <TableBadge variant="info">{scenario.level}</TableBadge>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{scenario.levelName}</td>
                  <td className="px-6 py-4 text-gray-900">{scenario.modifiedBy}</td>
                  <td className="px-6 py-4 text-gray-900">{scenario.lastModified}</td>
                  <td className="px-6 py-4">
                    <button className="text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      {/* Drawer Overlay - Only covers main content area */}
      {isDrawerOpen && (
        <div
          className="fixed top-0 bottom-0 bg-black bg-opacity-50"
          style={{
            left: '80px',
            right: 0,
            zIndex: 35
          }}
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 bg-white shadow-2xl transition-all duration-300 ease-in-out w-[400px]`}
        style={{
          top: '49px',
          left: isDrawerOpen ? '80px' : '-400px',
          zIndex: 35
        }}
      >
        {/* Drawer Header */}
        <div className="bg-[#2B2D3E] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChevronLeft className="w-5 h-5" />
            <div>
              <div className="text-sm font-normal">Segmentation Scenario</div>
              <div className="text-lg font-semibold">Draft</div>
            </div>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="hover:bg-gray-700 p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-900 font-medium">Choose a time period</h3>
            <button
              onClick={() => {
                if (selectedPeriod) {
                  onCreateScenario(selectedPeriod);
                }
              }}
              disabled={!selectedPeriod}
              className="px-4 py-2 bg-[indigo-600] text-white hover:bg-[indigo-700] transition-colors font-medium text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>

          {/* Time Period List */}
          <div className="space-y-3">
            {timePeriods.map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`w-full flex items-center gap-3 px-4 py-3 border rounded transition-all ${
                  selectedPeriod === period
                    ? 'border-[indigo-600] bg-[#E8F4F6]'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPeriod === period
                    ? 'border-[indigo-600]'
                    : 'border-gray-300'
                }`}>
                  {selectedPeriod === period && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[indigo-600]" />
                  )}
                </div>
                <span className="text-gray-900 text-sm">{period}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
