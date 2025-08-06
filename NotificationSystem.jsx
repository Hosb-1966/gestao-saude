import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Contexto para notificações
const NotificationContext = createContext();

// Hook para usar notificações
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
}

// Componente de notificação individual
function Notification({ notification, onRemove }) {
  const { id, type, title, message, duration } = notification;
  
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />
  };
  
  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  };
  
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [id, duration, onRemove]);
  
  return (
    <div className={`p-4 rounded-lg border shadow-sm ${bgColors[type]} animate-in slide-in-from-right-full`}>
      <div className="flex items-start gap-3">
        {icons[type]}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              {title}
            </h4>
          )}
          <p className="text-sm text-gray-700">
            {message}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(id)}
          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Provider de notificações
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      duration: 5000, // 5 segundos por padrão
      ...notification
    };
    
    setNotifications(prev => [...prev, newNotification]);
    return id;
  }, []);
  
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);
  
  // Funções de conveniência
  const success = useCallback((message, title, options = {}) => {
    return addNotification({ type: 'success', message, title, ...options });
  }, [addNotification]);
  
  const error = useCallback((message, title, options = {}) => {
    return addNotification({ type: 'error', message, title, duration: 8000, ...options });
  }, [addNotification]);
  
  const warning = useCallback((message, title, options = {}) => {
    return addNotification({ type: 'warning', message, title, duration: 6000, ...options });
  }, [addNotification]);
  
  const info = useCallback((message, title, options = {}) => {
    return addNotification({ type: 'info', message, title, ...options });
  }, [addNotification]);
  
  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Container de notificações */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
          {notifications.map(notification => (
            <Notification
              key={notification.id}
              notification={notification}
              onRemove={removeNotification}
            />
          ))}
          
          {notifications.length > 1 && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="text-xs"
              >
                Limpar todas
              </Button>
            </div>
          )}
        </div>
      )}
    </NotificationContext.Provider>
  );
}

// Hook para notificações de operações assíncronas
export function useAsyncNotification() {
  const { success, error, info } = useNotifications();
  
  const notifyAsync = useCallback(async (
    asyncFn,
    {
      loadingMessage = 'Processando...',
      successMessage = 'Operação realizada com sucesso!',
      errorMessage = 'Erro ao realizar operação'
    } = {}
  ) => {
    const loadingId = info(loadingMessage, null, { duration: 0 });
    
    try {
      const result = await asyncFn();
      removeNotification(loadingId);
      success(successMessage);
      return result;
    } catch (err) {
      removeNotification(loadingId);
      error(errorMessage, err.message);
      throw err;
    }
  }, [success, error, info]);
  
  return { notifyAsync };
}

// Hook para validação com notificações
export function useValidationNotification() {
  const { error, warning } = useNotifications();
  
  const notifyValidationErrors = useCallback((errors, title = 'Erro de validação') => {
    if (typeof errors === 'object' && errors !== null) {
      const errorMessages = Object.values(errors).join(', ');
      error(errorMessages, title);
    } else if (typeof errors === 'string') {
      error(errors, title);
    }
  }, [error]);
  
  const notifyValidationWarnings = useCallback((warnings, title = 'Atenção') => {
    if (typeof warnings === 'object' && warnings !== null) {
      const warningMessages = Object.values(warnings).join(', ');
      warning(warningMessages, title);
    } else if (typeof warnings === 'string') {
      warning(warnings, title);
    }
  }, [warning]);
  
  return { notifyValidationErrors, notifyValidationWarnings };
}

