import { 
  ImageFile, 
  SpliceSettings, 
  CompressionSettings, 
  TextElement, 
  IconElement,
  ExportSettings 
} from '../types';
import { generatePresets } from './canvasPresets';

// 图片拼接处理
export class ImageSplicer {
  static async spliceImages(
    images: ImageFile[], 
    settings: SpliceSettings
  ): Promise<HTMLCanvasElement> {
    if (images.length === 0) {
      throw new Error('No images to splice');
    }

    // 加载所有图片
    const loadedImages = await Promise.all(
      images.map(imageFile => this.loadImage(imageFile.url))
    );

    // 计算画布尺寸
    const { canvasWidth, canvasHeight } = this.calculateCanvasSize(
      loadedImages, 
      settings
    );

    // 创建画布
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth + settings.borderWidth * 2;
    canvas.height = canvasHeight + settings.borderWidth * 2;
    const ctx = canvas.getContext('2d')!;

    // 绘制背景和边框
    this.drawBackground(ctx, canvas.width, canvas.height, settings);

    // 绘制图片
    await this.drawImages(ctx, loadedImages, settings, canvasWidth, canvasHeight);

    return canvas;
  }

  private static loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  private static drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    settings: SpliceSettings
  ): void {
    ctx.save();

    // 创建圆角矩形路径
    if (settings.borderRadius > 0) {
      this.createRoundedRectPath(ctx, 0, 0, width, height, settings.borderRadius);
      ctx.clip();
    }

    // 绘制背景
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // 绘制边框
    if (settings.borderWidth > 0) {
      ctx.strokeStyle = settings.borderColor;
      ctx.lineWidth = settings.borderWidth;
      
      if (settings.borderRadius > 0) {
        this.createRoundedRectPath(
          ctx,
          settings.borderWidth / 2, 
          settings.borderWidth / 2, 
          width - settings.borderWidth, 
          height - settings.borderWidth, 
          settings.borderRadius
        );
        ctx.stroke();
      } else {
        ctx.strokeRect(
          settings.borderWidth / 2, 
          settings.borderWidth / 2, 
          width - settings.borderWidth, 
          height - settings.borderWidth
        );
      }
    }

    ctx.restore();
  }

  private static createRoundedRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private static calculateCanvasSize(
    images: HTMLImageElement[], 
    settings: SpliceSettings
  ): { canvasWidth: number; canvasHeight: number } {
    const paddingHorizontal = settings.paddingLeft + settings.paddingRight;
    const paddingVertical = settings.paddingTop + settings.paddingBottom;
    
    // 首先计算基于图片内容的自然尺寸
    let naturalWidth: number;
    let naturalHeight: number;
    
    if (settings.direction === 'horizontal') {
      naturalWidth = images.reduce((sum, img) => sum + img.width, 0) + 
                    (images.length - 1) * settings.spacing;
      naturalHeight = Math.max(...images.map(img => img.height));
    } else {
      naturalWidth = Math.max(...images.map(img => img.width));
      naturalHeight = images.reduce((sum, img) => sum + img.height, 0) + 
                     (images.length - 1) * settings.spacing;
    }
    
    // 如果设置了比例预设，调整尺寸以匹配目标比例
    if (settings.canvasSizeMode === 'preset' && settings.canvasPreset) {
      // 根据当前方向生成预设列表
      const presets = generatePresets(settings.canvasOrientation);
      const preset = presets.find(p => p.name === settings.canvasPreset);
      if (preset) {
        const targetRatio = preset.width / preset.height;
        const naturalRatio = naturalWidth / naturalHeight;
        
        // 根据目标比例调整尺寸，确保图片内容完整显示
        if (naturalRatio > targetRatio) {
          // 自然宽度相对更大，以宽度为准调整高度
          naturalHeight = naturalWidth / targetRatio;
        } else {
          // 自然高度相对更大，以高度为准调整宽度
          naturalWidth = naturalHeight * targetRatio;
        }
      }
    } else if (settings.canvasSizeMode === 'custom' && settings.customWidth && settings.customHeight) {
      // 自定义尺寸模式：使用指定的固定尺寸（包含内边距）
      return { 
        canvasWidth: settings.customWidth, 
        canvasHeight: settings.customHeight 
      };
    }
    
    return { 
      canvasWidth: naturalWidth + paddingHorizontal, 
      canvasHeight: naturalHeight + paddingVertical 
    };
  }

  private static async drawImages(
    ctx: CanvasRenderingContext2D,
    images: HTMLImageElement[],
    settings: SpliceSettings,
    canvasWidth: number,
    canvasHeight: number
  ): Promise<void> {
    const borderOffset = settings.borderWidth;
    const paddingLeft = settings.paddingLeft;
    const paddingTop = settings.paddingTop;
    const paddingRight = settings.paddingRight;
    const paddingBottom = settings.paddingBottom;
    
    // 计算内容区域的尺寸（减去边框和内边距）
    const contentWidth = canvasWidth - borderOffset * 2 - paddingLeft - paddingRight;
    const contentHeight = canvasHeight - borderOffset * 2 - paddingTop - paddingBottom;
    
    // 重新设计对齐逻辑：先计算拼接组合的总尺寸，然后在画布中对齐
    
    // 1. 计算拼接组合的自然尺寸
    let spliceWidth: number;
    let spliceHeight: number;
    
    if (settings.direction === 'horizontal') {
      spliceWidth = images.reduce((sum, img) => sum + img.width, 0) + (images.length - 1) * settings.spacing;
      spliceHeight = Math.max(...images.map(img => img.height));
    } else {
      spliceWidth = Math.max(...images.map(img => img.width));
      spliceHeight = images.reduce((sum, img) => sum + img.height, 0) + (images.length - 1) * settings.spacing;
    }
    
    // 2. 根据水平对齐计算拼接组合的起始 X 位置
    let spliceStartX: number;
    switch (settings.horizontalAlignment) {
      case 'start':
        spliceStartX = borderOffset + paddingLeft;
        break;
      case 'center':
        spliceStartX = borderOffset + paddingLeft + (contentWidth - spliceWidth) / 2;
        break;
      case 'end':
        spliceStartX = borderOffset + paddingLeft + contentWidth - spliceWidth;
        break;
    }
    
    // 3. 根据垂直对齐计算拼接组合的起始 Y 位置
    let spliceStartY: number;
    switch (settings.verticalAlignment) {
      case 'start':
        spliceStartY = borderOffset + paddingTop;
        break;
      case 'center':
        spliceStartY = borderOffset + paddingTop + (contentHeight - spliceHeight) / 2;
        break;
      case 'end':
        spliceStartY = borderOffset + paddingTop + contentHeight - spliceHeight;
        break;
    }
    
    // 4. 在计算出的起始位置上绘制图片
    let currentX = spliceStartX;
    let currentY = spliceStartY;

    for (const img of images) {
      let x = currentX;
      let y = currentY;
      
      // 在拼接组合内部的对齐调整
      if (settings.direction === 'horizontal') {
        // 横向拼接：在垂直方向上对齐各个图片
        switch (settings.verticalAlignment) {
          case 'start':
            y = spliceStartY;
            break;
          case 'center':
            y = spliceStartY + (spliceHeight - img.height) / 2;
            break;
          case 'end':
            y = spliceStartY + spliceHeight - img.height;
            break;
        }
      } else {
        // 纵向拼接：在水平方向上对齐各个图片
        switch (settings.horizontalAlignment) {
          case 'start':
            x = spliceStartX;
            break;
          case 'center':
            x = spliceStartX + (spliceWidth - img.width) / 2;
            break;
          case 'end':
            x = spliceStartX + spliceWidth - img.width;
            break;
        }
      }
        
        // 绘制图片
        ctx.drawImage(img, x, y);
        
        // 更新位置以便绘制下一张图片
        if (settings.direction === 'horizontal') {
          currentX += img.width + settings.spacing;
        } else {
          currentY += img.height + settings.spacing;
        }
      }
  }
}

