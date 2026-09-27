import React, { useState, useEffect } from 'react';
import { FileCode, Save, Check, Terminal, Play, FileText } from 'lucide-react';
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
      const moduleName = file.path.replace('src/', '').replace('.py', '').replace('/', '.');
      onRunInTerminal(`uv run python -m ${moduleName}`);
    } else {
      onRunInTerminal(`cat ${file.path}`);
    }
  };

  const lines = content.split('\n');

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden text-slate-100">
      {/* Editor Header Bar */}
      <div className="h-10 px-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-xs font-mono font-medium text-slate-200">{file.path}</span>
          {!isSaved && (
            <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Execute file in Fabric terminal"
          >
            <Play className="w-3 h-3 text-cyan-400 fill-current" />
            <span>Run File</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isSaved
                ? 'bg-slate-900 text-slate-500 cursor-default'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            {isSaved ? <Check className="w-3 h-3 text-emerald-400" /> : <Save className="w-3 h-3" />}
            <span>{isSaved ? 'Saved' : 'Save (Ctrl+S)'}</span>
          </button>
        </div>
      </div>

      {/* Editor Main Canvas with Line Numbers */}
      <div className="flex-1 flex overflow-hidden font-mono text-xs">
        {/* Line Numbers Column */}
        <div className="w-12 py-3 bg-slate-950/80 border-r border-slate-800/60 select-none text-right pr-3 text-slate-600 font-mono">
          {lines.map((_, i) => (
            <div key={i} className="leading-5 h-5">{i + 1}</div>
          ))}
        </div>

        {/* Text Area */}
        <div className="flex-1 overflow-auto p-3">
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
            className="w-full h-full bg-transparent resize-none outline-none font-mono text-xs text-slate-200 leading-5 whitespace-pre selection:bg-cyan-500/30"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};
