import React from 'react';
import { BaseElement } from '../../types';
import { STYLES, getTextStyle } from '../../utils/styles';
import { clamp } from '../../utils/common';

interface PropertyEditorProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
  showPosition?: boolean;
  showRotation?: boolean;
  showOpacity?: boolean;
  showScale?: boolean;
  showVisibility?: boolean;
  showLock?: boolean;
}

const PropertyEditor: React.FC<PropertyEditorProps> = ({
  element,
  onUpdate,
  showPosition = true,
  showRotation = true,
  showOpacity = true,
  showScale = true,
  showVisibility = true,
  showLock = true,
}) => {
  const handleNumberChange = (field: keyof BaseElement, value: string) => {
    const numValue = parseFloat(value) || 0;
    let clampedValue = numValue;
    
    // 应用特定字段的限制
    switch (field) {
      case 'opacity':
        clampedValue = clamp(numValue, 0, 1);
        break;
      case 'rotation':
        clampedValue = numValue % 360;
        break;
      case 'scaleX':
      case 'scaleY':
        clampedValue = clamp(numValue, 0.1, 10);
        break;
    }
    
    onUpdate({ [field]: clampedValue });
  };

  const handleBooleanChange = (field: keyof BaseElement, value: boolean) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* 位置控制 */}
      {showPosition && (
        <div>
          <label className={getTextStyle('label')}>位置</label>
          <div className={STYLES.layout.grid2}>
            <div>
              <label className="block text-xs text-gray-500 mb-1">X</label>
              <input
                type="number"
                value={Math.round(element.x)}
                onChange={(e) => handleNumberChange('x', e.target.value)}
                className={STYLES.input.number}
                step="1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y</label>
              <input
                type="number"
                value={Math.round(element.y)}
                onChange={(e) => handleNumberChange('y', e.target.value)}
                className={STYLES.input.number}
                step="1"
              />
            </div>
          </div>
        </div>
      )}

      {/* 旋转控制 */}
      {showRotation && (
        <div>
          <label className={getTextStyle('label')}>旋转角度</label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="0"
              max="360"
              value={element.rotation}
              onChange={(e) => handleNumberChange('rotation', e.target.value)}
              className="flex-1"
            />
            <input
              type="number"
              value={Math.round(element.rotation)}
              onChange={(e) => handleNumberChange('rotation', e.target.value)}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
              min="0"
              max="360"
            />
            <span className="text-xs text-gray-500">°</span>
          </div>
        </div>
      )}

      {/* 透明度控制 */}
      {showOpacity && (
        <div>
          <label className={getTextStyle('label')}>透明度</label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={element.opacity}
              onChange={(e) => handleNumberChange('opacity', e.target.value)}
              className="flex-1"
            />
            <input
              type="number"
              value={Math.round(element.opacity * 100)}
              onChange={(e) => handleNumberChange('opacity', (parseFloat(e.target.value) / 100).toString())}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
              min="0"
              max="100"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
        </div>
      )}

      {/* 缩放控制 */}
      {showScale && (
        <div>
          <label className={getTextStyle('label')}>缩放</label>
          <div className={STYLES.layout.grid2}>
            <div>
              <label className="block text-xs text-gray-500 mb-1">宽度</label>
              <input
                type="number"
                value={element.scaleX.toFixed(2)}
                onChange={(e) => handleNumberChange('scaleX', e.target.value)}
                className={STYLES.input.number}
                step="0.1"
                min="0.1"
                max="10"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">高度</label>
              <input
                type="number"
                value={element.scaleY.toFixed(2)}
                onChange={(e) => handleNumberChange('scaleY', e.target.value)}
                className={STYLES.input.number}
                step="0.1"
                min="0.1"
                max="10"
              />
            </div>
          </div>
        </div>
      )}

      {/* 可见性和锁定控制 */}
      {(showVisibility || showLock) && (
        <div className={STYLES.layout.grid2}>
          {showVisibility && (
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={element.visible}
                onChange={(e) => handleBooleanChange('visible', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">可见</span>
            </label>
          )}
          {showLock && (
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={element.locked}
                onChange={(e) => handleBooleanChange('locked', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">锁定</span>
            </label>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyEditor;