import { useState } from 'react';
import { Search, ChevronRight, ChevronLeft, X, Calendar, Home, Package, Grid3x3, Phone, Settings, Database, Bell } from 'lucide-react';
import { Wizard } from '../components/ui/Wizard';
import { AccordionItem } from '../components/ui/Accordion';
import { Tag } from '../components/ui/Tag';
import { Button } from '../components/ui/Button';
import { Dropdown } from '../components/ui/Dropdown';
import { ActionField } from '../components/ui/ActionField';
import { Breadcrumb, BreadcrumbItem } from '../components/ui/Breadcrumb';
import { PrimaryNavigation } from '../components/ui/PrimaryNavigation';
import { AIAgentPanel } from '../components/AIAgentPanel';
import { supabase } from '../lib/supabase';

interface SegmentationScenarioDetailPageProps {
  timePeriod: string;
  onBack: () => void;
  onBackToProjects: () => void;
  projectName: string;
  segmentationName: string;
  businessUnit: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onContinue?: () => void;
  projectId?: string;
  scenarioId?: string;
  initialStep?: number;
  onSave?: () => void;
}

export function SegmentationScenarioDetailPage({
  timePeriod,
  onBack,
  onBackToProjects,
  projectName,
  segmentationName,
  businessUnit,
  sidebarCollapsed,
  onToggleSidebar,
  onContinue,
  projectId,
  scenarioId,
  initialStep = 1,
  onSave
}: SegmentationScenarioDetailPageProps) {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [expandedAccordions, setExpandedAccordions] = useState<number[]>([0, 1]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('Beh_Lexorin');
  const [segmentationType, setSegmentationType] = useState('behavioral');
  const [customerType, setCustomerType] = useState('hcp');
  const [level, setLevel] = useState('brand');
  const [levelName, setLevelName] = useState('lexorin');
  const [modelingFramework, setModelingFramework] = useState('rule-based');
  const [numDimensions, setNumDimensions] = useState<string>('');
  const [dimensions, setDimensions] = useState<Array<{ objectName: string; fieldName: string }>>([]);
  const [activeDimensionTab, setActiveDimensionTab] = useState(0);
  const [showOnboardingTooltip, setShowOnboardingTooltip] = useState(true);

  const handleSaveAndClose = async () => {
    try {
      const scenarioData = {
        project_id: projectId,
        segmentation_name: segmentationName,
        business_unit: businessUnit,
        time_period: timePeriod,
        name: scenarioName,
        type: segmentationType,
        customer_type: customerType,
        level: level,
        level_name: levelName,
        modeling_framework: modelingFramework,
        num_dimensions: parseInt(numDimensions) || 0,
        dimensions: dimensions,
        current_step: currentStep,
        status: 'draft',
        modified_by: 'user',
        updated_at: new Date().toISOString()
      };

      if (scenarioId) {
        await supabase
          .from('scenarios')
          .update(scenarioData)
          .eq('id', scenarioId);
      } else {
        await supabase
          .from('scenarios')
          .insert(scenarioData);
      }

      onBack();
    } catch (error) {
      console.error('Error saving scenario:', error);
    }
  };

  const handleContinue = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (onContinue) {
      onContinue();
    }
  };

  const handleNumDimensionsChange = (value: string) => {
    setNumDimensions(value);
    const count = parseInt(value);
    if (!isNaN(count) && count > 0) {
      setDimensions(Array(count).fill(null).map(() => ({ objectName: '', fieldName: '' })));
    } else {
      setDimensions([]);
    }
  };

  const updateDimension = (index: number, field: 'objectName' | 'fieldName', value: string) => {
    setDimensions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const wizardSteps = [
    { id: '1', label: 'Definition', number: 1, status: 'default' as const, state: currentStep === 1 ? 'active' as const : 'completed' as const },
    { id: '2', label: 'Dimensions', number: 2, status: 'default' as const, state: currentStep === 2 ? 'active' as const : (currentStep > 2 ? 'completed' as const : 'default' as const) },
    { id: '3', label: 'Modeling', number: 3, status: 'default' as const, state: currentStep === 3 ? 'active' as const : (currentStep > 3 ? 'completed' as const : 'default' as const) },
    { id: '4', label: 'Segmentation', number: 4, status: 'default' as const, state: currentStep === 4 ? 'active' as const : 'default' as const }
  ];

  const dimensionNumberOptions = Array.from({ length: 20 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1)
  }));

  const objectNameOptions = [
    { value: 'customer-product', label: 'Customer Product' },
    { value: 'customer', label: 'Customer' },
    { value: 'product', label: 'Product' }
  ];

  const fieldNameOptions = [
    { value: 'lexorin_trx', label: 'Lexorin_TRx' },
    { value: 'lexorin_nrx', label: 'Lexorin_NRx' },
    { value: 'competitor_trx', label: 'Competitor_TRx' }
  ];

  const toggleAccordion = (index: number) => {
    setExpandedAccordions(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const segmentationTypeOptions = [
    { value: 'behavioral', label: 'Behavioral' },
    { value: 'attitudinal', label: 'Attitudinal' },
    { value: 'needs-based', label: 'Needs-based' }
  ];

  const customerTypeOptions = [
    { value: 'hcp', label: 'HCP' },
    { value: 'patient', label: 'Patient' },
    { value: 'payer', label: 'Payer' }
  ];

  const levelOptions = [
    { value: 'brand', label: 'Brand' },
    { value: 'franchise', label: 'Franchise' },
    { value: 'therapeutic-area', label: 'Therapeutic Area' }
  ];

  const levelNameOptions = [
    { value: 'lexorin', label: 'Lexorin' },
    { value: 'other-brand', label: 'Other Brand' }
  ];

  const showAIAgent = projectName.includes('3.0');
  const bottomBarLeftPosition = showAIAgent ? 'left-[500px]' : 'left-20';

  return (
    <div className="h-full flex flex-col bg-white relative">
      <div className="border-b border-gray-200 bg-white px-6 py-3 relative z-40">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={onBackToProjects}
            className="text-[indigo-600] hover:text-[indigo-700] font-medium transition-colors"
          >
            Projects
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-medium">{projectName}</span>
        </div>
      </div>

      <div className="flex-1 flex bg-white">
        {/* Primary Navigation */}
        <PrimaryNavigation variant="collapsed" />

        {/* AI Agent Panel - Left Side - Only for 3.0 projects */}
        {showAIAgent && (
          <AIAgentPanel
            onNavigateToSegment={(segmentName) => {
              console.log('Navigate to segment:', segmentName);
            }}
            onCreateSegment={() => {
              console.log('Create new segment');
            }}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 pr-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="bg-[#EC7200] text-white px-4 py-1.5 font-semibold text-sm uppercase tracking-wide">
                  SEGMENTATION
                </span>
                <Tag variant="info" size="medium" style="filled">
                  DRAFT
                </Tag>
                <button
                  onClick={() => setIsDatePickerOpen(true)}
                  className="flex items-center gap-2 text-gray-900 hover:text-[indigo-600] transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">{segmentationName} - {businessUnit} - {timePeriod}</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 transition-colors">
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 bg-white px-8 py-4">
            <div className="flex items-center justify-between">
              <Breadcrumb
                items={[
                  { label: 'Segmentations', onClick: () => {} },
                  { label: 'Scenarios', onClick: onBack },
                  { label: 'Create Scenario', isActive: true }
                ]}
                size="normal"
                theme="light"
              />

              <div className="flex items-center gap-3">
                <Button variant="outline" size="normal" disabled={true}>
                  Analysis and Overrides
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-gray-600">Geography: </span>
                <span className="font-semibold text-gray-900">USA</span>
              </div>
              <div>
                <span className="text-gray-600">Business Unit: </span>
                <span className="font-semibold text-gray-900">{businessUnit}</span>
              </div>
              {currentStep === 2 && (
                <>
                  <div>
                    <span className="text-gray-600">Scenario Name: </span>
                    <span className="font-semibold text-gray-900">{scenarioName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type: </span>
                    <span className="font-semibold text-gray-900">{segmentationType.charAt(0).toUpperCase() + segmentationType.slice(1)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Customer Type: </span>
                    <span className="font-semibold text-gray-900">{customerType.toUpperCase()}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white border-b border-gray-200 px-8 py-4">
            <Wizard steps={wizardSteps} currentStep={currentStep - 1} onStepClick={(stepIndex) => setCurrentStep(stepIndex + 1)} />
          </div>

          <div className="flex-1 overflow-auto bg-gray-50 pb-24">
            {currentStep === 1 ? (
            <div key="step-1">
              <AccordionItem
                title="Modeling framework"
                isExpanded={expandedAccordions.includes(0)}
                onToggle={() => toggleAccordion(0)}
                variant="borderless"
                showButton={false}
                showIcons={true}
                className="bg-white"
                content={
                  <div className="flex gap-6 px-8 py-6 bg-[#F9FAFB]">
                    <button
                      onClick={() => setModelingFramework('rule-based')}
                      className={`inline-flex items-center gap-3 px-6 py-4 border transition-all ${
                        modelingFramework === 'rule-based'
                          ? 'border-[indigo-600] bg-[#E8F4F6]'
                          : 'border-[#5B5864] hover:border-gray-400 hover:bg-white'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        modelingFramework === 'rule-based'
                          ? 'border-[indigo-600]'
                          : 'border-gray-300'
                      }`}>
                        {modelingFramework === 'rule-based' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[indigo-600]" />
                        )}
                      </div>
                      <span className="text-gray-900 whitespace-nowrap">Rule based</span>
                    </button>
                    <button
                      onClick={() => setModelingFramework('advanced-clustering')}
                      className={`inline-flex items-center gap-3 px-6 py-4 border transition-all ${
                        modelingFramework === 'advanced-clustering'
                          ? 'border-[indigo-600] bg-[#E8F4F6]'
                          : 'border-[#5B5864] hover:border-gray-400 hover:bg-white'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        modelingFramework === 'advanced-clustering'
                          ? 'border-[indigo-600]'
                          : 'border-gray-300'
                      }`}>
                        {modelingFramework === 'advanced-clustering' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[indigo-600]" />
                        )}
                      </div>
                      <span className="text-gray-900 whitespace-nowrap">Advanced Clustering (K-means, LCA, Hierarchy)</span>
                    </button>
                  </div>
                }
              />

              <AccordionItem
                title="Properties"
                isExpanded={expandedAccordions.includes(1)}
                onToggle={() => toggleAccordion(1)}
                variant="borderless"
                showButton={false}
                showIcons={true}
                className="bg-white"
                content={
                  <div className="px-8 py-6 bg-[#F9FAFB]">
                    <div className="space-y-6">
                      <div className="flex gap-10">
                        <div className="w-[332px]">
                          <ActionField
                            label="Scenario Name"
                            value={scenarioName}
                            onChange={setScenarioName}
                            placeholder="Enter scenario name"
                            showHelper={false}
                          />
                        </div>
                        <div className="w-[332px]">
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Segmentation Type
                          </label>
                          <Dropdown
                            options={segmentationTypeOptions}
                            value={segmentationType}
                            onChange={setSegmentationType}
                            size="normal"
                            variant="outline"
                            className="w-full"
                          />
                        </div>
                        <div className="w-[332px]">
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Customer Type
                          </label>
                          <Dropdown
                            options={customerTypeOptions}
                            value={customerType}
                            onChange={setCustomerType}
                            size="normal"
                            variant="outline"
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div className="flex gap-10">
                        <div className="w-[332px]">
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Level
                          </label>
                          <Dropdown
                            options={levelOptions}
                            value={level}
                            onChange={setLevel}
                            size="normal"
                            variant="outline"
                            className="w-full"
                          />
                        </div>
                        <div className="w-[332px]">
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Level Name
                          </label>
                          <Dropdown
                            options={levelNameOptions}
                            value={levelName}
                            onChange={setLevelName}
                            size="normal"
                            variant="outline"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />

              <AccordionItem
                title="Filter the customer universe by adding conditions (Optional)"
                isExpanded={expandedAccordions.includes(2)}
                onToggle={() => toggleAccordion(2)}
                variant="borderless"
                showButton={false}
                showIcons={true}
                className="bg-white"
                content={
                  <div className="px-8 py-6 bg-[#F9FAFB]">
                    <div className="flex items-center gap-4">
                      <button className="px-4 py-2 bg-white border border-[indigo-600] text-[indigo-600] hover:bg-[indigo-600] hover:text-white transition-colors font-medium text-sm">
                        AND
                      </button>
                      <Dropdown
                        options={[{ value: 'select', label: 'Select Object' }]}
                        value=""
                        onChange={() => {}}
                        placeholder="Select Object"
                        size="normal"
                        variant="outline"
                      />
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <circle cx="4" cy="10" r="2" />
                          <circle cx="10" cy="10" r="2" />
                          <circle cx="16" cy="10" r="2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                }
              />
            </div>
            ) : currentStep === 2 ? (
            <div key="step-2" className="px-8 py-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Set Dimensions</h2>

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Choose No. of dimension
                </label>
                <div className="w-[640px]">
                  <Dropdown
                    options={dimensionNumberOptions}
                    value={numDimensions}
                    onChange={handleNumDimensionsChange}
                    placeholder="Select"
                    size="normal"
                    variant="outline"
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Dimensions</h3>

                {dimensions.length === 0 ? (
                  <div className="bg-gray-100 border border-gray-200 rounded px-6 py-12 text-center">
                    <p className="text-gray-600 font-medium">No Dimensions Selected</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {dimensions.map((dimension, index) => (
                      <div key={index} className="p-6 border-b border-gray-300">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4">Dimension {index + 1}</h4>

                        <div className="flex items-end gap-[60px]">
                          <div className="w-[332px]">
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Object Name
                            </label>
                            <Dropdown
                              options={objectNameOptions}
                              value={dimension.objectName}
                              onChange={(value) => updateDimension(index, 'objectName', value)}
                              placeholder="Select"
                              size="normal"
                              variant="outline"
                              className="w-full"
                            />
                          </div>

                          <div className="w-[332px]">
                            <div className="flex items-center gap-2 mb-2">
                              <label className="block text-sm font-medium text-gray-900">
                                Field Name
                              </label>
                              <button
                                disabled={!dimension.fieldName}
                                className={dimension.fieldName ? "text-gray-600 hover:text-gray-900" : "text-gray-300 cursor-not-allowed"}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" strokeWidth={2} />
                                  <line x1="12" y1="7" x2="12" y2="17" strokeWidth={2} />
                                  <line x1="7" y1="12" x2="17" y2="12" strokeWidth={2} />
                                </svg>
                              </button>
                            </div>
                            <Dropdown
                              options={fieldNameOptions.map(option => ({
                                ...option,
                                disabled: dimensions.some((dim, dimIndex) =>
                                  dimIndex !== index && dim.fieldName === option.value
                                )
                              }))}
                              value={dimension.fieldName}
                              onChange={(value) => updateDimension(index, 'fieldName', value)}
                              placeholder="Select"
                              size="normal"
                              variant="outline"
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            ) : currentStep === 3 ? (
            <div key="step-3" className="h-full flex flex-col">
              {/* Dimension Stats and Concentration Accordion */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => toggleAccordion(3)}
                  className="w-full px-8 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="text-base font-semibold text-gray-900">Dimension Stats and Concentration</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${expandedAccordions.includes(3) ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </div>

              {/* Dynamic Dimension Tabs */}
              <div className="border-b border-gray-200 bg-white px-8 overflow-x-auto">
                <div className="flex gap-6">
                  {dimensions.filter(d => d.fieldName).map((dim, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveDimensionTab(index)}
                      className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                        activeDimensionTab === index
                          ? 'border-[indigo-600] text-[indigo-600]'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {fieldNameOptions.find(opt => opt.value === dim.fieldName)?.label || dim.fieldName}
                    </button>
                  ))}
                  {dimensions.filter(d => d.fieldName).length > 8 && (
                    <button className="px-4 py-3 font-medium text-sm text-gray-600 hover:text-gray-900 border-b-2 border-transparent">
                      {dimensions.filter(d => d.fieldName).length - 8} More
                      <span className="ml-1">⋯</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Chart and Stats Content */}
              <div className="flex-1 p-8 bg-white overflow-auto">
                {dimensions.filter(d => d.fieldName).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">
                      {fieldNameOptions.find(opt => opt.value === dimensions[activeDimensionTab]?.fieldName)?.label || 'Dimension Stats'}
                    </h3>

                    <div className="grid grid-cols-2 gap-8">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="text-4xl font-bold text-gray-900 mb-1">70</div>
                          <div className="text-sm text-gray-600">Minimum</div>
                        </div>
                        <div>
                          <div className="text-4xl font-bold text-gray-900 mb-1">274.5</div>
                          <div className="text-sm text-gray-600">Median</div>
                        </div>
                        <div>
                          <div className="text-4xl font-bold text-gray-900 mb-1">167.25</div>
                          <div className="text-sm text-gray-600">25th Percentile</div>
                        </div>
                        <div>
                          <div className="text-4xl font-bold text-gray-900 mb-1">383.25</div>
                          <div className="text-sm text-gray-600">75th Percentile</div>
                        </div>
                        <div>
                          <div className="text-4xl font-bold text-gray-900 mb-1">276.76</div>
                          <div className="text-sm text-gray-600">Average</div>
                        </div>
                        <div>
                          <div className="text-4xl font-bold text-gray-900 mb-1">495</div>
                          <div className="text-sm text-gray-600">Maximum</div>
                        </div>
                      </div>

                      {/* Chart */}
                      <div>
                        <div className="text-sm font-medium text-gray-900 mb-4 text-center">
                          {fieldNameOptions.find(opt => opt.value === dimensions[activeDimensionTab]?.fieldName)?.label || ''}
                        </div>
                        <div className="relative h-64">
                          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-600">
                            <span>24</span>
                            <span>20</span>
                            <span>16</span>
                            <span>12</span>
                            <span>8</span>
                            <span>4</span>
                            <span>0</span>
                          </div>
                          <div className="ml-8 h-full flex items-end gap-1">
                            <div className="flex-1 bg-[#3B9CFF] h-[66%]"></div>
                            <div className="flex-1 bg-[#3B9CFF] h-[83%]"></div>
                            <div className="flex-1 bg-[#3B9CFF] h-[63%]"></div>
                            <div className="flex-1 bg-[#3B9CFF] h-[66%]"></div>
                            <div className="flex-1 bg-[#3B9CFF] h-[88%]"></div>
                            <div className="flex-1 bg-[#3B9CFF] h-[50%]"></div>
                          </div>
                          <div className="mt-2 ml-8 flex justify-between text-xs text-gray-600">
                            <span>[70, 141]</span>
                            <span>[141, 212]</span>
                            <span>[212, 283]</span>
                            <span>[283, 353]</span>
                            <span>[353, 424]</span>
                            <span>[424, 495]</span>
                          </div>
                          <div className="mt-1 text-center text-xs text-gray-600">
                            {fieldNameOptions.find(opt => opt.value === dimensions[activeDimensionTab]?.fieldName)?.label || ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Onboarding Tooltip */}
                    {showOnboardingTooltip && (
                      <div className="fixed top-24 right-8 bg-gray-900 text-white p-4 rounded shadow-xl max-w-xs z-50">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-gray-900 flex items-center justify-center font-bold text-sm">
                            i
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold mb-1">Smart Assist</div>
                            <div className="text-sm mb-3">Use Smart Assist to prompt and identify the cluster model.</div>
                            <button
                              onClick={() => setShowOnboardingTooltip(false)}
                              className="px-4 py-2 bg-[#0B8457] hover:bg-[#0A7349] text-white text-sm font-medium rounded transition-colors"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={`fixed bottom-0 ${bottomBarLeftPosition} right-0 bg-white border-t border-gray-200 px-8 py-4 z-50`}>
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="normal"
            onClick={handleSaveAndClose}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            size="normal"
            onClick={handleSaveAndClose}
          >
            Save and Close
          </Button>
          <Button
            variant="solid"
            size="normal"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
