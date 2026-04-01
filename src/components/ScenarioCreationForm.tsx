import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Wizard } from './ui/Wizard';
import { AccordionItem } from './ui/Accordion';
import { Tag } from './ui/Tag';
import { Button } from './ui/Button';
import { Dropdown } from './ui/Dropdown';
import { ActionField } from './ui/ActionField';
import { Breadcrumb } from './ui/Breadcrumb';

interface ScenarioDefinition {
  modelingFramework: string;
  scenarioName: string;
  segmentationType: string;
  customerType: string;
  level: string;
  levelName: string;
}

interface ScenarioCreationFormProps {
  timePeriod: string;
  segmentationName: string;
  businessUnit: string;
  scenarioDefinition?: ScenarioDefinition | null;
  onBack?: () => void;
}

export function ScenarioCreationForm({
  timePeriod,
  segmentationName,
  businessUnit,
  scenarioDefinition,
  onBack
}: ScenarioCreationFormProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [expandedAccordions, setExpandedAccordions] = useState<number[]>([0, 1]);
  const [scenarioName, setScenarioName] = useState('Beh_Lexorin');
  const [segmentationType, setSegmentationType] = useState('behavioral');
  const [customerType, setCustomerType] = useState('hcp');
  const [level, setLevel] = useState('brand');
  const [levelName, setLevelName] = useState('lexorin');
  const [modelingFramework, setModelingFramework] = useState('rule-based');

  const wizardSteps = [
    { id: '1', label: 'Definition', number: 1, status: 'default' as const, state: currentStep === 1 ? 'active' as const : 'completed' as const },
    { id: '2', label: 'Dimensions', number: 2, status: 'default' as const, state: currentStep === 2 ? 'active' as const : (currentStep > 2 ? 'completed' as const : 'default' as const) },
    { id: '3', label: 'Modeling', number: 3, status: 'default' as const, state: currentStep === 3 ? 'active' as const : (currentStep > 3 ? 'completed' as const : 'default' as const) },
    { id: '4', label: 'Segmentation', number: 4, status: 'default' as const, state: currentStep === 4 ? 'active' as const : 'default' as const }
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

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="bg-[#EC7200] text-white px-4 py-1.5 font-semibold text-sm uppercase tracking-wide">
              SEGMENTATION
            </span>
            <Tag variant="info" size="medium" style="filled">
              DRAFT
            </Tag>
            <button className="flex items-center gap-2 text-gray-900 hover:text-[indigo-600] transition-colors">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">{segmentationName} - {businessUnit} / {timePeriod}</span>
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

      <div className="bg-white px-8 py-6">
        <Wizard
          steps={wizardSteps}
          currentStep={currentStep}
          onStepClick={(step) => setCurrentStep(step)}
        />
      </div>

      <div className="flex-1 overflow-auto bg-white px-8 pb-8">
        <div className="space-y-6">
          <AccordionItem
            title="Modeling framework"
            isOpen={expandedAccordions.includes(0)}
            onToggle={() => toggleAccordion(0)}
          >
            {scenarioDefinition ? (
              <div className="pt-4">
                <div className="flex items-center gap-3 px-6 py-4 border-2 border-[indigo-600] bg-[#E8F4F6] rounded-lg">
                  <div className="w-5 h-5 rounded-full border-2 border-[indigo-600] flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[indigo-600]" />
                  </div>
                  <span className="font-medium text-gray-900">
                    {scenarioDefinition.modelingFramework === 'rule-based' ? 'Rule based' : 'Advanced Clustering (K-means, LCA, Hierarchy)'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => setModelingFramework('rule-based')}
                    className={`flex-1 px-6 py-4 border-2 rounded-lg text-left transition-all ${
                      modelingFramework === 'rule-based'
                        ? 'border-[indigo-600] bg-[#E8F4F6]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        modelingFramework === 'rule-based'
                          ? 'border-[indigo-600]'
                          : 'border-gray-300'
                      }`}>
                        {modelingFramework === 'rule-based' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[indigo-600]" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">Rule based</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setModelingFramework('advanced-clustering')}
                    className={`flex-1 px-6 py-4 border-2 rounded-lg text-left transition-all ${
                      modelingFramework === 'advanced-clustering'
                        ? 'border-[indigo-600] bg-[#E8F4F6]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        modelingFramework === 'advanced-clustering'
                          ? 'border-[indigo-600]'
                          : 'border-gray-300'
                      }`}>
                        {modelingFramework === 'advanced-clustering' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[indigo-600]" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">Advanced Clustering (K-means, LCA, Hierarchy)</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </AccordionItem>

          <AccordionItem
            title="Properties"
            isOpen={expandedAccordions.includes(1)}
            onToggle={() => toggleAccordion(1)}
          >
            {scenarioDefinition ? (
              <div className="space-y-4 pt-4">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="text-sm text-gray-700 w-40">Scenario Name:</span>
                    <span className="text-sm font-semibold text-gray-900">{scenarioDefinition.scenarioName}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-sm text-gray-700 w-40">Segmentation Type:</span>
                    <span className="text-sm font-semibold text-gray-900 capitalize">{scenarioDefinition.segmentationType}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-sm text-gray-700 w-40">Customer Type:</span>
                    <span className="text-sm font-semibold text-gray-900 uppercase">{scenarioDefinition.customerType}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-sm text-gray-700 w-40">Level:</span>
                    <span className="text-sm font-semibold text-gray-900 capitalize">{scenarioDefinition.level}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-sm text-gray-700 w-40">Level Name:</span>
                    <span className="text-sm font-semibold text-gray-900 capitalize">{scenarioDefinition.levelName.replace('-', ' ')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Scenario Name
                    </label>
                    <input
                      type="text"
                      value={scenarioName}
                      onChange={(e) => setScenarioName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[indigo-600] focus:border-[indigo-600]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Segmentation Type
                    </label>
                    <Dropdown
                      options={segmentationTypeOptions}
                      value={segmentationType}
                      onChange={setSegmentationType}
                      placeholder="Select type"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Customer Type
                    </label>
                    <Dropdown
                      options={customerTypeOptions}
                      value={customerType}
                      onChange={setCustomerType}
                      placeholder="Select type"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Level
                    </label>
                    <Dropdown
                      options={levelOptions}
                      value={level}
                      onChange={setLevel}
                      placeholder="Select level"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Level Name
                    </label>
                    <Dropdown
                      options={levelNameOptions}
                      value={levelName}
                      onChange={setLevelName}
                      placeholder="Select name"
                    />
                  </div>
                </div>
              </div>
            )}
          </AccordionItem>

          <AccordionItem
            title="Filter the customer universe by adding conditions (Optional)"
            isOpen={expandedAccordions.includes(2)}
            onToggle={() => toggleAccordion(2)}
          >
            <div className="pt-4">
              <p className="text-sm text-gray-600">No filters added yet.</p>
            </div>
          </AccordionItem>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white px-8 py-4 flex items-center justify-end gap-3">
        <Button variant="outline" size="normal" onClick={onBack}>
          Cancel
        </Button>
        <Button variant="secondary" size="normal">
          Save and Close
        </Button>
        <Button variant="primary" size="normal">
          Continue
        </Button>
      </div>
    </div>
  );
}
