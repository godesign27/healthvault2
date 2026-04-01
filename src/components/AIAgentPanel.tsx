import { useState, useEffect } from 'react';
import { Send, Paperclip, Mic, MoreHorizontal, RotateCcw, Loader2 } from 'lucide-react';

interface ScenarioDefinition {
  modelingFramework: string;
  scenarioName: string;
  segmentationType: string;
  customerType: string;
  level: string;
  levelName: string;
}

interface AIAgentPanelProps {
  onNavigateToSegment?: (segmentName: string) => void;
  onCreateSegment?: (segmentationName: string, businessUnit: string, timePeriod: string) => void;
  onScenarioDefinitionComplete?: (definition: ScenarioDefinition) => void;
  segmentations?: Array<{ name: string; businessUnit: string }>;
  isInScenarioCreation?: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  options?: Array<{ id: string; label: string; action: () => void }>;
  dropdown?: {
    placeholder: string;
    options: Array<{ value: string; label: string }>;
    onSelect: (value: string) => void;
  };
  radioButtons?: {
    options: Array<{ value: string; label: string }>;
    onSelect: (value: string) => void;
  };
  isLoading?: boolean;
}

export function AIAgentPanel({ onNavigateToSegment, onCreateSegment, onScenarioDefinitionComplete, segmentations = [], isInScenarioCreation = false }: AIAgentPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello, you have 9 dimensions, what clustering approach did you want to apply to these dimensions?',
      options: [
        {
          id: '1',
          label: '1. Create Segmentation',
          action: () => handleOptionClick('Create Segmentation')
        },
        {
          id: '2',
          label: '2. Create Scenario',
          action: () => handleOptionClick('Create Scenario')
        },
        {
          id: '3',
          label: '3. Edit a Scenario',
          action: () => handleOptionClick('Edit a Scenario')
        }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const [selectedSegmentation, setSelectedSegmentation] = useState<string>('');
  const [scenarioDefinition, setScenarioDefinition] = useState<Partial<ScenarioDefinition>>({});
  const [hasStartedScenarioDefinition, setHasStartedScenarioDefinition] = useState(false);

  useEffect(() => {
    if (isInScenarioCreation && !hasStartedScenarioDefinition) {
      setHasStartedScenarioDefinition(true);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Let\'s define your scenario. First, what modeling framework do you want to use?',
          radioButtons: {
            options: [
              { value: 'rule-based', label: 'Rule based' },
              { value: 'advanced-clustering', label: 'Advanced Clustering (K-means, LCA, Hierarchy)' }
            ],
            onSelect: handleModelingFrameworkSelection
          }
        }]);
      }, 300);
    } else if (!isInScenarioCreation && hasStartedScenarioDefinition) {
      setHasStartedScenarioDefinition(false);
    }
  }, [isInScenarioCreation, hasStartedScenarioDefinition]);

  const handleSegmentationSelection = (segmentationName: string) => {
    setSelectedSegmentation(segmentationName);
    setMessages(prev => [...prev, {
      role: 'user',
      content: segmentationName
    }]);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Great! Now, which time period would you like to use for the ${segmentationName} scenario?`,
        options: [
          {
            id: 'q4-2025',
            label: 'Q4 2025  Oct 01 - Dec 31',
            action: () => handleTimePeriodSelection('Q4 2025  Oct 01 - Dec 31')
          },
          {
            id: 'q1-2026',
            label: 'Q1 2026  Jan 01 - Mar 31',
            action: () => handleTimePeriodSelection('Q1 2026  Jan 01 - Mar 31')
          },
          {
            id: 'q2-2026',
            label: 'Q2 2026  Apr 01 - May 30',
            action: () => handleTimePeriodSelection('Q2 2026  Apr 01 - May 30')
          },
          {
            id: 'q3-2026',
            label: 'Q3 2026  Jun 01 - Sep 30',
            action: () => handleTimePeriodSelection('Q3 2026  Jun 01 - Sep 30')
          }
        ]
      }]);
    }, 500);
  };

  const handleTimePeriodSelection = (period: string) => {
    setMessages(prev => [...prev, {
      role: 'user',
      content: period
    }]);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Perfect! I'll create a scenario for ${selectedSegmentation} using ${period}. Opening the scenario creation form now.`,
        isLoading: true
      }]);

      setTimeout(() => {
        if (onCreateSegment) {
          const selectedSeg = segmentations.find(seg => seg.name === selectedSegmentation);
          const businessUnit = selectedSeg?.businessUnit || '';
          onCreateSegment(selectedSegmentation, businessUnit, period);
        }
      }, 2000);
    }, 500);
  };


  const handleModelingFrameworkSelection = (framework: string) => {
    setScenarioDefinition(prev => ({ ...prev, modelingFramework: framework }));
    setMessages(prev => [...prev, {
      role: 'user',
      content: framework === 'rule-based' ? 'Rule based' : 'Advanced Clustering (K-means, LCA, Hierarchy)'
    }]);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Great! Now let\'s set up the scenario properties. What would you like to name this scenario?'
      }]);
    }, 500);
  };

  const handleScenarioPropertyInput = (property: keyof ScenarioDefinition, value: string, displayValue?: string) => {
    setScenarioDefinition(prev => ({ ...prev, [property]: value }));
    setMessages(prev => [...prev, {
      role: 'user',
      content: displayValue || value
    }]);

    const currentDef = { ...scenarioDefinition, [property]: value };

    if (!currentDef.scenarioName) {
      return;
    } else if (!currentDef.segmentationType) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'What segmentation type would you like?',
          dropdown: {
            placeholder: 'Select segmentation type',
            options: [
              { value: 'behavioral', label: 'Behavioral' },
              { value: 'demographic', label: 'Demographic' },
              { value: 'geographic', label: 'Geographic' }
            ],
            onSelect: (val) => handleScenarioPropertyInput('segmentationType', val)
          }
        }]);
      }, 500);
    } else if (!currentDef.customerType) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'What customer type?',
          dropdown: {
            placeholder: 'Select customer type',
            options: [
              { value: 'b2b', label: 'B2B' },
              { value: 'b2c', label: 'B2C' }
            ],
            onSelect: (val) => handleScenarioPropertyInput('customerType', val)
          }
        }]);
      }, 500);
    } else if (!currentDef.level) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'What level?',
          dropdown: {
            placeholder: 'Select level',
            options: [
              { value: 'national', label: 'National' },
              { value: 'regional', label: 'Regional' },
              { value: 'local', label: 'Local' }
            ],
            onSelect: (val) => handleScenarioPropertyInput('level', val)
          }
        }]);
      }, 500);
    } else if (!currentDef.levelName) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'And finally, what level name?',
          dropdown: {
            placeholder: 'Select level name',
            options: [
              { value: 'tier-1', label: 'Tier 1' },
              { value: 'tier-2', label: 'Tier 2' },
              { value: 'tier-3', label: 'Tier 3' }
            ],
            onSelect: (val) => {
              const finalDef = { ...currentDef, levelName: val };
              handleScenarioPropertyInput('levelName', val);
              setTimeout(() => {
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: 'Perfect! I have all the information I need. Your scenario definition is complete.',
                  isLoading: false
                }]);
                if (onScenarioDefinitionComplete) {
                  onScenarioDefinitionComplete(finalDef as ScenarioDefinition);
                }
              }, 500);
            }
          }
        }]);
      }, 500);
    }
  };

  const handleOptionClick = (option: string) => {
    setMessages(prev => [...prev, {
      role: 'user',
      content: option
    }]);

    setTimeout(() => {
      if (option === 'Create Segmentation') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I\'ll help you create a new segmentation. What would you like to name it?'
        }]);
      } else if (option === 'Create Scenario') {
        const dropdownOptions = segmentations.map(seg => ({
          value: seg.name,
          label: `${seg.name} - ${seg.businessUnit}`
        }));

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Let me help you create a new scenario. Which segmentation would you like to create a scenario for?',
          dropdown: {
            placeholder: 'Select a segmentation',
            options: dropdownOptions,
            onSelect: handleSegmentationSelection
          }
        }]);
      } else if (option === 'Edit a Scenario') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Which scenario would you like to edit?'
        }]);
      }
    }, 500);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();

    if (isInScenarioCreation && !scenarioDefinition.scenarioName && messages[messages.length - 1]?.content.includes('name this scenario')) {
      handleScenarioPropertyInput('scenarioName', userMessage);
      setInputValue('');
      return;
    }

    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage
    }]);

    setInputValue('');

    setTimeout(() => {
      const lowerMessage = userMessage.toLowerCase();

      if (lowerMessage.includes('usa') && lowerMessage.includes('segment')) {
        if (onNavigateToSegment) {
          onNavigateToSegment('USA');
        }
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Taking you to the USA segment list now.'
        }]);
      } else if (lowerMessage.includes('create') && lowerMessage.includes('segment')) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I\'ll help you create a new segment. Let me open the creation form.'
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I understand you\'re asking about "' + userMessage + '". How can I help you with that?'
        }]);
      }
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-[420px] border-l border-r border-gray-300 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">Segmentation</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
            <RotateCcw className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
            <MoreHorizontal className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => (
          <div key={idx} className={`${message.role === 'user' ? 'text-right' : ''}`}>
            {message.role === 'assistant' ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-800 leading-relaxed">
                  {message.content}
                </div>
                {message.isLoading && (
                  <div className="flex items-start pt-2">
                    <Loader2 className="w-6 h-6 text-[#4A3F9F] animate-spin" />
                  </div>
                )}
                {message.dropdown && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 italic mb-2">
                      Select from the dropdown <span className="text-gray-400">(or prompt below)</span>:
                    </div>
                    <select
                      onChange={(e) => e.target.value && message.dropdown!.onSelect(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A3F9F] focus:border-[#4A3F9F] text-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        {message.dropdown.placeholder}
                      </option>
                      {message.dropdown.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {message.radioButtons && (
                  <div className="space-y-3 mt-3">
                    <div className="text-xs text-gray-500 italic mb-2">
                      Select one <span className="text-gray-400">(or prompt below)</span>:
                    </div>
                    <div className="flex gap-4">
                      {message.radioButtons.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => message.radioButtons!.onSelect(option.value)}
                          className="flex-1 px-6 py-4 border-2 border-gray-300 hover:border-[indigo-600] rounded-lg text-left transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                              <div className="w-2.5 h-2.5 rounded-full" />
                            </div>
                            <span className="font-medium text-gray-900 text-sm">{option.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {message.options && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 italic mb-2">
                      Choose from one of these options <span className="text-gray-400">(or prompt below)</span>:
                    </div>
                    {message.options.map((option) => (
                      <button
                        key={option.id}
                        onClick={option.action}
                        className="block w-full text-left px-4 py-2.5 border-2 border-[#4A3F9F] text-[#4A3F9F] rounded-full hover:bg-[#4A3F9F] hover:text-white transition-colors font-medium text-sm"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="inline-block bg-[#4A3F9F] text-white px-4 py-2 rounded-2xl text-sm max-w-[80%]">
                {message.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask"
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#4A3F9F] focus:border-transparent text-sm"
            rows={3}
          />
          <button
            onClick={handleSendMessage}
            className="absolute bottom-3 right-3 p-2 text-[#4A3F9F] hover:bg-gray-100 rounded transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
            <Paperclip className="w-4 h-4 text-gray-500" />
          </button>
          <button className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Select
          </button>
          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
            <Mic className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
