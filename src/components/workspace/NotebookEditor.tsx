import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Zap, 
  Cpu
} from 'lucide-react';
import { NotebookCell } from '../../types/fabric';

interface NotebookEditorProps {
  cells: NotebookCell[];
  onUpdateCells: (newCells: NotebookCell[]) => void;
  gpuModel: string;
  isGpuReady: boolean;
}

export const NotebookEditor: React.FC<NotebookEditorProps> = ({
  cells,
  onUpdateCells,
  gpuModel,
  isGpuReady,
}) => {
  const [activeCellId, setActiveCellId] = useState<string>(cells[0]?.id || 'cell-1');
  const [runningCellId, setRunningCellId] = useState<string | null>(null);

  const runCell = async (cellId: string) => {
    setRunningCellId(cellId);
    
    const updated = cells.map(c => {
      if (c.id === cellId) {
        return { ...c, status: 'running' as const };
      }
      return c;
    });
    onUpdateCells(updated);

    await new Promise(r => setTimeout(r, 380));

    const finalCells = cells.map(c => {
      if (c.id === cellId) {
        const nextExecCount = (c.executionCount || 0) + 1;
        let newOutputs = c.outputs;

        if (c.id === 'cell-4') {
          const tflops = (940 + Math.random() * 40).toFixed(2);
          const latency = (1.08 + Math.random() * 0.12).toFixed(2);
          newOutputs = [
            {
              outputType: 'stream',
              text: [
                'GEMM Shape: [8192, 8192] x [8192, 8192]\n',
                `Execution Latency: ${latency} ms\n`,
                `Sustained Tensor Core Throughput: ${tflops} TFLOPS\n`,
              ],
            },
          ];
        } else if (c.id === 'cell-5') {
          const lossVal = (3.1 + Math.random() * 0.3).toFixed(4);
          newOutputs = [
            {
              outputType: 'stream',
              text: [
                'Batch Tokens: (32, 1024)\n',
                `Initial Cross-Entropy Loss: ${lossVal}\n`,
                'Training step pipeline verified. Ready for background training execution.\n',
              ],
            },
          ];
        }

        return {
          ...c,
          status: 'success' as const,
          executionCount: nextExecCount,
          runtimeMs: Math.floor(25 + Math.random() * 70),
          outputs: newOutputs,
        };
      }
      return c;
    });

    onUpdateCells(finalCells);
    setRunningCellId(null);
  };

  const runAllCells = async () => {
    for (const cell of cells) {
      if (cell.cellType === 'code') {
        await runCell(cell.id);
      }
    }
  };

  const restartKernel = () => {
    const reset = cells.map(c => ({
      ...c,
      status: 'idle' as const,
      executionCount: null,
    }));
    onUpdateCells(reset);
  };

  const addCell = (type: 'code' | 'markdown', afterId?: string) => {
    const newCell: NotebookCell = {
      id: `cell-${Date.now()}`,
      cellType: type,
      source: type === 'code' ? '# In [ ]: Write Python code\n' : '### Notes\n',
      executionCount: null,
      status: 'idle',
      outputs: [],
    };

    if (!afterId) {
      onUpdateCells([...cells, newCell]);
    } else {
      const idx = cells.findIndex(c => c.id === afterId);
      const copy = [...cells];
      copy.splice(idx + 1, 0, newCell);
      onUpdateCells(copy);
    }
    setActiveCellId(newCell.id);
  };

  const deleteCell = (cellId: string) => {
    if (cells.length <= 1) return;
    onUpdateCells(cells.filter(c => c.id !== cellId));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e1e] overflow-hidden text-[#cccccc]">
      {/* Notebook Toolbar: Compact, flat, VS Code style */}
      <div className="h-[30px] px-3 border-b border-[#282828] bg-[#181818] flex items-center justify-between shrink-0 select-none text-[11px]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => runCell(activeCellId)}
            disabled={runningCellId !== null}
            className="h-[22px] px-2 rounded-sm bg-[#0078d4] hover:bg-[#006bbd] disabled:opacity-40 text-white flex items-center gap-1 transition-colors"
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>Run Cell</span>
          </button>

          <button
            onClick={runAllCells}
            disabled={runningCellId !== null}
            className="h-[22px] px-2 rounded-sm bg-[#252525] hover:bg-[#2d2d2d] text-[#bbbbbb] flex items-center gap-1 transition-colors"
          >
            <Zap className="w-2.5 h-2.5 text-[#cca700]" />
            <span>Run All</span>
          </button>

          <button
            onClick={restartKernel}
            className="h-[22px] px-2 rounded-sm hover:bg-[#252525] text-[#858585] hover:text-[#cccccc] flex items-center gap-1 transition-colors"
            title="Restart Kernel"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Restart</span>
          </button>

          <div className="h-3 w-px bg-[#2b2b2b] mx-1" />

          <button
            onClick={() => addCell('code', activeCellId)}
            className="h-[22px] px-2 rounded-sm hover:bg-[#252525] text-[#858585] hover:text-[#cccccc] flex items-center gap-1 transition-colors"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>Code</span>
          </button>

          <button
            onClick={() => addCell('markdown', activeCellId)}
            className="h-[22px] px-2 rounded-sm hover:bg-[#252525] text-[#858585] hover:text-[#cccccc] flex items-center gap-1 transition-colors"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>Markdown</span>
          </button>
        </div>

        {/* Kernel & Hardware Status */}
        <div className="flex items-center gap-2.5 text-[11px] font-mono text-[#858585]">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isGpuReady ? 'bg-[#4ec9b0]' : 'bg-[#cca700]'}`} />
            <span className="text-[#cccccc]">Python 3.12 (uv venv)</span>
          </div>
          <span className="text-[#3a3a3a]">|</span>
          <div className="flex items-center gap-1 text-[#858585]">
            <Cpu className="w-3 h-3 text-[#666666]" />
            <span>{gpuModel}</span>
          </div>
        </div>
      </div>

      {/* Cells List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {cells.map((cell) => {
          const isActive = activeCellId === cell.id;
          const isRunning = runningCellId === cell.id;

          if (cell.cellType === 'markdown') {
            return (
              <div
                key={cell.id}
                onClick={() => setActiveCellId(cell.id)}
                className={`p-2.5 rounded-sm border transition-colors ${
                  isActive
                    ? 'border-[#0078d4] bg-[#222222]'
                    : 'border-transparent hover:border-[#2b2b2b]'
                }`}
              >
                <div className="text-[12px] text-[#cccccc] leading-relaxed">
                  {cell.source.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) {
                      return <h3 key={i} className="text-[13px] font-semibold text-[#ffffff] mb-1">{line.replace('## ', '')}</h3>;
                    }
                    if (line.startsWith('### ')) {
                      return <h4 key={i} className="text-[12px] font-medium text-[#dddddd] my-1">{line.replace('### ', '')}</h4>;
                    }
                    return <p key={i} className="text-[#a0a0a0] mb-0.5">{line}</p>;
                  })}
                </div>
              </div>
            );
          }

          // Code Cell: Jupyter / VS Code style
          return (
            <div
              key={cell.id}
              onClick={() => setActiveCellId(cell.id)}
              className={`rounded-sm border transition-colors ${
                isActive
                  ? 'border-[#0078d4] bg-[#1e1e1e]'
                  : 'border-[#282828] bg-[#1e1e1e] hover:border-[#333333]'
              }`}
            >
              {/* Cell Input Section */}
              <div className="flex items-start">
                {/* Gutter with In [ ]: prompt */}
                <div className="w-14 pt-2.5 pr-2 select-none text-right font-mono text-[11px] text-[#666666] shrink-0">
                  {isRunning ? (
                    <span className="text-[#0078d4] animate-pulse">In [*]:</span>
                  ) : (
                    <span>In [{cell.executionCount ?? ' '}]:</span>
                  )}
                </div>

                {/* Code Textarea Area */}
                <div className="flex-1 py-2 pr-3">
                  <textarea
                    value={cell.source}
                    onChange={(e) => {
                      const newSource = e.target.value;
                      onUpdateCells(
                        cells.map(c => c.id === cell.id ? { ...c, source: newSource } : c)
                      );
                    }}
                    rows={cell.source.split('\n').length}
                    className="w-full bg-transparent resize-none outline-none font-mono text-[12px] text-[#d4d4d4] leading-5 selection:bg-[#264f78]"
                    spellCheck={false}
                  />
                </div>

                {/* Quick actions for active cell */}
                {isActive && (
                  <div className="flex items-center gap-1 pt-2 pr-2 text-[#666666] shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); runCell(cell.id); }}
                      className="p-1 hover:text-[#cccccc] rounded-sm transition-colors"
                      title="Run Cell (Shift+Enter)"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); addCell('code', cell.id); }}
                      className="p-1 hover:text-[#cccccc] rounded-sm transition-colors"
                      title="Add Cell Below"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCell(cell.id); }}
                      className="p-1 hover:text-[#e06c75] rounded-sm transition-colors"
                      title="Delete Cell"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Cell Output Section */}
              {cell.outputs && cell.outputs.length > 0 && (
                <div className="flex border-t border-[#252526] bg-[#181818]">
                  <div className="w-14 pt-2 pr-2 select-none text-right font-mono text-[11px] text-[#555555] shrink-0">
                    Out:
                  </div>
                  <div className="flex-1 p-2 font-mono text-[11px] text-[#a0a0a0] leading-relaxed overflow-x-auto">
                    {cell.outputs.map((out, outIdx) => (
                      <div key={outIdx} className="space-y-0.5">
                        {out.text?.map((txtLine, txtIdx) => (
                          <div 
                            key={txtIdx} 
                            className={
                              txtLine.includes('TFLOPS') 
                                ? 'text-[#4ec9b0] font-semibold' 
                                : txtLine.includes('Loss:') 
                                ? 'text-[#ce9178]' 
                                : 'text-[#b5b5b5]'
                            }
                          >
                            {txtLine}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
