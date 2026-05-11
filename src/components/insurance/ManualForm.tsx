import { useState } from 'react';
import { CoverageZ, Coverage, Relationship } from '../../schemas/insurance';

interface ManualFormProps {
  providerId: string;
  onSubmit: (coverage: Partial<Coverage>) => void;
  onCancel: () => void;
  darkMode?: boolean;
}

export function ManualForm({ providerId, onSubmit, onCancel, darkMode = false }: ManualFormProps) {
  const [formData, setFormData] = useState({
    planName: '',
    memberId: '',
    groupNumber: '',
    bin: '',
    pcn: '',
    relationship: 'self' as Relationship,
    effectiveStart: new Date().toISOString().split('T')[0],
    effectiveEnd: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const coverage: Partial<Coverage> = {
        providerId,
        planName: formData.planName,
        memberId: formData.memberId,
        groupNumber: formData.groupNumber || undefined,
        bin: formData.bin || undefined,
        pcn: formData.pcn || undefined,
        relationship: formData.relationship,
        effectiveStart: new Date(formData.effectiveStart).toISOString(),
        effectiveEnd: formData.effectiveEnd ? new Date(formData.effectiveEnd).toISOString() : null,
        isPrimary: false,
        source: 'manual',
      };

      CoverageZ.parse(coverage);
      onSubmit(coverage);
    } catch (err: any) {
      if (err.errors) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((error: any) => {
          const field = error.path[0];
          newErrors[field] = error.message;
        });
        setErrors(newErrors);
      }
    }
  };

  const inputClass = `w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
    darkMode
      ? 'bg-surface-sunken border-stroke-default text-white placeholder:text-content-placeholder'
      : 'bg-white border-stroke-default text-content-primary placeholder:text-content-placeholder'
  }`;

  const labelClass = `block text-sm font-medium mb-2 ${
    darkMode ? 'text-content-primary' : 'text-content-primary'
  }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="planName" className={labelClass}>
          Plan Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="planName"
          value={formData.planName}
          onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
          className={inputClass}
          placeholder="e.g., Blue Shield PPO"
        />
        {errors.planName && <p className="text-red-500 text-sm mt-1">{errors.planName}</p>}
      </div>

      <div>
        <label htmlFor="memberId" className={labelClass}>
          Member ID <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="memberId"
          value={formData.memberId}
          onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
          className={inputClass}
          placeholder="e.g., ZXY1234567"
        />
        {errors.memberId && <p className="text-red-500 text-sm mt-1">{errors.memberId}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="groupNumber" className={labelClass}>
            Group Number
          </label>
          <input
            type="text"
            id="groupNumber"
            value={formData.groupNumber}
            onChange={(e) => setFormData({ ...formData, groupNumber: e.target.value })}
            className={inputClass}
            placeholder="e.g., G12345"
          />
        </div>

        <div>
          <label htmlFor="relationship" className={labelClass}>
            Relationship
          </label>
          <select
            id="relationship"
            value={formData.relationship}
            onChange={(e) => setFormData({ ...formData, relationship: e.target.value as Relationship })}
            className={inputClass}
          >
            <option value="self">Self</option>
            <option value="spouse">Spouse</option>
            <option value="dependent">Dependent</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="bin" className={labelClass}>
            BIN
          </label>
          <input
            type="text"
            id="bin"
            value={formData.bin}
            onChange={(e) => setFormData({ ...formData, bin: e.target.value })}
            className={inputClass}
            placeholder="e.g., 004336"
          />
        </div>

        <div>
          <label htmlFor="pcn" className={labelClass}>
            PCN
          </label>
          <input
            type="text"
            id="pcn"
            value={formData.pcn}
            onChange={(e) => setFormData({ ...formData, pcn: e.target.value })}
            className={inputClass}
            placeholder="e.g., MEDDPRIME"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="effectiveStart" className={labelClass}>
            Effective Start <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="effectiveStart"
            value={formData.effectiveStart}
            onChange={(e) => setFormData({ ...formData, effectiveStart: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="effectiveEnd" className={labelClass}>
            Effective End
          </label>
          <input
            type="date"
            id="effectiveEnd"
            value={formData.effectiveEnd}
            onChange={(e) => setFormData({ ...formData, effectiveEnd: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Add Coverage
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`px-6 py-3 font-medium rounded-lg transition-colors ${
            darkMode
              ? 'text-content-primary hover:bg-surface-sunken'
              : 'text-content-primary hover:bg-surface-sunken'
          }`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
