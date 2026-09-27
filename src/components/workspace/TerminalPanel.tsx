import React, { useState } from 'react';
import { Terminal, Send, Trash2, SplitSquareVertical, Plus } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'bash' | 'agent'>('bash');
  const [history, setHistory] = useState<CommandEntry[]>([
    {
      command: 'fabric-agent doctor',
      timestamp: '14:20:02',
      output: [
        'Fabric Agent v2.4.1 (linux/amd64 commit 98a21f) - Diagnostic Self-Test',
        '----------------------------------------------------------------------',
        '[PASS] Identity & Enrollment: spiffe://execution.fabric/tenant/t_noah/node/n_gmi_h200 (mTLS cert valid)',
        '[PASS] Gateway Multiplexing: QUIC stream active on udp://gateway.fabric.internal:443 (fallback: TCP 443 OK)',
        '[PASS] Block Storage: /workspace (ext4) mounted rw, 400 GB total, 72.4 GB used, inode free: 94%',
        '[PASS] NVIDIA Container Toolkit: Driver 550.54.14, NVML reachable, GPU 0 device /dev/nvidia0 online',
        '[PASS] OCI Container Isolation: Kata/runc sandbox healthy, user uid=1000 (developer)',
        '[PASS] Jupyter Runtime Isolation: JupyterLab running from /opt/fabric/tools, kernels using /workspace/.venv',
        '[PASS] Restic Checkpoint Target: S3-compatible encrypted snapshot repository reachable (p95: 19ms)',
        'Status: ALL HEALTH CHECKS NOMINAL (Ready for workload supervision)',
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
    <div className="flex-1 flex flex-col h-full bg-[#181818] font-mono text-[11px] text-[#cccccc] overflow-hidden select-none">
      {/* Terminal Tab Bar */}
      <div className="h-[26px] px-2 border-b border-[#282828] bg-[#141414] flex items-center justify-between text-[#858585]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('bash')}
            className={`h-[22px] px-2 flex items-center gap-1.5 rounded-sm transition-colors ${
              activeTab === 'bash' ? 'bg-[#1e1e1e] text-[#cccccc]' : 'hover:text-[#cccccc]'
            }`}
          >
            <Terminal className="w-3 h-3 text-[#0078d4]" />
            <span>1: bash (node-gmi-h200)</span>
          </button>

          <button
            onClick={() => setActiveTab('agent')}
            className={`h-[22px] px-2 flex items-center gap-1.5 rounded-sm transition-colors ${
              activeTab === 'agent' ? 'bg-[#1e1e1e] text-[#cccccc]' : 'hover:text-[#cccccc]'
            }`}
          >
            <span className="text-[#858585]">2: fabric-agent</span>
          </button>

          <button className="p-1 hover:text-[#cccccc] rounded-sm transition-colors" title="New Terminal">
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-[#555555]">Quick:</span>
          <button
            onClick={() => executeCommand('nvidia-smi')}
            className="hover:text-[#cccccc] text-[#858585] transition-colors"
          >
            nvidia-smi
          </button>
          <span>·</span>
          <button
            onClick={() => executeCommand('fabric-agent doctor')}
            className="hover:text-[#cccccc] text-[#858585] transition-colors"
          >
            doctor
          </button>
          <span>·</span>
          <button
            onClick={() => executeCommand('uv run python -m project.train')}
            className="hover:text-[#cccccc] text-[#858585] transition-colors"
          >
            train
          </button>
          <span>·</span>
          <button
            onClick={() => setHistory([])}
            className="p-1 hover:text-[#cccccc] transition-colors"
            title="Clear Terminal"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Terminal Output Stream */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 select-text font-mono leading-5">
        {history.map((entry, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[#cccccc]">
              <span className="text-[#569cd6]">developer@node-gmi-h200</span>
              <span className="text-[#858585]">:</span>
              <span className="text-[#dcdcaa]">~</span>
              <span className="text-[#858585]">$</span>
              <span className="text-[#ffffff]">{entry.command}</span>
            </div>
            <div className="text-[#a0a0a0] pl-2 whitespace-pre-wrap">
              {entry.output.map((line, lIdx) => (
                <div 
                  key={lIdx}
                  className={
                    line.includes('[PASS]') || line.includes('[OK]') 
                      ? 'text-[#4ec9b0]' 
                      : line.includes('NVIDIA-SMI') 
                      ? 'text-[#858585]' 
                      : line.includes('Loss:') 
                      ? 'text-[#ce9178]' 
                      : ''
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Command Input Prompt */}
      <form 
        onSubmit={(e) => { e.preventDefault(); executeCommand(inputVal); }}
        className="h-[28px] border-t border-[#242424] px-2.5 bg-[#141414] flex items-center gap-1.5"
      >
        <span className="text-[#569cd6] text-[11px]">developer@node:~$</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="nvidia-smi, fabric-agent doctor, uv run..."
          className="flex-1 bg-transparent outline-none font-mono text-[11px] text-[#cccccc] placeholder-[#444444]"
        />
        <button
          type="submit"
          className="p-1 text-[#666666] hover:text-[#cccccc] transition-colors"
        >
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
