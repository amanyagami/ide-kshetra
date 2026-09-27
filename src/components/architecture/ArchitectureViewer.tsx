import React from 'react';
import { 
  Terminal, 
  Layers, 
  FileCode, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Cpu, 
  Globe 
} from 'lucide-react';

export const ArchitectureViewer: React.FC = () => {
  const invariants = [
    { id: 'I1', rule: 'Workspace ≠ Environment ≠ Compute', reason: 'A VM may disappear without deleting the user’s project. A source edit should not rebuild CUDA.' },
    { id: 'I2', rule: 'No shared database between Part A and Part B', reason: 'They communicate through versioned APIs/events only. This is what makes the split real.' },
    { id: 'I3', rule: 'Every infrastructure-changing operation is idempotent', reason: 'Retries after timeouts must never create duplicate expensive nodes.' },
    { id: 'I4', rule: 'Every compute resource has an owner, lease, generation, and cleanup path', reason: 'A stale controller cannot destroy a newer machine; orphan resources are detectable.' },
    { id: 'I5', rule: 'No public Jupyter/terminal/app port is required', reason: 'Remote nodes initiate outbound connectivity to the gateway.' },
    { id: 'I6', rule: 'READY is evidence, not a state label', reason: 'File write, Jupyter API, Python execution, and CUDA tensor execution are verified as applicable.' },
    { id: 'I7', rule: 'Provider adapters cannot run project setup', reason: 'No uv, Jupyter, repository clone, or Dockerfile logic inside AWS/GCP/Azure/GMI modules.' },
    { id: 'I8', rule: 'Runtime cannot depend on provider names', reason: 'Part A sees capabilities and leases, never p5.48xlarge or Azure SKU behavior.' },
    { id: 'I9', rule: 'Immutable artifacts in the runtime path', reason: 'Resolved images are used by digest; mutable tags are resolved before launch.' },
    { id: 'I10', rule: 'User code is untrusted', reason: 'Builds and runtime containers must be isolated and never receive control-plane secrets by default.' },
    { id: 'I11', rule: 'Browser lifecycle is unrelated to job lifecycle', reason: 'A closed laptop must not kill a training process.' },
    { id: 'I12', rule: 'Every launch step emits a traceable structured event', reason: 'Performance optimization and incident analysis must be data-driven.' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto p-6 space-y-6 text-slate-100 max-w-6xl mx-auto w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Execution Fabric — Production Architecture & Contract Spec
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Two independently verifiable and plug-and-play subsystems joined by a small versioned Protobuf / ConnectRPC contract.
        </p>
      </div>

      {/* Visual Subsystem Split Diagram (Figure 1 & 2) */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
        <span className="text-sm font-semibold text-white block">
          Subsystem Boundary & Shared Contract Architecture
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Part A */}
          <div className="p-4 rounded-xl border border-cyan-800/60 bg-cyan-950/20 space-y-2">
            <div className="text-sm font-bold text-cyan-400">Part A — Universal Execution Core</div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              Owns: JupyterLab workspace, Python package compiler, BuildKit build plane, Go agent, detached jobs, truthful readiness gate.
            </p>
            <div className="pt-2 border-t border-cyan-900/40 text-[10px] text-slate-400">
              <span className="text-cyan-300 font-bold">Must NOT know:</span> AWS/GCP/Azure/GMI instance types, IAM credentials, provider lifecycle.
            </div>
          </div>

          {/* Shared Contract */}
          <div className="p-4 rounded-xl border border-slate-700 bg-slate-900 flex flex-col justify-center items-center text-center space-y-2">
            <div className="text-sm font-bold text-white">Shared Contract Layer</div>
            <div className="text-[11px] text-cyan-400">Protobuf + Buf + ConnectRPC</div>
            <div className="text-[10px] text-slate-400 font-sans">
              ComputeRequest → ComputeOffer[]<br />
              BootstrapSpec → NodeLease<br />
              Lease Renew / Release (Generation Fencing)
            </div>
            <div className="text-[10px] text-emerald-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              Zero Shared Database (I2)
            </div>
          </div>

          {/* Part B */}
          <div className="p-4 rounded-xl border border-indigo-800/60 bg-indigo-950/20 space-y-2">
            <div className="text-sm font-bold text-indigo-400">Part B — Multi-Cloud Compute Fabric</div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              Owns: Cloud connections (GMI, AWS, GCP, Azure, Static), two-stage scheduler, idempotency store, global reconciler, node bootstrap.
            </p>
            <div className="pt-2 border-t border-indigo-900/40 text-[10px] text-slate-400">
              <span className="text-indigo-300 font-bold">Must NOT know:</span> Repo files, notebooks, uv/Python dependencies, Jupyter internals.
            </div>
          </div>
        </div>
      </div>

      {/* Protobuf Schema Viewer */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="font-semibold text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>contracts/compute/v1/broker.proto (Canonical Contract)</span>
          </span>
          <span className="text-[10px] text-emerald-400">Buf Lint Verified ✓</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-300 space-y-2 overflow-x-auto leading-relaxed">
          <pre>{`syntax = "proto3";
package compute.v1;

service ComputeBroker {
  rpc ListOffers(ListOffersRequest) returns (ListOffersResponse);
  rpc AcquireCompute(AcquireComputeRequest) returns (OperationRef);
  rpc GetOperation(OperationRef) returns (ComputeOperation);
  rpc RenewLease(RenewLeaseRequest) returns (NodeLease);
  rpc ReleaseCompute(ReleaseComputeRequest) returns (OperationRef);
  rpc ValidateProvider(ValidateProviderRequest) returns (ProviderStatus);
}

message AcquireComputeRequest {
  string request_id = 1;              // Invariant I3: idempotency key
  string tenant_id = 2;
  string workspace_id = 3;
  ComputeRequirements requirements = 4;
  BootstrapSpec bootstrap = 5;         // Signed agent artifact & tokens
  LifecyclePolicy lifecycle = 6;
}

message NodeLease {
  string lease_id = 1;
  string node_id = 2;
  uint64 generation = 3;              // Invariant I4: fencing token
  google.protobuf.Timestamp expires_at = 4;
  NodeCapabilities capabilities = 5;
  ProviderRef provider = 6;           // Opaque display metadata
  CostEstimate cost = 7;
}`}</pre>
        </div>
      </div>

      {/* The 12 Non-Negotiable Invariants Table */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
        <span className="text-sm font-semibold text-white block">
          Non-Negotiable System Invariants (Section 3)
        </span>

        <div className="space-y-2">
          {invariants.map(inv => (
            <div 
              key={inv.id}
              className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/80 text-cyan-300 font-mono font-bold text-[11px]">
                  {inv.id}
                </span>
                <span className="font-semibold text-white">{inv.rule}</span>
              </div>
              <span className="text-slate-400 text-[11px] font-sans sm:text-right max-w-md">
                {inv.reason}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
