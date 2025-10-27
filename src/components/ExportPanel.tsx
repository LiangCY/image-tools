import React, { useState } from 'react';
import { useEditStore, useProcessingStore, useHistoryStore } from '../stores';
import { ImageProcessor, ImageExporter } from '../utils/imageProcessor';
import { ExportSettings } from '../types';
import { 
  Download, 
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const ExportPanel: React.FC = () => {
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'png',
    quality: 90,
    includeMetadata: false,
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [previewInfo, setPreviewInfo] = useState<{
    width: number;
    height: number;
    estimatedSize: string;
  } | null>(null);

  const { 
    images, 
    selectedImageIds, 
    spliceSettings, 
    compressionSettings, 
    textElements, 
    iconElements 
  } = useEditStore();
  
  const { startProcessing, updateProgress, finishProcessing } = useProcessingStore();
  const { addRecord } = useHistoryStore();

  // 计算当前处理的图片信息
  React.useEffect(() => {
    const calculatePreviewInfo = async () => {
      if (images.length === 0) {
        setPreviewInfo(null);
        return;
      }

      try {
        const processedCanvas = await ImageProcessor.processImages(
          images,
          selectedImageIds,
          spliceSettings,
          compressionSettings,
          textElements,
          iconElements
        );

        // 应用导出设置中的尺寸调整
        let finalWidth = processedCanvas.width;
        let finalHeight = processedCanvas.height;

        if (exportSettings.width || exportSettings.height) {
          const aspectRatio = processedCanvas.width / processedCanvas.height;
          
          if (exportSettings.width && exportSettings.height) {
            finalWidth = exportSettings.width;
            finalHeight = exportSettings.height;
          } else if (exportSettings.width) {
            finalWidth = exportSettings.width;
            finalHeight = exportSettings.width / aspectRatio;
          } else if (exportSettings.height) {
            finalHeight = exportSettings.height;
            finalWidth = exportSettings.height * aspectRatio;
          }
        }

        // 估算文件大小
        const pixels = finalWidth * finalHeight;
        let estimatedBytes: number;
        
        switch (exportSettings.format) {
          case 'jpeg':
            estimatedBytes = pixels * 3 * (exportSettings.quality / 100);
            break;
          case 'png':
            estimatedBytes = pixels * 4;
            break;
          case 'webp':
            estimatedBytes = pixels * 2.5 * (exportSettings.quality / 100);
            break;
          default:
            estimatedBytes = pixels * 3;
        }

        const estimatedSize = formatFileSize(estimatedBytes);

        setPreviewInfo({
          width: Math.round(finalWidth),
          height: Math.round(finalHeight),
          estimatedSize
        });
      } catch (error) {
        console.error('Failed to calculate preview info:', error);
        setPreviewInfo(null);
      }
    };

    calculatePreviewInfo();
  }, [images, selectedImageIds, spliceSettings, compressionSettings, textElements, iconElements, exportSettings]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFormatChange = (format: ExportSettings['format']) => {
    setExportSettings(prev => ({ ...prev, format }));
  };

  const handleQualityChange = (quality: number) => {
    setExportSettings(prev => ({ ...prev, quality }));
  };

  const handleSizeChange = (width?: number, height?: number) => {
    setExportSettings(prev => ({ ...prev, width, height }));
  };

  const handleMetadataToggle = () => {
    setExportSettings(prev => ({ ...prev, includeMetadata: !prev.includeMetadata }));
  };

  const handleExport = async () => {
    if (images.length === 0) {
      toast.error('没有图片可以导出');
      return;
    }

    setIsExporting(true);
    startProcessing('正在处理图片...');

    try {
      updateProgress(20, '生成最终图片...');

      // 生成最终的处理图片
      const processedCanvas = await ImageProcessor.processImages(
        images,
        selectedImageIds,
        spliceSettings,
        compressionSettings,
        textElements,
        iconElements
      );

      updateProgress(50, '应用导出设置...');

      // 如果需要调整尺寸，创建新的画布
      let finalCanvas = processedCanvas;
      if (exportSettings.width || exportSettings.height) {
        finalCanvas = document.createElement('canvas');
        const aspectRatio = processedCanvas.width / processedCanvas.height;
        
        if (exportSettings.width && exportSettings.height) {
          finalCanvas.width = exportSettings.width;
          finalCanvas.height = exportSettings.height;
        } else if (exportSettings.width) {
          finalCanvas.width = exportSettings.width;
          finalCanvas.height = exportSettings.width / aspectRatio;
        } else if (exportSettings.height) {
          finalCanvas.height = exportSettings.height;
          finalCanvas.width = exportSettings.height * aspectRatio;
        }

        const ctx = finalCanvas.getContext('2d')!;
        ctx.drawImage(processedCanvas, 0, 0, finalCanvas.width, finalCanvas.height);
      }

      updateProgress(80, '生成下载文件...');

      // 生成文件名
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const selectedCount = selectedImageIds.length || images.length;
      const filename = `image-tool-${selectedCount}pics-${timestamp}`;

      // 导出图片
      await ImageExporter.downloadImage(finalCanvas, filename, exportSettings);

      updateProgress(100, '导出完成！');

      // 生成缩略图并添加到历史记录
      const thumbnailCanvas = document.createElement('canvas');
      thumbnailCanvas.width = 200;
      thumbnailCanvas.height = 150;
      const thumbnailCtx = thumbnailCanvas.getContext('2d')!;
      thumbnailCtx.drawImage(finalCanvas, 0, 0, 200, 150);
      const thumbnail = thumbnailCanvas.toDataURL('image/jpeg', 0.7);

      addRecord({
        thumbnail,
        operation: `导出${selectedCount}张图片 (${exportSettings.format.toUpperCase()})`,
        images: selectedImageIds.length > 0 
          ? images.filter(img => selectedImageIds.includes(img.id))
          : images
      });

      toast.success('图片导出成功！');
      finishProcessing();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('导出失败，请重试');
      finishProcessing();
    } finally {
      setIsExporting(false);
    }
  };

  const selectedImages = selectedImageIds.length > 0 
    ? images.filter(img => selectedImageIds.includes(img.id))
    : images;

  const canExport = selectedImages.length > 0;

  return (
    <div className="space-y-6">
      {/* 导出状态提示 */}
      <div className={`border rounded-lg p-3 ${
        canExport 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center space-x-2">
          {canExport ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          )}
          <p className={`text-sm ${
            canExport ? 'text-green-800' : 'text-yellow-800'
          }`}>
            {canExport 
              ? `准备导出 ${selectedImages.length} 张图片`
              : '请先添加图片或选择要导出的图片'
            }
          </p>
        </div>
      </div>

      {/* 预览信息 */}
      {previewInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Info className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">导出预览</h4>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">尺寸:</span>
              <span className="ml-2 font-medium">{previewInfo.width} × {previewInfo.height}</span>
            </div>
            <div>
              <span className="text-blue-700">预估大小:</span>
              <span className="ml-2 font-medium">{previewInfo.estimatedSize}</span>
            </div>
          </div>
        </div>
      )}

      {/* 格式选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          导出格式
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { format: 'png' as const, label: 'PNG', desc: '无损压缩' },
            { format: 'jpeg' as const, label: 'JPEG', desc: '小文件' },
            { format: 'webp' as const, label: 'WebP', desc: '现代格式' }
          ].map(({ format, label, desc }) => (
            <button
              key={format}
              onClick={() => handleFormatChange(format)}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                exportSettings.format === format
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <div className="font-medium">{label}</div>
              <div className="text-xs mt-1">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 质量设置 */}
      {(exportSettings.format === 'jpeg' || exportSettings.format === 'webp') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            图片质量: {exportSettings.quality}%
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={exportSettings.quality}
            onChange={(e) => handleQualityChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>低质量 (小文件)</span>
            <span>高质量 (大文件)</span>
          </div>
        </div>
      )}

      {/* 尺寸设置 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          输出尺寸 (可选)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">宽度 (px)</label>
            <input
              type="number"
              placeholder="自动"
              value={exportSettings.width || ''}
              onChange={(e) => handleSizeChange(
                e.target.value ? Number(e.target.value) : undefined,
                exportSettings.height
              )}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">高度 (px)</label>
            <input
              type="number"
              placeholder="自动"
              value={exportSettings.height || ''}
              onChange={(e) => handleSizeChange(
                exportSettings.width,
                e.target.value ? Number(e.target.value) : undefined
              )}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          留空则使用原始尺寸。只设置一个值时会保持宽高比。
        </p>
      </div>

      {/* 元数据设置 */}
      <div>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={exportSettings.includeMetadata}
            onChange={handleMetadataToggle}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">保留元数据</span>
            <p className="text-xs text-gray-500">包含创建时间、软件信息等</p>
          </div>
        </label>
      </div>

      {/* 预设选项 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          快速设置
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setExportSettings({
              format: 'png',
              quality: 100,
              includeMetadata: false
            })}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            🎨 设计用途
          </button>
          <button
            onClick={() => setExportSettings({
              format: 'jpeg',
              quality: 80,
              includeMetadata: false
            })}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            📱 网络分享
          </button>
          <button
            onClick={() => setExportSettings({
              format: 'jpeg',
              quality: 95,
              width: 1920,
              includeMetadata: true
            })}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            🖼️ 高质量打印
          </button>
          <button
            onClick={() => setExportSettings({
              format: 'webp',
              quality: 85,
              includeMetadata: false
            })}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            🚀 现代浏览器
          </button>
        </div>
      </div>

      {/* 导出按钮 */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleExport}
          disabled={!canExport || isExporting}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
            canExport && !isExporting
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Download className="w-5 h-5" />
          <span>
            {isExporting ? '导出中...' : '导出图片'}
          </span>
        </button>
        
        {canExport && (
          <p className="text-xs text-gray-500 text-center mt-2">
            点击导出后图片将自动下载到您的设备
          </p>
        )}
      </div>
    </div>
  );
};

export default ExportPanel;