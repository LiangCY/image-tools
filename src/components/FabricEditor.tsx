import React, { useRef } from 'react';
import { useEditStore, useProcessingStore } from '../stores';
import CanvasSettingsPanel from './CanvasSettingsPanel';
import ImagePanel from './ImagePanel';
import ExportPanel from './ExportPanel';
import TextPanel from './TextPanel';
import FabricCanvas from './FabricCanvas';
import { Canvas } from 'fabric';

import {
  Image as ImageIcon,
  Settings,
  Type,
  Download
} from 'lucide-react';

const FabricEditor: React.FC = () => {
  const {
    canvasSettings,
    activeTool,
    setActiveTool,
    reset
  } = useEditStore();

  const { progress } = useProcessingStore();
  const fabricCanvasRef = useRef<Canvas | null>(null);

  const handleCanvasReady = (canvas: Canvas) => {
    fabricCanvasRef.current = canvas;
  };

  // 工具面板配置
  const tools = [
    { id: 'canvas' as const, icon: Settings, label: '画布', component: CanvasSettingsPanel },
    { id: 'image' as const, icon: ImageIcon, label: '图片', component: ImagePanel },
    { id: 'text' as const, icon: Type, label: '文字', component: TextPanel },
    { id: 'export' as const, icon: Download, label: '导出', component: ExportPanel },
  ];

  const renderActiveToolComponent = () => {
    const tool = tools.find(tool => tool.id === activeTool);
    if (!tool) return <CanvasSettingsPanel />;
    
    if (tool.id === 'export') {
      return <ExportPanel fabricCanvasRef={fabricCanvasRef} />;
    }
    
    const Component = tool.component;
    return <Component />;
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* 主编辑区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部工具栏 */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-center space-x-1">
            {tools.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all ${activeTool === tool.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  title={tool.label}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="text-xs">{tool.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 画布区域 */}
        <div className="flex-1 bg-gray-200 p-6" style={{ minHeight: 0 }}>
          <div className="h-full w-full">
            <FabricCanvas onCanvasReady={handleCanvasReady} />
          </div>
        </div>

        {/* 进度条 */}
        {progress.isProcessing && (
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{progress.message}</span>
                  <span className="text-sm text-gray-500">{progress.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 右侧配置面板 */}
      <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
        {/* 标题栏 */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-900">
            {tools.find(tool => tool.id === activeTool)?.label || '配置'}
          </h2>
        </div>

        {/* 配置内容 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {renderActiveToolComponent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FabricEditor;