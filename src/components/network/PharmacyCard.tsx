import { Phone, MapPin, Star, Edit2, Share2, Trash2, Package, CheckCircle, XCircle } from 'lucide-react';
import { Pharmacy } from '../../types/network';

interface PharmacyCardProps {
  pharmacy: Pharmacy;
  darkMode?: boolean;
  onView?: (pharmacy: Pharmacy) => void;
  onEdit?: (pharmacy: Pharmacy) => void;
  onShare?: (pharmacy: Pharmacy) => void;
  onRemove?: (pharmacy: Pharmacy) => void;
}

export function PharmacyCard({
  pharmacy,
  darkMode = false,
  onView,
  onEdit,
  onShare,
  onRemove
}: PharmacyCardProps) {
  return (
    <div
      className={`rounded-xl border p-6 transition-all hover:shadow-lg cursor-pointer ${
        darkMode ? 'border-stroke-default bg-surface-raised hover:border-stroke-default' : 'border-stroke-subtle bg-white hover:border-stroke-default'
      }`}
      onClick={() => onView?.(pharmacy)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
              {pharmacy.name}
            </h3>
            {pharmacy.preferred && (
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            )}
          </div>
          {pharmacy.chain && (
            <p className={`text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
              {pharmacy.chain}
            </p>
          )}
        </div>
        {pharmacy.inNetwork !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
            pharmacy.inNetwork
              ? 'bg-green-100 text-green-700'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {pharmacy.inNetwork ? (
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

      <div className={`space-y-2 mb-4 text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
        {pharmacy.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>{pharmacy.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}</span>
          </div>
        )}
        {pharmacy.address && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{pharmacy.address}</span>
          </div>
        )}
        {pharmacy.deliveryOptions && pharmacy.deliveryOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <div className="flex gap-1.5">
              {pharmacy.deliveryOptions.map(option => (
                <span
                  key={option}
                  className={`text-xs px-2 py-0.5 rounded ${
                    darkMode ? 'bg-surface-sunken text-content-primary' : 'bg-surface-sunken text-content-primary'
                  }`}
                >
                  {option}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className={`flex items-center gap-2 pt-4 border-t ${darkMode ? 'border-stroke-subtle' : 'border-stroke-subtle'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {onEdit && (
          <button
            onClick={() => onEdit(pharmacy)}
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
            onClick={() => onShare(pharmacy)}
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
            onClick={() => onRemove(pharmacy)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
