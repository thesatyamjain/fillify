import { useState, Suspense, lazy } from 'react';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';
import { TemplateProvider, useTemplates } from './context/TemplateContext';
import { FillProvider, useFill } from './context/FillContext';
import { Navbar } from './components/Navbar';
import { LoadingSkeleton } from './components/Common/LoadingSkeleton';

// Code-split heavy views for fast initial load & optimal browser caching
const LandingPage = lazy(() =>
  import('./components/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const TextEditor = lazy(() =>
  import('./components/Editor/TextEditor').then((m) => ({ default: m.TextEditor }))
);
const FillWizard = lazy(() =>
  import('./components/FillMode/FillWizard').then((m) => ({ default: m.FillWizard }))
);
const FormView = lazy(() =>
  import('./components/FillMode/FormView').then((m) => ({ default: m.FormView }))
);
const BulkView = lazy(() =>
  import('./components/FillMode/BulkView').then((m) => ({ default: m.BulkView }))
);
const SampleTemplatesModal = lazy(() =>
  import('./components/Templates/SampleTemplatesModal').then((m) => ({ default: m.SampleTemplatesModal }))
);
const HistoryModal = lazy(() =>
  import('./components/History/HistoryModal').then((m) => ({ default: m.HistoryModal }))
);

function AppWorkspace() {
  const [activeMode, setActiveMode] = useState<'editor' | 'fill'>('editor');
  const [hasSeenLanding, setHasSeenLanding] = useState<boolean>(
    () => localStorage.getItem('fillify_seen_landing') === 'true'
  );

  const {
    currentTemplate,
    savedTemplates,
    isSamplesModalOpen,
    openSamplesModal,
    closeSamplesModal,
    updateTemplate,
    selectTemplate,
    deleteTemplateById,
  } = useTemplates();

  const {
    fillSubMode,
    setFillSubMode,
    filledHistory,
    isHistoryModalOpen,
    closeHistoryModal,
    saveSingleFillHistory,
    saveMultipleFillHistory,
    deleteHistoryItem,
    clearAllHistory,
  } = useFill();

  const handleGetStarted = () => {
    localStorage.setItem('fillify_seen_landing', 'true');
    setHasSeenLanding(true);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-dark)',
      }}
    >
      <Suspense fallback={<LoadingSkeleton label="Initializing Fillify..." />}>
        {!hasSeenLanding && <LandingPage onGetStarted={handleGetStarted} />}

        {hasSeenLanding && (
          <>
            <Navbar activeMode={activeMode} setActiveMode={setActiveMode} />

            <main style={{ flex: 1 }}>
              <Suspense fallback={<LoadingSkeleton label="Loading workspace..." />}>
                {activeMode === 'editor' && (
                  <TextEditor
                    template={currentTemplate}
                    onUpdateTemplate={updateTemplate}
                    onProceedToFill={() => setActiveMode('fill')}
                    onOpenSamples={openSamplesModal}
                  />
                )}

                {activeMode === 'fill' && fillSubMode === 'wizard' && (
                  <FillWizard
                    template={currentTemplate}
                    onSaveFillHistory={(values, finalText) =>
                      saveSingleFillHistory(currentTemplate.id, currentTemplate.name, values, finalText)
                    }
                    onSwitchToFormView={() => setFillSubMode('form')}
                    onSwitchToBulk={() => setFillSubMode('bulk')}
                    onReturnToEdit={() => setActiveMode('editor')}
                  />
                )}

                {activeMode === 'fill' && fillSubMode === 'form' && (
                  <FormView
                    template={currentTemplate}
                    onSaveFillHistory={(values, finalText) =>
                      saveSingleFillHistory(currentTemplate.id, currentTemplate.name, values, finalText)
                    }
                    onSwitchToWizard={() => setFillSubMode('wizard')}
                    onSwitchToBulk={() => setFillSubMode('bulk')}
                    onReturnToEdit={() => setActiveMode('editor')}
                  />
                )}

                {activeMode === 'fill' && fillSubMode === 'bulk' && (
                  <BulkView
                    template={currentTemplate}
                    onSaveFillHistory={(values, finalText) =>
                      saveSingleFillHistory(currentTemplate.id, currentTemplate.name, values, finalText)
                    }
                    onSaveMultipleFillHistory={saveMultipleFillHistory}
                    onSwitchToWizard={() => setFillSubMode('wizard')}
                    onSwitchToFormView={() => setFillSubMode('form')}
                    onReturnToEdit={() => setActiveMode('editor')}
                  />
                )}
              </Suspense>
            </main>

            {/* Modals loaded on demand */}
            <Suspense fallback={null}>
              <SampleTemplatesModal
                isOpen={isSamplesModalOpen}
                onClose={closeSamplesModal}
                savedTemplates={savedTemplates}
                onSelectTemplate={selectTemplate}
                onDeleteTemplate={deleteTemplateById}
              />

              <HistoryModal
                isOpen={isHistoryModalOpen}
                onClose={closeHistoryModal}
                history={filledHistory}
                onClearHistory={clearAllHistory}
                onDeleteItem={deleteHistoryItem}
              />
            </Suspense>
          </>
        )}
      </Suspense>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <TemplateProvider>
          <FillProvider>
            <AppWorkspace />
          </FillProvider>
        </TemplateProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
