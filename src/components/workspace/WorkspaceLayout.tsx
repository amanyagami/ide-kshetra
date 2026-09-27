import React, { useState } from 'react';
import { 
  BookOpen, 
  FileCode, 
  Terminal, 
  Activity, 
  Columns, 
  Maximize2, 
  Minimize2, 
  ChevronUp, 
  ChevronDown,
  Layers,
  X,
  Play
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
  gpuImageThumbnail: string;
  onExecuteTerminalCommand: (cmd: string) => void;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  files,
  lease,
  telemetry,
  readinessChecks,
  onReverifyReadiness,
  isVerifying,
  gpuImageThumbnail,
  onExecuteTerminalCommand,
}) => {
  // Active open file paths in editor
  const [openFiles, setOpenFiles] = useState<string[]>([
    'notebooks/training.ipynb',
    'src/project/train.py',
  ]);
  const [activeFilePath, setActiveFilePath] = useState<string>('notebooks/training.ipynb');
  const [splitView, setSplitView] = useState<boolean>(false);
  const [bottomTab, setBottomTab] = useState<'terminal' | 'jobs' | 'closed'>('terminal');
  const [terminalDispatchCommand, setTerminalDispatchCommand] = useState<string | undefined>(undefined);

  // Flattened file lookup helper
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
    // Updates notebook cells in activeFile
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
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden text-slate-200">
      {/* Workspace Sub-header (Tabs and View Controls) */}
      <div className="h-9 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-3 shrink-0 select-none">
        {/* Open File Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {openFiles.map(path => {
            const isActive = activeFilePath === path;
            const isNotebook = path.endsWith('.ipynb');

            return (
              <div
                key={path}
                onClick={() => setActiveFilePath(path)}
                className={`h-7 px-3 rounded-t-md text-xs font-mono flex items-center gap-2 cursor-pointer transition-colors border-t border-x ${
                  isActive
                    ? 'bg-slate-900 border-slate-700 text-white font-medium'
                    : 'bg-slate-950/60 border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {isNotebook ? (
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <FileCode className="w-3.5 h-3.5 text-sky-400" />
                )}
                <span>{path.split('/').pop()}</span>
                {openFiles.length > 1 && (
                  <button
                    onClick={(e) => closeTab(path, e)}
                    className="p-0.5 hover:text-rose-400 rounded transition-colors ml-1"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setSplitView(!splitView)}
            className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
              splitView
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Split Workspace: .ipynb and .py simultaneously"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split Editor</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body (3-Column Layout: Files | Canvas | Inspector) */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. File Explorer */}
        <FileExplorer
          files={files}
          activeFilePath={activeFilePath}
          onSelectFile={handleSelectFile}
        />

        {/* 2. Center Canvas: Single or Split View */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 flex overflow-hidden">
            {/* Primary Editor Pane */}
            <div className={`flex-1 flex overflow-hidden ${splitView ? 'border-r border-slate-800' : ''}`}>
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

            {/* Split Secondary Pane (shows Python package code alongside notebook) */}
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

          {/* 3. Bottom Drawer: Terminal & Jobs Supervisor */}
          <div className="border-t border-slate-800 bg-slate-950 flex flex-col shrink-0 select-none">
            {/* Drawer Tab Headers */}
            <div className="h-8 px-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setBottomTab(bottomTab === 'terminal' ? 'closed' : 'terminal')}
                  className={`flex items-center gap-1.5 py-1 transition-colors ${
                    bottomTab === 'terminal' 
                      ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Interactive Terminal</span>
                </button>

                <button
                  onClick={() => setBottomTab(bottomTab === 'jobs' ? 'closed' : 'jobs')}
                  className={`flex items-center gap-1.5 py-1 transition-colors ${
                    bottomTab === 'jobs' 
                      ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Detached Jobs (Invariant I11)</span>
                </button>
              </div>

              <button
                onClick={() => setBottomTab(bottomTab === 'closed' ? 'terminal' : 'closed')}
                className="text-slate-500 hover:text-slate-300 p-1"
                title={bottomTab === 'closed' ? 'Expand bottom drawer' : 'Collapse bottom drawer'}
              >
                {bottomTab === 'closed' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Drawer Content */}
            {bottomTab !== 'closed' && (
              <div className="h-56 overflow-hidden">
                {bottomTab === 'terminal' ? (
                  <TerminalPanel 
                    initialCommand={terminalDispatchCommand} 
                    onClearInitialCommand={() => setTerminalDispatchCommand(undefined)} 
                  />
                ) : (
                  <JobsSupervisor />
                )}
              </div>
            )}
          </div>
        </div>

        {/* 4. Right Inspector Sidebar */}
        <FabricInspector
          lease={lease}
          telemetry={telemetry}
          readinessChecks={readinessChecks}
          onReverifyReadiness={onReverifyReadiness}
          isVerifying={isVerifying}
          gpuImageThumbnail={gpuImageThumbnail}
        />
      </div>
    </div>
  );
};
