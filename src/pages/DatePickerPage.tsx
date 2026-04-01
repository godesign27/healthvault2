import { DatePicker, DatePickerCalendar, DatePickerDay } from '../components/ui/DatePicker';
import { useState } from 'react';

export function DatePickerPage() {
  const [normalDate, setNormalDate] = useState('');
  const [smallDate, setSmallDate] = useState('');
  const [xsmallDate, setXsmallDate] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Date Picker</h1>
          <p className="text-gray-600">
            Calendar component for selecting dates with various sizes and states
          </p>
        </div>

        <div className="space-y-8">
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Date Picker Sizes</h2>

            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase">Normal</h3>
                <DatePicker
                  label="Date picker label"
                  value={normalDate}
                  onChange={setNormalDate}
                  size="normal"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase">Small</h3>
                <DatePicker
                  label="Date picker label"
                  value={smallDate}
                  onChange={setSmallDate}
                  size="small"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase">X-Small</h3>
                <DatePicker
                  label="Date picker label"
                  value={xsmallDate}
                  onChange={setXsmallDate}
                  size="xsmall"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Master Components (For UI Kit building only)</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Current Date States</h3>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Default</p>
                    <DatePickerDay day={31} isCurrentDate state="default" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Hover</p>
                    <DatePickerDay day={31} isCurrentDate state="hover" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Pressed</p>
                    <DatePickerDay day={31} isCurrentDate state="pressed" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Selected</p>
                    <DatePickerDay day={31} isCurrentDate state="selected" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Highlight</p>
                    <DatePickerDay day={31} isCurrentDate state="highlight" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Focused</p>
                    <DatePickerDay day={31} isCurrentDate state="focused" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Inactive Date States</h3>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Default</p>
                    <DatePickerDay day={31} state="default" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Hover</p>
                    <DatePickerDay day={31} state="hover" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Pressed</p>
                    <DatePickerDay day={31} state="pressed" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Disabled</p>
                    <DatePickerDay day={31} state="disabled" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Navigation Buttons</h3>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Back Button - Default</p>
                    <button className="p-2 rounded-full border-2 border-transparent hover:bg-gray-100 transition-colors">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Back Button - Hover</p>
                    <button className="p-2 rounded-full bg-gray-100 border-2 border-transparent transition-colors">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Back Button - Focused</p>
                    <button className="p-2 rounded-full border-2 border-[indigo-600] transition-colors">
                      <svg className="w-5 h-5 text-[indigo-600]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Forward Button - Default</p>
                    <button className="p-2 rounded-full border-2 border-transparent hover:bg-gray-100 transition-colors">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Forward Button - Hover</p>
                    <button className="p-2 rounded-full bg-gray-100 border-2 border-transparent transition-colors">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Forward Button - Focused</p>
                    <button className="p-2 rounded-full border-2 border-[indigo-600] transition-colors">
                      <svg className="w-5 h-5 text-[indigo-600]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Month/Year Dropdown</h3>
                <div className="flex gap-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#1C2938] text-white rounded border-2 border-gray-300 hover:bg-[#2A3F52] transition-colors">
                    <span className="text-sm">December</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#1C2938] text-white rounded border-2 border-gray-300 hover:bg-[#2A3F52] transition-colors">
                    <span className="text-sm">2020</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Day of the Week</h3>
                <div className="flex gap-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <div key={idx} className="w-10 h-10 flex items-center justify-center text-xs font-semibold text-gray-600">
                      {day}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Today Button</h3>
                <button className="text-sm text-[indigo-600] hover:text-[indigo-700] font-medium transition-colors">
                  Today
                </button>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Footer</h3>
                <div className="flex items-center justify-between border-t-2 border-gray-200 pt-4">
                  <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button className="text-sm text-[indigo-600] hover:text-[indigo-700] font-medium transition-colors">
                    Today
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Calendar Views</h2>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Normal Size</h3>
                <DatePickerCalendar
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  size="normal"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Small Size</h3>
                <DatePickerCalendar
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  size="small"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Action Field with Date Picker</h2>

            <div className="max-w-sm">
              <DatePicker
                label="Date picker label"
                value={normalDate}
                onChange={setNormalDate}
              />
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage Guidelines</h2>

            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2 text-lg">When to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>For selecting specific dates in forms and applications</li>
                  <li>When users need to schedule appointments or events</li>
                  <li>For date range selection in filtering and reporting</li>
                  <li>When precise date input is required instead of free text</li>
                  <li>For birthday, deadline, or any date-specific information</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Sizes</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Normal:</strong> Standard size for most forms and applications</li>
                  <li><strong className="text-[indigo-600]">Small:</strong> Compact size for dense layouts or inline forms</li>
                  <li><strong className="text-[indigo-600]">X-Small:</strong> Minimal size for very compact interfaces</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">States</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Default:</strong> Normal unselected date</li>
                  <li><strong className="text-[indigo-600]">Hover:</strong> Visual feedback when hovering over a date</li>
                  <li><strong className="text-[indigo-600]">Pressed:</strong> Active state when clicking a date</li>
                  <li><strong className="text-[indigo-600]">Selected:</strong> Currently selected date</li>
                  <li><strong className="text-[indigo-600]">Highlight:</strong> Special emphasis for important dates</li>
                  <li><strong className="text-[indigo-600]">Focused:</strong> Keyboard navigation focus indicator</li>
                  <li><strong className="text-[indigo-600]">Disabled:</strong> Unavailable dates that cannot be selected</li>
                  <li><strong className="text-[indigo-600]">Current Date:</strong> Today's date with border indicator</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Always indicate the current date with a border</li>
                  <li>Use clear visual distinction for selected dates</li>
                  <li>Provide "Today" button for quick navigation</li>
                  <li>Show month and year dropdowns for easy navigation</li>
                  <li>Display days from adjacent months in muted colors</li>
                  <li>Allow keyboard navigation for accessibility</li>
                  <li>Use consistent date format (MM/DD/YYYY or locale-appropriate)</li>
                  <li>Disable dates that are not valid selections</li>
                  <li>Include navigation arrows for month-to-month movement</li>
                  <li>Provide clear labels for the input field</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Calendar Navigation</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Use dropdown selectors for month and year selection</li>
                  <li>Provide arrow buttons for moving between months</li>
                  <li>Include a "Today" button to quickly return to current date</li>
                  <li>Allow clicking on dates from adjacent months to navigate</li>
                  <li>Support keyboard navigation (arrow keys, Enter to select)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Use proper ARIA labels for calendar elements</li>
                  <li>Support keyboard navigation (Tab, Arrow keys, Enter, Escape)</li>
                  <li>Provide clear focus indicators for keyboard users</li>
                  <li>Announce selected dates to screen readers</li>
                  <li>Ensure sufficient color contrast for all states</li>
                  <li>Make clickable areas large enough for easy interaction</li>
                  <li>Use semantic HTML for calendar structure</li>
                  <li>Provide text alternatives for icon-only buttons</li>
                  <li>Support date input via typing in the input field</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Date Format</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Default format: MM/DD/YYYY (adjust for locale)</li>
                  <li>Show format as placeholder text in input field</li>
                  <li>Validate date format on input</li>
                  <li>Support manual typing of dates</li>
                  <li>Parse common date input variations</li>
                  <li>Display validation errors clearly</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
