import { BaseElement, ElementType, EditState } from '../types';
import { generateId, getNextZIndex } from './common';

// 通用元素管理器工厂函数
export const createElementManager = <T extends BaseElement>() => {
  return {
    // 创建元素添加器
    createAdder: (
      getState: () => EditState,
      setState: (updater: (state: EditState) => Partial<EditState>) => void,
      stateKey: keyof EditState
    ) => (element: Omit<T, 'id'>) => {
      setState((state: EditState) => {
        const allElements = [
          state.imageElements || [],
          state.textElements || [],
          state.iconElements || [],
          state.drawElements || []
        ];
        
        const nextZIndex = getNextZIndex(allElements);
        
        const newElement: T = {
          ...element,
          id: generateId(),
          zIndex: element.zIndex || nextZIndex,
          visible: element.visible !== undefined ? element.visible : true,
          locked: element.locked !== undefined ? element.locked : false,
          scaleX: element.scaleX !== undefined ? element.scaleX : 1,
          scaleY: element.scaleY !== undefined ? element.scaleY : 1,
        } as T;
        
        return {
          [stateKey]: [...((state[stateKey] as unknown as T[]) || []), newElement]
        } as Partial<EditState>;
      });
    },

    // 创建元素更新器
    createUpdater: (
      setState: (updater: (state: EditState) => Partial<EditState>) => void,
      stateKey: keyof EditState
    ) => (id: string, updates: Partial<T>) => {
      setState((state: EditState) => ({
        [stateKey]: ((state[stateKey] as unknown as T[]) || []).map((element: T) =>
          element.id === id ? { ...element, ...updates } : element
        )
      } as Partial<EditState>));
    },

    // 创建元素删除器
    createRemover: (
      setState: (updater: (state: EditState) => Partial<EditState>) => void,
      stateKey: keyof EditState,
      cleanup?: (element: T) => void
    ) => (id: string) => {
      setState((state: EditState) => {
        const element = ((state[stateKey] as unknown as T[]) || []).find((el: T) => el.id === id);
        if (element && cleanup) {
          cleanup(element);
        }
        
        return {
          [stateKey]: ((state[stateKey] as unknown as T[]) || []).filter((element: T) => element.id !== id),
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
          selectedElementType: state.selectedElementId === id ? null : state.selectedElementType,
        } as Partial<EditState>;
      });
    },

    // 创建元素选择器
    createSelector: (
      setState: (updater: (state: EditState) => Partial<EditState>) => void
    ) => (id: string | null, type: ElementType | null) => {
      setState((state: EditState) => {
        const newState: Partial<EditState> = { 
          selectedElementId: id,
          selectedElementType: type 
        };
        
        // 当选中元素时，自动切换到对应的设置面板
        if (id && type) {
          newState.activeTool = type;
        }
        
        // 当选中任何元素时，退出绘画状态
        if (id && type) {
          newState.drawSettings = {
            ...state.drawSettings,
            isDrawingMode: false
          };
        }
        
        return newState;
      });
    },

    // 创建层级管理器
    createLayerManager: (
      getState: () => EditState,
      setState: (updater: (state: EditState) => Partial<EditState>) => void
    ) => ({
      moveUp: (id: string, type: ElementType) => {
        setState((state: EditState) => {
          const stateKey = `${type}Elements` as keyof EditState;
          const elements = [...((state[stateKey] as unknown as T[]) || [])];
          const index = elements.findIndex((el: T) => el.id === id);
          
          if (index > -1 && index < elements.length - 1) {
            [elements[index], elements[index + 1]] = [elements[index + 1], elements[index]];
          }
          
          return { [stateKey]: elements } as Partial<EditState>;
        });
      },

      moveDown: (id: string, type: ElementType) => {
        setState((state: EditState) => {
          const stateKey = `${type}Elements` as keyof EditState;
          const elements = [...((state[stateKey] as unknown as T[]) || [])];
          const index = elements.findIndex((el: T) => el.id === id);
          
          if (index > 0) {
            [elements[index], elements[index - 1]] = [elements[index - 1], elements[index]];
          }
          
          return { [stateKey]: elements } as Partial<EditState>;
        });
      },

      moveToTop: (id: string, type: ElementType) => {
        setState((state: EditState) => {
          const stateKey = `${type}Elements` as keyof EditState;
          const elements = [...((state[stateKey] as unknown as T[]) || [])];
          const index = elements.findIndex((el: T) => el.id === id);
          
          if (index > -1) {
            const element = elements.splice(index, 1)[0];
            elements.push(element);
          }
          
          return { [stateKey]: elements } as Partial<EditState>;
        });
      },

      moveToBottom: (id: string, type: ElementType) => {
        setState((state: EditState) => {
          const stateKey = `${type}Elements` as keyof EditState;
          const elements = [...((state[stateKey] as unknown as T[]) || [])];
          const index = elements.findIndex((el: T) => el.id === id);
          
          if (index > -1) {
            const element = elements.splice(index, 1)[0];
            elements.unshift(element);
          }
          
          return { [stateKey]: elements } as Partial<EditState>;
        });
      },
    }),
  };
};

// 预设的元素管理器
export const textElementManager = createElementManager();
export const imageElementManager = createElementManager();
export const iconElementManager = createElementManager();
export const drawElementManager = createElementManager();