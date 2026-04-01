import { Card, ContentCard, SkeletonCard } from '../components/ui/Card';

export function CardsPage() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cards</h1>
          <p className="text-gray-600">
            Flexible container components with various shadow styles and states
          </p>
        </div>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Shadow Variations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-4">NO SHADOW</p>
              <Card shadow="none" className="w-full h-32 p-6">
                <p className="text-sm text-gray-600">Default card</p>
              </Card>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-4">FLAT RIGHT SHADOW</p>
              <Card shadow="flat-right" className="w-full h-32 p-6">
                <p className="text-sm text-gray-600">Default card</p>
              </Card>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-4">FLAT ANGLE RIGHT SHADOW</p>
              <Card shadow="flat-angle-right" className="w-full h-32 p-6">
                <p className="text-sm text-gray-600">Default card</p>
              </Card>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-4">BLUR SHADOW</p>
              <Card shadow="blur" className="w-full h-32 p-6">
                <p className="text-sm text-gray-600">Default card</p>
              </Card>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>*Not using a global token</strong>
              <br />
              Background: Neutral White
              <br />
              Border: Neutral 30
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-4">DEFAULT</p>
              <Card state="default" className="w-full h-32 p-6">
                <p className="text-sm text-gray-600">Default state</p>
              </Card>
              <p className="text-xs text-gray-500 mt-2">
                Background: Neutral 00
                <br />
                Border: Neutral 80
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-4">HOVER</p>
              <Card state="hover" className="w-full h-32 p-6">
                <p className="text-sm text-gray-600">Hover state</p>
              </Card>
              <p className="text-xs text-gray-500 mt-2">
                Background: Neutral 00
                <br />
                Border: Neutral 80
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-4">SELECTED</p>
              <Card state="selected" className="w-full h-32 p-6">
                <p className="text-sm text-gray-600">Selected state</p>
              </Card>
              <p className="text-xs text-gray-500 mt-2">
                Background: Action 90
                <br />
                Border: Action 90
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-4">HOVER SELECTED</p>
              <Card state="hover-selected" className="w-full h-32 p-6">
                <p className="text-sm text-gray-600">Hover selected</p>
              </Card>
              <p className="text-xs text-gray-500 mt-2">
                Background: Action 10*
                <br />
                Border: Action 90
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Disabled State</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-4">DISABLED</p>
              <Card state="disabled" className="w-full h-32 p-6">
                <p className="text-sm text-gray-400">Disabled state</p>
              </Card>
              <p className="text-xs text-gray-500 mt-2">
                Background: Neutral 10
                <br />
                Border: Neutral 30*
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Skeleton Loading</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-4">SKELETON LOADING</p>
              <SkeletonCard />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Content Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ContentCard
              shadow="flat-right"
              title="Work Units"
              description="Manage and organize your work units efficiently with our comprehensive tools."
              footer={
                <button className="text-sm text-[indigo-600] font-medium hover:text-[indigo-700]">
                  View Details
                </button>
              }
            />

            <ContentCard
              shadow="blur"
              state="hover"
              title="Project Overview"
              description="Track your project progress and milestones in real-time."
              footer={
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">12 items</span>
                </div>
              }
            />

            <ContentCard
              shadow="flat-angle-right"
              state="selected"
              title="Analytics Dashboard"
              description="View comprehensive analytics and insights for your data."
              footer={
                <button className="w-full px-4 py-2 bg-[indigo-600] text-white rounded-lg hover:bg-[indigo-700] text-sm font-medium">
                  Open Dashboard
                </button>
              }
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Focus Ring</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-4">FOCUS RING</p>
              <Card focusRing className="w-full h-32 p-6">
                <p className="text-sm text-gray-600">Press Tab to focus</p>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Guidelines</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">When to Use Cards</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>To group related information and actions</li>
                <li>As clickable containers that lead to more detailed content</li>
                <li>To create visual hierarchy in dashboard layouts</li>
                <li>For displaying preview content with associated actions</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Shadow Selection</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>No Shadow:</strong> For subtle, minimal designs</li>
                <li><strong>Flat Right:</strong> Standard shadow for most use cases</li>
                <li><strong>Flat Angle Right:</strong> More pronounced elevation</li>
                <li><strong>Blur Shadow:</strong> Modern, soft shadow effect</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Accessibility</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Use focusRing prop for keyboard navigation</li>
                <li>Ensure sufficient color contrast in all states</li>
                <li>Provide clear visual feedback for interactive cards</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
