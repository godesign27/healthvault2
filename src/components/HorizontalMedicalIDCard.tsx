interface HorizontalMedicalIDCardProps {
  darkMode?: boolean;
}

export function HorizontalMedicalIDCard({ darkMode = false }: HorizontalMedicalIDCardProps) {
  return (
    <div className={`rounded-lg border p-4 ${
      darkMode
        ? 'bg-stone-800 border-stone-700'
        : 'bg-white border-stone-200'
    }`}>
      <div className={`text-xs font-semibold uppercase tracking-wide mb-3 ${
        darkMode ? 'text-stone-400' : 'text-stone-500'
      }`}>
        Medical ID Card
      </div>

      <div className="flex items-start gap-4">
        <div className={`flex items-center justify-center w-16 h-16 rounded-full flex-shrink-0 ${
          darkMode ? 'bg-stone-700' : 'bg-stone-100'
        }`}>
          <span className={`text-xl font-bold ${
            darkMode ? 'text-stone-300' : 'text-stone-700'
          }`}>TM</span>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
          <div>
            <div className={`font-bold mb-2 ${
              darkMode ? 'text-white' : 'text-stone-900'
            }`}>Timothy McGuire</div>
            <div className="flex justify-between">
              <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>DOB:</span>
              <span className={`font-medium ${
                darkMode ? 'text-stone-200' : 'text-stone-900'
              }`}>Oct 12, 1967</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between">
              <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Blood Type:</span>
              <span className={`font-medium ${
                darkMode ? 'text-stone-200' : 'text-stone-900'
              }`}>O+</span>
            </div>
            <div className="flex justify-between">
              <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Allergies:</span>
              <span className={`font-medium ${
                darkMode ? 'text-stone-200' : 'text-stone-900'
              }`}>None</span>
            </div>
          </div>

          <div className="flex justify-between">
            <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Emergency:</span>
            <span className={`font-medium ${
              darkMode ? 'text-stone-200' : 'text-stone-900'
            }`}>(555) 123-4567</span>
          </div>

          <div className="flex justify-between">
            <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Conditions:</span>
            <span className={`font-medium ${
              darkMode ? 'text-stone-200' : 'text-stone-900'
            }`}>None</span>
          </div>
        </div>
      </div>
    </div>
  );
}
