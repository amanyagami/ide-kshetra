import React, { useState, useEffect } from 'react';
import { Play, Save, Check } from 'lucide-react';
import { RepositoryFile } from '../../types/fabric';

interface CodeEditorProps {
  file: RepositoryFile;
  onSaveContent: (path: string, content: string) => void;
  onRunInTerminal: (command: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  onSaveContent,
  onRunInTerminal,
}) => {
  const [content, setContent] = useState<string>(file.content || '');
  const [isSaved, setIsSaved] = useState<boolean>(true);

  useEffect(() => {
    setContent(file.content || '');
    setIsSaved(true);
  }, [file.path, file.content]);

  const handleSave = () => {
    onSaveContent(file.path, content);
    setIsSaved(true);
  };

  const handleRun = () => {
    if (file.path.endsWith('.py')) {
      const moduleName = file.path.replace('src/', '').replace('.py', '').replace(/\//g, '.');
      onRunInTerminal(`uv run python -m ${moduleName}`);
    } else {
      onRunInTerminal(`cat ${file.path}`);
    }
  };

  const lines = content.split('\n');

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e1e] overflow-hidden text-[#d4d4d4]">
      {/* Editor Sub-Header: Path Breadcrumbs & Actions */}
      <div className="h-[30px] px-3 border-b border-[#282828] bg-[#181818] flex items-center justify-between shrink-0 select-none text-[11px]">
        <div className="flex items-center gap-1.5 text-[#858585] font-mono">
          <span>{file.path}</span>
          {!isSaved && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#cccccc]" title="Unsaved change" />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRun}
            className="h-[22px] px-2 rounded-sm bg-[#252525] hover:bg-[#2d2d2d] text-[#cccccc] flex items-center gap-1 transition-colors"
            title="Execute file in Fabric terminal"
          >
            <Play className="w-2.5 h-2.5 fill-current text-[#4ec9b0]" />
            <span>Run</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`h-[22px] px-2 rounded-sm flex items-center gap-1 transition-colors ${
              isSaved
                ? 'bg-[#181818] text-[#555555] cursor-default'
                : 'bg-[#0078d4] hover:bg-[#006bbd] text-white'
            }`}
          >
            {isSaved ? <Check className="w-2.5 h-2.5 text-[#4ec9b0]" /> : <Save className="w-2.5 h-2.5" />}
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Editor Canvas with Line Numbers */}
      <div className="flex-1 flex overflow-hidden font-mono text-[12px] leading-5">
        {/* Line Numbers Column */}
        <div className="w-12 py-2 bg-[#1e1e1e] border-r border-[#282828] select-none text-right pr-3 text-[#5a5a5a] shrink-0">
          {lines.map((_, i) => (
            <div key={i} className="h-5">{i + 1}</div>
          ))}
        </div>

        {/* Text Input Area */}
        <div className="flex-1 overflow-auto p-2">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setIsSaved(false);
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
              }
            }}
            className="w-full h-full bg-transparent resize-none outline-none font-mono text-[12px] text-[#d4d4d4] leading-5 whitespace-pre selection:bg-[#264f78]"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};
