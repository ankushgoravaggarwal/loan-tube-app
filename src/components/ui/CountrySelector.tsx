import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { usePartner } from '../../partner/PartnerContext';

export interface Country {
  name: string;
  code: string;
  flag: string;
}

interface CountrySelectorProps {
  selectedCountry: Country;
  onChange: (country: Country) => void;
  onClose: () => void;
  isOpen: boolean;
}

// Moved COUNTRIES array outside component to prevent recreation on every render
const COUNTRIES: Country[] = [
  { name: "United Kingdom", code: "GB", flag: "gb" },
  { name: "Afghanistan", code: "AF", flag: "af" },
  { name: "Albania", code: "AL", flag: "al" },
  { name: "Algeria", code: "DZ", flag: "dz" },
  { name: "Andorra", code: "AD", flag: "ad" },
  { name: "Angola", code: "AO", flag: "ao" },
  { name: "Antigua and Barbuda", code: "AG", flag: "ag" },
  { name: "Argentina", code: "AR", flag: "ar" },
  { name: "Armenia", code: "AM", flag: "am" },
  { name: "Australia", code: "AU", flag: "au" },
  { name: "Austria", code: "AT", flag: "at" },
  { name: "Azerbaijan", code: "AZ", flag: "az" },
  { name: "Bahamas", code: "BS", flag: "bs" },
  { name: "Bahrain", code: "BH", flag: "bh" },
  { name: "Bangladesh", code: "BD", flag: "bd" },
  { name: "Barbados", code: "BB", flag: "bb" },
  { name: "Belarus", code: "BY", flag: "by" },
  { name: "Belgium", code: "BE", flag: "be" },
  { name: "Belize", code: "BZ", flag: "bz" },
  { name: "Benin", code: "BJ", flag: "bj" },
  { name: "Bhutan", code: "BT", flag: "bt" },
  { name: "Bolivia", code: "BO", flag: "bo" },
  { name: "Bosnia and Herzegovina", code: "BA", flag: "ba" },
  { name: "Botswana", code: "BW", flag: "bw" },
  { name: "Brazil", code: "BR", flag: "br" },
  { name: "Brunei", code: "BN", flag: "bn" },
  { name: "Bulgaria", code: "BG", flag: "bg" },
  { name: "Burkina Faso", code: "BF", flag: "bf" },
  { name: "Burundi", code: "BI", flag: "bi" },
  { name: "Cambodia", code: "KH", flag: "kh" },
  { name: "Cameroon", code: "CM", flag: "cm" },
  { name: "Canada", code: "CA", flag: "ca" },
  { name: "Cape Verde", code: "CV", flag: "cv" },
  { name: "Central African Republic", code: "CF", flag: "cf" },
  { name: "Chad", code: "TD", flag: "td" },
  { name: "Chile", code: "CL", flag: "cl" },
  { name: "China", code: "CN", flag: "cn" },
  { name: "Colombia", code: "CO", flag: "co" },
  { name: "Comoros", code: "KM", flag: "km" },
  { name: "Congo", code: "CG", flag: "cg" },
  { name: "Costa Rica", code: "CR", flag: "cr" },
  { name: "Croatia", code: "HR", flag: "hr" },
  { name: "Cuba", code: "CU", flag: "cu" },
  { name: "Cyprus", code: "CY", flag: "cy" },
  { name: "Czech Republic", code: "CZ", flag: "cz" },
  { name: "Denmark", code: "DK", flag: "dk" },
  { name: "Djibouti", code: "DJ", flag: "dj" },
  { name: "Dominica", code: "DM", flag: "dm" },
  { name: "Dominican Republic", code: "DO", flag: "do" },
  { name: "East Timor", code: "TL", flag: "tl" },
  { name: "Ecuador", code: "EC", flag: "ec" },
  { name: "Egypt", code: "EG", flag: "eg" },
  { name: "El Salvador", code: "SV", flag: "sv" },
  { name: "Equatorial Guinea", code: "GQ", flag: "gq" },
  { name: "Eritrea", code: "ER", flag: "er" },
  { name: "Estonia", code: "EE", flag: "ee" },
  { name: "Eswatini", code: "SZ", flag: "sz" },
  { name: "Ethiopia", code: "ET", flag: "et" },
  { name: "Fiji", code: "FJ", flag: "fj" },
  { name: "Finland", code: "FI", flag: "fi" },
  { name: "France", code: "FR", flag: "fr" },
  { name: "Gabon", code: "GA", flag: "ga" },
  { name: "Gambia", code: "GM", flag: "gm" },
  { name: "Georgia", code: "GE", flag: "ge" },
  { name: "Germany", code: "DE", flag: "de" },
  { name: "Ghana", code: "GH", flag: "gh" },
  { name: "Greece", code: "GR", flag: "gr" },
  { name: "Grenada", code: "GD", flag: "gd" },
  { name: "Guatemala", code: "GT", flag: "gt" },
  { name: "Guinea", code: "GN", flag: "gn" },
  { name: "Guinea-Bissau", code: "GW", flag: "gw" },
  { name: "Guyana", code: "GY", flag: "gy" },
  { name: "Haiti", code: "HT", flag: "ht" },
  { name: "Honduras", code: "HN", flag: "hn" },
  { name: "Hungary", code: "HU", flag: "hu" },
  { name: "Iceland", code: "IS", flag: "is" },
  { name: "India", code: "IN", flag: "in" },
  { name: "Indonesia", code: "ID", flag: "id" },
  { name: "Iran", code: "IR", flag: "ir" },
  { name: "Iraq", code: "IQ", flag: "iq" },
  { name: "Ireland", code: "IE", flag: "ie" },
  { name: "Israel", code: "IL", flag: "il" },
  { name: "Italy", code: "IT", flag: "it" },
  { name: "Jamaica", code: "JM", flag: "jm" },
  { name: "Japan", code: "JP", flag: "jp" },
  { name: "Jordan", code: "JO", flag: "jo" },
  { name: "Kazakhstan", code: "KZ", flag: "kz" },
  { name: "Kenya", code: "KE", flag: "ke" },
  { name: "Kiribati", code: "KI", flag: "ki" },
  { name: "Kuwait", code: "KW", flag: "kw" },
  { name: "Kyrgyzstan", code: "KG", flag: "kg" },
  { name: "Laos", code: "LA", flag: "la" },
  { name: "Latvia", code: "LV", flag: "lv" },
  { name: "Lebanon", code: "LB", flag: "lb" },
  { name: "Lesotho", code: "LS", flag: "ls" },
  { name: "Liberia", code: "LR", flag: "lr" },
  { name: "Libya", code: "LY", flag: "ly" },
  { name: "Liechtenstein", code: "LI", flag: "li" },
  { name: "Lithuania", code: "LT", flag: "lt" },
  { name: "Luxembourg", code: "LU", flag: "lu" },
  { name: "Madagascar", code: "MG", flag: "mg" },
  { name: "Malawi", code: "MW", flag: "mw" },
  { name: "Malaysia", code: "MY", flag: "my" },
  { name: "Maldives", code: "MV", flag: "mv" },
  { name: "Mali", code: "ML", flag: "ml" },
  { name: "Malta", code: "MT", flag: "mt" },
  { name: "Marshall Islands", code: "MH", flag: "mh" },
  { name: "Mauritania", code: "MR", flag: "mr" },
  { name: "Mauritius", code: "MU", flag: "mu" },
  { name: "Mexico", code: "MX", flag: "mx" },
  { name: "Micronesia", code: "FM", flag: "fm" },
  { name: "Moldova", code: "MD", flag: "md" },
  { name: "Monaco", code: "MC", flag: "mc" },
  { name: "Mongolia", code: "MN", flag: "mn" },
  { name: "Montenegro", code: "ME", flag: "me" },
  { name: "Morocco", code: "MA", flag: "ma" },
  { name: "Mozambique", code: "MZ", flag: "mz" },
  { name: "Myanmar", code: "MM", flag: "mm" },
  { name: "Namibia", code: "NA", flag: "na" },
  { name: "Nauru", code: "NR", flag: "nr" },
  { name: "Nepal", code: "NP", flag: "np" },
  { name: "Netherlands", code: "NL", flag: "nl" },
  { name: "New Zealand", code: "NZ", flag: "nz" },
  { name: "Nicaragua", code: "NI", flag: "ni" },
  { name: "Niger", code: "NE", flag: "ne" },
  { name: "Nigeria", code: "NG", flag: "ng" },
  { name: "North Korea", code: "KP", flag: "kp" },
  { name: "North Macedonia", code: "MK", flag: "mk" },
  { name: "Norway", code: "NO", flag: "no" },
  { name: "Oman", code: "OM", flag: "om" },
  { name: "Pakistan", code: "PK", flag: "pk" },
  { name: "Palau", code: "PW", flag: "pw" },
  { name: "Palestine", code: "PS", flag: "ps" },
  { name: "Panama", code: "PA", flag: "pa" },
  { name: "Papua New Guinea", code: "PG", flag: "pg" },
  { name: "Paraguay", code: "PY", flag: "py" },
  { name: "Peru", code: "PE", flag: "pe" },
  { name: "Philippines", code: "PH", flag: "ph" },
  { name: "Poland", code: "PL", flag: "pl" },
  { name: "Portugal", code: "PT", flag: "pt" },
  { name: "Qatar", code: "QA", flag: "qa" },
  { name: "Romania", code: "RO", flag: "ro" },
  { name: "Russia", code: "RU", flag: "ru" },
  { name: "Rwanda", code: "RW", flag: "rw" },
  { name: "Saint Kitts and Nevis", code: "KN", flag: "kn" },
  { name: "Saint Lucia", code: "LC", flag: "lc" },
  { name: "Saint Vincent and the Grenadines", code: "VC", flag: "vc" },
  { name: "Samoa", code: "WS", flag: "ws" },
  { name: "San Marino", code: "SM", flag: "sm" },
  { name: "Sao Tome and Principe", code: "ST", flag: "st" },
  { name: "Saudi Arabia", code: "SA", flag: "sa" },
  { name: "Senegal", code: "SN", flag: "sn" },
  { name: "Serbia", code: "RS", flag: "rs" },
  { name: "Seychelles", code: "SC", flag: "sc" },
  { name: "Sierra Leone", code: "SL", flag: "sl" },
  { name: "Singapore", code: "SG", flag: "sg" },
  { name: "Slovakia", code: "SK", flag: "sk" },
  { name: "Slovenia", code: "SI", flag: "si" },
  { name: "Solomon Islands", code: "SB", flag: "sb" },
  { name: "Somalia", code: "SO", flag: "so" },
  { name: "South Africa", code: "ZA", flag: "za" },
  { name: "South Korea", code: "KR", flag: "kr" },
  { name: "South Sudan", code: "SS", flag: "ss" },
  { name: "Spain", code: "ES", flag: "es" },
  { name: "Sri Lanka", code: "LK", flag: "lk" },
  { name: "Sudan", code: "SD", flag: "sd" },
  { name: "Suriname", code: "SR", flag: "sr" },
  { name: "Sweden", code: "SE", flag: "se" },
  { name: "Switzerland", code: "CH", flag: "ch" },
  { name: "Syria", code: "SY", flag: "sy" },
  { name: "Taiwan", code: "TW", flag: "tw" },
  { name: "Tajikistan", code: "TJ", flag: "tj" },
  { name: "Tanzania", code: "TZ", flag: "tz" },
  { name: "Thailand", code: "TH", flag: "th" },
  { name: "Togo", code: "TG", flag: "tg" },
  { name: "Tonga", code: "TO", flag: "to" },
  { name: "Trinidad and Tobago", code: "TT", flag: "tt" },
  { name: "Tunisia", code: "TN", flag: "tn" },
  { name: "Turkey", code: "TR", flag: "tr" },
  { name: "Turkmenistan", code: "TM", flag: "tm" },
  { name: "Tuvalu", code: "TV", flag: "tv" },
  { name: "Uganda", code: "UG", flag: "ug" },
  { name: "Ukraine", code: "UA", flag: "ua" },
  { name: "United Arab Emirates", code: "AE", flag: "ae" },
  { name: "United States", code: "US", flag: "us" },
  { name: "Uruguay", code: "UY", flag: "uy" },
  { name: "Uzbekistan", code: "UZ", flag: "uz" },
  { name: "Vanuatu", code: "VU", flag: "vu" },
  { name: "Vatican City", code: "VA", flag: "va" },
  { name: "Venezuela", code: "VE", flag: "ve" },
  { name: "Vietnam", code: "VN", flag: "vn" },
  { name: "Yemen", code: "YE", flag: "ye" },
  { name: "Zambia", code: "ZM", flag: "zm" },
  { name: "Zimbabwe", code: "ZW", flag: "zw" }
];

