// 创建测试图片的工具函数
export const createTestImage = (
  width: number, 
  height: number, 
  color: string, 
  text: string
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // 绘制背景
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    // 绘制文字
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
    
    // 转换为Blob然后创建File
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `test-${text.toLowerCase()}.png`, {
          type: 'image/png'
        });
        resolve(file);
      }
    }, 'image/png');
  });
};

export const createTestImages = async (): Promise<File[]> => {
  const images = await Promise.all([
    createTestImage(200, 150, '#ff6b6b', '图片1'),
    createTestImage(180, 160, '#4ecdc4', '图片2'),
    createTestImage(220, 140, '#45b7d1', '图片3'),
  ]);
  
  return images;
};