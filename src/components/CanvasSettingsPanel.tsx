import React from 'react';
import { useEditStore } from '../stores';
import { Palette } from 'lucide-react';

const CanvasSettingsPanel: React.FC = () => {
  const { canvasSettings, updateCanvasSettings } = useEditStore();

  const handleSizeChange = (width: number, height: number) => {
    updateCanvasSettings({ width, height });
  };

  const handleBackgroundColorChange = (backgroundColor: string) => {
    updateCanvasSettings({ backgroundColor });
  };

  return (
    <div className="space-y-6">
      {/* 画布尺寸 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          画布尺寸
        </label>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">宽度 (px)</label>
            <input
              type="number"
              min="100"
              max="4000"
              value={canvasSettings.width}
              onChange={(e) => handleSizeChange(Number(e.target.value), canvasSettings.height)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">高度 (px)</label>
            <input
              type="number"
              min="100"
              max="4000"
              value={canvasSettings.height}
              onChange={(e) => handleSizeChange(canvasSettings.width, Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 预设尺寸 */}
        <div>
          <label className="block text-xs text-gray-500 mb-2">常用尺寸</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: '1:1', width: 800, height: 800 },
              { name: '4:3', width: 800, height: 600 },
              { name: '16:9', width: 800, height: 450 },
              { name: '3:2', width: 800, height: 533 },
              { name: 'A4', width: 595, height: 842 },
              { name: '自定义', width: 1200, height: 800 }
            ].map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleSizeChange(preset.width, preset.height)}
                className={`px-3 py-2 text-xs rounded border transition-colors ${
                  canvasSettings.width === preset.width && canvasSettings.height === preset.height
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400 text-gray-700'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 背景颜色 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          背景颜色
        </label>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-gray-500" />
            <input
              type="color"
              value={canvasSettings.backgroundColor}
              onChange={(e) => handleBackgroundColorChange(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
          </div>
          <input
            type="text"
            value={canvasSettings.backgroundColor}
            onChange={(e) => handleBackgroundColorChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="#ffffff"
          />
        </div>
        
        {/* 预设颜色 */}
        <div className="flex space-x-2 mt-3">
          {['#ffffff', '#f3f4f6', '#000000', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((color) => (
            <button
              key={color}
              onClick={() => handleBackgroundColorChange(color)}
              className={`w-6 h-6 rounded border-2 transition-all ${
                canvasSettings.backgroundColor === color
                  ? 'border-blue-500 scale-110'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* 画布信息 */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-xs font-medium text-gray-700 mb-2">画布信息</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>尺寸: {canvasSettings.width} × {canvasSettings.height} px</div>
          <div>比例: {(canvasSettings.width / canvasSettings.height).toFixed(2)}:1</div>
          <div>背景: {canvasSettings.backgroundColor}</div>
        </div>
      </div>

      {/* 操作提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800 font-medium mb-2">
          🎨 画布设置说明：
        </p>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 画布是所有元素的容器</li>
          <li>• 可以独立设置尺寸和背景色</li>
          <li>• 添加的图片和文字都会显示在画布上</li>
        </ul>
      </div>
    </div>
  );
};

export default CanvasSettingsPanel;