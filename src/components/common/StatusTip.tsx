import React from 'react';
import { Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { getTipStyle, getTextStyle } from '../../utils/styles';

interface StatusTipProps {
  type: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  message: string;
  icon?: boolean;
}

const StatusTip: React.FC<StatusTipProps> = ({
  type,
  title,
  message,
  icon = true,
}) => {
  const getIcon = () => {
    if (!icon) return null;
    
    const iconProps = { className: 'w-4 h-4 flex-shrink-0' };
    
    switch (type) {
      case 'info':
        return <Info {...iconProps} />;
      case 'warning':
        return <AlertTriangle {...iconProps} />;
      case 'error':
        return <AlertCircle {...iconProps} />;
      case 'success':
        return <CheckCircle {...iconProps} />;
      default:
        return <Info {...iconProps} />;
    }
  };

  return (
    <div className={getTipStyle(type)}>
      <div className="flex items-start space-x-2">
        {getIcon()}
        <div className="flex-1">
          {title && (
            <div className={`font-medium mb-1 ${getTextStyle(type)}`}>
              {title}
            </div>
          )}
          <div className={getTextStyle(type)}>
            {message}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusTip;