import { Phone, Mail, MapPin, Calendar, CreditCard as Edit2, Share2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Provider } from '../../types/network';
import { Card } from '../ui/Card';

interface ProviderCardProps {
  provider: Provider;
  darkMode?: boolean;
  onView?: (provider: Provider) => void;
  onEdit?: (provider: Provider) => void;
  onShare?: (provider: Provider) => void;
  onRemove?: (provider: Provider) => void;
}

export function ProviderCard({
  provider,
  darkMode = false,
  onView,
  onEdit,
  onShare,
  onRemove
}: ProviderCardProps) {
  const relationshipColors: Record<string, string> = {
    Primary: 'bg-blue-600',
    Specialist: 'bg-purple-600',
    Dental: 'bg-teal-600',
    Vision: 'bg-amber-600',
    Therapy: 'bg-pink-600',
    Other: 'bg-surface-overlay'
  };

  const relationshipColor = provider.relationship ? relationshipColors[provider.relationship] : 'bg-surface-overlay';

  return (
    <Card
      shadow="blur"
      className="h-full cursor-pointer transition-all hover:-translate-y-0.5"
      onClick={() => onView?.(provider)}
    >
      <div className="mb-4 flex items-start justify-between gap-3 p-6 pb-4">
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-semibold mb-1 truncate ${darkMode ? 'text-white' : 'text-content-primary'}`}>
            {provider.name}
          </h3>
          {provider.specialty && (
            <p className={`text-sm mb-2 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
              {provider.specialty}
            </p>
          )}
          {provider.clinic && (
            <p className={`text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
              {provider.clinic}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {provider.relationship && (
            <span className={`${relationshipColor} text-white text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap`}>
              {provider.relationship}
            </span>
          )}
          {provider.inNetwork !== undefined && (
            <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
              provider.inNetwork
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            }`}>
              {provider.inNetwork ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  In-Network
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3" />
                  Out-of-Network
                </>
              )}
            </span>
          )}
        </div>
      </div>
      <div className={`mb-4 space-y-2 px-6 pb-4 text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
        {provider.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>{provider.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}</span>
          </div>
        )}
        {provider.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>{provider.email}</span>
          </div>
        )}
        {provider.address && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{provider.address}</span>
          </div>
        )}
        {provider.lastVisitDate && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Last visit: {new Date(provider.lastVisitDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      <div
        className={`flex items-center gap-2 border-t ${darkMode ? 'border-stroke-subtle' : 'border-stroke-subtle'} px-6 pb-3 pt-4`}
        onClick={(e) => e.stopPropagation()}
      >
        {onEdit && (
          <button
            onClick={() => onEdit(provider)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              darkMode
                ? 'text-content-primary hover:bg-surface-sunken'
                : 'text-content-primary hover:bg-surface-sunken'
            }`}
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        )}
        {onShare && (
          <button
            onClick={() => onShare(provider)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              darkMode
                ? 'text-content-primary hover:bg-surface-sunken'
                : 'text-content-primary hover:bg-surface-sunken'
            }`}
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        )}
        {onRemove && (
          <button
            onClick={() => onRemove(provider)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            Remove
          </button>
        )}
      </div>
    </Card>
  );
}
