import { create } from 'zustand';
import { 
  EditState, 
  EditTool, 
  ImageFile, 
  SpliceSettings, 
  CompressionSettings,
  TextElement,
  ImageElement,
  IconElement,
  CanvasSettings,
  ProcessingProgress,
  HistoryRecord,
  LayerElement,
  LayerOperation,
  DrawSettings
} from '../types';

// 默认拼接设置
const defaultSpliceSettings: SpliceSettings = {
  direction: 'horizontal',
  spacing: 10,
  horizontalAlignment: 'center',
  verticalAlignment: 'center',
  backgroundColor: '#ffffff',
  borderRadius: 0,
  borderWidth: 0,
  borderColor: '#000000',
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  canvasSizeMode: 'auto',
  canvasOrientation: 'landscape',
};

// 默认压缩设置
const defaultCompressionSettings: CompressionSettings = {
  quality: 80,
  maintainAspectRatio: true,
  format: 'jpeg',
};

// 默认画布设置
const defaultCanvasSettings: CanvasSettings = {
  width: 800,
  height: 600,
  backgroundColor: '#ffffff',
  maxWidth: 2000,
  maxHeight: 2000,
};

// 默认绘画设置
const defaultDrawSettings: DrawSettings = {
  brushSize: 5,
  brushColor: '#000000',
  isDrawingMode: false,
};

interface EditStore extends EditState {
  // 画布设置
  updateCanvasSettings: (settings: Partial<CanvasSettings>) => void;
  
  // 图片元素管理
  addImageElement: (file: File) => Promise<void>;
  updateImageElement: (id: string, updates: Partial<ImageElement>) => void;
  removeImageElement: (id: string) => void;
  
  // 文字元素管理
  addTextElement: (element: Omit<TextElement, 'id'>) => void;
  updateTextElement: (id: string, updates: Partial<TextElement>) => void;
  removeTextElement: (id: string) => void;
  
  // 图标元素管理
  addIconElement: (element: Omit<IconElement, 'id'>) => void;
  updateIconElement: (id: string, updates: Partial<IconElement>) => void;
  removeIconElement: (id: string) => void;
  
  // 元素选择
  selectElement: (id: string | null, type: 'image' | 'text' | 'icon' | null) => void;
  
  // 层级管理
  getAllLayers: () => LayerElement[];
  getNextZIndex: () => number;
  
  // 画布渲染
  forceRenderCanvas: () => void;
  
  // 工具切换
  setActiveTool: (tool: EditTool) => void;
  
  // 绘画设置
  updateDrawSettings: (settings: Partial<DrawSettings>) => void;
  toggleDrawingMode: () => void;
  clearDrawing: () => void;
  
  // 视图控制
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;
  
  // 兼容性方法（保留旧的设置）
  updateSpliceSettings: (settings: Partial<SpliceSettings>) => void;
  updateCompressionSettings: (settings: Partial<CompressionSettings>) => void;
  
  // 重置状态
  reset: () => void;
}

interface ProcessingStore {
  progress: ProcessingProgress;
  setProgress: (progress: Partial<ProcessingProgress>) => void;
  startProcessing: (message: string) => void;
  updateProgress: (progress: number, message?: string) => void;
  finishProcessing: () => void;
}

interface HistoryStore {
  records: HistoryRecord[];
  addRecord: (record: Omit<HistoryRecord, 'id' | 'timestamp'>) => void;
  removeRecord: (id: string) => void;
  clearHistory: () => void;
  getRecentRecords: (limit?: number) => HistoryRecord[];
}

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 11);

// 计算图片自动调整后的尺寸
const calculateAutoResizedDimensions = (
  originalWidth: number,
  originalHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  maxPercentage: number = 0.8 // 默认80%
): { width: number; height: number; scale: number } => {
  // 计算基于画布尺寸的最大允许尺寸
  const maxWidth = canvasWidth * maxPercentage;
  const maxHeight = canvasHeight * maxPercentage;
  
  // 如果图片尺寸在限制范围内，不需要调整
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return {
      width: originalWidth,
      height: originalHeight,
      scale: 1
    };
  }

  // 计算缩放比例，保持宽高比
  const scaleX = maxWidth / originalWidth;
  const scaleY = maxHeight / originalHeight;
  const scale = Math.min(scaleX, scaleY);

  return {
    width: Math.round(originalWidth * scale),
    height: Math.round(originalHeight * scale),
    scale
  };
};

