// client/src/components/country-code-picker.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Country phone codes database
const COUNTRIES = [
  { name: 'Botswana', code: 'BW', dialCode: '+267', flag: '🇧🇼' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦' },
  { name: 'Namibia', code: 'NA', dialCode: '+264', flag: '🇳🇦' },
  { name: 'Zimbabwe', code: 'ZW', dialCode: '+263', flag: '🇿🇼' },
  { name: 'Zambia', code: 'ZM', dialCode: '+260', flag: '🇿🇲' },
  { name: 'Nigeria', code: 'NG', dialCode: '+234', flag: '🇳🇬' },
  { name: 'Kenya', code: 'KE', dialCode: '+254', flag: '🇰🇪' },
  { name: 'Uganda', code: 'UG', dialCode: '+256', flag: '🇺🇬' },
  { name: 'Ghana', code: 'GH', dialCode: '+233', flag: '🇬🇭' },
  { name: 'Tanzania', code: 'TZ', dialCode: '+255', flag: '🇹🇿' },
  { name: 'Mozambique', code: 'MZ', dialCode: '+258', flag: '🇲🇿' },
  { name: 'Angola', code: 'AO', dialCode: '+244', flag: '🇦🇴' },
  { name: 'Lesotho', code: 'LS', dialCode: '+266', flag: '🇱🇸' },
  { name: 'Eswatini', code: 'SZ', dialCode: '+268', flag: '🇸🇿' },
  { name: 'Malawi', code: 'MW', dialCode: '+265', flag: '🇲🇼' },
  { name: 'Rwanda', code: 'RW', dialCode: '+250', flag: '🇷🇼' },
  { name: 'Burundi', code: 'BI', dialCode: '+257', flag: '🇧🇮' },
  { name: 'DRC', code: 'CD', dialCode: '+243', flag: '🇨🇩' },
  { name: 'Cameroon', code: 'CM', dialCode: '+237', flag: '🇨🇲' },
  { name: 'Senegal', code: 'SN', dialCode: '+221', flag: '🇸🇳' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
];

interface CountryCodePickerProps {
  value: string; // dial code (e.g., "+267")
  onChange: (dialCode: string, countryName: string, countryCode: string) => void;
  className?: string;
}

export function CountryCodePicker({ value, onChange, className }: CountryCodePickerProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Get current country from value
  const currentCountry = COUNTRIES.find(c => c.dialCode === value) || COUNTRIES[0];

  // Filter countries based on search
  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.dialCode.includes(searchQuery)
  );

  const handleSelect = (country: typeof COUNTRIES[0]) => {
    onChange(country.dialCode, country.name, country.code);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-between', className)}
        >
          <span className="flex items-center gap-2">
            <span className="text-lg">{currentCountry.flag}</span>
            <span className="text-sm font-medium">{currentCountry.dialCode}</span>
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[300px]" align="start">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <Input
            placeholder={t('Select Country') || 'Search country...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-0 bg-transparent text-sm focus-visible:ring-0"
            autoFocus
          />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country) => (
              <DropdownMenuItem
                key={country.code}
                onClick={() => handleSelect(country)}
                className="cursor-pointer flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">{country.flag}</span>
                  <div>
                    <div className="text-sm font-medium">{country.name}</div>
                    <div className="text-xs text-muted-foreground">{country.dialCode}</div>
                  </div>
                </span>
                {currentCountry.code === country.code && (
                  <span className="text-sm font-semibold">✓</span>
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-2 py-6 text-sm text-center text-muted-foreground">
              {t('No suppliers found') || 'No countries found'}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CountryCodePicker;
