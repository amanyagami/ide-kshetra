import React, { useState } from 'react';
import { Terminal, Send, Trash2, ShieldAlert, Cpu, Activity, Play } from 'lucide-react';

interface TerminalPanelProps {
  initialCommand?: string;
  onClearInitialCommand?: () => void;
}

interface CommandEntry {
  command: string;
  output: string[];
  timestamp: string;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  initialCommand,
  onClearInitialCommand,
}) => {
  const [history, setHistory] = useState<CommandEntry[]>([
    {
      command: 'fabric-agent doctor',
      timestamp: '14:20:02',
      output: [
        'Fabric Agent v2.4.1 (linux/amd64 commit 98a21f) · Diagnostic Self-Test',
        '----------------------------------------------------------------------',
        '[PASS] Identity & Enrollment: spiffe://execution.fabric/tenant/t_noah/node/n_gmi_h200 (valid mTLS cert)',
        '[PASS] Gateway Multiplexing: QUIC stream active on udp://gateway.fabric.internal:443 (fallback: TCP 443 OK)',
        '[PASS] Block Storage: /workspace (ext4) mounted rw, 400 GB total, 72.4 GB used, inode free: 94%',
        '[PASS] NVIDIA Container Toolkit: Driver 550.54.14, NVML reachable, GPU 0 device /dev/nvidia0 online',
        '[PASS] OCI Container Isolation: Kata/runc sandbox healthy, user uid=1000 (developer)',
        '[PASS] Jupyter Runtime Isolation: JupyterLab running from /opt/fabric/tools, kernels using /workspace/.venv',
        '[PASS] Restic Checkpoint Target: S3-compatible encrypted snapshot repository reachable (p95: 19ms)',
        '>> System status: ALL HEALTH CHECKS NOMINAL (Ready for workload supervision)',
      ],
    },
  ]);

  const [inputVal, setInputVal] = useState<string>('');

  React.useEffect(() => {
    if (initialCommand) {
      executeCommand(initialCommand);
      if (onClearInitialCommand) onClearInitialCommand();
    }
  }, [initialCommand]);

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    let output: string[] = [];
    const lower = trimmed.toLowerCase();

    if (lower === 'nvidia-smi') {
      output = [
        '+-----------------------------------------------------------------------------------------+',
        '| NVIDIA-SMI 550.54.14              Driver Version: 550.54.14      CUDA Version: 12.4     |',
        '|-----------------------------------------+------------------------+----------------------+',
        '| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |',
        '| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |',
        '|=========================================+========================+======================|',
        '|   0  NVIDIA H200 141GB SXM          On  |   00000000:0F:00.0 Off |                    0 |',
        '| N/A   42C    P0            320W / 700W  |    4260MiB / 144384MiB |     28%      Default |',
        '+-----------------------------------------+------------------------+----------------------+',
        '| Processes:                                                                              |',
        '|  GPU   GI   CI        PID   Type   Process name                              GPU Memory |',
        '|        ID   ID                                                               Usage      |',
        '|=========================================================================================|',
        '|    0   N/A  N/A      4129      C   /workspace/.venv/bin/python                  4250MiB |',
        '+-----------------------------------------------------------------------------------------+',
      ];
    } else if (lower.includes('doctor')) {
      output = [
        'Fabric Agent v2.4.1 diagnostics running...',
        '[OK] Memory: 128 GB Total, 114 GB Available',
        '[OK] GPU: NVIDIA H200 SXM, 141 GB HBM3e VRAM, PCIe Gen5 x16',
        '[OK] Gateway Connection: QUIC mTLS active, 0 packet loss, 1.2ms roundtrip',
        '[OK] Container Engine: Docker / containerd 1.7.19 with NVIDIA CDI runtime',
      ];
    } else if (lower.includes('uv run') || lower.includes('train')) {
      output = [
        'Using /workspace/.venv (Python 3.12.3)',
        'Initializing GemmaAttentionBlock (Hopper Tensor Core FP16)...',
        'Batch 1/100 | Step 1 | Loss: 3.4182 | Throughput: 49,210 tokens/sec',
        'Batch 2/100 | Step 2 | Loss: 3.2941 | Throughput: 51,400 tokens/sec',
        'Step verified: GPU tensor matrix multiplication completed cleanly.',
      ];
    } else if (lower.includes('cpuinfo')) {
      output = [
        'processor       : 0',
        'vendor_id       : GenuineIntel',
        'model name      : Intel(R) Xeon(R) Platinum 8480+ (Sapphire Rapids)',
        'cpu cores       : 32',
        'flags           : fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov avx512f amx_bf16',
      ];
    } else if (lower.includes('restic')) {
      output = [
        'repository sha256:4f89d311cb7a8b92 opened successfully',
        'ID        Time                 Host                  Tags        Paths',
        '-----------------------------------------------------------------------------',
        'a1b2c3d4  2026-09-26 14:00:00  node-gmi-h200         checkpoint  /workspace',
        '1 snapshots found. RPO: 24 minutes ago. Local encrypted restic repository healthy.',
      ];
    } else if (lower.includes('ping')) {
      output = [
        'PING gateway.fabric.internal (10.240.0.1) 56(84) bytes of data.',
        '64 bytes from 10.240.0.1: icmp_seq=1 ttl=64 time=1.18 ms',
        '64 bytes from 10.240.0.1: icmp_seq=2 ttl=64 time=1.04 ms',
        '--- gateway.fabric.internal ping statistics ---',
        '2 packets transmitted, 2 received, 0% packet loss, time 1001ms',
      ];
    } else if (lower.includes('clear')) {
      setHistory([]);
      setInputVal('');
      return;
    } else {
      output = [
        `Executed: ${trimmed}`,
        `Process finished with exit code 0.`,
      ];
    }

    setHistory(prev => [
      ...prev,
      {
        command: trimmed,
        timestamp: new Date().toLocaleTimeString(),
        output,
      },
    ]);
    setInputVal('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 font-mono text-xs text-slate-200 overflow-hidden">
      {/* Quick command bar */}
      <div className="h-8 px-3 border-b border-slate-800/60 bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-400 select-none">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-slate-500 font-medium">Quick commands:</span>
          <button
            onClick={() => executeCommand('fabric-agent doctor')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
          >
            fabric-agent doctor
          </button>
          <button
            onClick={() => executeCommand('nvidia-smi')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 transition-colors"
          >
            nvidia-smi
          </button>
          <button
            onClick={() => executeCommand('uv run python -m project.train')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
          >
            uv run train
          </button>
          <button
            onClick={() => executeCommand('restic snapshots')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 transition-colors"
          >
            restic snapshots
          </button>
        </div>

        <button
          onClick={() => setHistory([])}
          className="p-1 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
          title="Clear Terminal"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Output log */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 leading-relaxed">
        {history.map((entry, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <span className="text-slate-500 font-normal">[{entry.timestamp}]</span>
              <span>developer@node-gmi-h200:~$</span>
              <span className="text-white">{entry.command}</span>
            </div>
            <div className="pl-4 border-l border-slate-800 text-slate-300 space-y-0.5 whitespace-pre-wrap">
              {entry.output.map((line, lIdx) => (
                <div 
                  key={lIdx}
                  className={`${
                    line.includes('[PASS]') || line.includes('[OK]') 
                      ? 'text-emerald-400' 
                      : line.includes('NVIDIA-SMI') 
                      ? 'text-cyan-300' 
                      : line.includes('Loss:') 
                      ? 'text-amber-300 font-bold' 
                      : ''
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Command prompt input */}
      <form 
        onSubmit={(e) => { e.preventDefault(); executeCommand(inputVal); }}
        className="h-10 border-t border-slate-800/80 px-3 bg-slate-900/60 flex items-center gap-2"
      >
        <span className="text-cyan-400 font-bold">developer@node:~$</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Type command (e.g. nvidia-smi, fabric-agent doctor, uv run...)"
          className="flex-1 bg-transparent outline-none font-mono text-xs text-white placeholder-slate-600"
        />
        <button
          type="submit"
          className="p-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
        >
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