// 创建图片文件对象
const createImageFile = async (file: File): Promise<ImageFile> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      resolve({
        id: generateId(),
        file,
        url,
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        name: file.name,
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

// 编辑状态store
export const useEditStore = create<EditStore>((set, get) => ({
  // 画布设置
  canvasSettings: defaultCanvasSettings,
  
  // 元素管理
  imageElements: [],
  textElements: [],
  iconElements: [],
  
  // 选择状态
  selectedElementId: null,
  selectedElementType: null,
  
  // 工具和视图
  activeTool: 'canvas',
  zoom: 1,
  panX: 0,
  panY: 0,
  
  // 绘画设置
  drawSettings: defaultDrawSettings,
  
  // 兼容性设置
  spliceSettings: defaultSpliceSettings,
  compressionSettings: defaultCompressionSettings,

  // 画布设置
  updateCanvasSettings: (settings: Partial<CanvasSettings>) => {
    set(state => ({
      canvasSettings: { ...state.canvasSettings, ...settings }
    }));
  },

  // 图片元素管理
  addImageElement: async (file: File) => {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      
      return new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const state = get();
          const { width: canvasWidth, height: canvasHeight } = state.canvasSettings;
          
          // 计算缩放比例（基于画布尺寸的80%）
          const { scale } = calculateAutoResizedDimensions(
            img.naturalWidth,
            img.naturalHeight,
            canvasWidth,
            canvasHeight,
            0.8 // 80%的画布尺寸
          );
          
          const currentState = get();
          const nextZIndex = Math.max(
            ...currentState.imageElements.map(el => el.zIndex || 0),
            ...currentState.textElements.map(el => el.zIndex || 0),
            ...currentState.iconElements.map(el => el.zIndex || 0),
            0
          ) + 1;
          
          const imageElement: ImageElement = {
            id: generateId(),
            imageUrl: url,
            x: 100,
            y: 100,
            width: img.naturalWidth,  // 保持原始宽度
            height: img.naturalHeight, // 保持原始高度
            rotation: 0,
            opacity: 1,
            scaleX: scale, // 只调整缩放比例
            scaleY: scale, // 只调整缩放比例
            zIndex: nextZIndex,
            visible: true,
            locked: false,
          };
          
          set(state => ({
            imageElements: [...state.imageElements, imageElement]
          }));
          
          // 如果图片被缩放了，在控制台输出提示信息
          if (scale < 1) {
            const maxAllowedWidth = Math.round(canvasWidth * 0.8);
            const maxAllowedHeight = Math.round(canvasHeight * 0.8);
            const displayWidth = Math.round(img.naturalWidth * scale);
            const displayHeight = Math.round(img.naturalHeight * scale);
            console.log(`图片 "${file.name}" 已自动缩放显示：原始尺寸 ${img.naturalWidth}×${img.naturalHeight}，显示尺寸 ${displayWidth}×${displayHeight}`);
            console.log(`画布尺寸: ${canvasWidth}×${canvasHeight}, 最大允许: ${maxAllowedWidth}×${maxAllowedHeight} (80%), 缩放比例: ${(scale * 100).toFixed(1)}%`);
          }
          
          resolve();
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load image'));
        };
        
        img.src = url;
      });
    } catch (error) {
      console.error('Failed to add image element:', error);
    }
  },

  updateImageElement: (id: string, updates: Partial<ImageElement>) => {
    set(state => ({
      imageElements: state.imageElements.map(element =>
        element.id === id ? { ...element, ...updates } : element
      )
    }));
  },

  removeImageElement: (id: string) => {
    set(state => {
      const element = state.imageElements.find(el => el.id === id);
      if (element) {
        URL.revokeObjectURL(element.imageUrl);
      }
      return {
        imageElements: state.imageElements.filter(element => element.id !== id),
        selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
        selectedElementType: state.selectedElementId === id ? null : state.selectedElementType,
      };
    });
  },

  // 文字元素管理
  addTextElement: (element: Omit<TextElement, 'id'>) => {
    set(state => {
      const nextZIndex = Math.max(
        ...state.imageElements.map(el => el.zIndex || 0),
        ...state.textElements.map(el => el.zIndex || 0),
        ...state.iconElements.map(el => el.zIndex || 0),
        0
      ) + 1;
      
      const newElement: TextElement = {
        ...element,
        id: generateId(),
        zIndex: element.zIndex || nextZIndex,
        visible: element.visible !== undefined ? element.visible : true,
        locked: element.locked !== undefined ? element.locked : false,
      };
      
      return {
        textElements: [...state.textElements, newElement]
      };
    });
  },

  updateTextElement: (id: string, updates: Partial<TextElement>) => {
    set(state => ({
      textElements: state.textElements.map(element =>
        element.id === id ? { ...element, ...updates } : element
      )
    }));
  },

  removeTextElement: (id: string) => {
    set(state => ({
      textElements: state.textElements.filter(element => element.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
      selectedElementType: state.selectedElementId === id ? null : state.selectedElementType,
    }));
  },

  // 图标元素管理
  addIconElement: (element: Omit<IconElement, 'id'>) => {
    set(state => {
      const nextZIndex = Math.max(
        ...state.imageElements.map(el => el.zIndex || 0),
        ...state.textElements.map(el => el.zIndex || 0),
        ...state.iconElements.map(el => el.zIndex || 0),
        0
      ) + 1;
      
      const newElement: IconElement = {
        ...element,
        id: generateId(),
        zIndex: element.zIndex || nextZIndex,
        visible: element.visible !== undefined ? element.visible : true,
        locked: element.locked !== undefined ? element.locked : false,
      };
      
      return {
        iconElements: [...state.iconElements, newElement]
      };
    });
  },

  updateIconElement: (id: string, updates: Partial<IconElement>) => {
    set(state => ({
      iconElements: state.iconElements.map(element =>
        element.id === id ? { ...element, ...updates } : element
      )
    }));
  },

  removeIconElement: (id: string) => {
    set(state => ({
      iconElements: state.iconElements.filter(element => element.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
      selectedElementType: state.selectedElementId === id ? null : state.selectedElementType,
    }));
  },

  // 元素选择
  selectElement: (id: string | null, type: 'image' | 'text' | 'icon' | null) => {
    set(state => {
      const newState: any = { 
        selectedElementId: id,
        selectedElementType: type 
      };
      
      // 当选中元素时，自动切换到对应的设置面板
      if (id && type) {
        if (type === 'image') {
          newState.activeTool = 'image';
        } else if (type === 'text') {
          newState.activeTool = 'text';
        }
      }
      
      return newState;
    });
  },

  // 层级管理
  getAllLayers: () => {
    const state = get();
    const layers: LayerElement[] = [];
    
    // 添加图片元素
    state.imageElements.forEach(element => {
      layers.push({
        id: element.id,
        type: 'image',
        name: `图片 ${element.id.slice(-4)}`,
        zIndex: element.zIndex,
      });
    });
    
    // 添加文字元素
    state.textElements.forEach(element => {
      layers.push({
        id: element.id,
        type: 'text',
        name: element.text.length > 10 ? `${element.text.slice(0, 10)}...` : element.text,
        zIndex: element.zIndex,
      });
    });
    
    // 添加图标元素
    state.iconElements.forEach(element => {
      layers.push({
        id: element.id,
        type: 'icon',
        name: `图标 ${element.iconName}`,
        zIndex: element.zIndex,
      });
    });
    
    // 按zIndex排序，zIndex高的在前面
    return layers.sort((a, b) => b.zIndex - a.zIndex);
  },

  getNextZIndex: () => {
    const state = get();
    return Math.max(
      ...state.imageElements.map(el => el.zIndex || 0),
      ...state.textElements.map(el => el.zIndex || 0),
      ...state.iconElements.map(el => el.zIndex || 0),
      0
    ) + 1;
  },

  // 强制重新渲染画布
  forceRenderCanvas: () => {
    // 触发一个微小的状态更新来强制重新渲染
    set(state => ({ 
      ...state,
      _forceRender: Date.now() 
    }));
  },





  // 工具切换
  setActiveTool: (tool: EditTool) => {
    set({ activeTool: tool });
  },

  // 绘画设置
  updateDrawSettings: (settings: Partial<DrawSettings>) => {
    set(state => ({
      drawSettings: { ...state.drawSettings, ...settings }
    }));
  },

  toggleDrawingMode: () => {
    set(state => ({
      drawSettings: { 
        ...state.drawSettings, 
        isDrawingMode: !state.drawSettings.isDrawingMode 
      }
    }));
  },

  clearDrawing: () => {
    set(state => ({
      drawSettings: { 
        ...state.drawSettings, 
        clearDrawingTrigger: Date.now() 
      }
    }));
  },

  // 兼容性方法
  updateSpliceSettings: (settings: Partial<SpliceSettings>) => {
    set(state => ({
      spliceSettings: { ...state.spliceSettings, ...settings }
    }));
  },

  updateCompressionSettings: (settings: Partial<CompressionSettings>) => {
    set(state => ({
      compressionSettings: { ...state.compressionSettings, ...settings }
    }));
  },

  // 视图控制
  setZoom: (zoom: number) => {
    set({ zoom: Math.max(0.1, Math.min(5, zoom)) });
  },

  setPan: (x: number, y: number) => {
    set({ panX: x, panY: y });
  },

  resetView: () => {
    set({ zoom: 1, panX: 0, panY: 0 });
  },

  // 重置状态
  reset: () => {
    const state = get();
    // 清理图片URL
    state.imageElements.forEach(element => URL.revokeObjectURL(element.imageUrl));
    
    set({
      canvasSettings: defaultCanvasSettings,
      imageElements: [],
      textElements: [],
      iconElements: [],
      selectedElementId: null,
      selectedElementType: null,
      activeTool: 'canvas',
      zoom: 1,
      panX: 0,
      panY: 0,
      drawSettings: defaultDrawSettings,
      spliceSettings: defaultSpliceSettings,
      compressionSettings: defaultCompressionSettings,
    });
  },
}));

