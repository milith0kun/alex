import { useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useConceptStore } from "./store/useConceptStore";
import { MainHeader } from "./components/MainHeader";
import { TopBar } from "./components/TopBar";
import { SidebarCategories } from "./components/SidebarCategories";
import { ConceptGraph } from "./components/ConceptGraph";
import { NodeDetailsPanel } from "./components/NodeDetailsPanel";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PasswordModal } from "./components/PasswordModal";

function AppInner() {
  const loadFromServer = useConceptStore((s) => s.loadFromServer);
  const selectedNodeId = useConceptStore((s) => s.selectedNodeId);
  const theme = useConceptStore((s) => s.theme);

  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  return (
    <div translate="no" className={`h-screen w-screen flex flex-col overflow-hidden transition-colors duration-500 ${
      theme === 'dark' 
        ? 'bg-[#0b1020] bg-gradient-to-b from-[#0b1020] via-[#0a1230] to-[#060814] text-white' 
        : 'bg-white text-slate-900'
    }`}>
      {theme === 'dark' && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,41,59,0.3)_0%,transparent_70%)] pointer-events-none" />
      )}
      <div className="flex flex-1 overflow-hidden relative">
        <SidebarCategories />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar />
          <ConceptGraph />
        </div>
        {selectedNodeId && <NodeDetailsPanel />}
      </div>
      <PasswordModal />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <ReactFlowProvider>
        <AppInner />
      </ReactFlowProvider>
    </ErrorBoundary>
  );
}
