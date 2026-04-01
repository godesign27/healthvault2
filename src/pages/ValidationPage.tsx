import { Validation } from '../components/ui/Validation';

export function ValidationPage() {
  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Validation</h1>
          <p className="text-gray-600">
            Feedback messages to inform users about validation states and outcomes
          </p>
        </div>

        <div className="space-y-8">
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Master Components <span className="text-base font-normal text-gray-500">(for UI Kit building only)</span>
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-[#9B85D8] rounded p-6 space-y-4">
                <Validation
                  type="info"
                  title="Basic Validation Title"
                  message="This message is used to convey information related to the nature of the validation to the user. Additional details added as needed."
                  layout="title-icon"
                />
                <Validation
                  type="info"
                  title="Basic Validation Title"
                  message=""
                  layout="icon-left"
                />
              </div>

              <div className="border-2 border-dashed border-[#9B85D8] rounded p-6 space-y-4">
                <Validation
                  type="info"
                  title="Basic Validation Title"
                  message="This message is used to convey information related to the nature of the validation to the user. Additional details added as needed."
                  layout="title-icon"
                  size="small"
                />
                <Validation
                  type="info"
                  title="Basic Validation Title"
                  message=""
                  layout="icon-left"
                  size="small"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Validation Messages</h2>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-center font-semibold text-gray-700 mb-6 uppercase text-sm">Normal (16)</h3>

                <div className="space-y-8">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-4 bg-gray-100 p-2">Text Only</h4>
                    <div className="space-y-3 border-2 border-dashed border-gray-300 p-4">
                      <Validation
                        type="info"
                        message="Info Validation Title"
                        layout="text"
                      />
                      <Validation
                        type="negative"
                        message="Negative Validation Title"
                        layout="text"
                      />
                      <Validation
                        type="positive"
                        message="Positive Validation Title"
                        layout="text"
                      />
                      <Validation
                        type="warning"
                        message="Warning Validation Title"
                        layout="text"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-4 bg-gray-100 p-2">Icon Left</h4>
                    <div className="space-y-3 border-2 border-dashed border-gray-300 p-4">
                      <Validation
                        type="info"
                        message="Info Validation Title"
                        layout="icon-left"
                      />
                      <Validation
                        type="negative"
                        message="Negative Validation Title"
                        layout="icon-left"
                      />
                      <Validation
                        type="positive"
                        message="Positive Validation Title"
                        layout="icon-left"
                      />
                      <Validation
                        type="warning"
                        message="Warning Validation Title"
                        layout="icon-left"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-4 bg-gray-100 p-2">Title</h4>
                    <div className="space-y-3 border-2 border-dashed border-gray-300 p-4">
                      <Validation
                        type="info"
                        title="Info Validation Title"
                        message="This message is used to convey information related to the nature of the validation to the user. Additional details added as needed."
                        layout="title"
                      />
                      <Validation
                        type="negative"
                        title="Negative Validation Title"
                        message="This message is used to convey information related to the nature of the validation to the user. Additional details added as needed."
                        layout="title"
                      />
                      <Validation
                        type="positive"
                        title="Positive Validation Title"
                        message="This message is used to convey information related to the nature of the validation to the user. Additional details added as needed."
                        layout="title"
                      />
                      <Validation
                        type="warning"
                        title="Warning Validation Title"
                        message="This message is used to convey information related to the nature of the validation to the user. Additional details added as needed."
                        layout="title"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-4 bg-gray-100 p-2">Title & Icon</h4>
                    <div className="space-y-3 border-2 border-dashed border-gray-300 p-4">
                      <Validation
                        type="info"
                        title="Info Validation Title"
                        message="This message is used to convey information related to the nature of the validation to the user. Additional details added as needed."
                        layout="title-icon"
                      />
                      <Validation
                        type="negative"
                        title="Negative Validation Title"
                        message="This message is used to convey information related to the nature of the validation to the user. Additional details added as needed."
                        layout="title-icon"
                      />
                      <Validation
                        type="positive"
                        title="Positive Validation Title"
                        message="This message is used to convey information related to the nature of the validation to the user. Additional details added as needed."
                        layout="title-icon"
                      />
                      <Validation
                        type="warning"
                        title="Warning Validation Title"
                        message="This message is used to convey information related to the nature of the validation to the user. Additional details added as needed."
                        layout="title-icon"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-center font-semibold text-gray-700 mb-6 uppercase text-sm">Small (14)</h3>

                <div className="space-y-8">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-4 bg-gray-100 p-2">Text Only</h4>
                    <div className="space-y-3 border-2 border-dashed border-gray-300 p-4">
                      <Validation
                        type="info"
                        message="Info Validation Title"
                        layout="text"
                        size="small"
                      />
                      <Validation
                        type="negative"
                        message="Negative Validation Title"
                        layout="text"
                        size="small"
                      />
                      <Validation
                        type="positive"
                        message="Positive Validation Title"
                        layout="text"
                        size="small"
                      />
                      <Validation
                        type="warning"
                        message="Warning Validation Title"
                        layout="text"
                        size="small"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-4 bg-gray-100 p-2">Icon Left</h4>
                    <div className="space-y-3 border-2 border-dashed border-gray-300 p-4">
                      <Validation
                        type="info"
                        message="Info Validation Title"
                        layout="icon-left"
                        size="small"
                      />
                      <Validation
                        type="negative"
                        message="Negative Validation Title"
                        layout="icon-left"
                        size="small"
                      />
                      <Validation
                        type="positive"
                        message="Positive Validation Title"
                        layout="icon-left"
                        size="small"
                      />
                      <Validation
                        type="warning"
                        message="Warning Validation Title"
                        layout="icon-left"
                        size="small"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-4 bg-gray-100 p-2">Title</h4>
                    <div className="space-y-3 border-2 border-dashed border-gray-300 p-4">
                      <Validation
                        type="info"
                        title="Info Validation Title"
                        message="This message is used to convey information related to the nature of the validation to the user. Additional details added as needed."
                        layout="title"
                        size="small"
                      />
                      <Validation
                        type="negative"
                        title="Negative Validation Title"
                        message="This message is used to convey information related to the nature of the validation to the user. Additional details added as needed."
                        layout="title"
                        size="small"
                      />
                      <Validation
                        type="positive"
                        title="Positive Validation Title"
                        message="This message is used to convey information related to the nature of the validation to the user. Additional details added as needed."
                        layout="title"
                        size="small"
                      />
                      <Validation
                        type="warning"
                        title="Warning Validation Title"
                        message="This message is used to convey information related to the nature of the validation to the user. Additional details added as needed."
                        layout="title"
                        size="small"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-4 bg-gray-100 p-2">Title & Icon</h4>
                    <div className="space-y-3 border-2 border-dashed border-gray-300 p-4">
                      <Validation
                        type="info"
                        title="Info Validation Title"
                        message="This message is used to convey information related to the nature of the validation to the user. Additional details added as needed."
                        layout="title-icon"
                        size="small"
                      />
                      <Validation
                        type="negative"
                        title="Negative Validation Title"
                        message="This message is used to convey information related to the nature of the validation to the user. Additional details added as needed."
                        layout="title-icon"
                        size="small"
                      />
                      <Validation
                        type="positive"
                        title="Positive Validation Title"
                        message="This message is used to convey information related to the nature of the validation to the user. Additional details added as needed."
                        layout="title-icon"
                        size="small"
                      />
                      <Validation
                        type="warning"
                        title="Warning Validation Title"
                        message="This message is used to convey information related to the nature of the validation to the user. Additional details added as needed."
                        layout="title-icon"
                        size="small"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Component Specifications</h2>

            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2 text-lg">Sizes</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Normal (16px):</strong> Standard size for most validation messages</li>
                  <li><strong className="text-[indigo-600]">Small (14px):</strong> Compact size for inline validations and tight spaces</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Types</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[#3B82F6]">Info:</strong> Blue - Neutral information, guidance, or general feedback</li>
                  <li><strong className="text-[#EF4444]">Negative:</strong> Red - Errors, failed validation, or critical issues</li>
                  <li><strong className="text-[#10B981]">Positive:</strong> Green - Success, passed validation, or confirmation</li>
                  <li><strong className="text-[#EAB308]">Warning:</strong> Yellow - Caution, important notes, or potential issues</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Layouts</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Text Only:</strong> Simple message without icon, minimal visual weight</li>
                  <li><strong className="text-[indigo-600]">Icon Left:</strong> Icon on the left followed by text, draws attention to message type</li>
                  <li><strong className="text-[indigo-600]">Title:</strong> Bold title with descriptive message below, hierarchical content</li>
                  <li><strong className="text-[indigo-600]">Title & Icon:</strong> Icon, bold title, and message, most prominent layout</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Visual Design</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>4px left border in type color for visual emphasis</li>
                  <li>Light background tint matching the message type</li>
                  <li>Rounded corners for modern appearance</li>
                  <li>Consistent padding for readable content</li>
                  <li>Type-specific icons (Info, Alert Triangle, Check Circle, Alert Circle)</li>
                  <li>Dark text on light background for optimal readability</li>
                  <li>Color-coded by message type for quick recognition</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Color System</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[#3B82F6]">Info:</strong> Blue backgrounds (#EFF6FF), border and icon (#3B82F6), text (#1E3A8A)</li>
                  <li><strong className="text-[#EF4444]">Negative:</strong> Red backgrounds (#FEF2F2), border and icon (#EF4444), text (#7F1D1D)</li>
                  <li><strong className="text-[#10B981]">Positive:</strong> Green backgrounds (#F0FDF4), border and icon (#10B981), text (#064E3B)</li>
                  <li><strong className="text-[#EAB308]">Warning:</strong> Yellow backgrounds (#FEFCE8), border and icon (#EAB308), text (#713F12)</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage Guidelines</h2>

            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2 text-lg">When to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>To provide feedback on form validation results</li>
                  <li>To inform users about the success or failure of an action</li>
                  <li>To display important information or warnings inline with content</li>
                  <li>To guide users with contextual help or instructions</li>
                  <li>To show system status or state changes</li>
                  <li>To alert users to potential issues before they occur</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">When Not to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>For temporary notifications - use Toast or Banner instead</li>
                  <li>For critical system alerts - use Modal or Alert Dialog</li>
                  <li>For navigation feedback - use appropriate navigation patterns</li>
                  <li>For promotional content - use dedicated marketing components</li>
                  <li>When the message requires user action - use Dialog or Action Banner</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Type Selection</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[#3B82F6]">Info:</strong> Use for neutral information, tips, or helpful guidance</li>
                  <li><strong className="text-[#EF4444]">Negative:</strong> Use for errors, validation failures, or problems requiring immediate attention</li>
                  <li><strong className="text-[#10B981]">Positive:</strong> Use for successful operations, passed validations, or confirmations</li>
                  <li><strong className="text-[#EAB308]">Warning:</strong> Use for cautions, important notes, or situations requiring user awareness</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Layout Selection</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Text Only:</strong> For simple, brief messages where icon is unnecessary</li>
                  <li><strong className="text-[indigo-600]">Icon Left:</strong> For quick scanning and clear message type identification</li>
                  <li><strong className="text-[indigo-600]">Title:</strong> For longer explanations that benefit from structure and hierarchy</li>
                  <li><strong className="text-[indigo-600]">Title & Icon:</strong> For important messages requiring maximum visibility and clarity</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Place validation messages near the related field or content</li>
                  <li>Keep messages concise and actionable</li>
                  <li>Use appropriate severity level - don't overuse warnings or errors</li>
                  <li>Provide clear next steps when showing errors</li>
                  <li>Use consistent messaging throughout the application</li>
                  <li>Write in the active voice and present tense</li>
                  <li>Avoid technical jargon in user-facing messages</li>
                  <li>Test messages with real users for clarity</li>
                  <li>Consider accessibility - don't rely solely on color</li>
                  <li>Use title + message format for complex information</li>
                  <li>Choose appropriate size based on context and importance</li>
                  <li>Don't stack multiple validation messages - consolidate when possible</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Content Guidelines</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Start with the most important information</li>
                  <li>Be specific about what happened and why</li>
                  <li>Provide actionable guidance for resolving issues</li>
                  <li>Use plain language appropriate for your audience</li>
                  <li>Keep titles short (3-5 words) and descriptive</li>
                  <li>Write messages in complete sentences with proper punctuation</li>
                  <li>Use positive framing when possible</li>
                  <li>Avoid blame or negative language toward users</li>
                  <li>Be consistent in tone and terminology</li>
                  <li>Include specific examples when helpful</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Form Validation Patterns</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Show validation messages after user interaction (blur, submit)</li>
                  <li>Display field-level validation inline below the input</li>
                  <li>Show form-level validation at the top of the form</li>
                  <li>Clear validation messages when user begins correcting</li>
                  <li>Provide real-time feedback for complex requirements</li>
                  <li>Use positive validation sparingly to avoid clutter</li>
                  <li>Group related validation errors when appropriate</li>
                  <li>Link error messages to specific fields when possible</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Use ARIA live regions to announce validation messages to screen readers</li>
                  <li>Ensure sufficient color contrast for text and backgrounds (WCAG AA)</li>
                  <li>Don't rely solely on color to convey meaning - use icons and text</li>
                  <li>Include descriptive alt text or aria-labels for icons</li>
                  <li>Make error messages programmatically associated with form fields</li>
                  <li>Use semantic HTML for proper structure</li>
                  <li>Ensure keyboard users can navigate to and from validation messages</li>
                  <li>Test with screen readers to verify message clarity</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Placement</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Place field-level validation directly below the input field</li>
                  <li>Position form-level validation at the top of the form</li>
                  <li>Show page-level messages prominently at the top of content</li>
                  <li>Keep validation messages visible while users make corrections</li>
                  <li>Avoid hiding validation in tooltips or collapsed sections</li>
                  <li>Consider sticky positioning for critical messages during scrolling</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