// 处理进度store
export const useProcessingStore = create<ProcessingStore>((set) => ({
  progress: {
    isProcessing: false,
    progress: 0,
    message: '',
  },

  setProgress: (progress: Partial<ProcessingProgress>) => {
    set(state => ({
      progress: { ...state.progress, ...progress }
    }));
  },

  startProcessing: (message: string) => {
    set({
      progress: {
        isProcessing: true,
        progress: 0,
        message,
      }
    });
  },

  updateProgress: (progress: number, message?: string) => {
    set(state => ({
      progress: {
        ...state.progress,
        progress,
        ...(message && { message }),
      }
    }));
  },

  finishProcessing: () => {
    set({
      progress: {
        isProcessing: false,
        progress: 100,
        message: '完成',
      }
    });
  },
}));

// 历史记录store
export const useHistoryStore = create<HistoryStore>((set, get) => ({
  records: [],

  addRecord: (record: Omit<HistoryRecord, 'id' | 'timestamp'>) => {
    set(state => ({
      records: [
        {
          ...record,
          id: generateId(),
          timestamp: Date.now(),
        },
        ...state.records.slice(0, 49), // 保留最近50条记录
      ]
    }));
  },

  removeRecord: (id: string) => {
    set(state => ({
      records: state.records.filter(record => record.id !== id)
    }));
  },

  clearHistory: () => {
    set({ records: [] });
  },

  getRecentRecords: (limit = 10) => {
    return get().records.slice(0, limit);
  },
}));