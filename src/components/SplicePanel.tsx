import React from 'react';
import { useEditStore } from '../stores';
import { 
  ArrowRight, 
  ArrowDown
} from 'lucide-react';

const SplicePanel: React.FC = () => {
  const { 
    imageElements, 
    spliceSettings, 
    updateSpliceSettings 
  } = useEditStore();

  // 处理拼接方向变化
  const handleDirectionChange = (direction: 'horizontal' | 'vertical') => {
    updateSpliceSettings({ direction });
  };

  // 处理间距变化
  const handleSpacingChange = (spacing: number) => {
    updateSpliceSettings({ spacing });
  };

  const canSplice = imageElements.length >= 2;

  return (
    <div className="space-y-6">
      {/* 选择状态提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          {imageElements.length === 0 && '请先添加图片'}
          {imageElements.length === 1 && `已添加 1 张图片，需要添加多张图片才能拼接`}
          {imageElements.length >= 2 && `已添加 ${imageElements.length} 张图片，可以进行拼接`}
        </p>
      </div>

      {/* 拼接方向 - 只在多张图片时显示 */}
      {canSplice && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            拼接方向
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDirectionChange('horizontal')}
              className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all ${
                spliceSettings.direction === 'horizontal'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
              <span className="text-sm">横向</span>
            </button>
            <button
              onClick={() => handleDirectionChange('vertical')}
              className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all ${
                spliceSettings.direction === 'vertical'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <ArrowDown className="w-4 h-4" />
              <span className="text-sm">纵向</span>
            </button>
          </div>
        </div>
      )}

      {/* 间距调整 */}
      {canSplice && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            图片间距 (px)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={spliceSettings.spacing}
            onChange={(e) => handleSpacingChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0"
          />
        </div>
      )}

      {/* 操作提示 */}
      {!canSplice && imageElements.length === 1 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            💡 提示：选择多张图片进行拼接，或使用"画布"工具设置单张图片的样式。
          </p>
        </div>
      )}

      {!canSplice && imageElements.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            💡 提示：在左侧图片列表中选择图片，然后设置拼接参数。
          </p>
        </div>
      )}

      {canSplice && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">
            ✅ 拼接设置完成！可以切换到"画布"工具调整样式，或切换到"导出"工具保存图片。
          </p>
        </div>
      )}
    </div>
  );
};

export default SplicePanel;