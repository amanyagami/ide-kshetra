import React, { useState } from 'react';
import { 
  Columns, 
  ChevronUp, 
  ChevronDown, 
  X, 
  Terminal, 
  Activity,
  FolderOpen
} from 'lucide-react';
import { 
  RepositoryFile, 
  NotebookCell, 
  NodeLease, 
  GpuTelemetry, 
  ReadinessCheck 
} from '../../types/fabric';
import { FileExplorer } from './FileExplorer';
import { NotebookEditor } from './NotebookEditor';
import { CodeEditor } from './CodeEditor';
import { TerminalPanel } from './TerminalPanel';
import { JobsSupervisor } from './JobsSupervisor';
import { FabricInspector } from './FabricInspector';

interface WorkspaceLayoutProps {
  files: RepositoryFile[];
  lease: NodeLease | null;
  telemetry: GpuTelemetry;
  readinessChecks: ReadinessCheck[];
  onReverifyReadiness: () => void;
  isVerifying: boolean;
  onExecuteTerminalCommand: (cmd: string) => void;
  showSidebar: boolean;
  showBottomPanel: boolean;
  showInspector: boolean;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  files,
  lease,
  telemetry,
  readinessChecks,
  onReverifyReadiness,
  isVerifying,
  onExecuteTerminalCommand,
  showSidebar,
  showBottomPanel,
  showInspector,
}) => {
  const [openFiles, setOpenFiles] = useState<string[]>([
    'notebooks/training.ipynb',
    'src/project/train.py',
  ]);
  const [activeFilePath, setActiveFilePath] = useState<string>('notebooks/training.ipynb');
  const [splitView, setSplitView] = useState<boolean>(false);
  const [bottomTab, setBottomTab] = useState<'terminal' | 'jobs'>('terminal');
  const [terminalDispatchCommand, setTerminalDispatchCommand] = useState<string | undefined>(undefined);

  const findFileByPath = (path: string, items: RepositoryFile[]): RepositoryFile | null => {
    for (const item of items) {
      if (item.path === path) return item;
      if (item.children) {
        const found = findFileByPath(path, item.children);
        if (found) return found;
      }
    }
    return null;
  };

  const handleSelectFile = (file: RepositoryFile) => {
    if (!openFiles.includes(file.path)) {
      setOpenFiles(prev => [...prev, file.path]);
    }
    setActiveFilePath(file.path);
  };

  const closeTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = openFiles.filter(p => p !== path);
    setOpenFiles(remaining);
    if (activeFilePath === path) {
      setActiveFilePath(remaining[0] || 'notebooks/training.ipynb');
    }
  };

  const activeFile = findFileByPath(activeFilePath, files) || files[0].children![0];
  const pythonFile = findFileByPath('src/project/train.py', files)!;

  const handleUpdateCells = (newCells: NotebookCell[]) => {
    if (activeFile.cells) {
      activeFile.cells = newCells;
    }
  };

  const handleSaveFileContent = (path: string, newContent: string) => {
    const f = findFileByPath(path, files);
    if (f) {
      f.content = newContent;
    }
  };

  const handleRunInTerminal = (cmd: string) => {
    setBottomTab('terminal');
    setTerminalDispatchCommand(cmd);
  };

  const isGpuReady = readinessChecks.find(c => c.id === 'cuda_tensor_exec')?.status === 'passed';

  return (
    <div className="flex-1 flex overflow-hidden bg-[#1e1e1e] text-[#cccccc]">
      {/* 1. Primary Collapsible Sidebar: File Explorer */}
      {showSidebar && (
        <FileExplorer
          files={files}
          activeFilePath={activeFilePath}
          onSelectFile={handleSelectFile}
        />
      )}

      {/* 2. Main Editor & Bottom Panel Container */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Editor Tabs: Compact, rectangular, VS Code style */}
        <div className="h-[30px] bg-[#141414] border-b border-[#282828] flex items-center justify-between select-none shrink-0">
          <div className="flex items-center h-full overflow-x-auto">
            {openFiles.map(path => {
              const isActive = activeFilePath === path;
              const fileName = path.split('/').pop() || path;
              const isNotebook = path.endsWith('.ipynb');

              return (
                <div
                  key={path}
                  onClick={() => setActiveFilePath(path)}
                  className={`h-full px-3 flex items-center gap-2 cursor-pointer text-[12px] border-r border-[#242424] transition-colors relative ${
                    isActive
                      ? 'bg-[#1e1e1e] text-[#ffffff] font-normal border-t border-t-[#0078d4]'
                      : 'bg-[#141414] text-[#858585] hover:text-[#cccccc] hover:bg-[#1a1a1a]'
                  }`}
                >
                  <span className={`text-[10px] font-mono font-bold ${isNotebook ? 'text-[#dcdcaa]' : 'text-[#569cd6]'}`}>
                    {isNotebook ? 'ipynb' : 'py'}
                  </span>
                  <span>{fileName}</span>
                  {openFiles.length > 1 && (
                    <button
                      onClick={(e) => closeTab(path, e)}
                      className="p-0.5 hover:text-[#ffffff] rounded-sm transition-colors text-[#5a5a5a]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center px-2 text-[#777777]">
            <button
              onClick={() => setSplitView(!splitView)}
              className={`p-1 hover:text-[#cccccc] rounded-sm transition-colors ${splitView ? 'text-[#0078d4]' : ''}`}
              title="Split Editor Right"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Editor Breadcrumb Line */}
        <div className="h-[22px] px-3 bg-[#1e1e1e] border-b border-[#242424] flex items-center gap-1.5 text-[11px] text-[#666666] select-none font-mono">
          <span>gemma-agent-core</span>
          <span>&gt;</span>
          <span>{activeFilePath.replace(/\//g, ' > ')}</span>
        </div>

        {/* Editor Body: Single or Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Pane */}
          <div className={`flex-1 flex overflow-hidden ${splitView ? 'border-r border-[#282828]' : ''}`}>
            {activeFile.name.endsWith('.ipynb') && activeFile.cells ? (
              <NotebookEditor
                cells={activeFile.cells}
                onUpdateCells={handleUpdateCells}
                gpuModel={lease?.capabilities.gpuModel || 'NVIDIA H200 SXM'}
                isGpuReady={isGpuReady}
              />
            ) : (
              <CodeEditor
                file={activeFile}
                onSaveContent={handleSaveFileContent}
                onRunInTerminal={handleRunInTerminal}
              />
            )}
          </div>

          {/* Split Secondary Pane */}
          {splitView && (
            <div className="flex-1 flex overflow-hidden">
              <CodeEditor
                file={pythonFile}
                onSaveContent={handleSaveFileContent}
                onRunInTerminal={handleRunInTerminal}
              />
            </div>
          )}
        </div>

        {/* Bottom Panel (Terminal / Jobs): Collapsible */}
        {showBottomPanel && (
          <div className="h-[210px] border-t border-[#282828] bg-[#181818] flex flex-col shrink-0 select-none">
            {/* Panel Tabs */}
            <div className="h-[26px] px-2 border-b border-[#282828] bg-[#141414] flex items-center justify-between text-[11px] font-medium text-[#858585]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBottomTab('terminal')}
                  className={`h-[22px] px-2 flex items-center gap-1 transition-colors ${
                    bottomTab === 'terminal' ? 'text-[#ffffff] border-b border-[#0078d4]' : 'hover:text-[#cccccc]'
                  }`}
                >
                  <Terminal className="w-3 h-3 text-[#0078d4]" />
                  <span>TERMINAL</span>
                </button>

                <button
                  onClick={() => setBottomTab('jobs')}
                  className={`h-[22px] px-2 flex items-center gap-1 transition-colors ${
                    bottomTab === 'jobs' ? 'text-[#ffffff] border-b border-[#0078d4]' : 'hover:text-[#cccccc]'
                  }`}
                >
                  <Activity className="w-3 h-3 text-[#4ec9b0]" />
                  <span>DETACHED JOBS (INVARIANT I11)</span>
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {bottomTab === 'terminal' ? (
                <TerminalPanel
                  initialCommand={terminalDispatchCommand}
                  onClearInitialCommand={() => setTerminalDispatchCommand(undefined)}
                />
              ) : (
                <JobsSupervisor />
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Right Inspector (Fabric Inspector): Collapsible */}
      {showInspector && (
        <FabricInspector
          lease={lease}
          telemetry={telemetry}
          readinessChecks={readinessChecks}
          onReverifyReadiness={onReverifyReadiness}
          isVerifying={isVerifying}
        />
      )}
    </div>
  );
};
