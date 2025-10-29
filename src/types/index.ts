// 图片相关类型
export interface ImageFile {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
  size: number;
  name: string;
}

// 画布尺寸预设类型
export interface CanvasPreset {
  name: string;
  width: number;
  height: number;
  category: 'ratio' | 'paper' | 'custom';
}

// 拼接设置类型
export interface SpliceSettings {
  direction: 'horizontal' | 'vertical';
  spacing: number;
  // 支持水平和垂直两个独立的对齐方式
  horizontalAlignment: 'start' | 'center' | 'end';
  verticalAlignment: 'start' | 'center' | 'end';
  backgroundColor: string;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  // 画布尺寸设置
  canvasSizeMode: 'auto' | 'preset' | 'custom';
  canvasPreset?: string;
  canvasOrientation: 'landscape' | 'portrait';
  customWidth?: number;
  customHeight?: number;
}

// 对齐方式的语义化映射
export const AlignmentLabels = {
  horizontal: {
    start: { label: '左对齐', icon: 'AlignLeft' },
    center: { label: '水平居中', icon: 'AlignCenter' },
    end: { label: '右对齐', icon: 'AlignRight' }
  },
  vertical: {
    start: { label: '顶部对齐', icon: 'AlignTop' },
    center: { label: '垂直居中', icon: 'AlignCenter' },
    end: { label: '底部对齐', icon: 'AlignBottom' }
  }
} as const;

// 压缩设置类型
export interface CompressionSettings {
  quality: number; // 0-100
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
  format: 'jpeg' | 'png' | 'webp';
}

// 文字元素类型
export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  rotation: number;
  opacity: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
}

// 图片元素类型
export interface ImageElement {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  scaleX: number;
  scaleY: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
}

// 图标元素类型
export interface IconElement {
  id: string;
  iconName: string;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  opacity: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
}

// 导出设置类型
export interface ExportSettings {
  format: 'jpeg' | 'png' | 'webp';
  quality: number;
  width?: number;
  height?: number;
  includeMetadata: boolean;
}

// 编辑工具类型
export type EditTool = 'canvas' | 'image' | 'text' | 'icon' | 'export' | 'splice';

// 画布设置类型
export interface CanvasSettings {
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImage?: string;
  maxWidth?: number;
  maxHeight?: number;
}

// 编辑状态类型
export interface EditState {
  // 画布设置
  canvasSettings: CanvasSettings;
  
  // 元素管理
  imageElements: ImageElement[];
  textElements: TextElement[];
  iconElements: IconElement[];
  
  // 选择状态
  selectedElementId: string | null;
  selectedElementType: 'image' | 'text' | 'icon' | null;
  
  // 工具和视图
  activeTool: EditTool;
  zoom: number;
  panX: number;
  panY: number;
  
  // 旧的设置（保留兼容性）
  spliceSettings: SpliceSettings;
  compressionSettings: CompressionSettings;
  
  // 强制渲染标记
  _forceRender?: number;
}

// 处理进度类型
export interface ProcessingProgress {
  isProcessing: boolean;
  progress: number;
  message: string;
}

// 历史记录类型
export interface HistoryRecord {
  id: string;
  timestamp: number;
  thumbnail: string;
  operation: string;
  images: ImageFile[];
}

// 层级元素类型
export interface LayerElement {
  id: string;
  type: 'image' | 'text' | 'icon';
  name: string;
  zIndex: number;
}

// 层级操作类型
export type LayerOperation = 'moveUp' | 'moveDown' | 'moveToTop' | 'moveToBottom';