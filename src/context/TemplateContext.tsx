import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Template } from '../types/template';
import {
  getSavedTemplates,
  saveTemplate,
  deleteTemplate as deleteFromStorage,
  exportTemplatesJSON,
  parseTemplatesJSON,
} from '../utils/storage';
import { useToast } from './ToastContext';

interface TemplateContextType {
  savedTemplates: Template[];
  currentTemplate: Template;
  isSamplesModalOpen: boolean;
  openSamplesModal: () => void;
  closeSamplesModal: () => void;
  updateTemplate: (updated: Template) => void;
  createNewTemplate: () => Template;
  selectTemplate: (selected: Template) => void;
  deleteTemplateById: (id: string) => void;
  exportTemplatesJSONFile: () => void;
  importTemplatesFromJSON: (jsonStr: string) => void;
}

const TemplateContext = createContext<TemplateContextType | null>(null);

function createFreshTemplate(): Template {
  const fresh: Template = {
    id: `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: 'Untitled Interactive Template',
    category: 'Custom',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    bodyText: 'Paste your raw text here...',
    blanks: [],
  };
  saveTemplate(fresh);
  return fresh;
}

export const TemplateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();

  const [savedTemplates, setSavedTemplates] = useState<Template[]>(() => {
    return getSavedTemplates();
  });

  const [currentTemplate, setCurrentTemplate] = useState<Template>(() => {
    const list = getSavedTemplates();
    return list.length > 0 ? list[0] : createFreshTemplate();
  });

  const [isSamplesModalOpen, setIsSamplesModalOpen] = useState(false);

  const openSamplesModal = useCallback(() => setIsSamplesModalOpen(true), []);
  const closeSamplesModal = useCallback(() => setIsSamplesModalOpen(false), []);

  const updateTemplate = useCallback((updated: Template) => {
    setCurrentTemplate(updated);
    const updatedList = saveTemplate(updated);
    setSavedTemplates(updatedList);
  }, []);

  const createNewTemplate = useCallback(() => {
    const fresh = createFreshTemplate();
    setCurrentTemplate(fresh);
    setSavedTemplates(getSavedTemplates());
    showToast('Created new blank template');
    return fresh;
  }, [showToast]);

  const selectTemplate = useCallback((selected: Template) => {
    setCurrentTemplate(selected);
  }, []);

  const deleteTemplateById = useCallback((id: string) => {
    const updatedList = deleteFromStorage(id);
    setSavedTemplates(updatedList);

    setCurrentTemplate((prev) => {
      if (prev.id === id) {
        if (updatedList.length > 0) {
          return updatedList[0];
        } else {
          const fresh = createFreshTemplate();
          setSavedTemplates([fresh]);
          return fresh;
        }
      }
      return prev;
    });

    showToast('Template deleted');
  }, [showToast]);

  const exportTemplatesJSONFile = useCallback(() => {
    const jsonStr = exportTemplatesJSON(savedTemplates);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fillify_templates_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    showToast('Exported templates to JSON backup');
  }, [savedTemplates, showToast]);

  const importTemplatesFromJSON = useCallback((jsonStr: string) => {
    try {
      const imported = parseTemplatesJSON(jsonStr);
      let lastSaved: Template | null = null;
      imported.forEach((t) => {
        saveTemplate(t);
        lastSaved = t;
      });
      const updatedList = getSavedTemplates();
      setSavedTemplates(updatedList);
      if (lastSaved) {
        setCurrentTemplate(lastSaved);
      }
      showToast(`Successfully imported ${imported.length} template(s)`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Invalid JSON format', 'error');
    }
  }, [showToast]);

  return (
    <TemplateContext.Provider
      value={{
        savedTemplates,
        currentTemplate,
        isSamplesModalOpen,
        openSamplesModal,
        closeSamplesModal,
        updateTemplate,
        createNewTemplate,
        selectTemplate,
        deleteTemplateById,
        exportTemplatesJSONFile,
        importTemplatesFromJSON,
      }}
    >
      {children}
    </TemplateContext.Provider>
  );
};

export function useTemplates(): TemplateContextType {
  const ctx = useContext(TemplateContext);
  if (!ctx) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }
  return ctx;
}
