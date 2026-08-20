import { useState } from 'react';
import { Template, FilledInstance } from './types/template';
import {
  getSavedTemplates,
  saveTemplate,
  deleteTemplate,
  getFilledHistory,
  saveFilledInstance,
  exportTemplatesJSON,
  parseTemplatesJSON,
} from './utils/storage';

import { Navbar } from './components/Navbar';
import { TextEditor } from './components/Editor/TextEditor';
import { FillWizard } from './components/FillMode/FillWizard';
import { FormView } from './components/FillMode/FormView';
import { SampleTemplatesModal } from './components/Templates/SampleTemplatesModal';
import { HistoryModal } from './components/History/HistoryModal';
import { LandingPage } from './components/LandingPage';

/** Create a blank template and persist it. Used on first launch and when all templates are deleted. */
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

export function App() {
  // Read localStorage once and derive both initial states from the same snapshot.
  const [savedTemplates, setSavedTemplates] = useState<Template[]>(() => {
    const templates = getSavedTemplates();
    return templates;
  });

  const [currentTemplate, setCurrentTemplate] = useState<Template>(() => {
    const templates = getSavedTemplates();
    if (templates.length > 0) return templates[0];
    // First-ever launch: create a blank template (outside useState initializer to avoid side-effect warning).
    return createFreshTemplate();
  });

  const [activeMode, setActiveMode] = useState<'editor' | 'fill'>('editor');
  const [fillSubMode, setFillSubMode] = useState<'wizard' | 'form'>('wizard');
  const [filledHistory, setFilledHistory] = useState<FilledInstance[]>(() => getFilledHistory());
  const [isSamplesModalOpen, setIsSamplesModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Show landing page only on the very first visit.
  const [hasSeenLanding, setHasSeenLanding] = useState<boolean>(
    () => localStorage.getItem('fillify_seen_landing') === 'true'
  );

  const handleGetStarted = () => {
    localStorage.setItem('fillify_seen_landing', 'true');
    setHasSeenLanding(true);
  };

  // Update current template and auto-save
  const handleUpdateTemplate = (updated: Template) => {
    setCurrentTemplate(updated);
    const updatedList = saveTemplate(updated);
    setSavedTemplates(updatedList);
  };

  // Create new blank template
  const handleNewTemplate = () => {
    const fresh = createFreshTemplate();
    setCurrentTemplate(fresh);
    setSavedTemplates(getSavedTemplates());
    setActiveMode('editor');
  };

  // Switch template
  const handleSelectTemplate = (selected: Template) => {
    setCurrentTemplate(selected);
  };

  // Delete saved template
  const handleDeleteTemplate = (id: string) => {
    const updatedList = deleteTemplate(id);
    setSavedTemplates(updatedList);

    if (currentTemplate.id === id) {
      if (updatedList.length > 0) {
        setCurrentTemplate(updatedList[0]);
      } else {
        // Last template deleted — create a fresh blank so the app is never empty.
        const fresh = createFreshTemplate();
        setSavedTemplates([fresh]);
        setCurrentTemplate(fresh);
      }
    }
  };

  // Export JSON file — revoke object URL after a small delay so download initiates.
  const handleExportJSON = () => {
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
  };

  // Import JSON file
  const handleImportJSON = (jsonStr: string) => {
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
      alert(`Successfully imported ${imported.length} template(s)!`);
    } catch (e) {
      alert(`Import failed: ${e instanceof Error ? e.message : 'Invalid JSON format'}`);
    }
  };

  // Record filled instance history
  const handleSaveFillHistory = (values: Record<string, string>, finalText: string) => {
    const instance: FilledInstance = {
      id: `fill_${Date.now()}`,
      templateId: currentTemplate.id,
      templateName: currentTemplate.name,
      filledAt: Date.now(),
      values,
      finalText,
    };
    const updated = saveFilledInstance(instance);
    setFilledHistory(updated);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
      {!hasSeenLanding && <LandingPage onGetStarted={handleGetStarted} />}

      {hasSeenLanding && (
        <>
          <Navbar
            activeMode={activeMode}
            setActiveMode={setActiveMode}
            onNewTemplate={handleNewTemplate}
            onOpenHistory={() => setIsHistoryModalOpen(true)}
            onExportJSON={handleExportJSON}
            onImportJSON={handleImportJSON}
          />

          <main style={{ flex: 1 }}>
            {activeMode === 'editor' && (
              <TextEditor
                template={currentTemplate}
                onUpdateTemplate={handleUpdateTemplate}
                onProceedToFill={() => setActiveMode('fill')}
                onOpenSamples={() => setIsSamplesModalOpen(true)}
              />
            )}

            {activeMode === 'fill' && fillSubMode === 'wizard' && (
              <FillWizard
                template={currentTemplate}
                onSaveFillHistory={handleSaveFillHistory}
                onSwitchToFormView={() => setFillSubMode('form')}
                onReturnToEdit={() => setActiveMode('editor')}
              />
            )}

            {activeMode === 'fill' && fillSubMode === 'form' && (
              <FormView
                template={currentTemplate}
                onSaveFillHistory={handleSaveFillHistory}
                onSwitchToWizard={() => setFillSubMode('wizard')}
                onReturnToEdit={() => setActiveMode('editor')}
              />
            )}
          </main>

          {/* Modals */}
          <SampleTemplatesModal
            isOpen={isSamplesModalOpen}
            onClose={() => setIsSamplesModalOpen(false)}
            savedTemplates={savedTemplates}
            onSelectTemplate={handleSelectTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />

          <HistoryModal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            history={filledHistory}
          />
        </>
      )}
    </div>
  );
}

export default App;
