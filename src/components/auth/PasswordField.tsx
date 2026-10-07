import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  inputClassName: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  inputClassName,
  placeholder,
  disabled = false,
  required = false,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-content-primary">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`${inputClassName} pr-12`}
        />
        {value.length > 0 ? (
          <button
            type="button"
            aria-label={visible ? 'Hide password' : 'Show password'}
            onClick={() => setVisible((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-content-secondary hover:text-content-primary"
          >
            {visible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
          </button>
        ) : null}
      </div>
    </div>
  );
}
