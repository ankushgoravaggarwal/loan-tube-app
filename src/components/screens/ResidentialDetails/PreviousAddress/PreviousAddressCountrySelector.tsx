import React from 'react';
import { CountrySelector, Country } from '../../../ui';

interface PreviousAddressCountrySelectorProps {
  selectedCountry: Country;
  onCountryChange: (country: Country) => void;
  textColorStyle?: React.CSSProperties;
  showCountrySelector: boolean;
  setShowCountrySelector: (show: boolean) => void;
}

const PreviousAddressCountrySelector: React.FC<PreviousAddressCountrySelectorProps> = ({
  selectedCountry,
  onCountryChange,
  textColorStyle,
  showCountrySelector,
  setShowCountrySelector
}) => {
  const handleChangeCountry = () => {
    setShowCountrySelector(true);
  };

  const handleCountrySelect = (country: Country) => {
    onCountryChange(country);
    setShowCountrySelector(false);
  };

  return (
    <>
      <div className="country-selection">
        <div className="country-display">
          <div className="flag-icon">
            <img
              className="flag-image"
              src={`/assets/flags/${selectedCountry?.flag.toLowerCase()}.svg`}
              alt={`${selectedCountry?.name} flag`}
              loading="lazy"
            />
          </div>
          <div className="country-info">
            <div className="country-name">{selectedCountry?.name}</div>
            <div className="country-code">{selectedCountry?.code}</div>
          </div>
          <button 
            className="change-button"
            onClick={handleChangeCountry}
            style={textColorStyle}
          >
            Change
          </button>
        </div>
      </div>

      {/* Country Selector Modal */}
      <CountrySelector
        selectedCountry={selectedCountry}
        onChange={handleCountrySelect}
        onClose={() => setShowCountrySelector(false)}
        isOpen={showCountrySelector}
      />
    </>
  );
};

export default PreviousAddressCountrySelector; 