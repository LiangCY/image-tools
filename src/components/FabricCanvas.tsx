import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas, Text, Image, Point, Rect, PencilBrush } from 'fabric';
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

  // 根据zIndex重新排序画布对象
  const reorderCanvasObjects = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    const allObjects = canvas.getObjects();
    
    // 检查是否需要重新排序
    const needsReordering = allObjects.some((obj, index) => {
      const nextObj = allObjects[index + 1];
      if (!nextObj) return false;
      const currentZIndex = (obj as any).zIndex || 0;
      const nextZIndex = (nextObj as any).zIndex || 0;
      return currentZIndex > nextZIndex;
    });
    
    if (needsReordering) {
      const sortedObjects = [...allObjects].sort((a, b) => {
        const aZIndex = (a as any).zIndex || 0;
        const bZIndex = (b as any).zIndex || 0;
        return aZIndex - bZIndex;
      });
      
      // 直接重新排序对象数组
      (canvas as any)._objects = sortedObjects;
      
      canvas.renderAll();
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
    selectElement,
    drawSettings,
    clearDrawing,
    _forceRender
  } = useEditStore();

  // 缩放控制函数 - 使用Fabric.js内置缩放功能
  const handleZoomIn = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    const newZoom = Math.min(5, zoom * 1.2);



    // 使用Fabric.js的缩放功能
    const center = canvas.getCenter();
    canvas.zoomToPoint(new Point(center.left, center.top), newZoom);

    setZoom(newZoom);
    setDisplayZoom(newZoom);
  }, [zoom]);

  const handleZoomOut = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    const newZoom = Math.max(0.1, zoom / 1.2);



    // 使用Fabric.js的缩放功能
    const center = canvas.getCenter();
    canvas.zoomToPoint(new Point(center.left, center.top), newZoom);

    setZoom(newZoom);
    setDisplayZoom(newZoom);
  }, [zoom]);

  const handleZoomReset = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;



    // 使用Fabric.js重置缩放
    const center = canvas.getCenter();
    canvas.zoomToPoint(new Point(center.left, center.top), 1);

    setZoom(1);
    setDisplayZoom(1);
  }, []);

  const handleZoomFit = useCallback(() => {
    if (!fabricCanvasRef.current || !containerRef.current) return;
    const canvas = fabricCanvasRef.current;
    const container = containerRef.current;

    const containerWidth = container.clientWidth - 100;
    const containerHeight = container.clientHeight - 100;
    const canvasWidth = canvasSettings.width;
    const canvasHeight = canvasSettings.height;

    const scaleX = containerWidth / canvasWidth;
    const scaleY = containerHeight / canvasHeight;
    const newZoom = Math.min(scaleX, scaleY, 1);



    // 使用Fabric.js的缩放功能
    const center = canvas.getCenter();
    canvas.zoomToPoint(new Point(center.left, center.top), newZoom);

    setZoom(newZoom);
    setDisplayZoom(newZoom);
  }, [canvasSettings]);

  // 初始化 Fabric.js 画布
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: canvasSettings.width,
      height: canvasSettings.height,
      backgroundColor: canvasSettings.backgroundColor,
      selection: true,
      preserveObjectStacking: true,
      isDrawingMode: false,
      enableRetinaScaling: true,
    });

    fabricCanvasRef.current = canvas;

    // 初始化绘画笔刷
    if (!canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush = new PencilBrush(canvas);
    }
    
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = 5;
      canvas.freeDrawingBrush.color = '#000000';
    }

    // 通知父组件画布已准备就绪
    if (onCanvasReady) {
      onCanvasReady(canvas);
    }

    // 启用滚轮缩放
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      
      if (zoom > 5) zoom = 5;
      if (zoom < 0.1) zoom = 0.1;
      
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      setZoom(zoom);
      setDisplayZoom(zoom);
      
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // 平移功能和绘画模式监听
    canvas.on('mouse:down', (opt) => {
      const evt = opt.e;
      
      if (canvas.isDrawingMode) {
        // 在绘画模式下不阻止事件传播
        return;
      } else if (evt.altKey || evt.ctrlKey) {
        // 只在非绘画模式下启用平移
        setIsPanning(true);
        canvas.selection = false;
        canvas.defaultCursor = 'grab';
        canvas.hoverCursor = 'grab';
        canvas.isDragging = true;
        canvas.lastPosX = evt.clientX;
        canvas.lastPosY = evt.clientY;
        opt.e.preventDefault();
        opt.e.stopPropagation();
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (canvas.isDrawingMode) {
        // 在绘画模式下不阻止事件传播
        return;
      } else if (isPanning && canvas.isDragging) {
        const evt = opt.e;
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += evt.clientX - canvas.lastPosX;
          vpt[5] += evt.clientY - canvas.lastPosY;
          canvas.requestRenderAll();
          canvas.lastPosX = evt.clientX;
          canvas.lastPosY = evt.clientY;
        }
        opt.e.preventDefault();
        opt.e.stopPropagation();
      }
    });

    canvas.on('mouse:up', (opt) => {
      if (canvas.isDrawingMode) {
        // 在绘画模式下不阻止事件传播
        return;
      } else if (isPanning) {
        setIsPanning(false);
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';
        canvas.isDragging = false;
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

    // 监听绘画路径创建事件
    canvas.on('path:created', (e) => {
      // 绘画路径创建后的处理逻辑可以在这里添加
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
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []);

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

  // 监听绘画设置变化
  useEffect(() => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      
      // 更新绘画模式
      canvas.isDrawingMode = drawSettings.isDrawingMode;
      
      // 更新笔刷设置
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = drawSettings.brushSize;
        canvas.freeDrawingBrush.color = drawSettings.brushColor;
      }
      
      // 如果进入绘画模式，禁用对象选择
      if (drawSettings.isDrawingMode) {
        canvas.selection = false;
        canvas.defaultCursor = 'crosshair';
        canvas.hoverCursor = 'crosshair';
        canvas.moveCursor = 'crosshair';
      } else {
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';
        canvas.moveCursor = 'move';
      }
    }
  }, [drawSettings]);

  // 初始化绘画设置（仅在画布创建后执行一次）
  useEffect(() => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      
      // 初始化绘画模式设置
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = drawSettings.brushSize;
        canvas.freeDrawingBrush.color = drawSettings.brushColor;
      }
    }
  }, [fabricCanvasRef.current]);

  // 清除绘画功能
  useEffect(() => {
    if (fabricCanvasRef.current && drawSettings.clearDrawingTrigger) {
      const canvas = fabricCanvasRef.current;
      
      // 清除所有绘画路径
      const objects = canvas.getObjects();
      const drawingPaths = objects.filter(obj => obj.type === 'path');
      drawingPaths.forEach(path => canvas.remove(path));
      canvas.renderAll();
    }
  }, [drawSettings.clearDrawingTrigger]);

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
      visible: textElement.visible,
      selectable: !textElement.locked,
      evented: !textElement.locked,
      cornerStyle: 'circle',
      cornerColor: '#2563eb',
      cornerSize: 8,
      transparentCorners: false,
      borderColor: '#2563eb',
      borderScaleFactor: 2,
    });

    // 添加自定义属性
    (text as any).textElementId = textElement.id;
    (text as any).zIndex = textElement.zIndex;

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
        visible: imageElement.visible,
        selectable: !imageElement.locked,
        evented: !imageElement.locked,
        cornerStyle: 'circle',
        cornerColor: '#2563eb',
        cornerSize: 8,
        transparentCorners: false,
        borderColor: '#2563eb',
        borderScaleFactor: 2,
      });

      // 添加自定义属性
      (img as any).imageElementId = imageElement.id;
      (img as any).zIndex = imageElement.zIndex;

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
            visible: textElement.visible,
            selectable: !textElement.locked,
            evented: !textElement.locked,
          });
          (existingObj as any).zIndex = textElement.zIndex;
        }
      }
    });

    // 重新排序画布对象
    reorderCanvasObjects();

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
  }, [textElements, createFabricText, reorderCanvasObjects]);

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
            visible: imageElement.visible,
            selectable: !imageElement.locked,
            evented: !imageElement.locked,
          });
          (existingObj as any).zIndex = imageElement.zIndex;
        }
      }
    });

    // 重新排序画布对象
    reorderCanvasObjects();

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
  }, [imageElements, createFabricImage, reorderCanvasObjects]);

  // 监听强制渲染标记
  useEffect(() => {
    if (_forceRender && fabricCanvasRef.current) {
      reorderCanvasObjects();
      forceRenderAll();
    }
  }, [_forceRender, reorderCanvasObjects, forceRenderAll]);

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
          onClick={handleZoomOut}
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
          onClick={handleZoomIn}
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
            backgroundColor: canvasSettings.backgroundColor
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