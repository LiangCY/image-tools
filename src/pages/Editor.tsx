import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditStore, useProcessingStore } from '../stores';
import { useFileUpload } from '../hooks/useFileUpload';
import { ImageProcessor, TextRenderer } from '../utils/imageProcessor';
import SplicePanel from '../components/SplicePanel';
import CanvasPanel from '../components/CanvasPanel';
import ExportPanel from '../components/ExportPanel';
import TextPanel from '../components/TextPanel';

import {
  Images,
  Layers,
  Type,
  Sticker,
  Download,
  Plus,
  X,
  RotateCcw,
  Settings,
  GripVertical
} from 'lucide-react';
import { toast } from 'sonner';

const Editor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { handleDrop, handleDragOver, openFileDialog } = useFileUpload();
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [dragStartScreenPos, setDragStartScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [dragStartTextPos, setDragStartTextPos] = useState<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);

  const {
    images,
    selectedImageIds,
    activeTool,
    spliceSettings,
    compressionSettings,
    textElements,
    iconElements,
    zoom,
    panX,
    panY,
    selectedTextId,
    setActiveTool,
    selectImage,
    removeImage,
    reset,
    setZoom,
    addTextElement,
    selectTextElement,
    updateTextElement,
    reorderImages
  } = useEditStore();

  const { progress } = useProcessingStore();

  // 渲染预览画布
  useEffect(() => {
    const renderPreview = async () => {
      if (!canvasRef.current || images.length === 0) return;

      try {
        const processedCanvas = await ImageProcessor.processImages(
          images,
          selectedImageIds,
          spliceSettings,
          compressionSettings,
          textElements,
          iconElements,
          selectedTextId
        );

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d')!;

        // 设置画布尺寸
        canvas.width = processedCanvas.width;
        canvas.height = processedCanvas.height;

        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制处理后的图片
        ctx.drawImage(processedCanvas, 0, 0);
      } catch (error) {
        console.error('Preview render error:', error);
      }
    };

    renderPreview();
  }, [images, selectedImageIds, spliceSettings, compressionSettings, textElements, iconElements, selectedTextId]);

  // 清理动画帧
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleToolSelect = (tool: typeof activeTool) => {
    setActiveTool(tool);
  };

  const handleImageSelect = (imageId: string, event: React.MouseEvent) => {
    const multiSelect = event.ctrlKey || event.metaKey;
    selectImage(imageId, multiSelect);
  };

  const handleRemoveImage = (imageId: string) => {
    removeImage(imageId);
  };

  const handleZoom = (delta: number) => {
    const newZoom = zoom + delta;
    setZoom(Math.max(0.1, Math.min(5, newZoom)));
  };

  // 获取画布坐标
  const getCanvasCoordinates = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // 计算相对于画布的坐标
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    
    // 简单的坐标转换：将显示坐标转换为画布内容坐标
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: canvasX * scaleX,
      y: canvasY * scaleY
    };
  };

  // 将屏幕坐标差值转换为画布坐标差值
  const screenDeltaToCanvasDelta = (screenDeltaX: number, screenDeltaY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: screenDeltaX * scaleX,
      y: screenDeltaY * scaleY
    };
  };

  // 画布鼠标按下处理
  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'text' || !canvasRef.current) return;

    const { x, y } = getCanvasCoordinates(event);
    
    // 检查是否点击了文字元素
    let clickedTextId: string | null = null;
    for (let i = textElements.length - 1; i >= 0; i--) {
      const textElement = textElements[i];
      if (TextRenderer.isPointInText(textElement, x, y)) {
        clickedTextId = textElement.id;
        break;
      }
    }

    if (clickedTextId) {
      // 选中文字元素
      const clickedText = textElements.find(t => t.id === clickedTextId);
      selectTextElement(clickedTextId);
      setIsDraggingText(true);
      // 记录屏幕坐标和文字初始位置
      setDragStartScreenPos({ x: event.clientX, y: event.clientY });
      if (clickedText) {
        setDragStartTextPos({ x: clickedText.x, y: clickedText.y });
      }
    } else {
      // 取消选中
      selectTextElement(null);
    }
  };

  // 画布鼠标移动处理
  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingText || !selectedTextId || !dragStartScreenPos || !dragStartTextPos || !canvasRef.current) return;

    const now = performance.now();
    
    // 取消之前的动画帧
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // 使用 requestAnimationFrame 来优化性能
    animationFrameRef.current = requestAnimationFrame(() => {
      // 时间节流：限制更新频率到 60fps
      if (now - lastUpdateTime.current < 16) return;
      lastUpdateTime.current = now;
      
      // 计算屏幕坐标的偏移量
      const screenDeltaX = event.clientX - dragStartScreenPos.x;
      const screenDeltaY = event.clientY - dragStartScreenPos.y;
      
      // 将屏幕坐标偏移量转换为画布坐标偏移量
      const { x: canvasDeltaX, y: canvasDeltaY } = screenDeltaToCanvasDelta(screenDeltaX, screenDeltaY);
      
      // 计算新的文字位置
      const newX = dragStartTextPos.x + canvasDeltaX;
      const newY = dragStartTextPos.y + canvasDeltaY;
      
      // 添加边界检查
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const minX = 0;
      const minY = 20;
      const maxX = canvas.width - 50;
      const maxY = canvas.height - 10;
      
      const clampedX = Math.max(minX, Math.min(maxX, newX));
      const clampedY = Math.max(minY, Math.min(maxY, newY));
      
      // 更新文字位置
      updateTextElement(selectedTextId, {
        x: clampedX,
        y: clampedY
      });
    });
  }, [isDraggingText, selectedTextId, dragStartScreenPos, dragStartTextPos, updateTextElement]);

  // 画布鼠标释放处理
  const handleCanvasMouseUp = useCallback(() => {
    // 取消任何待处理的动画帧
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setIsDraggingText(false);
    setDragStartScreenPos(null);
    setDragStartTextPos(null);
  }, []);



  // 拖拽处理函数
  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedImageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');

    // 创建拖拽图像容器
    const dragContainer = document.createElement('div');
    dragContainer.style.width = '80px';
    dragContainer.style.height = '60px';
    dragContainer.style.position = 'absolute';
    dragContainer.style.top = '-1000px';
    dragContainer.style.borderRadius = '6px';
    dragContainer.style.overflow = 'hidden';
    dragContainer.style.border = '2px solid #3b82f6';
    dragContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    dragContainer.style.backgroundColor = 'white';

    // 创建图片元素
    const dragImage = document.createElement('img');
    dragImage.src = images[index].url;
    dragImage.style.width = '100%';
    dragImage.style.height = '100%';
    dragImage.style.objectFit = 'cover';

    // 创建序号标签
    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.top = '2px';
    label.style.left = '2px';
    label.style.width = '16px';
    label.style.height = '16px';
    label.style.backgroundColor = '#3b82f6';
    label.style.color = 'white';
    label.style.fontSize = '10px';
    label.style.fontWeight = 'bold';
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.justifyContent = 'center';
    label.style.borderRadius = '2px';
    label.textContent = (index + 1).toString();

    // 组装拖拽元素
    dragContainer.appendChild(dragImage);
    dragContainer.appendChild(label);
    document.body.appendChild(dragContainer);

    // 设置为拖拽图像
    e.dataTransfer.setDragImage(dragContainer, 40, 30);

    // 延迟移除元素
    setTimeout(() => {
      if (document.body.contains(dragContainer)) {
        document.body.removeChild(dragContainer);
      }
    }, 0);
  };

  const handleImageDragEnd = () => {
    setDraggedImageIndex(null);
    setDragOverIndex(null);
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedImageIndex !== null && draggedImageIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleImageDragLeave = (e: React.DragEvent) => {
    // 只有当鼠标真正离开元素时才清除dragOverIndex
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedImageIndex !== null && draggedImageIndex !== dropIndex) {
      reorderImages(draggedImageIndex, dropIndex);
      toast.success('图片顺序已调整');
    }

    setDraggedImageIndex(null);
    setDragOverIndex(null);
  };

  const tools = [
    { id: 'canvas' as const, icon: Settings, label: '画布' },
    { id: 'splice' as const, icon: Layers, label: '拼接' },
    { id: 'text' as const, icon: Type, label: '文字' },
    { id: 'icon' as const, icon: Sticker, label: '图标' },
    { id: 'export' as const, icon: Download, label: '导出' },
  ];

  return (
    <div className="h-screen flex bg-gray-50">
      {/* 左侧图片管理区 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* 标题和操作区 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-gray-900">图片编辑器</h1>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setZoom(1)}
                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="重置缩放"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={reset}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                清空
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-500 mb-3">
            {images.length} 张图片
          </div>

          <div className="space-y-2">
            <button
              onClick={openFileDialog}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>添加图片</span>
            </button>


          </div>
        </div>

        {/* 图片列表 */}
        <div
          className="flex-1 p-4 overflow-y-auto"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {images.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Images className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>拖拽图片到这里</p>
              <p className="text-sm">或点击上方按钮添加</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 拖拽提示 */}
              {images.length > 1 && (
                <div className="text-xs text-gray-500 text-center py-2 border-b border-gray-200">
                  💡 拖拽图片可以重新排序
                </div>
              )}
              {images.map((image, index) => (
                <React.Fragment key={image.id}>
                  {/* 拖拽插入指示器 */}
                  {dragOverIndex === index && draggedImageIndex !== null && draggedImageIndex !== index && (
                    <div className="h-1 bg-green-500 rounded-full mx-4 animate-pulse" />
                  )}

                  <div
                    draggable
                    onDragStart={(e) => handleImageDragStart(e, index)}
                    onDragEnd={handleImageDragEnd}
                    onDragOver={(e) => handleImageDragOver(e, index)}
                    onDragLeave={handleImageDragLeave}
                    onDrop={(e) => handleImageDrop(e, index)}
                    className={`relative group border-2 rounded-lg overflow-hidden cursor-move transition-all duration-200 ${selectedImageIds.includes(image.id)
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                      } ${draggedImageIndex === index
                        ? 'opacity-50 transform rotate-2 scale-95'
                        : ''
                      }`}
                    onClick={(e) => handleImageSelect(image.id, e)}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-24 object-cover"
                    />

                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />

                    {/* 拖拽手柄和序号 */}
                    <div className="absolute top-2 left-2 flex items-center space-x-1">
                      <div className="p-1 bg-gray-800 bg-opacity-70 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                        {index + 1}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(image.id);
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                      <div className="text-xs truncate">{image.name}</div>
                      <div className="text-xs text-gray-300">
                        {image.width} × {image.height}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 中间画布预览区 */}
      <div className="flex-1 flex flex-col bg-green-50">
        {/* 工具栏 */}
        <div className="bg-white border-b border-gray-200 p-2">
          <div className="flex items-center justify-center space-x-1">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleToolSelect(tool.id)}
                  className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all ${activeTool === tool.id
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{tool.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 画布预览区域 */}
        <div className="flex-1 relative overflow-hidden bg-gray-100">
          {images.length > 0 ? (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
              }}
            >
              <canvas
                ref={canvasRef}
                className={`max-w-full max-h-full border border-gray-300 bg-white shadow-lg ${
                  activeTool === 'text' 
                    ? isDraggingText 
                      ? 'cursor-grabbing' 
                      : 'cursor-pointer'
                    : 'cursor-default'
                }`}
                style={{
                  imageRendering: 'pixelated',
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Images className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">选择图片开始编辑</p>
              </div>
            </div>
          )}



          {/* 缩放控制 */}
          {images.length > 0 && (
            <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-white rounded-lg shadow-lg p-2">
              <button
                onClick={() => handleZoom(-0.1)}
                className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                -
              </button>
              <span className="text-sm font-medium min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => handleZoom(0.1)}
                className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                +
              </button>
            </div>
          )}
        </div>


      </div>

      {/* 右侧设置面板 */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">
            {tools.find(t => t.id === activeTool)?.label || '设置'}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTool === 'splice' && <SplicePanel />}

          {activeTool === 'canvas' && <CanvasPanel />}

          {activeTool === 'text' && <TextPanel />}

          {activeTool === 'icon' && (
            <div className="text-sm text-gray-600">
              图标添加面板将在这里显示
            </div>
          )}

          {activeTool === 'export' && <ExportPanel />}
        </div>
      </div>

      {/* 处理进度提示 */}
      {progress.isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="text-lg font-semibold mb-2">{progress.message}</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <div className="text-sm text-gray-600">{progress.progress}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;