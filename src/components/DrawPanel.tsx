import React from 'react';
import { useEditStore } from '../stores';
import { Brush, Eraser, Palette } from 'lucide-react';

const DrawPanel: React.FC = () => {
  const { 
    drawSettings, 
    updateDrawSettings, 
    toggleDrawingMode,
    clearDrawing 
  } = useEditStore();

  const handleBrushSizeChange = (size: number) => {
    updateDrawSettings({ brushSize: size });
  };

  const handleColorChange = (color: string) => {
    updateDrawSettings({ brushColor: color });
  };

  const predefinedColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#000080', '#008000'
  ];

  const brushSizes = [1, 2, 3, 5, 8, 12, 16, 20, 25, 30];

  return (
    <div className="space-y-6">
      {/* 绘画模式切换 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          绘画模式
        </label>
        <button
          onClick={toggleDrawingMode}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
            drawSettings.isDrawingMode
              ? 'bg-blue-100 text-blue-700 border-blue-200'
              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <Brush className="w-4 h-4" />
          <span>{drawSettings.isDrawingMode ? '退出绘画' : '开始绘画'}</span>
        </button>
      </div>

      {/* 笔刷大小 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          笔刷大小: {drawSettings.brushSize}px
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="1"
            max="50"
            value={drawSettings.brushSize}
            onChange={(e) => handleBrushSizeChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="grid grid-cols-5 gap-1">
            {brushSizes.map((size) => (
              <button
                key={size}
                onClick={() => handleBrushSizeChange(size)}
                className={`p-2 text-xs rounded border transition-colors ${
                  drawSettings.brushSize === size
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {size}px
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 笔刷颜色 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          笔刷颜色
        </label>
        <div className="space-y-3">
          {/* 颜色选择器 */}
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-gray-500" />
            <input
              type="color"
              value={drawSettings.brushColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <span className="text-sm text-gray-600">{drawSettings.brushColor}</span>
          </div>
          
          {/* 预设颜色 */}
          <div className="grid grid-cols-5 gap-1">
            {predefinedColors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`w-8 h-8 rounded border-2 transition-all ${
                  drawSettings.brushColor === color
                    ? 'border-blue-500 scale-110'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 清除绘画 */}
      <div>
        <button
          onClick={clearDrawing}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
        >
          <Eraser className="w-4 h-4" />
          <span>清除所有绘画</span>
        </button>
      </div>



      {/* 绘画提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-800 mb-1">绘画提示</h4>
        <ul className="text-xs text-blue-600 space-y-1">
          <li>• 点击"开始绘画"进入绘画模式</li>
          <li>• 在画布上拖拽鼠标进行绘画</li>
          <li>• 可以随时调整笔刷大小和颜色</li>
          <li>• 点击"清除所有绘画"删除所有绘画内容</li>
        </ul>
      </div>
    </div>
  );
};

export default DrawPanel;