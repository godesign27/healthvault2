import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface MedicalIDCardProps {
  darkMode?: boolean;
  profilePhoto?: string | null;
  firstName?: string;
  lastName?: string;
}

export function MedicalIDCard({
  darkMode = false,
  profilePhoto = null,
  firstName = 'Timothy',
  lastName = 'McGuire'
}: MedicalIDCardProps) {
  const [showMore, setShowMore] = useState(false);
  const initials = `${firstName[0]}${lastName[0]}`;

  return (
    <div className={`h-full rounded-xl border p-8 transition-all ${
      darkMode
        ? 'bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800 border-stone-700'
        : 'bg-gradient-to-br from-white via-white to-stone-50 border-stone-200'
    }`}>
      <div className={`text-xs font-semibold uppercase tracking-wide mb-6 ${
        darkMode ? 'text-stone-400' : 'text-stone-500'
      }`}>
        Medical ID Card
      </div>

      {profilePhoto ? (
        <img
          src={profilePhoto}
          alt={`${firstName} ${lastName}`}
          className="w-24 h-24 rounded-full object-cover mb-4 mx-auto ring-4 ring-stone-200 dark:ring-stone-700"
        />
      ) : (
        <div className={`flex items-center justify-center w-24 h-24 rounded-full mb-4 mx-auto ring-4 ${
          darkMode
            ? 'bg-gradient-to-br from-stone-700 to-stone-800 ring-stone-700'
            : 'bg-gradient-to-br from-stone-100 to-stone-200 ring-stone-200'
        }`}>
          <span className={`text-3xl font-bold ${
            darkMode ? 'text-stone-300' : 'text-stone-700'
          }`}>{initials}</span>
        </div>
      )}

      <div className="text-center mb-8">
        <h3 className={`text-xl font-bold ${
          darkMode ? 'text-white' : 'text-stone-900'
        }`}>{firstName} {lastName}</h3>
      </div>

      <div className="space-y-4 text-sm">
        <div className="flex justify-between items-start">
          <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Date of Birth</span>
          <span className={`font-semibold text-right ${
            darkMode ? 'text-stone-100' : 'text-stone-900'
          }`}>October 12, 1967</span>
        </div>
        <div className={`border-t ${darkMode ? 'border-stone-800' : 'border-stone-100'}`}></div>
        <div className="flex justify-between items-start">
          <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Allergies & Restrictions</span>
          <span className={`font-semibold text-right ${
            darkMode ? 'text-stone-100' : 'text-stone-900'
          }`}>None</span>
        </div>
        <div className={`border-t ${darkMode ? 'border-stone-800' : 'border-stone-100'}`}></div>
        <div className="flex justify-between items-start">
          <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Medical Conditions</span>
          <span className={`font-semibold text-right ${
            darkMode ? 'text-stone-100' : 'text-stone-900'
          }`}>None</span>
        </div>
        <div className={`border-t ${darkMode ? 'border-stone-800' : 'border-stone-100'}`}></div>
        <div className="flex justify-between items-start">
          <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Organ Donor</span>
          <span className={`font-semibold text-right ${
            darkMode ? 'text-stone-100' : 'text-stone-900'
          }`}>Not listed</span>
        </div>
      </div>

      {showMore && (
        <div className={`mt-6 pt-6 border-t space-y-4 text-sm ${
          darkMode ? 'border-stone-700' : 'border-stone-200'
        }`}>
          <div className="flex justify-between items-start">
            <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Blood Type</span>
            <span className={`font-semibold text-right ${
              darkMode ? 'text-stone-100' : 'text-stone-900'
            }`}>O+</span>
          </div>
          <div className={`border-t ${darkMode ? 'border-stone-800' : 'border-stone-100'}`}></div>
          <div className="flex justify-between items-start">
            <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Emergency Contact</span>
            <span className={`font-semibold text-right ${
              darkMode ? 'text-stone-100' : 'text-stone-900'
            }`}>(555) 123-4567</span>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowMore(!showMore)}
        className="flex items-center justify-center gap-2 w-full mt-6 py-2 rounded-lg text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
        Show {showMore ? 'Less' : 'More'}
      </button>
    </div>
  );
}
