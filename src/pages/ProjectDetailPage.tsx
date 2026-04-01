import { ChevronRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { SegmentationScenariosPage } from './SegmentationScenariosPage';
import { SegmentationScenarioDetailPage } from './SegmentationScenarioDetailPage';
import { PrimaryNavigation } from '../components/ui/PrimaryNavigation';
import { AIAgentPanel } from '../components/AIAgentPanel';
import { ScenarioCreationForm } from '../components/ScenarioCreationForm';

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface ProjectDetailPageProps {
  projectId: string;
  onBack: () => void;
}

export function ProjectDetailPage({ projectId, onBack }: ProjectDetailPageProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedSegmentation, setSelectedSegmentation] = useState<{ name: string; businessUnit: string } | null>(null);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [selectedScenarioStep, setSelectedScenarioStep] = useState<number>(1);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [segmentations, setSegmentations] = useState<Array<{ name: string; businessUnit: string; docs: number; users: number; hasScenario?: boolean }>>([]);
  const [showScenarioCreation, setShowScenarioCreation] = useState(false);
  const [scenarioDefinition, setScenarioDefinition] = useState<any>(null);

  useEffect(() => {
    if (project) {
      loadSegmentations();
    }
  }, [project]);

  const loadSegmentations = async () => {
    try {
      const { data, error } = await supabase
        .from('segmentations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map(seg => ({
        name: seg.name,
        businessUnit: seg.business_unit,
        docs: seg.docs,
        users: seg.users,
        hasScenario: seg.has_scenario
      }));

      setSegmentations(formatted);
    } catch (error) {
      console.error('Error loading segmentations:', error);
    }
  };

  const generateSegmentationUI = () => {
    const showAIAgent = project?.name.includes('3.0');

    return (
      <div className="h-full flex bg-white">
        {/* Primary Navigation */}
        <PrimaryNavigation variant="collapsed" />

        {/* AI Agent Panel - Left Side - Only for 3.0 projects */}
        {showAIAgent && (
          <AIAgentPanel
            onNavigateToSegment={(segmentName) => {
              const seg = segmentations.find(s => s.name.toLowerCase() === segmentName.toLowerCase());
              if (seg) {
                setSelectedSegmentation({ name: seg.name, businessUnit: seg.businessUnit });
              }
            }}
            onCreateSegment={(segmentationName, businessUnit, timePeriod) => {
              setSelectedSegmentation({ name: segmentationName, businessUnit });
              setSelectedTimePeriod(timePeriod);
              setShowScenarioCreation(true);
            }}
            onScenarioDefinitionComplete={(definition) => {
              setScenarioDefinition(definition);
            }}
            segmentations={segmentations}
            isInScenarioCreation={showScenarioCreation}
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
              </div>

              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 transition-colors">
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {!showScenarioCreation ? (
            <>
              {/* Page Header */}
              <div className="bg-gray-50 px-6 py-3">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-semibold text-gray-900">Segmentations</h1>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="flex-1 overflow-auto bg-gray-50 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {segmentations.map((seg, idx) => (
                <Card
                  key={idx}
                  shadow="flat-right"
                  state="default"
                  className="p-6 group cursor-pointer hover:border-gray-400"
                  onClick={() => setSelectedSegmentation({ name: seg.name, businessUnit: seg.businessUnit })}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[indigo-600]">{seg.name}</h3>
                    <button
                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>

                  {seg.hasScenario && (
                    <div className="mb-3">
                      <Tag variant="info" size="small" style="filled">
                        Scenario
                      </Tag>
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <span className="text-gray-500">Business Unit:</span>
                      <span className="font-medium">{seg.businessUnit}</span>
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <div className="relative group/scenarios">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/scenarios:opacity-100 transition-opacity pointer-events-none z-10">
                            Scenarios
                          </div>
                        </div>
                        <span className="font-medium text-gray-900">{seg.docs}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative group/users">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/users:opacity-100 transition-opacity pointer-events-none z-10">
                            Users
                          </div>
                        </div>
                        <span className="font-medium text-gray-900">{seg.users}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
                </div>
              </div>
            </>
          ) : (
            <ScenarioCreationForm
              timePeriod={selectedTimePeriod || ''}
              segmentationName={selectedSegmentation?.name || ''}
              businessUnit={selectedSegmentation?.businessUnit || ''}
              scenarioDefinition={scenarioDefinition}
              onBack={() => setShowScenarioCreation(false)}
            />
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Project not found</div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-[indigo-600] text-white rounded-lg hover:bg-[indigo-700] transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  if (selectedSegmentation && segmentations.length > 0) {
    if (selectedTimePeriod || selectedScenarioId) {
      return (
        <div className="fixed inset-0">
          <SegmentationScenarioDetailPage
            timePeriod={selectedTimePeriod || ''}
            onBack={() => {
              setSelectedTimePeriod(null);
              setSelectedScenarioId(null);
              setShowSavedToast(true);
              setTimeout(() => setShowSavedToast(false), 3000);
            }}
            onBackToProjects={onBack}
            projectName={project.name}
            segmentationName={selectedSegmentation.name}
            businessUnit={selectedSegmentation.businessUnit}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            projectId={projectId}
            scenarioId={selectedScenarioId || undefined}
            initialStep={selectedScenarioStep}
          />
        </div>
      );
    }

    return (
      <div className="fixed inset-0">
        <SegmentationScenariosPage
          segmentationName={selectedSegmentation.name}
          businessUnit={selectedSegmentation.businessUnit}
          onBack={() => setSelectedSegmentation(null)}
          onBackToProjects={onBack}
          projectName={project.name}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onCreateScenario={(timePeriod: string) => setSelectedTimePeriod(timePeriod)}
          onOpenScenario={(scenarioId: string, currentStep: number) => {
            setSelectedScenarioId(scenarioId);
            setSelectedScenarioStep(currentStep);
          }}
          projectId={projectId}
          showSavedToast={showSavedToast}
          onToastClose={() => setShowSavedToast(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-white">
      {/* Breadcrumb Header */}
      <div className="border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={onBack}
            className="text-[indigo-600] hover:text-[indigo-700] font-medium transition-colors"
          >
            Projects
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-medium">{project.name}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {segmentations.length > 0 ? (
          <div className="h-full">
            {generateSegmentationUI()}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center text-gray-400">
              <p className="text-lg">No preview available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
