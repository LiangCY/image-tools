import React from 'react';
import { Eye, EyeOff, Lock, Unlock, Trash2 } from 'lucide-react';
import { BaseElement } from '../../types';
import { getListItemStyle } from '../../utils/styles';

interface ElementListItemProps {
  element: BaseElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<BaseElement>) => void;
  onDelete: () => void;
  children: React.ReactNode; // 元素特定的内容
  showControls?: boolean;
}

const ElementListItem: React.FC<ElementListItemProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  children,
  showControls = true,
}) => {
  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ visible: !element.visible });
  };

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ locked: !element.locked });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      className={getListItemStyle(isSelected, element.locked)}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        {/* 主要内容 */}
        <div className="flex-1 min-w-0">
          {children}
        </div>

        {/* 控制按钮 */}
        {showControls && (
          <div className="flex items-center space-x-1 ml-2">
            {/* 可见性切换 */}
            <button
              onClick={handleToggleVisibility}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={element.visible ? '隐藏' : '显示'}
            >
              {element.visible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>

            {/* 锁定切换 */}
            <button
              onClick={handleToggleLock}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={element.locked ? '解锁' : '锁定'}
            >
              {element.locked ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
            </button>

            {/* 删除按钮 */}
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 元素信息 */}
      <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
        <span>
          位置: ({Math.round(element.x)}, {Math.round(element.y)})
        </span>
        <span>
          层级: {element.zIndex}
        </span>
      </div>
    </div>
  );
};

export default ElementListItem;