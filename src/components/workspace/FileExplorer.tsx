import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  FileCode, 
  FileText, 
  Plus, 
  RefreshCw,
  FolderPlus,
  MoreHorizontal
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
      return (
        <span className="text-[#dcdcaa] text-[10px] font-mono font-bold w-3.5 h-3.5 flex items-center justify-center shrink-0">
          ipynb
        </span>
      );
    }
    if (file.name.endsWith('.py')) {
      return (
        <span className="text-[#569cd6] text-[10px] font-mono font-bold w-3.5 h-3.5 flex items-center justify-center shrink-0">
          py
        </span>
      );
    }
    if (file.name.endsWith('.toml') || file.name.endsWith('.lock')) {
      return (
        <span className="text-[#858585] text-[10px] font-mono w-3.5 h-3.5 flex items-center justify-center shrink-0">
          cfg
        </span>
      );
    }
    if (file.name.toLowerCase().includes('docker')) {
      return (
        <span className="text-[#4ec9b0] text-[10px] font-mono w-3.5 h-3.5 flex items-center justify-center shrink-0">
          dkr
        </span>
      );
    }
    return <FileText className="w-3.5 h-3.5 text-[#858585] shrink-0" />;
  };

  const renderFileTree = (items: RepositoryFile[], depth = 0) => {
    return items.map(item => {
      if (item.type === 'directory') {
        const isExpanded = expandedFolders[item.path] ?? true;
        return (
          <div key={item.path} className="select-none">
            <div
              onClick={() => toggleFolder(item.path)}
              className="flex items-center gap-1 h-[22px] text-[#bbbbbb] hover:bg-[#202020] cursor-pointer text-[12px] transition-colors"
              style={{ paddingLeft: `${depth * 12 + 6}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-[#858585] shrink-0" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[#858585] shrink-0" />
              )}
              <span className="truncate">{item.name}</span>
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
          className={`flex items-center gap-1.5 h-[22px] text-[12px] cursor-pointer select-none transition-colors ${
            isActive
              ? 'bg-[#252526] text-[#ffffff] font-normal'
              : 'text-[#969696] hover:text-[#cccccc] hover:bg-[#1f1f1f]'
          }`}
          style={{ paddingLeft: `${depth * 12 + 18}px` }}
        >
          {getFileIcon(item)}
          <span className="truncate">{item.name}</span>
        </div>
      );
    });
  };

  return (
    <div className="w-[240px] bg-[#181818] border-r border-[#282828] flex flex-col shrink-0 h-full overflow-hidden text-[#cccccc] select-none">
      {/* Explorer Section Title */}
      <div className="h-[30px] px-3 flex items-center justify-between text-[11px] font-semibold text-[#8c8c8c] uppercase tracking-wide">
        <span className="truncate">Explorer</span>
        <div className="flex items-center gap-1 text-[#666666]">
          <button 
            title="New File" 
            className="p-1 hover:text-[#cccccc] rounded-sm transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button 
            title="New Folder" 
            className="p-1 hover:text-[#cccccc] rounded-sm transition-colors"
          >
            <FolderPlus className="w-3 h-3" />
          </button>
          <button 
            title="Refresh Explorer" 
            className="p-1 hover:text-[#cccccc] rounded-sm transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Workspace Name Dropdown Header */}
      <div className="h-[22px] px-2 bg-[#202020] border-t border-b border-[#282828] flex items-center justify-between text-[11px] font-bold text-[#cccccc]">
        <div className="flex items-center gap-1 truncate">
          <ChevronDown className="w-3 h-3 text-[#858585] shrink-0" />
          <span className="truncate uppercase tracking-wider text-[10px]">gemma-agent-core</span>
        </div>
        <span className="text-[10px] text-[#666666] font-normal font-mono">main</span>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {renderFileTree(files)}
      </div>

      {/* Storage & Environment Status (Minimal flat footer) */}
      <div className="p-2 border-t border-[#242424] text-[11px] text-[#666666] bg-[#161616] flex flex-col gap-1">
        <div className="flex justify-between items-center text-[10px]">
          <span>WORKSPACE</span>
          <span className="font-mono text-[#8c8c8c]">ext4 · rw</span>
        </div>
        <div className="w-full bg-[#262626] h-[2px]">
          <div className="bg-[#0078d4] h-full" style={{ width: '18%' }} />
        </div>
        <div className="flex justify-between text-[10px] text-[#555555] font-mono">
          <span>72.4 GB</span>
          <span>400 GB</span>
        </div>
      </div>
    </div>
  );
};
