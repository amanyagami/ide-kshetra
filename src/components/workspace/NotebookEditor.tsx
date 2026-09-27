import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Check, 
  Zap, 
  Activity, 
  Cpu, 
  Copy,
  ChevronUp,
  ChevronDown
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
    
    // Simulate kernel dispatch and execution
    const updated = cells.map(c => {
      if (c.id === cellId) {
        return { ...c, status: 'running' as const };
      }
      return c;
    });
    onUpdateCells(updated);

    await new Promise(r => setTimeout(r, 450));

    const finalCells = cells.map(c => {
      if (c.id === cellId) {
        const nextExecCount = (c.executionCount || 0) + 1;
        let newOutputs = c.outputs;

        // Custom output logic if cell 4 (tensor benchmark) or cell 5 (training step)
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
                'Training step pipeline verified. Ready for detached background training.\n',
              ],
            },
          ];
        }

        return {
          ...c,
          status: 'success' as const,
          executionCount: nextExecCount,
          runtimeMs: Math.floor(30 + Math.random() * 90),
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
      source: type === 'code' ? '# Write your Python / PyTorch code here\n' : '### New Notes\n',
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
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden text-slate-100">
      {/* Notebook Toolbar */}
      <div className="h-10 px-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <button
            onClick={() => runCell(activeCellId)}
            disabled={runningCellId !== null}
            className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run Cell</span>
          </button>

          <button
            onClick={runAllCells}
            disabled={runningCellId !== null}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Run All</span>
          </button>

          <button
            onClick={restartKernel}
            className="px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors"
            title="Restart Kernel"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restart</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={() => addCell('code', activeCellId)}
            className="px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
          >
            <Plus className="w-3 h-3 text-cyan-400" />
            <span>+ Code</span>
          </button>

          <button
            onClick={() => addCell('markdown', activeCellId)}
            className="px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
          >
            <Plus className="w-3 h-3 text-purple-400" />
            <span>+ Text</span>
          </button>
        </div>

        {/* Kernel Status */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isGpuReady ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="font-mono text-slate-300">Python 3.12 (uv venv)</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>{gpuModel}</span>
          </div>
        </div>
      </div>

      {/* Cells List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {cells.map((cell) => {
          const isActive = activeCellId === cell.id;
          const isRunning = runningCellId === cell.id;

          if (cell.cellType === 'markdown') {
            return (
              <div
                key={cell.id}
                onClick={() => setActiveCellId(cell.id)}
                className={`group rounded-lg p-3 border transition-colors ${
                  isActive
                    ? 'border-cyan-500/50 bg-slate-900/30 shadow-sm'
                    : 'border-transparent hover:border-slate-800 bg-transparent'
                }`}
              >
                <div className="prose prose-invert prose-sm max-w-none text-slate-200 font-sans">
                  {cell.source.split('\n').map((line, i) => {
                    if (line.startsWith('# ')) {
                      return <h2 key={i} className="text-lg font-bold text-white mb-2">{line.replace('# ', '')}</h2>;
                    }
                    if (line.startsWith('### ')) {
                      return <h4 key={i} className="text-sm font-semibold text-slate-200 my-1">{line.replace('### ', '')}</h4>;
                    }
                    return <p key={i} className="text-xs text-slate-300 leading-relaxed">{line}</p>;
                  })}
                </div>
              </div>
            );
          }

          // Code Cell
          return (
            <div
              key={cell.id}
              onClick={() => setActiveCellId(cell.id)}
              className={`group rounded-lg border transition-all ${
                isActive
                  ? 'border-cyan-500/60 bg-slate-900/60 shadow-lg shadow-cyan-950/20'
                  : 'border-slate-800/80 bg-slate-900/20 hover:border-slate-700'
              }`}
            >
              {/* Cell Header / Action Row */}
              <div className="px-3 py-1.5 border-b border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-400 font-semibold">
                    In [{cell.executionCount ?? ' '}]:
                  </span>
                  {cell.runtimeMs && (
                    <span className="text-slate-500 font-mono text-[10px]">
                      {cell.runtimeMs}ms
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); runCell(cell.id); }}
                    className="p-1 hover:text-cyan-400 rounded hover:bg-slate-800 transition-colors"
                    title="Run Cell"
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); addCell('code', cell.id); }}
                    className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
                    title="Insert Cell Below"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteCell(cell.id); }}
                    className="p-1 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                    title="Delete Cell"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Code Input */}
              <div className="p-3 font-mono text-xs bg-slate-950/40 text-slate-200 overflow-x-auto leading-relaxed">
                <textarea
                  value={cell.source}
                  onChange={(e) => {
                    const newSource = e.target.value;
                    onUpdateCells(
                      cells.map(c => c.id === cell.id ? { ...c, source: newSource } : c)
                    );
                  }}
                  rows={cell.source.split('\n').length}
                  className="w-full bg-transparent resize-none outline-none font-mono text-xs text-slate-200 selection:bg-cyan-500/30"
                  spellCheck={false}
                />
              </div>

              {/* Outputs Area */}
              {cell.outputs && cell.outputs.length > 0 && (
                <div className="border-t border-slate-800/80 bg-slate-950/80 p-3 text-xs font-mono">
                  {cell.outputs.map((out, outIdx) => (
                    <div key={outIdx} className="space-y-1">
                      {out.text?.map((txtLine, txtIdx) => (
                        <div 
                          key={txtIdx} 
                          className={`${
                            txtLine.includes('✓') 
                              ? 'text-emerald-400 font-semibold' 
                              : txtLine.includes('TFLOPS') 
                              ? 'text-cyan-300 font-bold' 
                              : 'text-slate-300'
                          }`}
                        >
                          {txtLine}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
