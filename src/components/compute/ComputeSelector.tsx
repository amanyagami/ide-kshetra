import React, { useState } from 'react';
import { 
  Check, 
  ArrowRight,
  Clock,
  Cpu
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
    <div className="flex-1 flex flex-col h-full bg-[#1e1e1e] overflow-y-auto p-4 space-y-4 text-[#cccccc] select-none text-[12px]">
      {/* View Header */}
      <div className="border-b border-[#282828] pb-2">
        <h1 className="text-[13px] font-semibold text-[#ffffff]">
          Compute Fleet & Broker Scheduler
        </h1>
        <p className="text-[11px] text-[#777777] mt-0.5">
          Two-stage scheduler ranks available multi-cloud inventory. Leased nodes are attached under Invariant I4.
        </p>
      </div>

      {/* Global Reconciler Strip */}
      <div className="p-2 border border-[#282828] bg-[#181818] flex items-center justify-between text-[11px] font-mono text-[#858585]">
        <div>
          <span className="text-[#cccccc] font-medium">Reconciler: </span>
          <span>Continuous drift detection active · 0 orphans</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Active Leases: <strong className="text-[#ffffff]">{reconcilerStatus.activeLeasesCount}</strong></span>
          <span>Orphans: <strong className="text-[#4ec9b0]">{reconcilerStatus.orphansFound}</strong></span>
        </div>
      </div>

      {/* Requirements Form: Flat, compact, no cards */}
      <div className="p-3 border border-[#282828] bg-[#181818] space-y-3">
        <div className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide">
          Stage 1: Hard Constraints Filter
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px]">
          {/* VRAM Filter */}
          <div className="space-y-1">
            <div className="flex justify-between text-[#858585]">
              <span>Min VRAM:</span>
              <span className="font-mono text-[#ffffff] font-bold">{requirements.minVramGB} GB</span>
            </div>
            <input
              type="range"
              min={24}
              max={141}
              step={8}
              value={requirements.minVramGB}
              onChange={(e) => setRequirements({ ...requirements, minVramGB: Number(e.target.value) })}
              className="w-full accent-[#0078d4] bg-[#2b2b2b] h-1 appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#555555] font-mono">
              <span>24 GB</span>
              <span>80 GB</span>
              <span>141 GB</span>
            </div>
          </div>

          {/* Region */}
          <div className="space-y-1">
            <label className="text-[#858585] block">Region:</label>
            <select
              value={requirements.region}
              onChange={(e) => setRequirements({ ...requirements, region: e.target.value })}
              className="w-full h-[24px] px-1.5 bg-[#141414] border border-[#2b2b2b] text-[#cccccc] font-mono text-[11px] outline-none"
            >
              <option value="us">US (Any)</option>
              <option value="us-west">US West (Silicon Valley)</option>
              <option value="us-east">US East (Virginia)</option>
              <option value="any">Global (Lowest Latency)</option>
            </select>
          </div>

          {/* Strategy */}
          <div className="space-y-1">
            <label className="text-[#858585] block">Ranking Strategy:</label>
            <div className="flex h-[24px] border border-[#2b2b2b]">
              {(['fastest', 'cheapest', 'balanced'] as OptimizationStrategy[]).map(strategy => (
                <button
                  key={strategy}
                  onClick={() => setRequirements({ ...requirements, strategy })}
                  className={`flex-1 text-[10px] capitalize transition-colors ${
                    requirements.strategy === strategy
                      ? 'bg-[#0078d4] text-white font-medium'
                      : 'bg-[#141414] text-[#858585] hover:text-[#cccccc]'
                  }`}
                >
                  {strategy}
                </button>
              ))}
            </div>
          </div>

          {/* Spot Allowed */}
          <div className="space-y-1">
            <label className="text-[#858585] block">Preemptible / Spot:</label>
            <button
              onClick={() => setRequirements({ ...requirements, spotAllowed: !requirements.spotAllowed })}
              className={`w-full h-[24px] px-2 border text-[11px] flex items-center justify-between transition-colors ${
                requirements.spotAllowed
                  ? 'bg-[#1e1e1e] border-[#0078d4] text-[#ffffff]'
                  : 'bg-[#141414] border-[#2b2b2b] text-[#666666]'
              }`}
            >
              <span>{requirements.spotAllowed ? 'Spot Allowed' : 'On-Demand'}</span>
              {requirements.spotAllowed && <Check className="w-3 h-3 text-[#0078d4]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Offers Table: High-density list (VS Code Dark+ style) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[11px] text-[#858585]">
          <span>AVAILABLE OFFERS ({rankedOffers.length})</span>
          <span>Stage 2: Soft Ranked</span>
        </div>

        <div className="border border-[#282828] bg-[#181818] divide-y divide-[#242424]">
          {rankedOffers.map(offer => {
            const isSelected = selectedOfferId === offer.id;

            return (
              <div
                key={offer.id}
                onClick={() => onSelectAndLaunch(offer)}
                className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected ? 'bg-[#252526] text-white' : 'hover:bg-[#1f1f1f] text-[#cccccc]'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#ffffff]">{offer.gpuModel}</span>
                    <span className="text-[10px] font-mono text-[#858585]">{offer.vramGB} GB VRAM</span>
                    {offer.warmAvailable && (
                      <span className="text-[10px] text-[#4ec9b0] font-mono">Warm</span>
                    )}
                    {offer.spot && (
                      <span className="text-[10px] text-[#cca700] font-mono">Spot</span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#666666] font-mono">
                    {offer.providerName} · {offer.sku} · {offer.ramGB}GB RAM · {offer.region}
                  </div>
                </div>

                <div className="flex items-center gap-6 font-mono text-right text-[11px]">
                  <div>
                    <span className="text-[#555555] text-[10px] block">STARTUP</span>
                    <span>~{offer.estStartupSec}s</span>
                  </div>

                  <div>
                    <span className="text-[#555555] text-[10px] block">SCORE</span>
                    <span className="text-[#0078d4] font-bold">{offer.score}</span>
                  </div>

                  <div className="w-20">
                    <div className="text-[12px] font-bold text-[#ffffff]">
                      ${offer.pricePerHour.toFixed(2)}/h
                    </div>
                  </div>

                  <button
                    className={`h-[22px] px-2.5 rounded-sm text-[11px] font-medium flex items-center gap-1 transition-colors ${
                      isSelected
                        ? 'bg-[#0078d4] text-white'
                        : 'bg-[#252525] hover:bg-[#2d2d2d] text-[#aaaaaa]'
                    }`}
                  >
                    <span>{isSelected ? 'Selected' : 'Select'}</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
