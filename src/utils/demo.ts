import { useEditStore } from '../stores';
import { createTestImages } from './testImages';

// 演示完整工作流程的函数
export const runDemo = async () => {
  const store = useEditStore.getState();
  
  try {
    // 1. 清空当前状态
    store.reset();
    
    // 2. 加载测试图片
    const testImages = await createTestImages();
    for (const file of testImages) {
      await store.addImageElement(file);
    }
    
    // 等待图片加载
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 4. 设置拼接参数
    store.updateSpliceSettings({
      direction: 'horizontal',
      spacing: 20,
      horizontalAlignment: 'center',
      verticalAlignment: 'center',
      backgroundColor: '#f0f9ff',
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#3b82f6',
      paddingTop: 20,
      paddingRight: 20,
      paddingBottom: 20,
      paddingLeft: 20,
    });
    
    // 5. 切换到拼接工具
    store.setActiveTool('splice');
    
    return {
      success: true,
      message: '演示设置完成！您现在可以在拼接面板中查看效果，然后切换到导出工具保存图片。'
    };
  } catch (error) {
    console.error('Demo failed:', error);
    return {
      success: false,
      message: '演示设置失败，请重试。'
    };
  }
};