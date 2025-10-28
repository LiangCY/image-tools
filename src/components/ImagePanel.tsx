import React, { useState } from 'react';
import { useEditStore } from '../stores';
import { ImageElement } from '../types';
import { 
  Plus, 
  Trash2, 
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

const ImagePanel: React.FC = () => {
  const { 
    imageElements, 
    selectedElementId,
    selectedElementType,
    addImageElement, 
    updateImageElement, 
    removeImageElement,
    selectElement
  } = useEditStore();

  const [isDragging, setIsDragging] = useState(false);

  const selectedImage = imageElements.find(el => 
    el.id === selectedElementId && selectedElementType === 'image'
  );

  // 处理文件上传
  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      toast.error('请选择图片文件');
      return;
    }

    try {
      for (const file of imageFiles) {
        await addImageElement(file);
      }
      toast.success(`已添加 ${imageFiles.length} 张图片`);
    } catch (error) {
      toast.error('添加图片失败');
    }
  };

  // 文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(event.target.files);
    event.target.value = ''; // 重置input
  };

  // 拖拽处理
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    handleFileUpload(event.dataTransfer.files);
  };

  // 删除图片
  const handleRemoveImage = (id: string) => {
    removeImageElement(id);
    toast.success('图片已删除');
  };

  // 更新图片属性
  const updateImage = (updates: Partial<ImageElement>) => {
    if (selectedElementId && selectedElementType === 'image') {
      updateImageElement(selectedElementId, updates);
    }
  };

  // 打开文件选择器
  const openFileDialog = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => handleFileSelect(e as any);
    input.click();
  };

  return (
    <div className="space-y-6">
      {/* 添加图片区域 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          添加图片
        </label>
        
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            点击或拖拽图片到这里
          </p>
          <p className="text-xs text-gray-500">
            支持 JPG、PNG、WebP 格式
          </p>
        </div>

        <button
          onClick={openFileDialog}
          className="w-full mt-3 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>选择图片</span>
        </button>
      </div>

      {/* 图片列表 */}
      {imageElements.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            图片列表 ({imageElements.length})
          </label>
          <div className="space-y-2">
            {imageElements.map((imageElement) => (
              <div
                key={imageElement.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedElementId === imageElement.id && selectedElementType === 'image'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => selectElement(imageElement.id, 'image')}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={imageElement.imageUrl}
                    alt="图片"
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      图片 {imageElement.id.slice(-4)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.round(imageElement.width)} × {Math.round(imageElement.height)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateImageElement(imageElement.id, { 
                          opacity: imageElement.opacity === 1 ? 0.5 : 1 
                        });
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title={imageElement.opacity === 1 ? '隐藏' : '显示'}
                    >
                      {imageElement.opacity === 1 ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(imageElement.id);
                      }}
                      className="p-1 text-red-400 hover:text-red-600 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 图片编辑面板 */}
      {selectedImage && (
        <div className="border-t pt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">编辑图片</h4>
          
          <div className="space-y-4">
            {/* 位置 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  X 位置
                </label>
                <input
                  type="number"
                  value={Math.round(selectedImage.x)}
                  onChange={(e) => updateImage({ x: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Y 位置
                </label>
                <input
                  type="number"
                  value={Math.round(selectedImage.y)}
                  onChange={(e) => updateImage({ y: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 尺寸 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  宽度
                </label>
                <input
                  type="number"
                  value={Math.round(selectedImage.width * selectedImage.scaleX)}
                  onChange={(e) => {
                    const newWidth = Number(e.target.value);
                    const scaleX = newWidth / selectedImage.width;
                    updateImage({ scaleX });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  高度
                </label>
                <input
                  type="number"
                  value={Math.round(selectedImage.height * selectedImage.scaleY)}
                  onChange={(e) => {
                    const newHeight = Number(e.target.value);
                    const scaleY = newHeight / selectedImage.height;
                    updateImage({ scaleY });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 旋转角度 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                旋转角度
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={selectedImage.rotation}
                  onChange={(e) => updateImage({ rotation: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs text-gray-600 w-8">
                  {selectedImage.rotation}°
                </span>
                <button
                  onClick={() => updateImage({ rotation: 0 })}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border transition-colors"
                  title="重置为0度"
                  disabled={selectedImage.rotation === 0}
                >
                  重置
                </button>
              </div>
            </div>

            {/* 透明度 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                透明度
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedImage.opacity}
                  onChange={(e) => updateImage({ opacity: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs text-gray-600 w-8">
                  {Math.round(selectedImage.opacity * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 操作提示 */}
      {imageElements.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 font-medium mb-2">
            📷 如何添加图片：
          </p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 点击上方"选择图片"按钮选择文件</li>
            <li>• 或者直接拖拽图片到上方区域</li>
            <li>• 支持同时添加多张图片</li>
          </ul>
        </div>
      )}

      {imageElements.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">
            ✅ 图片已添加到画布！点击图片列表中的项目可以编辑属性。
          </p>
          <p className="text-sm text-green-800 mt-1">
            🖱️ 在画布上可以直接拖拽和调整图片！
          </p>
        </div>
      )}
    </div>
  );
};

export default ImagePanel;