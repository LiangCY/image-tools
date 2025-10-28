import React, { useState, useRef, useCallback } from 'react';
import { useEditStore, useProcessingStore, useHistoryStore } from '../stores';
import { ImageExporter } from '../utils/imageProcessor';
import { ExportSettings } from '../types';
import { 
  Download, 
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Canvas } from 'fabric';

interface ExportPanelProps {
  fabricCanvasRef: React.RefObject<Canvas | null>;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ fabricCanvasRef }) => {
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
    canvasSettings
  } = useEditStore();
  
  const { startProcessing, updateProgress, finishProcessing } = useProcessingStore();
  const { addRecord } = useHistoryStore();

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  // 获取画布预览信息
  const getCanvasPreviewInfo = useCallback(() => {
    if (!fabricCanvasRef.current) return null;
    
    const canvas = fabricCanvasRef.current;
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    
    // 估算文件大小
    const pixels = width * height;
    let estimatedBytes: number;
    
    switch (exportSettings.format) {
      case 'jpeg':
        estimatedBytes = pixels * 3 * (exportSettings.quality / 100);
        break;
      case 'png':
        estimatedBytes = pixels * 4;
        break;
      case 'webp':
        estimatedBytes = pixels * 3 * (exportSettings.quality / 100) * 0.8;
        break;
      default:
        estimatedBytes = pixels * 3;
    }
    
    return {
      width,
      height,
      estimatedSize: formatFileSize(estimatedBytes)
    };
  }, [fabricCanvasRef, exportSettings.format, exportSettings.quality, formatFileSize]);

  // 计算当前画布的预览信息
  React.useEffect(() => {
    const info = getCanvasPreviewInfo();
    setPreviewInfo(info);
  }, [exportSettings, canvasSettings, getCanvasPreviewInfo]);

  const handleFormatChange = (format: ExportSettings['format']) => {
    setExportSettings(prev => ({ ...prev, format }));
  };

  const handleQualityChange = (quality: number) => {
    setExportSettings(prev => ({ ...prev, quality }));
  };



  const handleMetadataToggle = () => {
    setExportSettings(prev => ({ ...prev, includeMetadata: !prev.includeMetadata }));
  };

  const handleExport = async () => {
    if (!fabricCanvasRef.current) {
      toast.error('画布未初始化');
      return;
    }

    const fabricCanvas = fabricCanvasRef.current;
    
    setIsExporting(true);
    startProcessing('正在导出画布...');

    try {
      updateProgress(30, '生成画布图片...');

      // 直接从 Fabric.js 画布导出
      const dataURL = fabricCanvas.toDataURL({
        format: exportSettings.format,
        quality: exportSettings.quality / 100,
        multiplier: 1 // 使用原始尺寸
      });

      updateProgress(70, '准备下载文件...');

      // 将 dataURL 转换为 blob
      const response = await fetch(dataURL);
      const blob = await response.blob();

      // 生成文件名
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `canvas-export-${timestamp}.${exportSettings.format}`;

      // 下载文件
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      updateProgress(100, '导出完成！');

      // 生成缩略图并添加到历史记录
      const thumbnailCanvas = document.createElement('canvas');
      thumbnailCanvas.width = 200;
      thumbnailCanvas.height = 150;
      const thumbnailCtx = thumbnailCanvas.getContext('2d')!;
      
      // 从 dataURL 创建图片来生成缩略图
      const img = new Image();
      img.onload = () => {
        thumbnailCtx.drawImage(img, 0, 0, 200, 150);
        const thumbnail = thumbnailCanvas.toDataURL('image/jpeg', 0.7);
        
        addRecord({
          thumbnail,
          operation: `导出画布 (${exportSettings.format.toUpperCase()})`,
          images: [] // 画布导出不需要原始图片信息
        });
      };
      img.src = dataURL;

      toast.success('画布导出成功！');
      finishProcessing();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('导出失败，请重试');
      finishProcessing();
    } finally {
      setIsExporting(false);
    }
  };

  const canExport = fabricCanvasRef.current !== null;

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
              ? '准备导出画布内容'
              : '画布未准备就绪'
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
            {isExporting ? '导出中...' : '导出画布'}
          </span>
        </button>
        
        {canExport && (
          <p className="text-xs text-gray-500 text-center mt-2">
            点击导出后画布将自动下载到您的设备
          </p>
        )}
      </div>
    </div>
  );
};

export default ExportPanel;