// 图片压缩处理
export class ImageCompressor {
  static async compressImage(
    imageFile: ImageFile, 
    settings: CompressionSettings
  ): Promise<{ canvas: HTMLCanvasElement; originalSize: number; compressedSize: number }> {
    const img = await this.loadImage(imageFile.url);
    
    // 计算新尺寸
    const { width, height } = this.calculateNewSize(img, settings);
    
    // 创建画布
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, width, height);
    
    // 估算压缩后大小
    const compressedSize = this.estimateCompressedSize(canvas, settings);
    
    return {
      canvas,
      originalSize: imageFile.size,
      compressedSize
    };
  }

  private static loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  private static calculateNewSize(
    img: HTMLImageElement, 
    settings: CompressionSettings
  ): { width: number; height: number } {
    let { width, height } = settings;
    
    if (!width && !height) {
      return { width: img.width, height: img.height };
    }
    
    if (settings.maintainAspectRatio) {
      const aspectRatio = img.width / img.height;
      
      if (width && !height) {
        height = width / aspectRatio;
      } else if (height && !width) {
        width = height * aspectRatio;
      } else if (width && height) {
        // 保持比例，使用较小的缩放比例
        const scaleX = width / img.width;
        const scaleY = height / img.height;
        const scale = Math.min(scaleX, scaleY);
        width = img.width * scale;
        height = img.height * scale;
      }
    }
    
    return { 
      width: width || img.width, 
      height: height || img.height 
    };
  }

  private static estimateCompressedSize(
    canvas: HTMLCanvasElement, 
    settings: CompressionSettings
  ): number {
    // 简单估算：基于像素数量和质量设置
    const pixels = canvas.width * canvas.height;
    const baseSize = pixels * (settings.format === 'png' ? 4 : 3);
    const qualityFactor = settings.quality / 100;
    return Math.round(baseSize * qualityFactor);
  }
}

