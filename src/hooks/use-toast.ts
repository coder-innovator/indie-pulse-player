import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

interface UseToastReturn {
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  toasts: Toast[];
}

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((toastData: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toastData,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after duration
    if (newToast.duration) {
      setTimeout(() => {
        dismiss(id);
      }, newToast.duration);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return {
    toast,
    dismiss,
    toasts,
  };
};
