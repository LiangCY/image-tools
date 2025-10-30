// 通用样式类名常量
export const STYLES = {
  // 按钮样式
  button: {
    base: 'px-3 py-2 rounded-lg border-2 transition-all duration-200',
    primary: 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200',
    selected: 'border-blue-500 bg-blue-50 text-blue-700',
    unselected: 'border-gray-200 hover:border-gray-300 text-gray-600',
    danger: 'bg-red-500 text-white border-red-500 hover:bg-red-600',
  },

  // 输入框样式
  input: {
    base: 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    number: 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    text: 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    select: 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  },

  // 面板样式
  panel: {
    container: 'bg-white border-r border-gray-200 flex flex-col',
    header: 'p-4 border-b border-gray-200',
    content: 'flex-1 overflow-y-auto p-4',
    title: 'text-lg font-semibold text-gray-900',
    subtitle: 'text-sm font-medium text-gray-900',
  },

  // 列表项样式
  listItem: {
    base: 'p-3 border rounded-lg cursor-pointer transition-all duration-200',
    selected: 'border-blue-500 bg-blue-50',
    unselected: 'border-gray-200 hover:border-gray-300',
    disabled: 'opacity-50 cursor-not-allowed',
  },

  // 提示框样式
  tip: {
    info: 'bg-blue-50 border border-blue-200 rounded-lg p-3',
    warning: 'bg-yellow-50 border border-yellow-200 rounded-lg p-3',
    error: 'bg-red-50 border border-red-200 rounded-lg p-3',
    success: 'bg-green-50 border border-green-200 rounded-lg p-3',
  },

  // 文本样式
  text: {
    info: 'text-sm text-blue-800',
    warning: 'text-sm text-yellow-800',
    error: 'text-sm text-red-800',
    success: 'text-sm text-green-800',
    muted: 'text-sm text-gray-600',
    label: 'block text-xs font-medium text-gray-600 mb-2',
  },

  // 布局样式
  layout: {
    grid2: 'grid grid-cols-2 gap-3',
    grid3: 'grid grid-cols-3 gap-3',
    flexCenter: 'flex items-center justify-center',
    flexBetween: 'flex items-center justify-between',
    flexCol: 'flex flex-col',
    spacingY: 'space-y-3',
    spacingX: 'space-x-3',
  },

  // 工具栏样式
  toolbar: {
    container: 'bg-white border-b border-gray-200 px-6 py-3',
    toolGroup: 'flex items-center justify-center space-x-1',
    tool: {
      base: 'flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all border',
      active: 'bg-blue-100 text-blue-700 border-blue-200',
      inactive: 'text-gray-600 hover:bg-gray-100 border-transparent',
    },
  },

  // 画布样式
  canvas: {
    container: 'flex-1 bg-gray-200 p-6',
    wrapper: 'h-full w-full',
    canvas: 'max-w-full max-h-full border border-gray-300 bg-white shadow-lg',
    controls: 'absolute bottom-4 right-4 flex items-center space-x-2 bg-white rounded-lg shadow-lg p-2',
  },
};

// 生成样式类名的工具函数
export const getButtonStyle = (variant: keyof typeof STYLES.button, isSelected?: boolean): string => {
  if (variant === 'base') return STYLES.button.base;
  if (isSelected && (variant === 'selected' || variant === 'unselected')) {
    return `${STYLES.button.base} ${STYLES.button.selected}`;
  }
  return `${STYLES.button.base} ${STYLES.button[variant]}`;
};

export const getListItemStyle = (isSelected: boolean, isDisabled?: boolean): string => {
  let style = STYLES.listItem.base;
  if (isDisabled) {
    style += ` ${STYLES.listItem.disabled}`;
  } else if (isSelected) {
    style += ` ${STYLES.listItem.selected}`;
  } else {
    style += ` ${STYLES.listItem.unselected}`;
  }
  return style;
};

export const getTipStyle = (type: keyof typeof STYLES.tip): string => {
  return STYLES.tip[type];
};

export const getTextStyle = (type: keyof typeof STYLES.text): string => {
  return STYLES.text[type];
};