import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FilledInstance } from '../types/template';
import {
  getFilledHistory,
  saveFilledInstance,
  saveMultipleFilledInstances,
} from '../utils/storage';
import { useToast } from './ToastContext';

export type FillSubMode = 'wizard' | 'form' | 'bulk';

interface FillContextType {
  fillSubMode: FillSubMode;
  setFillSubMode: (mode: FillSubMode) => void;
  filledHistory: FilledInstance[];
  isHistoryModalOpen: boolean;
  openHistoryModal: () => void;
  closeHistoryModal: () => void;
  saveSingleFillHistory: (templateId: string, templateName: string, values: Record<string, string>, finalText: string) => void;
  saveMultipleFillHistory: (instances: FilledInstance[]) => void;
}

const FillContext = createContext<FillContextType | null>(null);

export const FillProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [fillSubMode, setFillSubMode] = useState<FillSubMode>('wizard');
  const [filledHistory, setFilledHistory] = useState<FilledInstance[]>(() => getFilledHistory());
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const openHistoryModal = useCallback(() => setIsHistoryModalOpen(true), []);
  const closeHistoryModal = useCallback(() => setIsHistoryModalOpen(false), []);

  const saveSingleFillHistory = useCallback(
    (templateId: string, templateName: string, values: Record<string, string>, finalText: string) => {
      const instance: FilledInstance = {
        id: `fill_${Date.now()}`,
        templateId,
        templateName,
        filledAt: Date.now(),
        values,
        finalText,
      };
      const updated = saveFilledInstance(instance);
      setFilledHistory(updated);
      showToast('Document record saved to history');
    },
    [showToast]
  );

  const saveMultipleFillHistory = useCallback(
    (instances: FilledInstance[]) => {
      const updated = saveMultipleFilledInstances(instances);
      setFilledHistory(updated);
      showToast(`Saved all ${instances.length} documents to history`);
    },
    [showToast]
  );

  return (
    <FillContext.Provider
      value={{
        fillSubMode,
        setFillSubMode,
        filledHistory,
        isHistoryModalOpen,
        openHistoryModal,
        closeHistoryModal,
        saveSingleFillHistory,
        saveMultipleFillHistory,
      }}
    >
      {children}
    </FillContext.Provider>
  );
};

export function useFill(): FillContextType {
  const ctx = useContext(FillContext);
  if (!ctx) {
    throw new Error('useFill must be used within a FillProvider');
  }
  return ctx;
}
