import React, { useState } from 'react';
import { PRESET_COLORS } from '../../utils/common';
import { STYLES, getTextStyle } from '../../utils/styles';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  showPresets?: boolean;
  presetColors?: string[];
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  showPresets = true,
  presetColors = PRESET_COLORS,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);

  return (
    <div className="space-y-3">
      {label && <label className={getTextStyle('label')}>{label}</label>}
      
      {/* 当前颜色显示 */}
      <div className="flex items-center space-x-3">
        <div
          className="w-8 h-8 rounded-lg border-2 border-gray-300 cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => setShowCustomInput(!showCustomInput)}
          title="点击输入自定义颜色"
        />
        <span className="text-sm text-gray-600 font-mono">{value}</span>
      </div>

      {/* 预设颜色 */}
      {showPresets && (
        <div>
          <div className="text-xs text-gray-500 mb-2">预设颜色</div>
          <div className="grid grid-cols-5 gap-2">
            {presetColors.map((color) => (
              <button
                key={color}
                className={`w-8 h-8 rounded-lg border-2 transition-all ${
                  value === color
                    ? 'border-blue-500 scale-110'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => onChange(color)}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* 自定义颜色输入 */}
      {showCustomInput && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">自定义颜色</label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-10 h-8 rounded border border-gray-300"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={STYLES.input.text}
              placeholder="#000000"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;