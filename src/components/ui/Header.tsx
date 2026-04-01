import { useState } from 'react';
import { Calendar, ChevronDown, Edit3, Search, SlidersHorizontal, Globe } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showStatus?: boolean;
  showDate?: boolean;
  showActions?: boolean;
  showLanguage?: boolean;
  showSearch?: boolean;
  showFilter?: boolean;
}

export function Header({
  title = 'ALIGNMENTS',
  showStatus = true,
  showDate = true,
  showActions = true,
  showLanguage = true,
  showSearch = false,
  showFilter = false
}: HeaderProps) {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const languages = [
    'English (US)',
    'Spanish (Latin America)',
    'German',
    'Japanese',
    'Portuguese (Brazil)',
    'Chinese (Simplified)'
  ];

  const actions = [
    'Alignments Map',
    'Split Map',
    'Affiliations Map',
    'Roster',
    'Configurations'
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="bg-[#EC7200] text-white px-4 py-1.5 font-semibold text-sm uppercase">
            {title}
          </span>

          {showStatus && (
            <span className="bg-[#2364C7] text-white px-4 py-1.5 font-semibold text-sm">
              ACTIVE
            </span>
          )}

          {showDate && (
            <div className="flex items-center gap-2 text-gray-700 text-sm">
              <Calendar className="w-4 h-4" />
              <span>Cardiology - Apr 22, 2020</span>
            </div>
          )}

          {showActions && (
            <div className="relative">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="flex items-center gap-2 px-4 py-1.5 bg-[indigo-600] text-white hover:bg-[#156570] transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span className="text-sm font-medium">Configurations</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showActionsMenu && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg min-w-[200px] z-10">
                  {actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => setShowActionsMenu(false)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showSearch && (
            <button className="p-2 hover:bg-gray-100 transition-colors">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {showFilter && (
            <button className="p-2 hover:bg-gray-100 transition-colors">
              <SlidersHorizontal className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {showLanguage && (
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-2 px-4 py-1.5 bg-[indigo-600] text-white hover:bg-[#156570] transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">{selectedLanguage}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showLanguageMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 shadow-lg min-w-[220px] z-10">
                  {languages.map((language, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedLanguage(language.split(' ')[0]);
                        setShowLanguageMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                    >
                      {language}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
