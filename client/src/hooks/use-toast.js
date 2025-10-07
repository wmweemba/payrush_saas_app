import React, { useState, useCallback, useEffect } from 'react';

// Simple toast implementation for notifications
let toastId = 0;
const toasts = new Map();
const listeners = new Set();

const addToast = (toast) => {
  const id = toastId++;
  const toastWithId = { id, ...toast };
  toasts.set(id, toastWithId);
  
  // Notify all listeners
  listeners.forEach(listener => listener([...toasts.values()]));
  
  // Auto-remove after duration
  const duration = toast.duration || 5000;
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
  
  return id;
};

const removeToast = (id) => {
  toasts.delete(id);
  listeners.forEach(listener => listener([...toasts.values()]));
};

const updateToast = (id, updates) => {
  const existingToast = toasts.get(id);
  if (existingToast) {
    const updatedToast = { ...existingToast, ...updates };
    toasts.set(id, updatedToast);
    listeners.forEach(listener => listener([...toasts.values()]));
  }
};

export const useToast = () => {
  const [toastList, setToastList] = useState([...toasts.values()]);

  // Subscribe to toast changes
  useEffect(() => {
    listeners.add(setToastList);
    return () => {
      listeners.delete(setToastList);
    };
  }, []);

  const toast = useCallback((options) => {
    if (typeof options === 'string') {
      return addToast({
        title: options,
        variant: 'default',
        duration: 5000
      });
    }
    
    return addToast({
      variant: 'default',
      duration: 5000,
      ...options
    });
  }, []);

  const dismiss = useCallback((id) => {
    if (id) {
      removeToast(id);
    } else {
      // Clear all toasts
      toasts.clear();
      listeners.forEach(listener => listener([]));
    }
  }, []);

  return {
    toast,
    dismiss,
    toasts: toastList
  };
};

// Toast reducer for more complex state management
export const toastReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.toast]
      };
    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map(t => 
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        )
      };
    case 'DISMISS_TOAST':
      return {
        ...state,
        toasts: action.toastId
          ? state.toasts.filter(t => t.id !== action.toastId)
          : []
      };
    default:
      return state;
  }
};

// Export the direct functions for use outside of React components
export { addToast, removeToast, updateToast };