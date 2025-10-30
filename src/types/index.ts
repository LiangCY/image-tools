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

// 基础元素接口
export interface BaseElement {
  id: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  scaleX: number;
  scaleY: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
}

// 文字元素类型
export interface TextElement extends BaseElement {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
}

// 图片元素类型
export interface ImageElement extends BaseElement {
  imageUrl: string;
  width: number;
  height: number;
}

// 图标元素类型
export interface IconElement extends BaseElement {
  iconName: string;
  size: number;
  color: string;
}

// 绘画元素类型
export interface DrawElement extends BaseElement {
  pathData: string; // SVG路径数据
  strokeWidth: number;
  strokeColor: string;
  createdAt: number;
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
export type EditTool = 'canvas' | 'image' | 'text' | 'icon' | 'export' | 'splice' | 'draw';

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
  drawElements: DrawElement[];
  
  // 选择状态
  selectedElementId: string | null;
  selectedElementType: 'image' | 'text' | 'icon' | 'draw' | null;
  
  // 工具和视图
  activeTool: EditTool;
  zoom: number;
  panX: number;
  panY: number;
  
  // 绘画设置
  drawSettings: DrawSettings;
  
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
  type: 'image' | 'text' | 'icon' | 'draw';
  name: string;
  zIndex: number;
}

// 层级操作类型
export type LayerOperation = 'moveUp' | 'moveDown' | 'moveToTop' | 'moveToBottom';

// 绘画设置类型
export interface DrawSettings {
  brushSize: number;
  brushColor: string;
  isDrawingMode: boolean;
  clearDrawingTrigger?: number;
}

// 通用元素类型联合
export type AnyElement = TextElement | ImageElement | IconElement | DrawElement;

// 元素类型字符串
export type ElementType = 'text' | 'image' | 'icon' | 'draw';

// 通用更新函数类型
export type ElementUpdater<T extends BaseElement> = (id: string, updates: Partial<T>) => void;

// 通用删除函数类型
export type ElementRemover = (id: string) => void;

// 通用添加函数类型
export type ElementAdder<T extends BaseElement> = (element: Omit<T, 'id'>) => void;