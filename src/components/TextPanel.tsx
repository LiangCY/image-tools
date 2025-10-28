import React, { useState } from 'react';
import { useEditStore } from '../stores';
import { TextElement } from '../types';
import * as Select from '@radix-ui/react-select';
import { 
  Plus, 
  Trash2, 
  Bold,
  Italic,
  Eye,
  EyeOff,
  ChevronDown,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

const TextPanel: React.FC = () => {
  const { 
    textElements, 
    selectedElementId,
    selectedElementType,
    addTextElement, 
    updateTextElement, 
    removeTextElement,
    selectElement,
    canvasSettings
  } = useEditStore();

  const [newText, setNewText] = useState('');

  // 根据背景色自动选择合适的文字颜色
  const getContrastColor = (backgroundColor: string): string => {
    // 移除 # 符号
    const hex = backgroundColor.replace('#', '');
    
    // 转换为 RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // 计算亮度
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // 如果背景较亮，返回黑色；如果背景较暗，返回白色
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  // 颜色选项
  const colorOptions = [
    { value: '#000000', label: '黑色', color: '#000000' },
    { value: '#FFFFFF', label: '白色', color: '#FFFFFF' },
    { value: '#FF0000', label: '红色', color: '#FF0000' },
    { value: '#00FF00', label: '绿色', color: '#00FF00' },
    { value: '#0000FF', label: '蓝色', color: '#0000FF' },
    { value: '#FFFF00', label: '黄色', color: '#FFFF00' },
    { value: '#FF00FF', label: '紫红色', color: '#FF00FF' },
    { value: '#00FFFF', label: '青色', color: '#00FFFF' },
    { value: '#FFA500', label: '橙色', color: '#FFA500' },
    { value: '#800080', label: '紫色', color: '#800080' },
    { value: '#FFC0CB', label: '粉色', color: '#FFC0CB' },
    { value: '#A52A2A', label: '棕色', color: '#A52A2A' },
    { value: '#808080', label: '灰色', color: '#808080' },
    { value: '#000080', label: '深蓝色', color: '#000080' },
    { value: '#008000', label: '深绿色', color: '#008000' },
  ];


  const selectedText = textElements.find(text => 
    text.id === selectedElementId && selectedElementType === 'text'
  );

  // 添加新文字
  const handleAddText = () => {
    if (!newText.trim()) {
      toast.error('请输入文字内容');
      return;
    }



    const newTextElement: Omit<TextElement, 'id'> = {
      text: newText.trim(),
      x: 100,
      y: 100,
      fontSize: 24,
      fontFamily: 'Arial, sans-serif',
      color: getContrastColor(canvasSettings.backgroundColor),
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      rotation: 0,
      opacity: 1
    };

    addTextElement(newTextElement);
    setNewText('');
    toast.success('文字已添加');
  };

  // 快速添加预设文字
  const handleQuickAddText = (text: string) => {

    // 根据文字类型设置不同的样式
    let fontSize = 24;
    let fontWeight: 'normal' | 'bold' = 'normal';
    let color = '#000000';
    let opacity = 1;

    switch (text) {
      case '标题文字':
        fontSize = 32;
        fontWeight = 'bold';
        break;
      case '描述文字':
        fontSize = 18;
        color = '#666666';
        break;
      case '水印':
        fontSize = 16;
        color = '#cccccc';
        opacity = 0.7;
        break;
    }

    const newTextElement: Omit<TextElement, 'id'> = {
      text,
      x: 100 + textElements.length * 20, // 避免重叠
      y: 100 + textElements.length * 20,
      fontSize,
      fontFamily: 'Arial, sans-serif',
      color: getContrastColor(canvasSettings.backgroundColor), // 使用自动选择的颜色
      fontWeight,
      fontStyle: 'normal',
      textAlign: 'left',
      rotation: 0,
      opacity
    };

    addTextElement(newTextElement);
    // 自动选中新添加的文字
    setTimeout(() => {
      const newElement = textElements[textElements.length];
      if (newElement) {
        selectElement(newElement.id, 'text');
      }
    }, 100);
    toast.success(`${text}已添加`);
  };

  // 删除文字
  const handleRemoveText = (id: string) => {
    removeTextElement(id);
    toast.success('文字已删除');
  };

  // 更新文字属性
  const updateText = (updates: Partial<TextElement>) => {
    if (selectedElementId && selectedElementType === 'text') {
      updateTextElement(selectedElementId, updates);
    }
  };

  // 预设字体列表
  const fontFamilies = [
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Helvetica, sans-serif', label: 'Helvetica' },
    { value: '"Times New Roman", serif', label: 'Times New Roman' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: '"Courier New", monospace', label: 'Courier New' },
    { value: '"Microsoft YaHei", sans-serif', label: '微软雅黑' },
    { value: '"SimHei", sans-serif', label: '黑体' },
    { value: '"SimSun", serif', label: '宋体' },
    { value: '"KaiTi", serif', label: '楷体' }
  ];

  return (
    <div className="space-y-6">
      {/* 状态提示 */}
      <div className="border rounded-lg p-3 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800">
          在画布上添加和编辑文字元素
        </p>
      </div>

      {/* 添加新文字 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          添加文字
        </label>
        <div className="space-y-3">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="输入要添加的文字..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
disabled={false}
          />
          <button
            onClick={handleAddText}
disabled={!newText.trim()}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>添加文字</span>
          </button>
          
          {/* 快速添加按钮 */}
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              快速添加
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickAddText('标题文字')}
                disabled={false}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                title="添加标题文字"
              >
                标题
              </button>
              <button
                onClick={() => handleQuickAddText('描述文字')}
                disabled={false}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                title="添加描述文字"
              >
                描述
              </button>
              <button
                onClick={() => handleQuickAddText('水印')}
                disabled={false}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                title="添加水印文字"
              >
                水印
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 文字列表 */}
      {textElements.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            文字列表 ({textElements.length})
          </label>
          <div className="space-y-2">
            {textElements.map((textElement) => (
              <div
                key={textElement.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedElementId === textElement.id && selectedElementType === 'text'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => selectElement(textElement.id, 'text')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {textElement.text}
                    </p>
                    <p className="text-xs text-gray-500">
                      {textElement.fontSize}px • {textElement.color}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTextElement(textElement.id, { 
                          opacity: textElement.opacity === 1 ? 0.5 : 1 
                        });
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title={textElement.opacity === 1 ? '隐藏' : '显示'}
                    >
                      {textElement.opacity === 1 ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveText(textElement.id);
                      }}
                      className="p-1 text-red-400 hover:text-red-600 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 文字编辑面板 */}
      {selectedText && (
        <div className="border-t pt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">编辑文字</h4>
          
          <div className="space-y-4">
            {/* 文字内容 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                文字内容
              </label>
              <textarea
                value={selectedText.text}
                onChange={(e) => updateText({ text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={2}
              />
            </div>

            {/* 字体设置 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  字体
                </label>
                <select
                  value={selectedText.fontFamily}
                  onChange={(e) => updateText({ fontFamily: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {fontFamilies.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  大小
                </label>
                <input
                  type="number"
                  min="8"
                  max="200"
                  value={selectedText.fontSize}
                  onChange={(e) => updateText({ fontSize: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 样式和颜色 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                样式和颜色
              </label>
              <div className="flex items-center space-x-3">
                {/* 样式按钮 */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateText({ 
                      fontWeight: selectedText.fontWeight === 'bold' ? 'normal' : 'bold' 
                    })}
                    className={`p-2 border rounded-lg transition-all ${
                      selectedText.fontWeight === 'bold'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    title="粗体"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateText({ 
                      fontStyle: selectedText.fontStyle === 'italic' ? 'normal' : 'italic' 
                    })}
                    className={`p-2 border rounded-lg transition-all ${
                      selectedText.fontStyle === 'italic'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    title="斜体"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                </div>
                
                {/* 颜色下拉选择 */}
                <div className="flex-1">
                  <Select.Root
                    value={selectedText.color}
                    onValueChange={(value) => updateText({ color: value })}
                  >
                    <Select.Trigger className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white flex items-center justify-between hover:border-gray-400 transition-colors">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: selectedText.color }}
                        />
                        <Select.Value>
                          {colorOptions.find(option => option.value === selectedText.color)?.label || '选择颜色'}
                        </Select.Value>
                      </div>
                      <Select.Icon>
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      </Select.Icon>
                    </Select.Trigger>

                    <Select.Portal>
                      <Select.Content className="bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                        <Select.Viewport className="p-1">
                          {colorOptions.map((option) => (
                            <Select.Item
                              key={option.value}
                              value={option.value}
                              className="flex items-center space-x-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none rounded data-[highlighted]:bg-gray-100"
                            >
                              <div 
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: option.color }}
                              />
                              <Select.ItemText>{option.label}</Select.ItemText>
                              <Select.ItemIndicator className="ml-auto">
                                <Check className="w-4 h-4 text-blue-600" />
                              </Select.ItemIndicator>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
              </div>
            </div>

            {/* 位置和尺寸 */}
            <div className="space-y-3">
              {/* 位置 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    X 位置
                  </label>
                  <input
                    type="number"
                    value={Math.round(selectedText.x)}
                    onChange={(e) => updateText({ x: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Y 位置
                  </label>
                  <input
                    type="number"
                    value={Math.round(selectedText.y)}
                    onChange={(e) => updateText({ y: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* 尺寸信息 */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  💡 文字尺寸会根据字体大小自动调整，可以在画布上直接拖拽调整位置
                </p>
              </div>
            </div>

            {/* 旋转角度 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                旋转角度
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={selectedText.rotation}
                  onChange={(e) => updateText({ rotation: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs text-gray-600 w-8">
                  {selectedText.rotation}°
                </span>
                <button
                  onClick={() => updateText({ rotation: 0 })}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border transition-colors"
                  title="重置为0度"
                  disabled={selectedText.rotation === 0}
                >
                  重置
                </button>
              </div>
            </div>

            {/* 透明度 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                透明度
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedText.opacity}
                  onChange={(e) => updateText({ opacity: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs text-gray-600 w-8">
                  {Math.round(selectedText.opacity * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 操作提示 */}
      {false && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            💡 提示：请先在左侧添加图片，然后就可以在图片上添加文字了。
          </p>
        </div>
      )}

      {textElements.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 font-medium mb-2">
            📝 如何添加文字：
          </p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 在上方输入框中输入文字内容，然后点击"添加文字"按钮</li>
            <li>• 或者使用下方的快速添加按钮（标题、描述、水印）</li>
          </ul>
        </div>
      )}

      {textElements.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">
            ✅ 文字已添加！点击文字列表中的项目可以编辑样式和位置。
          </p>
          <p className="text-sm text-green-800 mt-1">
            🖱️ 在画布上点击文字可以选中，拖拽可以调整位置！
          </p>
        </div>
      )}
    </div>
  );
};

export default TextPanel;