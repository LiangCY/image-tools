import { create } from 'zustand';
import { 
  EditState, 
  EditTool, 
  ImageFile, 
  SpliceSettings, 
  CompressionSettings,
  TextElement,
  IconElement,
  ProcessingProgress,
  HistoryRecord
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

interface EditStore extends EditState {
  // 图片管理
  addImages: (files: File[]) => Promise<void>;
  removeImage: (id: string) => void;
  selectImage: (id: string, multiSelect?: boolean) => void;
  clearSelection: () => void;
  reorderImages: (fromIndex: number, toIndex: number) => void;
  
  // 工具切换
  setActiveTool: (tool: EditTool) => void;
  
  // 拼接设置
  updateSpliceSettings: (settings: Partial<SpliceSettings>) => void;
  
  // 压缩设置
  updateCompressionSettings: (settings: Partial<CompressionSettings>) => void;
  
  // 文字元素
  addTextElement: (element: Omit<TextElement, 'id'>) => void;
  updateTextElement: (id: string, updates: Partial<TextElement>) => void;
  removeTextElement: (id: string) => void;
  selectTextElement: (id: string | null) => void;
  
  // 图标元素
  addIconElement: (element: Omit<IconElement, 'id'>) => void;
  updateIconElement: (id: string, updates: Partial<IconElement>) => void;
  removeIconElement: (id: string) => void;
  
  // 画布控制
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;
  
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
  images: [],
  selectedImageIds: [],
  spliceSettings: defaultSpliceSettings,
  compressionSettings: defaultCompressionSettings,
  textElements: [],
  iconElements: [],
  activeTool: 'canvas',
  canvasWidth: 800,
  canvasHeight: 600,
  zoom: 1,
  panX: 0,
  panY: 0,
  selectedTextId: null,

  addImages: async (files: File[]) => {
    try {
      const imageFiles = await Promise.all(
        files.map(file => createImageFile(file))
      );
      set(state => ({
        images: [...state.images, ...imageFiles]
      }));
    } catch (error) {
      console.error('Failed to add images:', error);
    }
  },

  removeImage: (id: string) => {
    set(state => {
      const image = state.images.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.url);
      }
      return {
        images: state.images.filter(img => img.id !== id),
        selectedImageIds: state.selectedImageIds.filter(selectedId => selectedId !== id)
      };
    });
  },

  selectImage: (id: string, multiSelect = false) => {
    set(state => {
      if (multiSelect) {
        const isSelected = state.selectedImageIds.includes(id);
        return {
          selectedImageIds: isSelected
            ? state.selectedImageIds.filter(selectedId => selectedId !== id)
            : [...state.selectedImageIds, id]
        };
      } else {
        return {
          selectedImageIds: [id]
        };
      }
    });
  },

  clearSelection: () => {
    set({ selectedImageIds: [] });
  },

  reorderImages: (fromIndex: number, toIndex: number) => {
    set(state => {
      const newImages = [...state.images];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return { images: newImages };
    });
  },

  setActiveTool: (tool: EditTool) => {
    set({ activeTool: tool });
  },

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

  addTextElement: (element: Omit<TextElement, 'id'>) => {
    set(state => ({
      textElements: [...state.textElements, { ...element, id: generateId() }]
    }));
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
      selectedTextId: state.selectedTextId === id ? null : state.selectedTextId
    }));
  },

  selectTextElement: (id: string | null) => {
    set({ selectedTextId: id });
  },

  addIconElement: (element: Omit<IconElement, 'id'>) => {
    set(state => ({
      iconElements: [...state.iconElements, { ...element, id: generateId() }]
    }));
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
      iconElements: state.iconElements.filter(element => element.id !== id)
    }));
  },

  setZoom: (zoom: number) => {
    set({ zoom: Math.max(0.1, Math.min(5, zoom)) });
  },

  setPan: (x: number, y: number) => {
    set({ panX: x, panY: y });
  },

  resetView: () => {
    set({ zoom: 1, panX: 0, panY: 0 });
  },

  reset: () => {
    const state = get();
    // 清理图片URL
    state.images.forEach(img => URL.revokeObjectURL(img.url));
    
    set({
      images: [],
      selectedImageIds: [],
      spliceSettings: defaultSpliceSettings,
      compressionSettings: defaultCompressionSettings,
      textElements: [],
      iconElements: [],
      activeTool: 'canvas',
      zoom: 1,
      panX: 0,
      panY: 0,
      selectedTextId: null,
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