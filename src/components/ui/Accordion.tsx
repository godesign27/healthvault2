import { ChevronDown, ChevronUp, Plus, Edit2 } from 'lucide-react';
import { ReactNode, useState } from 'react';

interface AccordionItemProps {
  title: string;
  content?: ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
  variant?: 'border' | 'borderless';
  state?: 'default' | 'focus' | 'disabled';
  showButton?: boolean;
  buttonLabel?: string;
  showIcons?: boolean;
  className?: string;
}

export function AccordionItem({
  title,
  content,
  isExpanded = false,
  onToggle,
  variant = 'border',
  state = 'default',
  showButton = false,
  buttonLabel = 'Button',
  showIcons = true,
  className = ''
}: AccordionItemProps) {
  const isDisabled = state === 'disabled';
  const isFocused = state === 'focus';

  const getHeaderClasses = () => {
    const base = 'flex items-center justify-between px-8 py-4 cursor-pointer transition-colors border-t border-b border-gray-200';

    if (isDisabled) {
      return `${base} opacity-50 cursor-not-allowed bg-gray-50`;
    }

    return `${base} bg-white`;
  };

  const getContentClasses = () => {
    if (variant === 'border') {
      return 'border-t border-gray-200 bg-[#FEF6E8] px-8 py-4';
    }
    return '';
  };

  return (
    <div className={`${className}`}>
      <div
        className={getHeaderClasses()}
        onClick={() => !isDisabled && onToggle?.()}
      >
        <div className="flex items-center gap-3 flex-1">
          {showIcons && (
            isExpanded ? (
              <ChevronUp className="w-4 h-4 text-[indigo-600]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[indigo-600]" />
            )
          )}
          <span className="text-sm font-medium text-gray-900">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          {showButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              disabled={isDisabled}
              className="px-3 py-1 text-xs font-medium text-[indigo-600] border border-[indigo-600] rounded hover:bg-[indigo-600] hover:text-white transition-colors disabled:opacity-50"
            >
              {buttonLabel}
            </button>
          )}
          {showIcons && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                }}
                disabled={isDisabled}
                className="p-1 text-gray-500 hover:text-[indigo-600] transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                }}
                disabled={isDisabled}
                className="p-1 text-gray-500 hover:text-[indigo-600] transition-colors disabled:opacity-50"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {isExpanded && content && (
        <div className={getContentClasses()}>
          {content}
        </div>
      )}
    </div>
  );
}

interface AccordionProps {
  items: Array<{
    title: string;
    content?: ReactNode;
  }>;
  variant?: 'border' | 'borderless';
  defaultExpanded?: number[];
  allowMultiple?: boolean;
  showButtons?: boolean;
  buttonLabel?: string;
  showIcons?: boolean;
  className?: string;
}

export function Accordion({
  items,
  variant = 'border',
  defaultExpanded = [],
  allowMultiple = false,
  showButtons = false,
  buttonLabel = 'Button',
  showIcons = true,
  className = ''
}: AccordionProps) {
  const [expandedItems, setExpandedItems] = useState<number[]>(defaultExpanded);

  const handleToggle = (index: number) => {
    if (allowMultiple) {
      setExpandedItems(prev =>
        prev.includes(index)
          ? prev.filter(i => i !== index)
          : [...prev, index]
      );
    } else {
      setExpandedItems(prev =>
        prev.includes(index) ? [] : [index]
      );
    }
  };

  return (
    <div className={className}>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          title={item.title}
          content={item.content}
          isExpanded={expandedItems.includes(index)}
          onToggle={() => handleToggle(index)}
          variant={variant}
          showButton={showButtons}
          buttonLabel={buttonLabel}
          showIcons={showIcons}
        />
      ))}
    </div>
  );
}

interface NestedAccordionProps {
  title: string;
  nestedItems: Array<{
    title: string;
    content?: ReactNode;
  }>;
  isExpanded?: boolean;
  onToggle?: () => void;
  variant?: 'border' | 'borderless';
  state?: 'default' | 'focus';
  showIcons?: boolean;
  className?: string;
}

export function NestedAccordion({
  title,
  nestedItems,
  isExpanded = false,
  onToggle,
  variant = 'border',
  state = 'default',
  showIcons = true,
  className = ''
}: NestedAccordionProps) {
  const [expandedNested, setExpandedNested] = useState<number[]>([]);

  const handleNestedToggle = (index: number) => {
    setExpandedNested(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const isFocused = state === 'focus';

  const getHeaderClasses = () => {
    const base = 'flex items-center justify-between p-4 cursor-pointer transition-colors';

    if (variant === 'border') {
      if (isFocused) {
        return `${base} border-2 border-[indigo-600] bg-white`;
      }
      return `${base} border-2 border-gray-300 bg-white hover:border-gray-400`;
    }

    if (isFocused) {
      return `${base} bg-gray-100`;
    }
    return `${base} bg-white hover:bg-gray-50`;
  };

  return (
    <div className={className}>
      <div
        className={getHeaderClasses()}
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {showIcons && (
            isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )
          )}
          <span className="text-sm font-medium text-gray-900">{title}</span>
        </div>

        {showIcons && (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="p-1 text-gray-500 hover:text-[indigo-600] transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="p-1 text-gray-500 hover:text-[indigo-600] transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className={variant === 'border' ? 'border-2 border-t-0 border-gray-300' : ''}>
          {nestedItems.map((item, index) => (
            <div key={index} className={variant === 'border' ? 'border-t-2 border-gray-300' : 'border-t-2 border-gray-200'}>
              <div
                className="flex items-center justify-between p-4 pl-12 cursor-pointer bg-white hover:bg-gray-50 transition-colors"
                onClick={() => handleNestedToggle(index)}
              >
                <div className="flex items-center gap-3">
                  {showIcons && (
                    expandedNested.includes(index) ? (
                      <ChevronUp className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    )
                  )}
                  <span className="text-sm text-gray-900">{item.title}</span>
                </div>

                {showIcons && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-1 text-gray-500 hover:text-[indigo-600] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-1 text-gray-500 hover:text-[indigo-600] transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {expandedNested.includes(index) && item.content && (
                <div className="bg-[#FEF6E8] p-4 pl-12">
                  {item.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
