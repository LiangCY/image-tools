import React, { useState } from 'react';
import { useEditStore } from '../stores';
import { generatePresets } from '../utils/canvasPresets';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  FileText,
  Square,
  Monitor,
  Smartphone,
  RotateCw,
  Palette,
  Link,
  Unlink,
  Images
} from 'lucide-react';

const CanvasPanel: React.FC = () => {
  const { 
    images, 
    selectedImageIds, 
    spliceSettings, 
    updateSpliceSettings 
  } = useEditStore();

  const [paddingLinked, setPaddingLinked] = useState(true);

  // 处理水平对齐方式变化
  const handleHorizontalAlignmentChange = (horizontalAlignment: typeof spliceSettings.horizontalAlignment) => {
    updateSpliceSettings({ horizontalAlignment });
  };

  // 处理垂直对齐方式变化
  const handleVerticalAlignmentChange = (verticalAlignment: typeof spliceSettings.verticalAlignment) => {
    updateSpliceSettings({ verticalAlignment });
  };

  // 获取水平对齐方式的图标
  const getHorizontalAlignmentIcon = (alignment: typeof spliceSettings.horizontalAlignment) => {
    switch (alignment) {
      case 'start': return AlignLeft;
      case 'center': return AlignCenter;
      case 'end': return AlignRight;
      default: return AlignCenter;
    }
  };

  // 获取垂直对齐方式的图标
  const getVerticalAlignmentIcon = (alignment: typeof spliceSettings.verticalAlignment) => {
    switch (alignment) {
      case 'start': return AlignVerticalJustifyStart;
      case 'center': return AlignVerticalJustifyCenter;
      case 'end': return AlignVerticalJustifyEnd;
      default: return AlignVerticalJustifyCenter;
    }
  };

  const handleBackgroundColorChange = (backgroundColor: string) => {
    updateSpliceSettings({ backgroundColor });
  };

  const handlePaddingChange = (
    side: 'top' | 'right' | 'bottom' | 'left',
    value: number
  ) => {
    if (paddingLinked) {
      updateSpliceSettings({
        paddingTop: value,
        paddingRight: value,
        paddingBottom: value,
        paddingLeft: value,
      });
    } else {
      updateSpliceSettings({
        [`padding${side.charAt(0).toUpperCase() + side.slice(1)}`]: value,
      });
    }
  };

  const handlePaddingLinkToggle = () => {
    setPaddingLinked(!paddingLinked);
    if (!paddingLinked) {
      // 切换到链接模式时，使用左边距的值作为统一值
      const uniformValue = spliceSettings.paddingLeft;
      updateSpliceSettings({
        paddingTop: uniformValue,
        paddingRight: uniformValue,
        paddingBottom: uniformValue,
        paddingLeft: uniformValue,
      });
    }
  };

  const handleCanvasSizeModeChange = (canvasSizeMode: typeof spliceSettings.canvasSizeMode) => {
    updateSpliceSettings({ canvasSizeMode });
  };

  const handleCanvasPresetChange = (canvasPreset: string) => {
    updateSpliceSettings({ canvasPreset });
  };

  const handleOrientationToggle = () => {
    const newOrientation = spliceSettings.canvasOrientation === 'landscape' ? 'portrait' : 'landscape';
    
    // 如果当前有选中的预设，需要更新预设名称以匹配新的方向
    if (spliceSettings.canvasPreset) {
      const currentPresetBaseName = spliceSettings.canvasPreset.split(' ')[0];
      
      // 查找比例预设
      const ratio = baseRatios.find(r => r.name === currentPresetBaseName);
      if (ratio) {
        const newPresetName = `${ratio.name} (${newOrientation === 'landscape' ? '横向' : '纵向'})`;
        updateSpliceSettings({ 
          canvasOrientation: newOrientation,
          canvasPreset: newPresetName
        });
        return;
      }
      
      // 查找纸张预设 - 需要从 basePapers 导入
      const basePapers = [
        { name: 'A4', label: 'A4 (210×297mm)' },
        { name: '16K', label: '16K (195×270mm)' },
        { name: 'Letter', label: 'Letter (8.5×11in)' },
        { name: 'Legal', label: 'Legal (8.5×14in)' }
      ];
      const paper = basePapers.find(p => p.label.startsWith(currentPresetBaseName) || p.name === currentPresetBaseName);
      if (paper) {
        const newPresetName = `${paper.label} (${newOrientation === 'portrait' ? '纵向' : '横向'})`;
        updateSpliceSettings({ 
          canvasOrientation: newOrientation,
          canvasPreset: newPresetName
        });
        return;
      }
    }
    
    // 如果没有找到匹配的预设，只更新方向
    updateSpliceSettings({ canvasOrientation: newOrientation });
  };

  const handleCustomSizeChange = (width?: number, height?: number) => {
    updateSpliceSettings({
      canvasSizeMode: 'custom',
      customWidth: width,
      customHeight: height
    });
  };

  const selectedImages = images.filter(img => selectedImageIds.includes(img.id));
  const hasSelectedImages = selectedImages.length >= 1;

  // 生成预设选项
  const baseRatios = [
    { name: '1:1', ratio: 1 },
    { name: '4:3', ratio: 4/3 },
    { name: '16:9', ratio: 16/9 },
    { name: '3:2', ratio: 3/2 },
    { name: '21:9', ratio: 21/9 }
  ];

  return (
    <div className="space-y-6">
      {/* 选择状态提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          {selectedImages.length === 0 && '请先选择图片'}
          {selectedImages.length === 1 && `已选择 1 张图片，可以设置画布样式`}
          {selectedImages.length >= 2 && `已选择 ${selectedImages.length} 张图片，可以设置画布样式`}
        </p>
      </div>

      {/* 对齐方式设置 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          对齐方式
        </label>
        
        {/* 水平对齐 */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-2">水平对齐</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'start' as const, label: '左对齐' },
              { value: 'center' as const, label: '居中' },
              { value: 'end' as const, label: '右对齐' }
            ].map(({ value, label }) => {
              const IconComponent = getHorizontalAlignmentIcon(value);
              return (
                <button
                  key={value}
                  onClick={() => handleHorizontalAlignmentChange(value)}
                  className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg border-2 transition-all ${
                    spliceSettings.horizontalAlignment === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="text-xs">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 垂直对齐 */}
        <div>
          <label className="block text-xs text-gray-500 mb-2">垂直对齐</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'start' as const, label: '顶部' },
              { value: 'center' as const, label: '居中' },
              { value: 'end' as const, label: '底部' }
            ].map(({ value, label }) => {
              const IconComponent = getVerticalAlignmentIcon(value);
              return (
                <button
                  key={value}
                  onClick={() => handleVerticalAlignmentChange(value)}
                  className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg border-2 transition-all ${
                    spliceSettings.verticalAlignment === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="text-xs">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 画布尺寸设置 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          画布尺寸
        </label>
        
        {/* 尺寸模式选择 */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => handleCanvasSizeModeChange('auto')}
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg border-2 transition-all ${
              spliceSettings.canvasSizeMode === 'auto'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <Images className="w-4 h-4" />
            <span className="text-xs">自适应</span>
          </button>
          <button
            onClick={() => handleCanvasSizeModeChange('preset')}
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg border-2 transition-all ${
              spliceSettings.canvasSizeMode === 'preset'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-xs">比例预设</span>
          </button>
          <button
            onClick={() => handleCanvasSizeModeChange('custom')}
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg border-2 transition-all ${
              spliceSettings.canvasSizeMode === 'custom'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <Square className="w-4 h-4" />
            <span className="text-xs">自定义</span>
          </button>
        </div>

        {/* 预设尺寸选择 */}
        {spliceSettings.canvasSizeMode === 'preset' && (
          <div className="space-y-3">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <select
                  value={spliceSettings.canvasPreset?.split(' ')[0] || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      // 查找比例
                      const ratio = baseRatios.find(r => r.name === e.target.value);
                      if (ratio) {
                        const orientation = spliceSettings.canvasOrientation;
                        const presetName = `${ratio.name} (${orientation === 'landscape' ? '横向' : '纵向'})`;
                        handleCanvasPresetChange(presetName);
                        return;
                      }
                      
                      // 查找纸张
                      const presets = generatePresets(spliceSettings.canvasOrientation);
                      const preset = presets.find(p => p.name.startsWith(e.target.value));
                      if (preset) {
                        handleCanvasPresetChange(preset.name);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">选择预设</option>
                  <optgroup label="常用比例">
                    {baseRatios.map((ratio) => (
                      <option key={ratio.name} value={ratio.name}>
                        {ratio.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="纸张尺寸">
                    <option value="A4">A4</option>
                    <option value="16K">16K</option>
                    <option value="Letter">Letter</option>
                    <option value="Legal">Legal</option>
                  </optgroup>
                </select>
              </div>
              <button
                onClick={handleOrientationToggle}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1"
                title={`切换为${spliceSettings.canvasOrientation === 'landscape' ? '纵向' : '横向'}`}
              >
                {spliceSettings.canvasOrientation === 'landscape' ? (
                  <Monitor className="w-4 h-4" />
                ) : (
                  <Smartphone className="w-4 h-4" />
                )}
                <RotateCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* 自定义尺寸输入 */}
        {spliceSettings.canvasSizeMode === 'custom' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">宽度 (px)</label>
                <input
                  type="number"
                  min="100"
                  max="10000"
                  value={spliceSettings.customWidth || ''}
                  onChange={(e) => handleCustomSizeChange(
                    e.target.value ? Number(e.target.value) : undefined,
                    spliceSettings.customHeight
                  )}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1200"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">高度 (px)</label>
                <input
                  type="number"
                  min="100"
                  max="10000"
                  value={spliceSettings.customHeight || ''}
                  onChange={(e) => handleCustomSizeChange(
                    spliceSettings.customWidth,
                    e.target.value ? Number(e.target.value) : undefined
                  )}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="800"
                />
              </div>
            </div>
            
            {/* 常用比例快捷按钮 */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">快速比例</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: '1:1', width: 1000, height: 1000 },
                  { name: '4:3', width: 1200, height: 900 },
                  { name: '16:9', width: 1600, height: 900 },
                  { name: '3:2', width: 1200, height: 800 }
                ].map((ratio) => (
                  <button
                    key={ratio.name}
                    onClick={() => handleCustomSizeChange(ratio.width, ratio.height)}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    {ratio.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 当前尺寸显示 */}
        {spliceSettings.canvasSizeMode !== 'auto' && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600">
              {spliceSettings.canvasSizeMode === 'preset' && spliceSettings.canvasPreset && (
                <>
                  <div className="font-medium">{spliceSettings.canvasPreset}</div>
                  {(() => {
                    const presets = generatePresets(spliceSettings.canvasOrientation);
                    const preset = presets.find(p => p.name === spliceSettings.canvasPreset);
                    return preset ? (
                      <div className="text-gray-500">
                        {preset.width} × {preset.height} px
                      </div>
                    ) : null;
                  })()}
                </>
              )}
              {spliceSettings.canvasSizeMode === 'custom' && spliceSettings.customWidth && spliceSettings.customHeight && (
                <div>
                  自定义尺寸: {spliceSettings.customWidth} × {spliceSettings.customHeight} px
                </div>
              )}
            </div>
          </div>
        )}
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
              value={spliceSettings.backgroundColor}
              onChange={(e) => handleBackgroundColorChange(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
          </div>
          <input
            type="text"
            value={spliceSettings.backgroundColor}
            onChange={(e) => handleBackgroundColorChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="#ffffff"
          />
        </div>
        
        {/* 预设颜色 */}
        <div className="flex space-x-2 mt-2">
          {['#ffffff', '#f3f4f6', '#000000', '#3b82f6', '#10b981', '#f59e0b'].map((color) => (
            <button
              key={color}
              onClick={() => handleBackgroundColorChange(color)}
              className={`w-6 h-6 rounded border-2 transition-all ${
                spliceSettings.backgroundColor === color
                  ? 'border-blue-500 scale-110'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* 内边距设置 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">
            内边距
          </label>
          <button
            onClick={handlePaddingLinkToggle}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
              paddingLinked
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {paddingLinked ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
            <span>{paddingLinked ? '链接' : '独立'}</span>
          </button>
        </div>

        {paddingLinked ? (
          /* 统一内边距控制 */
          <div>
            <label className="block text-xs text-gray-500 mb-2">
              统一内边距 (px)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={spliceSettings.paddingLeft}
              onChange={(e) => handlePaddingChange('left', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
        ) : (
          /* 独立内边距控制 */
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">上边距</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={spliceSettings.paddingTop}
                  onChange={(e) => handlePaddingChange('top', Number(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">右边距</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={spliceSettings.paddingRight}
                  onChange={(e) => handlePaddingChange('right', Number(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">下边距</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={spliceSettings.paddingBottom}
                  onChange={(e) => handlePaddingChange('bottom', Number(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">左边距</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={spliceSettings.paddingLeft}
                  onChange={(e) => handlePaddingChange('left', Number(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 操作提示 */}
      {!hasSelectedImages && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            💡 提示：在左侧图片列表中选择图片，然后调整画布设置，预览区域会实时显示效果。
          </p>
        </div>
      )}

      {hasSelectedImages && selectedImages.length === 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            🎨 单张图片模式：可以设置画布比例、背景色、边距等样式效果。
          </p>
        </div>
      )}

      {hasSelectedImages && selectedImages.length >= 2 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">
            ✅ 多张图片模式：可以设置画布样式，配合拼接工具使用效果更佳。
          </p>
        </div>
      )}
    </div>
  );
};

export default CanvasPanel;