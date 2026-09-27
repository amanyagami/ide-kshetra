import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Activity, Cpu, Layers, HardDrive } from 'lucide-react';
import { DetachedJob } from '../../types/fabric';

export const JobsSupervisor: React.FC = () => {
  const [jobs, setJobs] = useState<DetachedJob[]>([
    {
      id: 'job-gemma-ft-01',
      name: 'Gemma-2B SFT Distributed Fine-Tuning',
      command: 'uv run python -m project.train --epochs 20 --batch-size 32 --lr 1e-4 --device cuda:0',
      pid: 4129,
      status: 'running',
      startedAt: '12m ago',
      durationSec: 742,
      currentEpoch: 6,
      totalEpochs: 20,
      loss: 1.482,
      accuracy: 94.2,
      vramUsedGB: 42.6,
      logs: [
        '[Epoch 06/20 Step 1240] loss: 1.4820 | lr: 0.000084 | tok/sec: 48,920 | vram: 42.6GB',
        '[Checkpoint] Saved model shard to /workspace/checkpoints/epoch_06_step_1200.pt (sha256 verified)',
        '[Fabric Agent] Health probe nominal. Job process PID 4129 running detached in background container.',
      ],
    },
  ]);

  // Live timer simulation for running jobs
  useEffect(() => {
    const timer = setInterval(() => {
      setJobs(prevJobs =>
        prevJobs.map(j => {
          if (j.status === 'running') {
            const nextDuration = j.durationSec + 1;
            const nextLoss = Math.max(0.4, j.loss - 0.0003);
            return {
              ...j,
              durationSec: nextDuration,
              loss: parseFloat(nextLoss.toFixed(4)),
            };
          }
          return j;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleJob = (jobId: string) => {
    setJobs(prev =>
      prev.map(j => {
        if (j.id === jobId) {
          const nextStatus = j.status === 'running' ? 'stopped' : 'running';
          return { ...j, status: nextStatus };
        }
        return j;
      })
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 font-mono text-xs text-slate-200 overflow-y-auto p-4 space-y-4">
      {/* Background Persistence Banner */}
      <div className="p-3 rounded-lg border border-indigo-900/60 bg-indigo-950/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-white">Fabric Agent Job Supervisor (Invariant I11)</span>
            <span className="text-slate-400 block text-[11px]">
              Jobs run inside the remote agent process. Closing the browser or switching networks will NOT interrupt active workloads.
            </span>
          </div>
        </div>
        <span className="text-emerald-400 font-mono text-xs">1 Active Job</span>
      </div>

      {/* Jobs List */}
      {jobs.map(job => (
        <div 
          key={job.id} 
          className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{job.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                  PID {job.pid}
                </span>
                <span className="text-slate-500 text-xs">· started {job.startedAt}</span>
              </div>
              <div className="text-[11px] text-cyan-400/90 font-mono mt-0.5 truncate">
                $ {job.command}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleJob(job.id)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                {job.status === 'running' ? (
                  <>
                    <Pause className="w-3 h-3 text-amber-400 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-emerald-400 fill-current" />
                    <span>Resume</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-4 gap-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Epoch Progress</span>
              <span className="text-sm font-bold text-white font-mono">
                {job.currentEpoch} / {job.totalEpochs}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Loss</span>
              <span className="text-sm font-bold text-cyan-400 font-mono">
                {job.loss.toFixed(4)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">VRAM Consumed</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {job.vramUsedGB} GB
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Duration</span>
              <span className="text-sm font-bold text-slate-300 font-mono">
                {Math.floor(job.durationSec / 60)}m {job.durationSec % 60}s
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-cyan-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(job.currentEpoch / job.totalEpochs) * 100}%` }}
            />
          </div>

          {/* Logs */}
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800/50 text-[11px] text-slate-400 font-mono space-y-1">
            {job.logs.map((log, lIdx) => (
              <div key={lIdx} className="leading-relaxed">
                <span className="text-cyan-500">&gt; </span>
                {log}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
