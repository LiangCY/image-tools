import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas, Text, Image, Point, Rect } from 'fabric';
import { useEditStore } from '../stores';
import { TextElement, ImageElement } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Maximize } from 'lucide-react';

interface FabricCanvasProps {
  // 不再需要外部传入尺寸，从 store 获取
  onCanvasReady?: (canvas: Canvas) => void;
}

const FabricCanvas: React.FC<FabricCanvasProps> = ({ onCanvasReady }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [displayZoom, setDisplayZoom] = useState(1);

  // 强制重绘所有对象的函数
  const forceRenderAll = useCallback(() => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;

      // 重新计算所有对象的坐标和标记为需要重绘
      canvas.getObjects().forEach(obj => {
        obj.setCoords();
        obj.dirty = true;
      });

      // 多次渲染确保正确显示
      canvas.renderAll();

      setTimeout(() => {
        if (canvas) {
          canvas.renderAll();
        }
      }, 10);

      setTimeout(() => {
        if (canvas) {
          canvas.renderAll();
        }
      }, 100);
    }
  }, []);

  const {
    canvasSettings,
    imageElements,
    textElements,
    selectedElementId,
    selectedElementType,
    updateImageElement,
    updateTextElement,
    selectElement
  } = useEditStore();

  // 缩放控制函数 - 使用CSS transform实现画布本身的视觉缩放
  const handleZoomIn = useCallback(() => {
    if (!canvasContainerRef.current) return;
    const newZoom = Math.min(5, zoom * 1.2);

    console.log('Zoom In:', zoom, '->', newZoom);

    // 使用CSS transform缩放画布容器
    const container = canvasContainerRef.current;
    container.style.transform = `scale(${newZoom})`;
    container.style.transformOrigin = 'center center';

    setZoom(newZoom);
    setDisplayZoom(newZoom);
  }, [zoom]);

  const handleZoomOut = useCallback(() => {
    if (!canvasContainerRef.current) return;
    const newZoom = Math.max(0.1, zoom / 1.2);

    console.log('Zoom Out:', zoom, '->', newZoom);

    // 使用CSS transform缩放画布容器
    const container = canvasContainerRef.current;
    container.style.transform = `scale(${newZoom})`;
    container.style.transformOrigin = 'center center';

    setZoom(newZoom);
    setDisplayZoom(newZoom);
  }, [zoom]);

  const handleZoomReset = useCallback(() => {
    if (!canvasContainerRef.current) return;

    console.log('Zoom Reset');

    // 重置CSS transform
    const container = canvasContainerRef.current;
    container.style.transform = 'scale(1)';
    container.style.transformOrigin = 'center center';

    setZoom(1);
    setDisplayZoom(1);
  }, []);

  const handleZoomFit = useCallback(() => {
    if (!canvasContainerRef.current || !containerRef.current) return;
    const container = containerRef.current;

    const containerWidth = container.clientWidth - 100;
    const containerHeight = container.clientHeight - 100;
    const canvasWidth = canvasSettings.width;
    const canvasHeight = canvasSettings.height;

    const scaleX = containerWidth / canvasWidth;
    const scaleY = containerHeight / canvasHeight;
    const newZoom = Math.min(scaleX, scaleY, 1);

    console.log('Zoom Fit:', newZoom);

    // 使用CSS transform缩放画布容器
    const canvasContainer = canvasContainerRef.current;
    canvasContainer.style.transform = `scale(${newZoom})`;
    canvasContainer.style.transformOrigin = 'center center';

    setZoom(newZoom);
    setDisplayZoom(newZoom);
  }, [canvasSettings]);

  // 初始化 Fabric.js 画布
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: canvasSettings.width,
      height: canvasSettings.height,
      backgroundColor: canvasSettings.backgroundColor,
      selection: true,
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;

    // 通知父组件画布已准备就绪
    if (onCanvasReady) {
      onCanvasReady(canvas);
    }

    // 禁用滚轮缩放，防止意外操作
    canvas.on('mouse:wheel', (opt) => {
      // 阻止默认的滚轮行为，但不进行缩放
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // 平移功能
    canvas.on('mouse:down', (opt) => {
      const evt = opt.e;
      if (evt.altKey || evt.ctrlKey) {
        setIsPanning(true);
        canvas.selection = false;
        canvas.defaultCursor = 'grab';
        canvas.hoverCursor = 'grab';
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (isPanning) {
        const evt = opt.e as MouseEvent;
        const vpt = canvas.viewportTransform;
        if (vpt && evt.movementX !== undefined && evt.movementY !== undefined) {
          vpt[4] += evt.movementX;
          vpt[5] += evt.movementY;
          canvas.requestRenderAll();
        }
      }
    });

    canvas.on('mouse:up', () => {
      if (isPanning) {
        setIsPanning(false);
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';
      }
    });

    // 监听对象选择事件
    canvas.on('selection:created', (e) => {
      const activeObject = e.selected?.[0] as any;
      if (activeObject) {
        if (activeObject.textElementId) {
          selectElement(activeObject.textElementId, 'text');
        } else if (activeObject.imageElementId) {
          selectElement(activeObject.imageElementId, 'image');
        }
      }
    });

    canvas.on('selection:updated', (e) => {
      const activeObject = e.selected?.[0] as any;
      if (activeObject) {
        if (activeObject.textElementId) {
          selectElement(activeObject.textElementId, 'text');
        } else if (activeObject.imageElementId) {
          selectElement(activeObject.imageElementId, 'image');
        }
      }
    });

    canvas.on('selection:cleared', () => {
      selectElement(null, null);
    });

    // 监听对象修改事件
    canvas.on('object:modified', (e) => {
      const obj = e.target as any;
      if (obj) {
        if (obj.textElementId) {
          updateTextElementFromFabricObject(obj);
        } else if (obj.imageElementId) {
          updateImageElementFromFabricObject(obj);
        }
      }
    });

    canvas.on('object:moving', (e) => {
      const obj = e.target as any;
      if (obj) {
        if (obj.textElementId) {
          updateTextElementFromFabricObject(obj);
        } else if (obj.imageElementId) {
          updateImageElementFromFabricObject(obj);
        }
      }
    });

    canvas.on('object:scaling', (e) => {
      const obj = e.target as any;
      if (obj) {
        if (obj.textElementId) {
          updateTextElementFromFabricObject(obj);
        } else if (obj.imageElementId) {
          updateImageElementFromFabricObject(obj);
        }
      }
    });

    canvas.on('object:rotating', (e) => {
      const obj = e.target as any;
      if (obj) {
        if (obj.textElementId) {
          updateTextElementFromFabricObject(obj);
        } else if (obj.imageElementId) {
          updateImageElementFromFabricObject(obj);
        }
      }
    });

    // 键盘快捷键支持
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            handleZoomIn();
            break;
          case '-':
            e.preventDefault();
            handleZoomOut();
            break;
          case '0':
            e.preventDefault();
            handleZoomReset();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      canvas.dispose();
    };
  }, [canvasSettings]);

  // 更新画布尺寸和背景色
  useEffect(() => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;

      console.log('Updating canvas settings, current objects:', canvas.getObjects().length);

      // 更新画布尺寸
      canvas.setDimensions({
        width: canvasSettings.width,
        height: canvasSettings.height
      });

      // 更新背景色
      canvas.backgroundColor = canvasSettings.backgroundColor;

      // 强制重新渲染所有对象
      canvas.getObjects().forEach(obj => {
        obj.setCoords();
        obj.dirty = true;
        // 强制重新绘制对象
        if (obj.type === 'text') {
          (obj as any)._clearCache();
        }
      });

      // 多次渲染确保正确显示
      canvas.renderAll();

      // 使用requestAnimationFrame确保在下一帧渲染
      requestAnimationFrame(() => {
        if (canvas) {
          canvas.renderAll();
        }
      });

      // 再次延迟渲染
      setTimeout(() => {
        if (canvas) {
          canvas.renderAll();
        }
      }, 100);

      console.log('After update, objects:', canvas.getObjects().length);
    }
  }, [canvasSettings]);







  // 从 Fabric 对象更新 TextElement
  const updateTextElementFromFabricObject = useCallback((obj: any) => {
    if (!obj.textElementId) return;

    const updates: Partial<TextElement> = {
      x: obj.left || 0,
      y: obj.top || 0,
      fontSize: (obj.fontSize || 20) * (obj.scaleY || 1),
      rotation: obj.angle || 0,
      opacity: obj.opacity || 1,
    };

    updateTextElement(obj.textElementId, updates);
  }, [updateTextElement]);

  // 从 Fabric 对象更新 ImageElement
  const updateImageElementFromFabricObject = useCallback((obj: any) => {
    if (!obj.imageElementId) return;

    const updates: Partial<ImageElement> = {
      x: obj.left || 0,
      y: obj.top || 0,
      scaleX: obj.scaleX || 1,
      scaleY: obj.scaleY || 1,
      rotation: obj.angle || 0,
      opacity: obj.opacity || 1,
    };

    updateImageElement(obj.imageElementId, updates);
  }, [updateImageElement]);

  // 创建 Fabric 文字对象
  const createFabricText = useCallback((textElement: TextElement): Text => {
    const text = new Text(textElement.text, {
      left: textElement.x,
      top: textElement.y,
      fontSize: textElement.fontSize,
      fontFamily: textElement.fontFamily,
      fill: textElement.color,
      fontWeight: textElement.fontWeight,
      fontStyle: textElement.fontStyle,
      textAlign: textElement.textAlign,
      angle: textElement.rotation,
      opacity: textElement.opacity,
      cornerStyle: 'circle',
      cornerColor: '#2563eb',
      cornerSize: 8,
      transparentCorners: false,
      borderColor: '#2563eb',
      borderScaleFactor: 2,
    });

    // 添加自定义属性
    (text as any).textElementId = textElement.id;

    return text;
  }, []);

  // 在画布设置更新后，强制重新同步文字元素
  const [lastCanvasSettings, setLastCanvasSettings] = useState(canvasSettings);

  useEffect(() => {
    // 只有当画布设置真正改变时才重新同步
    const settingsChanged =
      lastCanvasSettings.width !== canvasSettings.width ||
      lastCanvasSettings.height !== canvasSettings.height ||
      lastCanvasSettings.backgroundColor !== canvasSettings.backgroundColor;

    if (!fabricCanvasRef.current || textElements.length === 0 || !settingsChanged) {
      setLastCanvasSettings(canvasSettings);
      return;
    }

    const canvas = fabricCanvasRef.current;

    console.log('Force re-sync text elements after canvas settings change');

    // 移除所有现有的文字对象
    const textObjects = canvas.getObjects().filter(obj => (obj as any).textElementId);
    textObjects.forEach(obj => {
      canvas.remove(obj);
    });

    // 重新添加所有文字元素
    textElements.forEach(textElement => {
      console.log('Re-adding text element:', textElement.text);
      const fabricText = createFabricText(textElement);
      canvas.add(fabricText);
    });

    // 强制重新渲染
    canvas.renderAll();

    setTimeout(() => {
      if (canvas) {
        canvas.renderAll();
      }
    }, 50);

    setLastCanvasSettings(canvasSettings);

  }, [canvasSettings, textElements, createFabricText, lastCanvasSettings]);

  // 创建 Fabric 图片对象
  const createFabricImage = useCallback((imageElement: ImageElement): Promise<Image> => {
    return Image.fromURL(imageElement.imageUrl).then((img) => {
      img.set({
        left: imageElement.x,
        top: imageElement.y,
        scaleX: imageElement.scaleX,
        scaleY: imageElement.scaleY,
        angle: imageElement.rotation,
        opacity: imageElement.opacity,
        cornerStyle: 'circle',
        cornerColor: '#2563eb',
        cornerSize: 8,
        transparentCorners: false,
        borderColor: '#2563eb',
        borderScaleFactor: 2,
      });

      // 添加自定义属性
      (img as any).imageElementId = imageElement.id;

      return img;
    });
  }, []);

  // 在画布设置更新后，强制重新同步图片元素
  const [lastCanvasSettingsForImages, setLastCanvasSettingsForImages] = useState(canvasSettings);

  useEffect(() => {
    // 只有当画布设置真正改变时才重新同步
    const settingsChanged =
      lastCanvasSettingsForImages.width !== canvasSettings.width ||
      lastCanvasSettingsForImages.height !== canvasSettings.height ||
      lastCanvasSettingsForImages.backgroundColor !== canvasSettings.backgroundColor;

    if (!fabricCanvasRef.current || imageElements.length === 0 || !settingsChanged) {
      setLastCanvasSettingsForImages(canvasSettings);
      return;
    }

    const canvas = fabricCanvasRef.current;

    console.log('Force re-sync image elements after canvas settings change');

    // 移除所有现有的图片对象
    const imageObjects = canvas.getObjects().filter(obj => (obj as any).imageElementId);
    imageObjects.forEach(obj => {
      canvas.remove(obj);
    });

    // 重新添加所有图片元素
    imageElements.forEach(imageElement => {
      console.log('Re-adding image element:', imageElement.imageUrl);
      createFabricImage(imageElement).then(fabricImage => {
        canvas.add(fabricImage);
        canvas.renderAll();
      });
    });

    // 强制重新渲染
    setTimeout(() => {
      if (canvas) {
        canvas.renderAll();
      }
    }, 100);

    setLastCanvasSettingsForImages(canvasSettings);

  }, [canvasSettings, imageElements, createFabricImage, lastCanvasSettingsForImages]);

  // 同步文字元素到画布
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    console.log('Syncing text elements:', textElements.length);

    // 获取当前画布上的文字对象
    const currentObjects = canvas.getObjects().filter(obj => (obj as any).textElementId);
    const currentIds = currentObjects.map(obj => (obj as any).textElementId);

    console.log('Current text objects on canvas:', currentObjects.length);

    // 移除不存在的文字元素
    currentObjects.forEach(obj => {
      if (!textElements.find(el => el.id === (obj as any).textElementId)) {
        console.log('Removing text object:', (obj as any).textElementId);
        canvas.remove(obj);
      }
    });

    // 添加新的文字元素
    textElements.forEach(textElement => {
      if (!currentIds.includes(textElement.id)) {
        console.log('Adding new text element:', textElement.text);
        const fabricText = createFabricText(textElement);
        canvas.add(fabricText);
      } else {
        // 更新现有文字元素
        const existingObj = currentObjects.find(obj => (obj as any).textElementId === textElement.id) as Text;
        if (existingObj) {
          existingObj.set({
            text: textElement.text,
            left: textElement.x,
            top: textElement.y,
            fontSize: textElement.fontSize,
            fontFamily: textElement.fontFamily,
            fill: textElement.color,
            fontWeight: textElement.fontWeight,
            fontStyle: textElement.fontStyle,
            textAlign: textElement.textAlign,
            angle: textElement.rotation,
            opacity: textElement.opacity,
          });
        }
      }
    });

    // 强制重新绘制所有对象
    canvas.getObjects().forEach(obj => {
      obj.setCoords();
      obj.dirty = true;
    });

    canvas.renderAll();

    // 额外的渲染确保文字正确显示
    setTimeout(() => {
      if (canvas) {
        canvas.renderAll();
      }
    }, 50);
  }, [textElements, createFabricText]);

  // 同步图片元素到画布
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    // 获取当前画布上的图片对象
    const currentImageObjects = canvas.getObjects().filter(obj => (obj as any).imageElementId);
    const currentImageIds = currentImageObjects.map(obj => (obj as any).imageElementId);

    // 移除不存在的图片元素
    currentImageObjects.forEach(obj => {
      if (!imageElements.find(el => el.id === (obj as any).imageElementId)) {
        canvas.remove(obj);
      }
    });

    // 添加新的图片元素
    imageElements.forEach(imageElement => {
      if (!currentImageIds.includes(imageElement.id)) {
        createFabricImage(imageElement).then(fabricImage => {
          canvas.add(fabricImage);
          canvas.renderAll();
        });
      } else {
        // 更新现有图片元素
        const existingObj = currentImageObjects.find(obj => (obj as any).imageElementId === imageElement.id) as Image;
        if (existingObj) {
          existingObj.set({
            left: imageElement.x,
            top: imageElement.y,
            scaleX: imageElement.scaleX,
            scaleY: imageElement.scaleY,
            angle: imageElement.rotation,
            opacity: imageElement.opacity,
          });
        }
      }
    });

    // 强制重新绘制所有对象
    canvas.getObjects().forEach(obj => {
      obj.setCoords();
      obj.dirty = true;
    });

    canvas.renderAll();

    // 额外的渲染确保图片正确显示
    setTimeout(() => {
      if (canvas) {
        canvas.renderAll();
      }
    }, 50);
  }, [imageElements, createFabricImage]);

  // 选中元素
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    if (selectedElementId) {
      let targetObj;
      if (selectedElementType === 'text') {
        targetObj = canvas.getObjects().find(obj => (obj as any).textElementId === selectedElementId);
      } else if (selectedElementType === 'image') {
        targetObj = canvas.getObjects().find(obj => (obj as any).imageElementId === selectedElementId);
      }

      if (targetObj) {
        canvas.setActiveObject(targetObj);
      }
    } else {
      canvas.discardActiveObject();
    }

    canvas.renderAll();
  }, [selectedElementId, selectedElementType]);

  return (
    <div ref={containerRef} className="relative overflow-hidden h-full">
      {/* 缩放控制栏 */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center space-x-2 bg-white rounded-lg shadow-md border p-2">
        <button
          onClick={() => {
            console.log('Zoom Out button clicked');
            handleZoomOut();
          }}
          className={`p-2 rounded transition-colors ${zoom <= 0.1
            ? 'text-gray-300 cursor-not-allowed'
            : 'hover:bg-gray-100 text-gray-700'
            }`}
          title="缩小 (Ctrl + -)"
          disabled={zoom <= 0.1}
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-sm font-medium text-gray-700 min-w-[4rem] text-center bg-gray-50 px-2 py-1 rounded">
          {Math.round(displayZoom * 100)}%
        </span>

        <button
          onClick={() => {
            console.log('Zoom In button clicked');
            handleZoomIn();
          }}
          className={`p-2 rounded transition-colors ${zoom >= 5
            ? 'text-gray-300 cursor-not-allowed'
            : 'hover:bg-gray-100 text-gray-700'
            }`}
          title="放大 (Ctrl + +)"
          disabled={zoom >= 5}
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300"></div>

        <button
          onClick={handleZoomReset}
          className={`p-2 rounded transition-colors ${zoom === 1
            ? 'bg-blue-100 text-blue-700'
            : 'hover:bg-gray-100 text-gray-700'
            }`}
          title="重置缩放 (Ctrl + 0)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={handleZoomFit}
          className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
          title="适应窗口"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>



      {/* 画布容器 */}

      <div className="w-full h-full flex items-center justify-center">
        <div
          ref={canvasContainerRef}
          className="shadow-lg"
          style={{
            lineHeight: 0,
            backgroundColor: canvasSettings.backgroundColor,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease',
            willChange: 'transform'
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              display: 'block',
              maxWidth: 'none',
              maxHeight: 'none'
            }}
          />
        </div>
      </div>

    </div>
  );
};

export default FabricCanvas;