import React from 'react';
import { getTextStyle } from '../../utils/styles';

interface RangeInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  showInput?: boolean;
  inputWidth?: string;
}

const RangeInput: React.FC<RangeInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  showInput = true,
  inputWidth = 'w-16',
}) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
  };

  const formatValue = (val: number) => {
    if (step < 1) {
      return val.toFixed(2);
    }
    return Math.round(val).toString();
  };

  return (
    <div>
      <label className={getTextStyle('label')}>{label}</label>
      <div className="flex items-center space-x-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className="flex-1"
        />
        {showInput && (
          <>
            <input
              type="number"
              value={formatValue(value)}
              onChange={handleInputChange}
              className={`${inputWidth} px-2 py-1 border border-gray-300 rounded text-sm`}
              min={min}
              max={max}
              step={step}
            />
            {unit && <span className="text-xs text-gray-500">{unit}</span>}
          </>
        )}
      </div>
    </div>
  );
};

export default RangeInput;