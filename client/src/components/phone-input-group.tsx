// client/src/components/phone-input-group.tsx
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CountryCodePicker } from '@/components/country-code-picker';
import { cn } from '@/lib/utils';

interface PhoneInputGroupProps {
  label?: string;
  value: string; // phone number without country code
  countryCode: string; // e.g., "+267"
  onCountryCodeChange: (dialCode: string, countryName: string, countryCode: string) => void;
  onPhoneChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export const PhoneInputGroup = forwardRef<HTMLInputElement, PhoneInputGroupProps>(
  ({
    label,
    value,
    countryCode,
    onCountryCodeChange,
    onPhoneChange,
    placeholder,
    error,
    className,
    disabled = false,
  }, ref) => {
    const { t } = useTranslation();

    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label htmlFor="phone-input">
            {t(label) || label}
          </Label>
        )}
        <div className="flex gap-2">
          {/* Country Code Picker */}
          <div className="w-[140px]">
            <CountryCodePicker
              value={countryCode}
              onChange={onCountryCodeChange}
            />
          </div>

          {/* Phone Number Input */}
          <Input
            ref={ref}
            id="phone-input"
            type="tel"
            value={value}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder={placeholder || t('Phone Number') || 'Phone number'}
            disabled={disabled}
            className={cn(
              'flex-1',
              error && 'border-red-500'
            )}
          />
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}

        {/* Helper Text */}
        <p className="text-xs text-muted-foreground">
          {t('Select Country') || 'Select your country'} • {countryCode} + {value}
        </p>
      </div>
    );
  }
);

PhoneInputGroup.displayName = 'PhoneInputGroup';

export default PhoneInputGroup;