// 文字渲染器
export class TextRenderer {
  static drawText(
    ctx: CanvasRenderingContext2D,
    element: TextElement,
    isSelected: boolean = false
  ): void {
    ctx.save();
    
    // 设置字体样式
    ctx.font = `${element.fontStyle} ${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
    ctx.fillStyle = element.color;
    ctx.textAlign = element.textAlign;
    ctx.globalAlpha = element.opacity;
    
    // 分割文本为多行
    const lines = element.text.split('\n');
    const lineHeight = element.fontSize * 1.2; // 行高为字体大小的1.2倍
    
    // 应用旋转
    if (element.rotation !== 0) {
      // 计算文字的几何中心点
      const { width, height } = this.measureText(element);
      let centerX = element.x;
      const centerY = element.y - height / 2;
      
      // 根据对齐方式调整中心点的 x 坐标
      switch (element.textAlign) {
        case 'center':
          // 居中对齐时，x 坐标已经是中心
          break;
        case 'right':
          // 右对齐时，需要向左偏移宽度的一半
          centerX = element.x - width / 2;
          break;
        case 'left':
        default:
          // 左对齐时，需要向右偏移宽度的一半
          centerX = element.x + width / 2;
          break;
      }
      
      // 以几何中心为旋转中心
      ctx.translate(centerX, centerY);
      ctx.rotate((element.rotation * Math.PI) / 180);
      
      // 计算文字相对于旋转中心的偏移
      const textOffsetX = element.x - centerX;
      const textOffsetY = element.y - centerY;
      
      // 绘制多行文字
      lines.forEach((line, index) => {
        ctx.fillText(line, textOffsetX, textOffsetY + index * lineHeight);
      });
      
      // 绘制选中状态的边框
      if (isSelected) {
        this.drawSelectionBorder(ctx, element, true);
      }
    } else {
      // 绘制多行文字
      lines.forEach((line, index) => {
        ctx.fillText(line, element.x, element.y + index * lineHeight);
      });
      
      // 绘制选中状态的边框
      if (isSelected) {
        this.drawSelectionBorder(ctx, element, false);
      }
    }
    
    ctx.restore();
  }

  static drawSelectionBorder(
    ctx: CanvasRenderingContext2D,
    element: TextElement,
    isRotated: boolean = false
  ): void {
    const { width, height } = this.measureText(element);
    const padding = 4;
    
    ctx.save();
    
    // 设置边框样式 - 优化为更明显的显示
    ctx.strokeStyle = '#2563eb'; // 更深的蓝色
    ctx.lineWidth = 3; // 增加线宽
    ctx.setLineDash([8, 4]); // 调整虚线样式，更长的实线段
    ctx.globalAlpha = 1; // 完全不透明
    
    let x, y;
    
    if (isRotated) {
      // 对于旋转的文字，边框应该在旋转后的坐标系中绘制
      // 此时我们已经在以几何中心为原点的坐标系中
      // 需要计算文字相对于几何中心的偏移，然后围绕它绘制边框
      
      const { width: textWidth, height: textHeight } = this.measureText(element);
      
      // 计算几何中心
      let centerX = element.x;
      const centerY = element.y - textHeight / 2;
      
      switch (element.textAlign) {
        case 'center':
          break;
        case 'right':
          centerX = element.x - textWidth / 2;
          break;
        case 'left':
        default:
          centerX = element.x + textWidth / 2;
          break;
      }
      
      // 文字相对于几何中心的偏移
      const textOffsetX = element.x - centerX;
      const textOffsetY = element.y - centerY;
      
      // 边框应该围绕文字的边界，考虑对齐方式
      switch (element.textAlign) {
        case 'center':
          x = textOffsetX - textWidth / 2;
          break;
        case 'right':
          x = textOffsetX - textWidth;
          break;
        case 'left':
        default:
          x = textOffsetX;
          break;
      }
      
      // 边框顶部位置
      y = textOffsetY - element.fontSize;
    } else {
      // 非旋转文字的边框计算
      switch (element.textAlign) {
        case 'center':
          x = element.x - width / 2;
          break;
        case 'right':
          x = element.x - width;
          break;
        case 'left':
        default:
          x = element.x;
          break;
      }
      y = element.y - element.fontSize;
    }

    
    // 确定边框的宽度和高度
    const borderWidth = width;
    const borderHeight = height;
    
    // 先绘制阴影边框（白色描边提高对比度）
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.setLineDash([8, 4]);
    ctx.globalAlpha = 0.8;
    ctx.strokeRect(
      x - padding,
      y - padding,
      borderWidth + padding * 2,
      borderHeight + padding * 2
    );
    ctx.restore();
    
    // 绘制主选中边框
    ctx.strokeRect(
      x - padding,
      y - padding,
      borderWidth + padding * 2,
      borderHeight + padding * 2
    );
    
    // 绘制控制点 - 优化为更明显的圆形控制点
    const controlPoints = [
      { x: x - padding, y: y - padding }, // 左上
      { x: x + borderWidth + padding, y: y - padding }, // 右上
      { x: x + borderWidth + padding, y: y + borderHeight + padding }, // 右下
      { x: x - padding, y: y + borderHeight + padding }, // 左下
    ];
    
    ctx.setLineDash([]);
    controlPoints.forEach(point => {
      // 绘制白色外圈
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      // 绘制蓝色内圈
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    ctx.restore();
  }

  // 检测是否点击了控制点
  static getClickedControlPoint(
    element: TextElement,
    pointX: number,
    pointY: number
  ): { index: number; type: 'corner' } | null {
    const { width, height } = this.measureText(element);
    const padding = 4;
    
    // 计算控制点位置
    let x, y;
    
    if (element.rotation !== 0) {
      // 旋转文字的控制点计算
      const { width: textWidth, height: textHeight } = this.measureText(element);
      let centerX = element.x;
      const centerY = element.y - textHeight / 2;
      
      switch (element.textAlign) {
        case 'center':
          break;
        case 'right':
          centerX = element.x - textWidth / 2;
          break;
        case 'left':
        default:
          centerX = element.x + textWidth / 2;
          break;
      }
      
      const textOffsetX = element.x - centerX;
      const textOffsetY = element.y - centerY;
      
      switch (element.textAlign) {
        case 'center':
          x = textOffsetX - textWidth / 2;
          break;
        case 'right':
          x = textOffsetX - textWidth;
          break;
        case 'left':
        default:
          x = textOffsetX;
          break;
      }
      
      y = textOffsetY - element.fontSize;
      
      // 旋转控制点坐标
      const cos = Math.cos((element.rotation * Math.PI) / 180);
      const sin = Math.sin((element.rotation * Math.PI) / 180);
      
      const controlPoints = [
        { x: x - padding, y: y - padding }, // 左上
        { x: x + width + padding, y: y - padding }, // 右上
        { x: x + width + padding, y: y + height + padding }, // 右下
        { x: x - padding, y: y + height + padding }, // 左下
      ];
      
      // 将控制点坐标转换到全局坐标系
      const globalControlPoints = controlPoints.map(point => ({
        x: centerX + (cos * point.x - sin * point.y),
        y: centerY + (sin * point.x + cos * point.y)
      }));
      
      // 检测点击
      for (let i = 0; i < globalControlPoints.length; i++) {
        const point = globalControlPoints[i];
        const distance = Math.sqrt(
          Math.pow(pointX - point.x, 2) + Math.pow(pointY - point.y, 2)
        );
        if (distance <= 8) { // 控制点半径 + 容错
          return { index: i, type: 'corner' };
        }
      }
    } else {
      // 非旋转文字的控制点计算
      switch (element.textAlign) {
        case 'center':
          x = element.x - width / 2;
          break;
        case 'right':
          x = element.x - width;
          break;
        case 'left':
        default:
          x = element.x;
          break;
      }
      y = element.y - element.fontSize;
      
      const controlPoints = [
        { x: x - padding, y: y - padding }, // 左上
        { x: x + width + padding, y: y - padding }, // 右上
        { x: x + width + padding, y: y + height + padding }, // 右下
        { x: x - padding, y: y + height + padding }, // 左下
      ];
      
      // 检测点击
      for (let i = 0; i < controlPoints.length; i++) {
        const point = controlPoints[i];
        const distance = Math.sqrt(
          Math.pow(pointX - point.x, 2) + Math.pow(pointY - point.y, 2)
        );
        if (distance <= 8) { // 控制点半径 + 容错
          return { index: i, type: 'corner' };
        }
      }
    }
    
    return null;
  }

  static measureText(
    element: TextElement
  ): { width: number; height: number } {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    ctx.font = `${element.fontStyle} ${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
    
    // 分割文本为多行
    const lines = element.text.split('\n');
    const lineHeight = element.fontSize * 1.2;
    
    // 计算最大宽度
    let maxWidth = 0;
    lines.forEach(line => {
      const metrics = ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
    });
    
    // 计算总高度
    const totalHeight = lines.length * lineHeight;
    
    return {
      width: maxWidth,
      height: totalHeight
    };
  }

  static getTextBounds(element: TextElement): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const { width, height } = this.measureText(element);
    let x = element.x;
    // 对于多行文字，y坐标应该是第一行的顶部
    const y = element.y - element.fontSize;
    
    // 根据文字对齐方式调整边界
    switch (element.textAlign) {
      case 'center':
        x = element.x - width / 2;
        break;
      case 'right':
        x = element.x - width;
        break;
      case 'left':
      default:
        x = element.x;
        break;
    }
    
    return { x, y, width, height };
  }

