import { useCallback } from 'react';
import { useEditStore } from '../stores';
import { toast } from 'sonner';

export const useFileUpload = () => {
  const addImages = useEditStore(state => state.addImages);

  const handleFileSelect = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // 过滤图片文件
    const imageFiles = fileArray.filter(file => {
      return file.type.startsWith('image/');
    });

    if (imageFiles.length === 0) {
      toast.error('请选择有效的图片文件');
      return;
    }

    if (imageFiles.length !== fileArray.length) {
      toast.warning(`已过滤掉 ${fileArray.length - imageFiles.length} 个非图片文件`);
    }

    try {
      await addImages(imageFiles);
      toast.success(`成功添加 ${imageFiles.length} 张图片`);
    } catch (error) {
      console.error('Failed to add images:', error);
      toast.error('添加图片失败，请重试');
    }
  }, [addImages]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const openFileDialog = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        handleFileSelect(target.files);
      }
    };
    input.click();
  }, [handleFileSelect]);

  return {
    handleFileSelect,
    handleDrop,
    handleDragOver,
    openFileDialog,
  };
};