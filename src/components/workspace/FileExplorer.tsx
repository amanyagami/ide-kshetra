import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  FileCode, 
  Plus, 
  GitBranch, 
  RefreshCw 
} from 'lucide-react';
import { RepositoryFile } from '../../types/fabric';

interface FileExplorerProps {
  files: RepositoryFile[];
  activeFilePath: string;
  onSelectFile: (file: RepositoryFile) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFilePath,
  onSelectFile,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'notebooks': true,
    'src': true,
    'src/project': true,
    '.devcontainer': true,
  });

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const getFileIcon = (file: RepositoryFile) => {
    if (file.name.endsWith('.ipynb')) {
      return <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
    if (file.name.endsWith('.py')) {
      return <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    }
    if (file.name.endsWith('.toml') || file.name.endsWith('.lock')) {
      return <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
    if (file.name.toLowerCase().includes('docker')) {
      return <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
    return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  };

  const renderFileTree = (items: RepositoryFile[], depth = 0) => {
    return items.map(item => {
      if (item.type === 'directory') {
        const isExpanded = expandedFolders[item.path] ?? true;
        return (
          <div key={item.path} className="select-none">
            <div
              onClick={() => toggleFolder(item.path)}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800/60 rounded cursor-pointer transition-colors"
              style={{ paddingLeft: `${depth * 14 + 8}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              )}
              <span className="truncate font-medium">{item.name}</span>
            </div>
            {isExpanded && item.children && (
              <div>{renderFileTree(item.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      const isActive = activeFilePath === item.path;
      return (
        <div
          key={item.path}
          onClick={() => onSelectFile(item)}
          className={`flex items-center gap-2 px-2 py-1 text-xs rounded cursor-pointer transition-colors select-none ${
            isActive
              ? 'bg-cyan-950/60 text-cyan-200 border-l-2 border-cyan-400 font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
          }`}
          style={{ paddingLeft: `${depth * 14 + 18}px` }}
        >
          {getFileIcon(item)}
          <span className="truncate">{item.name}</span>
          {item.name.endsWith('.ipynb') && (
            <span className="ml-auto text-[10px] text-amber-500/80 font-mono">nb</span>
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-60 border-r border-slate-800/80 bg-slate-950 flex flex-col shrink-0 h-full overflow-hidden text-slate-300">
      {/* File Explorer Header */}
      <div className="h-9 px-3 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-semibold tracking-wider uppercase">
        <span className="flex items-center gap-1.5">
          <GitBranch className="w-3 h-3 text-cyan-400" />
          <span>Files</span>
        </span>
        <div className="flex items-center gap-1">
          <button 
            title="Create File"
            className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button 
            title="Refresh Filesystem"
            className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Repo Context Pill-free metadata */}
      <div className="px-3 py-2 border-b border-slate-800/60 text-[11px] text-slate-400 bg-slate-900/30 flex items-center justify-between">
        <span className="font-mono text-slate-300">gemma-agent-core</span>
        <span className="text-emerald-400 text-[10px]">uv sync ✓</span>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto py-1 space-y-0.5">
        {renderFileTree(files)}
      </div>

      {/* Persistence & Volume Indicator */}
      <div className="p-2 border-t border-slate-800/80 text-[11px] text-slate-400 bg-slate-950 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span>Storage</span>
          <span className="font-mono text-slate-200">/workspace (ext4)</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
          <div className="bg-cyan-500 h-full rounded-full" style={{ width: '18%' }} />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>72.4 GB used</span>
          <span>400 GB total</span>
        </div>
      </div>
    </div>
  );
};
