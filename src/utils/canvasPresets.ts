import { CanvasPreset } from '../types';

// 基础比例定义（总是以横向为基准）
export const baseRatios = [
  { name: '1:1', width: 1000, height: 1000, label: '正方形' },
  { name: '4:3', width: 1200, height: 900, label: '传统' },
  { name: '3:2', width: 1200, height: 800, label: '相机' },
  { name: '16:9', width: 1600, height: 900, label: '宽屏' },
  { name: '16:10', width: 1600, height: 1000, label: '宽屏' },
  { name: '21:9', width: 2100, height: 900, label: '超宽' }
];

// 基础纸张定义（总是以纵向为基准，因为纸张通常是竖着的）
export const basePapers = [
  { name: 'A4', width: 2480, height: 3508, label: 'A4 (210×297mm)' },
  { name: '16K', width: 2303, height: 3189, label: '16K (195×270mm)' },
  { name: 'Letter', width: 2550, height: 3300, label: 'Letter (8.5×11in)' },
  { name: 'Legal', width: 2550, height: 4200, label: 'Legal (8.5×14in)' }
];

// 根据基础比例和方向生成完整的预设
export const generatePresets = (orientation: 'landscape' | 'portrait' = 'landscape'): CanvasPreset[] => {
  const ratioPresets = baseRatios.map(ratio => {
    const isLandscape = orientation === 'landscape';
    const width = isLandscape ? ratio.width : ratio.height;
    const height = isLandscape ? ratio.height : ratio.width;
    
    return {
      name: `${ratio.name} (${isLandscape ? '横向' : '纵向'})`,
      width,
      height,
      category: 'ratio' as const
    };
  });
  
  const paperPresets = basePapers.map(paper => {
    // 基础纸张定义是纵向的（width < height）
    // 当 orientation === 'portrait' 时，保持原始尺寸
    // 当 orientation === 'landscape' 时，交换宽高
    const isPortrait = orientation === 'portrait';
    const width = isPortrait ? paper.width : paper.height;
    const height = isPortrait ? paper.height : paper.width;
    
    return {
      name: `${paper.label} (${isPortrait ? '纵向' : '横向'})`,
      width,
      height,
      category: 'paper' as const
    };
  });
  
  return [...ratioPresets, ...paperPresets];
};

// 默认预设（横向）
export const canvasPresets: CanvasPreset[] = generatePresets('landscape');

// 根据类别获取预设
export const getPresetsByCategory = (category: CanvasPreset['category']): CanvasPreset[] => {
  return canvasPresets.filter(preset => preset.category === category);
};

// 根据名称获取预设
export const getPresetByName = (name: string): CanvasPreset | undefined => {
  return canvasPresets.find(preset => preset.name === name);
};

// 计算预设的显示比例
export const getPresetRatio = (preset: CanvasPreset): string => {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(preset.width, preset.height);
  const ratioW = preset.width / divisor;
  const ratioH = preset.height / divisor;
  
  // 简化常见比例的显示
  if (ratioW === ratioH) return '1:1';
  if (ratioW === 4 && ratioH === 3) return '4:3';
  if (ratioW === 3 && ratioH === 4) return '3:4';
  if (ratioW === 3 && ratioH === 2) return '3:2';
  if (ratioW === 2 && ratioH === 3) return '2:3';
  if (ratioW === 16 && ratioH === 9) return '16:9';
  if (ratioW === 9 && ratioH === 16) return '9:16';
  if (ratioW === 16 && ratioH === 10) return '16:10';
  if (ratioW === 10 && ratioH === 16) return '10:16';
  if (ratioW === 21 && ratioH === 9) return '21:9';
  if (ratioW === 9 && ratioH === 21) return '9:21';
  
  return `${ratioW}:${ratioH}`;
};