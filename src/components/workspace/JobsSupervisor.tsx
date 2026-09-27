import React, { useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
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
    <div className="flex-1 flex flex-col h-full bg-[#181818] font-mono text-[11px] text-[#cccccc] overflow-y-auto p-3 space-y-3 select-none">
      {/* Informational Header Strip */}
      <div className="flex items-center justify-between text-[#858585] text-[10px] pb-1 border-b border-[#282828]">
        <span>AGENT SUPERVISOR · INVARIANT I11 (BROWSER LIFECYCLE DECOUPLED FROM WORKLOAD)</span>
        <span className="text-[#4ec9b0]">1 active job</span>
      </div>

      {/* Jobs Table */}
      {jobs.map(job => (
        <div key={job.id} className="border border-[#282828] bg-[#1e1e1e] p-2.5 space-y-2">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#ffffff]">{job.name}</span>
              <span className="text-[10px] font-mono text-[#858585] bg-[#141414] px-1.5 py-0.5 rounded-sm border border-[#2b2b2b]">
                PID {job.pid}
              </span>
              <span className="text-[#666666]">· {job.startedAt}</span>
            </div>

            <button
              onClick={() => toggleJob(job.id)}
              className="h-[20px] px-2 rounded-sm bg-[#252525] hover:bg-[#2e2e2e] text-[#cccccc] flex items-center gap-1 transition-colors text-[10px]"
            >
              {job.status === 'running' ? (
                <>
                  <Pause className="w-2.5 h-2.5 text-[#cca700] fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-2.5 h-2.5 text-[#4ec9b0] fill-current" />
                  <span>Resume</span>
                </>
              )}
            </button>
          </div>

          <div className="text-[10px] text-[#858585] truncate">
            $ {job.command}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-4 gap-2 p-2 bg-[#161616] border border-[#242424] text-[10px]">
            <div>
              <span className="text-[#555555] block">EPOCH</span>
              <span className="text-[#ffffff] font-bold">{job.currentEpoch} / {job.totalEpochs}</span>
            </div>
            <div>
              <span className="text-[#555555] block">LOSS</span>
              <span className="text-[#ce9178] font-bold">{job.loss.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-[#555555] block">VRAM</span>
              <span className="text-[#cccccc] font-bold">{job.vramUsedGB} GB</span>
            </div>
            <div>
              <span className="text-[#555555] block">DURATION</span>
              <span className="text-[#cccccc] font-bold">{Math.floor(job.durationSec / 60)}m {job.durationSec % 60}s</span>
            </div>
          </div>

          {/* Linear Progress Bar */}
          <div className="w-full bg-[#141414] h-[3px]">
            <div 
              className="bg-[#0078d4] h-full"
              style={{ width: `${(job.currentEpoch / job.totalEpochs) * 100}%` }}
            />
          </div>

          {/* Recent Log Lines */}
          <div className="p-1.5 bg-[#141414] border border-[#222222] text-[10px] text-[#777777] space-y-0.5 select-text">
            {job.logs.map((log, lIdx) => (
              <div key={lIdx} className="leading-snug">
                <span className="text-[#444444]">&gt; </span>
                {log}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
