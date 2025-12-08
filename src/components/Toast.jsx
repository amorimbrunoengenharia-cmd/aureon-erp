import React from 'react';
import { AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const toastStyles = {
    info: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    success: 'bg-green-500/20 border-green-500/50 text-green-400',
    warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
    error: 'bg-red-500/20 border-red-500/50 text-red-400'
  };

  const icons = {
    info: <Info size={18} />,
    success: <CheckCircle size={18} />,
    warning: <AlertCircle size={18} />,
    error: <AlertTriangle size={18} />
  };

  return (
    <div className={`fixed top-4 right-4 max-w-sm border rounded-lg p-4 flex items-start gap-3 animate-slide-in shadow-lg z-[999] ${toastStyles[type]}`}>
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-xl font-bold hover:opacity-70 transition-opacity"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
