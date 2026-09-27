import React, { useState } from 'react';
import { 
  Cpu, 
  DollarSign, 
  Clock, 
  Sparkles, 
  Sliders, 
  Layers, 
  Check, 
  ShieldAlert, 
  Flame, 
  Zap, 
  Activity,
  ArrowRight
} from 'lucide-react';
import { 
  ComputeOffer, 
  ComputeRequirements, 
  OptimizationStrategy 
} from '../../types/fabric';
import { computeBroker } from '../../services/computeBroker';

interface ComputeSelectorProps {
  onSelectAndLaunch: (offer: ComputeOffer) => void;
  selectedOfferId: string;
}

export const ComputeSelector: React.FC<ComputeSelectorProps> = ({
  onSelectAndLaunch,
  selectedOfferId,
}) => {
  const [requirements, setRequirements] = useState<ComputeRequirements>({
    gpuModel: 'H100',
    minVramGB: 80,
    region: 'us',
    architecture: 'amd64',
    minRamGB: 64,
    minDiskGB: 200,
    spotAllowed: true,
    strategy: 'balanced',
  });

  const rankedOffers = computeBroker.listOffers(requirements);
  const reconcilerStatus = computeBroker.reconcileFleet();

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto p-6 space-y-6 text-slate-100 max-w-6xl mx-auto w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Part B — Multi-Cloud Compute Broker & Fleet Scheduler
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Two-stage scheduler ranks available cloud inventory across GMI, AWS, GCP, Azure, and Private nodes. Output returns a leased, attached node under Invariant I4.
        </p>
      </div>

      {/* Reconciler & Global Invariant Banner */}
      <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-white">Global Resource Reconciler (Section 8.4)</span>
            <span className="text-slate-400 block text-[11px]">
              Continuous reconciliation matches desired state with provider reality. Leases use generation fencing tokens to prevent stale destroy races.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-slate-500 text-[10px] block">Active Leases</span>
            <span className="text-cyan-400 font-bold">{reconcilerStatus.activeLeasesCount}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 text-[10px] block">Orphans Detected</span>
            <span className="text-emerald-400 font-bold">{reconcilerStatus.orphansFound}</span>
          </div>
        </div>
      </div>

      {/* Requirements Configuration Grid */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <span className="text-sm font-semibold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Compute Requirements (Provider-Neutral)</span>
          </span>
          <span className="text-xs text-slate-400">Stage 1: Hard Constraints Filter</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {/* Minimum VRAM */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium flex justify-between">
              <span>Minimum VRAM</span>
              <span className="text-cyan-400 font-mono font-bold">{requirements.minVramGB} GB</span>
            </label>
            <input
              type="range"
              min={24}
              max={141}
              step={8}
              value={requirements.minVramGB}
              onChange={(e) => setRequirements({ ...requirements, minVramGB: Number(e.target.value) })}
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>24 GB</span>
              <span>80 GB</span>
              <span>141 GB</span>
            </div>
          </div>

          {/* Region */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium">Region / Data Residency</label>
            <select
              value={requirements.region}
              onChange={(e) => setRequirements({ ...requirements, region: e.target.value })}
              className="w-full p-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs outline-none"
            >
              <option value="us">United States (Any)</option>
              <option value="us-west">US West (Silicon Valley / Oregon)</option>
              <option value="us-east">US East (Virginia)</option>
              <option value="any">Global (Lowest Latency)</option>
            </select>
          </div>

          {/* Optimization Strategy */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium">Optimization Preference</label>
            <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-slate-800">
              {(['fastest', 'cheapest', 'balanced'] as OptimizationStrategy[]).map(strategy => (
                <button
                  key={strategy}
                  onClick={() => setRequirements({ ...requirements, strategy })}
                  className={`py-1.5 text-[11px] rounded capitalize font-medium transition-colors ${
                    requirements.strategy === strategy
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {strategy}
                </button>
              ))}
            </div>
          </div>

          {/* Spot Allowed */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium">Preemptible / Spot Instances</label>
            <div 
              onClick={() => setRequirements({ ...requirements, spotAllowed: !requirements.spotAllowed })}
              className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                requirements.spotAllowed
                  ? 'bg-slate-800 border-cyan-500/50 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span>{requirements.spotAllowed ? 'Spot Allowed (Save up to 60%)' : 'On-Demand Only'}</span>
              <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${
                requirements.spotAllowed ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700'
              }`}>
                {requirements.spotAllowed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Ranked Offers (Stage 2) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">
            Available Provider Offers (Ranked by Scheduler)
          </span>
          <span className="text-xs text-slate-400">
            {rankedOffers.length} eligible candidates found
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {rankedOffers.map(offer => {
            const isSelected = selectedOfferId === offer.id;

            return (
              <div
                key={offer.id}
                onClick={() => onSelectAndLaunch(offer)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-950/20 shadow-md shadow-cyan-950/30 ring-1 ring-cyan-500/50'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Hardware & Provider */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white font-mono">
                        {offer.gpuModel}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                        {offer.vramGB} GB VRAM
                      </span>
                      {offer.warmAvailable && (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono flex items-center gap-1">
                          <Flame className="w-3 h-3 text-emerald-400" />
                          <span>Warm Capacity</span>
                        </span>
                      )}
                      {offer.spot && (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 font-mono">
                          Spot
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-3">
                      <span className="text-slate-200 font-semibold">{offer.providerName}</span>
                      <span>·</span>
                      <span className="font-mono text-slate-400">{offer.sku}</span>
                      <span>·</span>
                      <span>{offer.ramGB} GB RAM</span>
                      <span>·</span>
                      <span>{offer.region}</span>
                    </div>
                  </div>

                  {/* Middle: Scheduler Scores Breakdown */}
                  <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-slate-500 text-[10px] block uppercase">Est. Startup</span>
                      <span className="text-slate-200 font-semibold flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>~{offer.estStartupSec}s</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-500 text-[10px] block uppercase">Scheduler Score</span>
                      <span className="text-cyan-400 font-bold text-sm">
                        {offer.score} / 100
                      </span>
                    </div>
                  </div>

                  {/* Right: Hourly Price & Action Button */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right font-mono">
                      <div className="text-base font-bold text-white">
                        ${offer.pricePerHour.toFixed(2)}
                        <span className="text-xs font-normal text-slate-400"> / hr</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Per-second billing</span>
                    </div>

                    <button
                      className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-white hover:bg-slate-700'
                      }`}
                    >
                      <span>{isSelected ? 'Selected' : 'Select'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