// Debounce hook for search optimization
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Memoized country option component
const CountryOption = React.memo<{
  country: Country;
  isSelected: boolean;
  selectedOptionStyle: React.CSSProperties;
  hoverColorStyle: React.CSSProperties;
  onSelect: (country: Country) => void;
}>(({ country, isSelected, selectedOptionStyle, hoverColorStyle, onSelect }) => {
  const handleClick = useCallback(() => {
    onSelect(country);
  }, [country, onSelect]);

  return (
    <button
      className={`country-option ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      style={{
        ...(isSelected ? selectedOptionStyle : {}),
        ...hoverColorStyle
      }}
    >
      <span className="country-flag">
        <img
          src={`/assets/flags/${country.flag.toLowerCase()}.svg`}
          alt={`${country.name} flag`}
          width="20"
          height="15"
          loading="lazy"
        />
      </span>
      <span className="country-name">{country.name}</span>
      <span className="country-code">{country.code}</span>
    </button>
  );
});

CountryOption.displayName = 'CountryOption';

const CountrySelector: React.FC<CountrySelectorProps> = ({ 
  selectedCountry, 
  onChange, 
  onClose, 
  isOpen 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 150);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { partner, isPartnerRoute } = usePartner();

  // Memoize primary color to avoid recalculation
  const primaryColor = useMemo(() => {
    return isPartnerRoute && partner?.primary_color ? partner.primary_color : '#000000';
  }, [isPartnerRoute, partner?.primary_color]);

  // Optimized input styles with stable dependencies
  const inputStyle = useMemo(() => {
    return { 
      border: `2px solid ${primaryColor}`,
      '--focus-color': primaryColor
    } as React.CSSProperties;
  }, [primaryColor]);

  // Optimized selected option style with stable dependencies
  const selectedOptionStyle = useMemo(() => {    
    if (isPartnerRoute && partner?.primary_color) {      
      return {         
        backgroundColor: `${partner.primary_color}10`,
        borderColor: partner.primary_color,        
        color: partner.primary_color      
      };    
    }    
    return {
      backgroundColor: '#f0f9ff',
      borderColor: '#000000',
      color: '#000000'
    };
  }, [isPartnerRoute, partner?.primary_color]);  
  
  // Optimized hover color style with stable dependencies
  const hoverColorStyle = useMemo(() => {    
    return {         
      '--hover-color': primaryColor,        
      '--search-icon-color': primaryColor      
    } as React.CSSProperties;
  }, [primaryColor]);

  // Memoized filtered countries with debounced search
  const filteredCountries = useMemo(() => {
    if (debouncedSearchTerm.trim() === "") {
      return COUNTRIES;
    }
    
    const lowercasedFilter = debouncedSearchTerm.toLowerCase();
    return COUNTRIES.filter(country => {
      return (
        country.name.toLowerCase().includes(lowercasedFilter) || 
        country.code.toLowerCase().includes(lowercasedFilter)
      );
    });
  }, [debouncedSearchTerm]);

  // Memoized country selection handler
  const handleCountrySelect = useCallback((country: Country) => {
    onChange(country);
    onClose();
  }, [onChange, onClose]);

  // Memoized search clear handler
  const handleSearchClear = useCallback(() => {
    setSearchTerm("");
  }, []);

  // Memoized search input change handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="country-selector-overlay">
      <div className="country-selector-modal" ref={modalRef}>
        <div className="country-selector-header">
          <h3 className="country-selector-title">Select a country</h3>
          <button 
            className="country-selector-close" 
            onClick={onClose}
            aria-label="Close"
            style={hoverColorStyle}
          >
            ×
          </button>
        </div>
        
        <div className="country-selector-search">
          <input
            ref={searchInputRef}
            type="text"
            className="country-search-input"
            placeholder="Search for a country..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={inputStyle}
          />
          {searchTerm ? (
            <button 
              className="country-search-clear" 
              onClick={handleSearchClear}
              aria-label="Clear search"
              style={hoverColorStyle}
            >
              ×
            </button>
          ) : (
            <svg 
              className="country-search-icon" 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke={primaryColor} 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          )}
        </div>
        
        <div className="country-list">
          {filteredCountries.length === 0 ? (
            <div className="no-countries-found">
              No countries found matching "{debouncedSearchTerm}"
            </div>
          ) : (
            filteredCountries.map((country) => (
              <CountryOption
                key={country.code}
                country={country}
                isSelected={selectedCountry.code === country.code}
                selectedOptionStyle={selectedOptionStyle}
                hoverColorStyle={hoverColorStyle}
                onSelect={handleCountrySelect}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CountrySelector; 