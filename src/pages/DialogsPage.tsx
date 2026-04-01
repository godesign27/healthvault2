import React, { useState } from 'react';
import { Dialog, DialogIconButton } from '../components/ui/Dialog';
import { ExternalLink } from 'lucide-react';

export default function DialogsPage() {
  const [headerDialog, setHeaderDialog] = useState(false);
  const [headerRecordDialog, setHeaderRecordDialog] = useState(false);
  const [darkHeaderDialog, setDarkHeaderDialog] = useState(false);
  const [darkHeaderRecordDialog, setDarkHeaderRecordDialog] = useState(false);
  const [warningDialog, setWarningDialog] = useState(false);
  const [centerDialog, setCenterDialog] = useState(false);
  const [mediumDialog, setMediumDialog] = useState(false);
  const [tallDialog, setTallDialog] = useState(false);
  const [fullDialog, setFullDialog] = useState(false);

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dialogs</h1>
          <p className="text-gray-600">
            Modal dialog components for displaying important content and gathering user input
          </p>
        </div>

        <div className="space-y-8">
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Master components</h2>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-medium mb-4 text-slate-600">LIGHT</h3>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 min-h-[120px]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">HEADER</h4>
                      <button
                        onClick={() => setHeaderDialog(true)}
                        className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm"
                      >
                        Open Dialog
                      </button>
                    </div>
                    <p className="text-sm text-slate-600">Left-Align Header</p>
                  </div>

                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 min-h-[120px]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">FOOTER</h4>
                      <button className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm">
                        Open Dialog
                      </button>
                    </div>
                    <p className="text-sm text-slate-600">Optional footer text</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-4 text-slate-600">DARK</h3>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 min-h-[120px]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">HEADER</h4>
                      <button
                        onClick={() => setDarkHeaderDialog(true)}
                        className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm"
                      >
                        Open Dialog
                      </button>
                    </div>
                    <p className="text-sm text-slate-600">Left-Align Header</p>
                  </div>

                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 min-h-[120px]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">FOOTER</h4>
                      <button className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm">
                        Open Dialog
                      </button>
                    </div>
                    <p className="text-sm text-slate-600">Optional footer text</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Examples</h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <button
                  onClick={() => setWarningDialog(true)}
                  className="w-full px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                >
                  Open Warning Dialog
                </button>
                <button
                  onClick={() => setCenterDialog(true)}
                  className="w-full px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                >
                  Open Center Dialog
                </button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setMediumDialog(true)}
                  className="w-full px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                >
                  Open Medium Dialog
                </button>
                <button
                  onClick={() => setTallDialog(true)}
                  className="w-full px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                >
                  Open Tall Dialog
                </button>
              </div>
            </div>
          </section>
        </div>

        <Dialog
          isOpen={headerDialog}
          onClose={() => setHeaderDialog(false)}
          title="Left-Align Header"
          variant="light"
        >
          <p className="text-slate-600">Dialog content displays here.</p>
        </Dialog>

        <Dialog
          isOpen={darkHeaderDialog}
          onClose={() => setDarkHeaderDialog(false)}
          title="Left-Align Header"
          variant="dark"
        >
          <p className="text-slate-600">Dialog content displays here.</p>
        </Dialog>

        <Dialog
          isOpen={warningDialog}
          onClose={() => setWarningDialog(false)}
          title="Left-Align Header"
          variant="light"
          showIcon
          iconType="warning"
          footerContent={
            <>
              <button className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50">
                Cancel
              </button>
              <button className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700">
                Confirm
              </button>
            </>
          }
        >
          <p className="text-slate-600">Dialog content displays here.</p>
        </Dialog>

        <Dialog
          isOpen={centerDialog}
          onClose={() => setCenterDialog(false)}
          title="Center Header"
          variant="light"
        >
          <div className="text-center">
            <p className="text-slate-600">Dialog content displays here.</p>
          </div>
        </Dialog>

        <Dialog
          isOpen={mediumDialog}
          onClose={() => setMediumDialog(false)}
          title="Medium Dialog"
          variant="light"
          size="medium"
        >
          <div className="space-y-4">
            <h3 className="font-semibold">Content</h3>
            <p className="text-slate-600">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
          </div>
        </Dialog>

        <Dialog
          isOpen={tallDialog}
          onClose={() => setTallDialog(false)}
          title="Tall Dialog"
          variant="light"
          size="medium"
        >
          <div className="space-y-4" style={{ minHeight: '600px' }}>
            <p className="text-slate-600">Tall dialog content...</p>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
