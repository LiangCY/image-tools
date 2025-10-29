import React from 'react';
import { useEditStore } from '../stores';
import { LayerElement } from '../types';
import {
  Image as ImageIcon,
  Type,
  Star,
  Trash2,
  GripVertical
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 可排序的图层项组件
interface SortableLayerItemProps {
  layer: LayerElement;
  isSelected: boolean;
  onLayerClick: (layer: LayerElement) => void;
  onDeleteLayer: (layer: LayerElement, e: React.MouseEvent) => void;
}

const SortableLayerItem: React.FC<SortableLayerItemProps> = ({
  layer,
  isSelected,
  onLayerClick,
  onDeleteLayer,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: layer.id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const getLayerIcon = (type: LayerElement['type']) => {
    switch (type) {
      case 'image':
        return ImageIcon;
      case 'text':
        return Type;
      case 'icon':
        return Star;
      default:
        return ImageIcon;
    }
  };

  const IconComponent = getLayerIcon(layer.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center p-2 rounded-lg border transition-all duration-200 ${
        isSelected
          ? 'bg-blue-50 border-blue-200 text-blue-700'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      } ${isDragging ? 'opacity-30 bg-gray-100 border-gray-300' : 'cursor-pointer'}`}
    >
      {/* 拖拽手柄 */}
      <div
        {...attributes}
        {...listeners}
        className={`flex items-center justify-center w-6 h-6 mr-2 cursor-grab active:cursor-grabbing transition-all duration-200 ${
          isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <GripVertical className={`w-4 h-4 transition-colors ${isDragging ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`} />
      </div>

      {/* 图层图标和名称 */}
      <div 
        className="flex items-center flex-1 min-w-0"
        onClick={() => onLayerClick(layer)}
      >
        <IconComponent className="w-4 h-4 mr-2 flex-shrink-0" />
        <span className="text-sm truncate">{layer.name}</span>
      </div>

      {/* 删除按钮 - 只在悬停时显示，不占据空间 */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded shadow-sm border">
        <button
          onClick={(e) => onDeleteLayer(layer, e)}
          className="p-1 rounded hover:bg-red-100 text-red-500"
          title="删除"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

const LayersPanel: React.FC = () => {
  const {
    getAllLayers,
    selectElement,
    selectedElementId,
    removeImageElement,
    removeTextElement,
    removeIconElement,
    updateImageElement,
    updateTextElement,
    updateIconElement,
    forceRenderCanvas
  } = useEditStore();

  const layers = getAllLayers();
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleLayerClick = (layer: LayerElement) => {
    selectElement(layer.id, layer.type);
  };

  const handleDeleteLayer = (layer: LayerElement, e: React.MouseEvent) => {
    e.stopPropagation();
    
    switch (layer.type) {
      case 'image':
        removeImageElement(layer.id);
        break;
      case 'text':
        removeTextElement(layer.id);
        break;
      case 'icon':
        removeIconElement(layer.id);
        break;
    }
  };

  // 处理拖拽开始事件
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  // 处理拖拽结束事件
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = layers.findIndex(layer => layer.id === active.id);
      const newIndex = layers.findIndex(layer => layer.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // 重新排列图层数组
        const newLayers = arrayMove(layers, oldIndex, newIndex);
        
        // 更新每个图层的 zIndex
        newLayers.forEach((layer, index) => {
          const newZIndex = newLayers.length - index; // 反转索引，使顶部图层有更高的 zIndex
          
          switch (layer.type) {
            case 'image':
              updateImageElement(layer.id, { zIndex: newZIndex });
              break;
            case 'text':
              updateTextElement(layer.id, { zIndex: newZIndex });
              break;
            case 'icon':
              updateIconElement(layer.id, { zIndex: newZIndex });
              break;
          }
        });

        // 强制重新渲染画布以反映新的层级顺序
        setTimeout(() => {
          forceRenderCanvas();
        }, 50);
      }
    }

    setActiveId(null);
  };

  // 拖拽动画配置
  const dropAnimation: DropAnimation = {
    duration: 200,
    easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.4',
        },
      },
    }),
  };

  if (layers.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <ImageIcon className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-sm text-gray-500">暂无图层</p>
          <p className="text-xs text-gray-400 mt-1">
            添加图片、文字或图标来创建图层
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 图层列表标题 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          图层 ({layers.length})
        </h3>
      </div>

      {/* 图层列表 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={layers.map(layer => layer.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {layers.map((layer) => {
              const isSelected = selectedElementId === layer.id;

              return (
                <SortableLayerItem
                  key={layer.id}
                  layer={layer}
                  isSelected={isSelected}
                  onLayerClick={handleLayerClick}
                  onDeleteLayer={handleDeleteLayer}
                />
              );
            })}
          </div>
        </SortableContext>
        
        <DragOverlay dropAnimation={dropAnimation}>
          {activeId ? (
            <div className="flex items-center p-2 rounded-lg border-2 border-blue-400 bg-white shadow-xl opacity-95 scale-105 rotate-1">
              <GripVertical className="w-4 h-4 mr-2 text-blue-500" />
              {(() => {
                const activeLayer = layers.find(layer => layer.id === activeId);
                if (!activeLayer) return null;
                
                const getLayerIcon = (type: LayerElement['type']) => {
                  switch (type) {
                    case 'image': return ImageIcon;
                    case 'text': return Type;
                    case 'icon': return Star;
                    default: return ImageIcon;
                  }
                };
                
                const IconComponent = getLayerIcon(activeLayer.type);
                
                return (
                  <>
                    <IconComponent className="w-4 h-4 mr-2 flex-shrink-0 text-blue-600" />
                    <span className="text-sm truncate font-medium text-gray-800">{activeLayer.name}</span>
                  </>
                );
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* 操作提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          💡 提示：
        </p>
        <ul className="text-xs text-blue-700 mt-1 space-y-1">
          <li>• 点击图层可选中对应元素</li>
          <li>• 拖拽图层可调整层级顺序</li>
          <li>• 悬停显示拖拽手柄和删除按钮</li>
          <li>• 垃圾桶图标可删除图层</li>
        </ul>
      </div>
    </div>
  );
};

export default LayersPanel;