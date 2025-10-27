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
    element: TextElement
  ): void {
    ctx.save();
    
    // 设置字体样式
    ctx.font = `${element.fontStyle} ${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
    ctx.fillStyle = element.color;
    ctx.textAlign = element.textAlign;
    ctx.globalAlpha = element.opacity;
    
    // 应用旋转
    if (element.rotation !== 0) {
      ctx.translate(element.x, element.y);
      ctx.rotate((element.rotation * Math.PI) / 180);
      ctx.fillText(element.text, 0, 0);
    } else {
      ctx.fillText(element.text, element.x, element.y);
    }
    
    ctx.restore();
  }

  static measureText(
    element: TextElement
  ): { width: number; height: number } {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    ctx.font = `${element.fontStyle} ${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
    const metrics = ctx.measureText(element.text);
    
    return {
      width: metrics.width,
      height: element.fontSize
    };
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
    iconElements: IconElement[]
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
      TextRenderer.drawText(ctx, textElement);
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