import { User, Mail, Phone, Share2, ExternalLink } from 'lucide-react';

interface CareTeamMember {
  id: string;
  name: string;
  title?: string;
  specialty?: string;
  organization?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  is_primary: boolean;
}

interface CareTeamCardProps {
  member: CareTeamMember;
  darkMode?: boolean;
  onViewProfile?: (member: CareTeamMember) => void;
  onShareRecords?: (member: CareTeamMember) => void;
}

export function CareTeamCard({ member, darkMode = false, onViewProfile, onShareRecords }: CareTeamCardProps) {
  return (
    <div className={`rounded-xl border p-6 transition-all ${
      darkMode ? 'border-stroke-subtle' : 'border-stroke-subtle'
    }`}>
      <div className="flex items-start gap-4 mb-4">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={member.name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            darkMode ? 'bg-surface-sunken' : 'bg-surface-sunken'
          }`}>
            <User className={`w-8 h-8 ${
              darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold truncate ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>
                {member.title ? `${member.title} ${member.name}` : member.name}
              </h3>
              {member.specialty && (
                <p className={`text-sm ${
                  darkMode ? 'text-content-secondary' : 'text-content-secondary'
                }`}>
                  {member.specialty}
                </p>
              )}
            </div>
            {member.is_primary && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 whitespace-nowrap shrink-0">
                Primary
              </span>
            )}
          </div>

          {member.organization && (
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`}>
              {member.organization}
            </p>
          )}
        </div>
      </div>

      {(member.email || member.phone) && (
        <div className={`space-y-2 mb-4 pt-4 border-t ${
          darkMode ? 'border-stroke-default' : 'border-stroke-subtle'
        }`}>
          {member.email && (
            <div className="flex items-center gap-2">
              <Mail className={`w-4 h-4 flex-shrink-0 ${
                darkMode ? 'text-content-secondary' : 'text-content-secondary'
              }`} />
              <a
                href={`mailto:${member.email}`}
                className={`text-sm hover:underline ${
                  darkMode ? 'text-content-primary' : 'text-content-primary'
                }`}
              >
                {member.email}
              </a>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-2">
              <Phone className={`w-4 h-4 flex-shrink-0 ${
                darkMode ? 'text-content-secondary' : 'text-content-secondary'
              }`} />
              <a
                href={`tel:${member.phone}`}
                className={`text-sm hover:underline ${
                  darkMode ? 'text-content-primary' : 'text-content-primary'
                }`}
              >
                {member.phone}
              </a>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => onViewProfile?.(member)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            darkMode
              ? 'bg-surface-sunken text-white hover:bg-surface-overlay'
              : 'bg-surface-sunken text-content-primary hover:bg-surface-overlay'
          }`}
        >
          <ExternalLink className="w-4 h-4" />
          View Profile
        </button>
        <button
          onClick={() => onShareRecords?.(member)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share Records
        </button>
      </div>
    </div>
  );
}
