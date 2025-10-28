// 这个 hook 已经不再使用，图片上传逻辑已移到 ImagePanel 组件中
// 保留空的实现以避免破坏现有的导入

export const useFileUpload = () => {
  return {
    handleFileSelect: () => {},
    handleDrop: () => {},
    handleDragOver: () => {},
    openFileDialog: () => {},
  };
};