  static isPointInText(
    element: TextElement,
    pointX: number,
    pointY: number
  ): boolean {
    const bounds = this.getTextBounds(element);
    const padding = 4; // 增加一些点击容错
    
    // 如果有旋转，需要进行坐标变换
    if (element.rotation !== 0) {
      // 计算文字的几何中心点（与渲染时保持一致）
      const { width, height } = this.measureText(element);
      let centerX = element.x;
      const centerY = element.y - height / 2;
      
      // 根据对齐方式调整中心点的 x 坐标
      switch (element.textAlign) {
        case 'center':
          break;
        case 'right':
          centerX = element.x - width / 2;
          break;
        case 'left':
        default:
          centerX = element.x + width / 2;
          break;
      }
      
      // 将点击点转换到文字的本地坐标系（逆旋转）
      const cos = Math.cos((-element.rotation * Math.PI) / 180);
      const sin = Math.sin((-element.rotation * Math.PI) / 180);
      
      // 先将点击点转换为相对于旋转中心的坐标
      const relativeX = pointX - centerX;
      const relativeY = pointY - centerY;
      
      // 应用逆旋转变换
      const rotatedX = cos * relativeX - sin * relativeY;
      const rotatedY = sin * relativeX + cos * relativeY;
      
      // 转换回绝对坐标
      const localX = rotatedX + centerX;
      const localY = rotatedY + centerY;
      
      return (
        localX >= bounds.x - padding &&
        localX <= bounds.x + bounds.width + padding &&
        localY >= bounds.y - padding &&
        localY <= bounds.y + bounds.height + padding
      );
    }
    
    return (
      pointX >= bounds.x - padding &&
      pointX <= bounds.x + bounds.width + padding &&
      pointY >= bounds.y - padding &&
      pointY <= bounds.y + bounds.height + padding
    );
  }
}

