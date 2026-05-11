import { Tooltip, TooltipPopover, TooltipConfirmation } from '../components/ui/Tooltip';

export function TooltipsPage() {
  return (
    <div className="w-full min-h-0">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content-primary mb-2">Tooltips</h1>
          <p className="text-content-secondary">
            Contextual information that appears on hover or focus
          </p>
        </div>

        <div className="space-y-8">
          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Tooltip : Master Components</h2>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-center font-semibold text-content-secondary mb-6 uppercase text-sm">Normal</h3>
                <div className="border-2 border-dashed border-[#9B85D8] rounded p-8 space-y-6">
                  <div className="flex justify-center">
                    <Tooltip content="Tooltip text" position="top" variant="default">
                      <button className="px-4 py-2 bg-surface-overlay text-content-primary rounded text-sm">
                        Tooltip text
                      </button>
                    </Tooltip>
                  </div>
                  <div className="flex justify-center">
                    <Tooltip content="Tooltip text" position="top" variant="inverse">
                      <button className="px-4 py-2 bg-surface-raised border border-stroke-default text-content-primary rounded text-sm">
                        Tooltip text
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-center font-semibold text-content-secondary mb-6 uppercase text-sm">Small</h3>
                <div className="border-2 border-dashed border-[#9B85D8] rounded p-8 space-y-6">
                  <div className="flex justify-center">
                    <Tooltip content="Tooltip text" position="top" variant="default" size="small">
                      <button className="px-3 py-1.5 bg-surface-overlay text-content-primary rounded text-xs">
                        Tooltip text
                      </button>
                    </Tooltip>
                  </div>
                  <div className="flex justify-center">
                    <Tooltip content="Tooltip text" position="top" variant="inverse" size="small">
                      <button className="px-3 py-1.5 bg-surface-raised border border-stroke-default text-content-primary rounded text-xs">
                        Tooltip text
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-center font-semibold text-content-secondary mb-6 uppercase text-sm">Default</h3>
                <div className="border-2 border-dashed border-[#9B85D8] rounded p-8 space-y-6">
                  <div className="flex justify-center gap-8 items-center">
                    <Tooltip content="Tooltip text" position="left" variant="default">
                      <button className="px-4 py-2 bg-surface-overlay text-content-primary rounded text-sm">•</button>
                    </Tooltip>
                    <Tooltip content="Tooltip text" position="top" variant="default">
                      <button className="px-4 py-2 bg-surface-overlay text-content-primary rounded text-sm">•</button>
                    </Tooltip>
                    <Tooltip content="Tooltip text" position="bottom" variant="default">
                      <button className="px-4 py-2 bg-surface-overlay text-content-primary rounded text-sm">•</button>
                    </Tooltip>
                    <Tooltip content="Tooltip text" position="right" variant="default">
                      <button className="px-4 py-2 bg-surface-overlay text-content-primary rounded text-sm">•</button>
                    </Tooltip>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-center font-semibold text-content-secondary mb-6 uppercase text-sm">Inverse</h3>
                <div className="border-2 border-dashed border-[#9B85D8] rounded p-8 space-y-6 bg-surface-overlay">
                  <div className="flex justify-center gap-8 items-center">
                    <Tooltip content="Tooltip text" position="left" variant="inverse">
                      <button className="px-4 py-2 bg-surface-raised text-content-primary rounded text-sm">•</button>
                    </Tooltip>
                    <Tooltip content="Tooltip text" position="top" variant="inverse">
                      <button className="px-4 py-2 bg-surface-raised text-content-primary rounded text-sm">•</button>
                    </Tooltip>
                    <Tooltip content="Tooltip text" position="bottom" variant="inverse">
                      <button className="px-4 py-2 bg-surface-raised text-content-primary rounded text-sm">•</button>
                    </Tooltip>
                    <Tooltip content="Tooltip text" position="right" variant="inverse">
                      <button className="px-4 py-2 bg-surface-raised text-content-primary rounded text-sm">•</button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Normal Default (16px)</h2>

            <div className="grid grid-cols-4 gap-6">
              {(['left', 'right', 'top', 'bottom'] as const).map((pos) => (
                <div key={pos} className="text-center space-y-4">
                  <h3 className="text-sm font-semibold text-content-secondary uppercase">{pos}</h3>
                  <div className="border-2 border-dashed border-stroke-default rounded p-12 flex items-center justify-center">
                    <Tooltip content="Tooltip text" position={pos} variant="default">
                      <button className="px-4 py-2 bg-surface-overlay text-content-primary rounded text-sm">
                        Tooltip text
                      </button>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Small Default (14px)</h2>

            <div className="grid grid-cols-4 gap-6">
              {(['left', 'right', 'top', 'bottom'] as const).map((pos) => (
                <div key={pos} className="text-center space-y-4">
                  <h3 className="text-sm font-semibold text-content-secondary uppercase">{pos}</h3>
                  <div className="border-2 border-dashed border-stroke-default rounded p-12 flex items-center justify-center">
                    <Tooltip content="Tooltip text" position={pos} variant="default" size="small">
                      <button className="px-3 py-1.5 bg-surface-overlay text-content-primary rounded text-xs">
                        Tooltip text
                      </button>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Normal Inverse (16px)</h2>

            <div className="grid grid-cols-4 gap-6">
              {(['left', 'right', 'top', 'bottom'] as const).map((pos) => (
                <div key={pos} className="text-center space-y-4">
                  <h3 className="text-sm font-semibold text-content-secondary uppercase">{pos}</h3>
                  <div className="border-2 border-dashed border-stroke-default rounded p-12 flex items-center justify-center bg-surface-overlay">
                    <Tooltip content="Tooltip text" position={pos} variant="inverse">
                      <button className="px-4 py-2 bg-surface-raised text-content-primary rounded text-sm">
                        Tooltip text
                      </button>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Small Inverse (14px)</h2>

            <div className="grid grid-cols-4 gap-6">
              {(['left', 'right', 'top', 'bottom'] as const).map((pos) => (
                <div key={pos} className="text-center space-y-4">
                  <h3 className="text-sm font-semibold text-content-secondary uppercase">{pos}</h3>
                  <div className="border-2 border-dashed border-stroke-default rounded p-12 flex items-center justify-center bg-surface-overlay">
                    <Tooltip content="Tooltip text" position={pos} variant="inverse" size="small">
                      <button className="px-3 py-1.5 bg-surface-raised text-content-primary rounded text-xs">
                        Tooltip text
                      </button>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Popover : Inverse : Master Components</h2>

            <div className="border-2 border-dashed border-[#9B85D8] rounded p-12 flex justify-center">
              <TooltipPopover
                title="Popover title"
                description="Popover content goes here. Nice and tidy."
                position="top"
                variant="inverse"
              >
                <button className="px-4 py-2 bg-surface-raised border border-stroke-default text-content-primary rounded text-sm">
                  Hover me
                </button>
              </TooltipPopover>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Popover : Inverse</h2>

            <div className="grid grid-cols-4 gap-6">
              {(['left', 'right', 'top', 'bottom'] as const).map((pos) => (
                <div key={pos} className="text-center space-y-4">
                  <h3 className="text-sm font-semibold text-content-secondary uppercase">{pos}</h3>
                  <div className="border-2 border-dashed border-stroke-default rounded p-12 flex items-center justify-center">
                    <TooltipPopover
                      title="Popover title"
                      description="Popover content goes here. Nice and tidy."
                      position={pos}
                      variant="inverse"
                    >
                      <button className="px-4 py-2 bg-surface-raised border border-stroke-default text-content-primary rounded text-sm">
                        Hover
                      </button>
                    </TooltipPopover>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Popover Confirmation : Master Components</h2>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-center font-semibold text-content-secondary mb-6 uppercase text-sm">Inverse</h3>
                <div className="border-2 border-dashed border-[#9B85D8] rounded p-12 flex justify-center">
                  <TooltipConfirmation
                    title="Are you sure you want to delete this item?"
                    message="This action cannot be undone."
                    position="top"
                    variant="inverse"
                    onConfirm={() => alert('Confirmed!')}
                    onCancel={() => alert('Cancelled')}
                  >
                    <button className="px-4 py-2 bg-surface-raised border border-stroke-default text-content-primary rounded text-sm">
                      Click me
                    </button>
                  </TooltipConfirmation>
                </div>
              </div>

              <div>
                <h3 className="text-center font-semibold text-content-secondary mb-6 uppercase text-sm">Default</h3>
                <div className="border-2 border-dashed border-[#9B85D8] rounded p-12 flex justify-center bg-surface-overlay">
                  <TooltipConfirmation
                    title="Are you sure you want to delete this item?"
                    message="This action cannot be undone."
                    position="top"
                    variant="default"
                    onConfirm={() => alert('Confirmed!')}
                    onCancel={() => alert('Cancelled')}
                  >
                    <button className="px-4 py-2 bg-surface-overlay border border-stroke-default text-white rounded text-sm">
                      Click me
                    </button>
                  </TooltipConfirmation>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Popover Confirmation : Inverse</h2>

            <div className="grid grid-cols-4 gap-6">
              {(['left', 'right', 'top', 'bottom'] as const).map((pos) => (
                <div key={pos} className="text-center space-y-4">
                  <h3 className="text-sm font-semibold text-content-secondary uppercase">{pos}</h3>
                  <div className="border-2 border-dashed border-stroke-default rounded p-12 flex items-center justify-center">
                    <TooltipConfirmation
                      title="Are you sure you want to delete this item?"
                      message="This action cannot be undone."
                      position={pos}
                      variant="inverse"
                      onConfirm={() => alert('Confirmed!')}
                      onCancel={() => alert('Cancelled')}
                    >
                      <button className="px-4 py-2 bg-surface-raised border border-stroke-default text-content-primary rounded text-sm">
                        Click
                      </button>
                    </TooltipConfirmation>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Popover Confirmation : Default</h2>

            <div className="grid grid-cols-4 gap-6">
              {(['left', 'right', 'top', 'bottom'] as const).map((pos) => (
                <div key={pos} className="text-center space-y-4">
                  <h3 className="text-sm font-semibold text-content-secondary uppercase">{pos}</h3>
                  <div className="border-2 border-dashed border-stroke-default rounded p-12 flex items-center justify-center bg-surface-overlay">
                    <TooltipConfirmation
                      title="Are you sure you want to delete this item?"
                      message="This action cannot be undone."
                      position={pos}
                      variant="default"
                      onConfirm={() => alert('Confirmed!')}
                      onCancel={() => alert('Cancelled')}
                    >
                      <button className="px-4 py-2 bg-surface-overlay border border-stroke-default text-white rounded text-sm">
                        Click
                      </button>
                    </TooltipConfirmation>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Usage Guidelines</h2>

            <div className="space-y-6 text-content-secondary">
              <div>
                <h3 className="font-semibold mb-2 text-lg">When to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>To provide brief, contextual information about an element</li>
                  <li>To explain icon buttons or controls without labels</li>
                  <li>To show keyboard shortcuts or additional details</li>
                  <li>To display full text when space is limited</li>
                  <li>For confirmation dialogs on simple actions</li>
                  <li>To provide helpful hints without cluttering the interface</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Keep tooltip text concise and informative</li>
                  <li>Position tooltips to avoid obscuring important content</li>
                  <li>Use default variant on light backgrounds, inverse on dark backgrounds</li>
                  <li>Show tooltips on hover and keyboard focus</li>
                  <li>Add appropriate delay before showing tooltips</li>
                  <li>Ensure tooltips don't interfere with clicking or tapping</li>
                  <li>Use popover style for more detailed information</li>
                  <li>Include confirmation tooltips for destructive actions</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