// 图标渲染器
export class IconRenderer {
  static drawIcon(
    ctx: CanvasRenderingContext2D,
    element: IconElement
  ): void {
    // 这里需要根据实际的图标库实现
    // 暂时用简单的形状代替
    ctx.save();
    
    ctx.globalAlpha = element.opacity;
    ctx.fillStyle = element.color;
    
    // 应用旋转
    if (element.rotation !== 0) {
      ctx.translate(element.x + element.size / 2, element.y + element.size / 2);
      ctx.rotate((element.rotation * Math.PI) / 180);
      ctx.translate(-element.size / 2, -element.size / 2);
    } else {
      ctx.translate(element.x, element.y);
    }
    
    // 绘制简单图标（圆形）
    ctx.beginPath();
    ctx.arc(element.size / 2, element.size / 2, element.size / 2, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.restore();
  }
}

// 导出处理器
export class ImageExporter {
  static async exportCanvas(
    canvas: HTMLCanvasElement,
    settings: ExportSettings
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const mimeType = this.getMimeType(settings.format);
      const quality = settings.quality / 100;
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to export image'));
          }
        },
        mimeType,
        quality
      );
    });
  }

  static async downloadImage(
    canvas: HTMLCanvasElement,
    filename: string,
    settings: ExportSettings
  ): Promise<void> {
    const blob = await this.exportCanvas(canvas, settings);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${settings.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  private static getMimeType(format: string): string {
    switch (format) {
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }
}

// 综合处理器
export class ImageProcessor {
  static async processImages(
    allImages: ImageFile[],
    selectedImageIds: string[],
    spliceSettings: SpliceSettings,
    compressionSettings: CompressionSettings,
    textElements: TextElement[],
    iconElements: IconElement[],
    selectedTextId?: string
  ): Promise<HTMLCanvasElement> {
    // 获取选中的图片，如果没有选中则使用所有图片
    const imagesToProcess = selectedImageIds.length > 0 
      ? allImages.filter(img => selectedImageIds.includes(img.id))
      : allImages;

    if (imagesToProcess.length === 0) {
      throw new Error('No images to process');
    }

    // 首先拼接图片
    let canvas: HTMLCanvasElement;
    
    if (imagesToProcess.length > 1) {
      canvas = await ImageSplicer.spliceImages(imagesToProcess, spliceSettings);
    } else if (imagesToProcess.length === 1) {
      // 单张图片，使用拼接器处理以支持画布尺寸设置
      canvas = await ImageSplicer.spliceImages(imagesToProcess, spliceSettings);
    } else {
      throw new Error('No images to process');
    }

    const ctx = canvas.getContext('2d')!;

    // 添加文字元素
    textElements.forEach(textElement => {
      const isSelected = selectedTextId === textElement.id;
      TextRenderer.drawText(ctx, textElement, isSelected);
    });

    // 添加图标元素
    iconElements.forEach(iconElement => {
      IconRenderer.drawIcon(ctx, iconElement);
    });

    // 应用压缩（如果需要）
    if (compressionSettings.width || compressionSettings.height || compressionSettings.quality < 100) {
      const tempImageFile: ImageFile = {
        id: 'temp',
        file: new File([], 'temp'),
        url: canvas.toDataURL(),
        width: canvas.width,
        height: canvas.height,
        size: 0,
        name: 'temp'
      };
      
      const { canvas: compressedCanvas } = await ImageCompressor.compressImage(
        tempImageFile, 
        compressionSettings
      );
      
      return compressedCanvas;
    }

    return canvas;
  }

  private static loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
}