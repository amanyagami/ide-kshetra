import React from 'react';
import { FileCode, ShieldCheck } from 'lucide-react';

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
    <div className="flex-1 flex flex-col h-full bg-[#1e1e1e] overflow-y-auto p-4 space-y-4 text-[#cccccc] text-[12px] select-none">
      {/* Header */}
      <div className="border-b border-[#282828] pb-2">
        <h1 className="text-[13px] font-semibold text-[#ffffff]">
          Execution Fabric — Production Architecture & Contract Spec
        </h1>
        <p className="text-[11px] text-[#777777] mt-0.5">
          Two independently verifiable subsystems joined by a small versioned Protobuf / ConnectRPC contract.
        </p>
      </div>

      {/* Subsystem Boundary Breakdown */}
      <div className="p-3 border border-[#282828] bg-[#181818] space-y-3 font-mono text-[11px]">
        <div className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide">
          Subsystem Boundaries (Section 4 & 5)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px]">
          {/* Part A */}
          <div className="p-2.5 bg-[#141414] border border-[#222222] space-y-1">
            <span className="font-bold text-[#ffffff] block text-[11px]">Part A — Execution Core</span>
            <p className="text-[#888888] leading-relaxed">
              Owns: JupyterLab workspace, Python environment compiler, BuildKit build plane, Go agent, detached jobs, truthful readiness gate.
            </p>
            <div className="pt-1 text-[#555555]">
              Must not know: Cloud instance types, IAM credentials, provider lifecycle.
            </div>
          </div>

          {/* Shared Contract */}
          <div className="p-2.5 bg-[#141414] border border-[#222222] space-y-1 text-center flex flex-col justify-center">
            <span className="font-bold text-[#0078d4] text-[11px]">Shared Contract</span>
            <div className="text-[#888888]">Protobuf + ConnectRPC</div>
            <div className="text-[#555555]">
              ComputeRequest → ComputeOffer[]<br />
              BootstrapSpec → NodeLease<br />
              Lease Renew / Release
            </div>
          </div>

          {/* Part B */}
          <div className="p-2.5 bg-[#141414] border border-[#222222] space-y-1">
            <span className="font-bold text-[#ffffff] block text-[11px]">Part B — Compute Fabric</span>
            <p className="text-[#888888] leading-relaxed">
              Owns: Cloud connections (GMI, AWS, GCP, Azure, Static), two-stage scheduler, idempotency store, global reconciler, node bootstrap.
            </p>
            <div className="pt-1 text-[#555555]">
              Must not know: Repository files, notebooks, uv/Python dependencies.
            </div>
          </div>
        </div>
      </div>

      {/* Protobuf Schema Box */}
      <div className="p-3 border border-[#282828] bg-[#181818] space-y-2 font-mono text-[11px]">
        <div className="flex items-center justify-between text-[#858585] border-b border-[#242424] pb-1">
          <span className="font-semibold text-[#ffffff]">contracts/compute/v1/broker.proto</span>
          <span className="text-[10px] text-[#4ec9b0]">Buf Verified</span>
        </div>

        <div className="p-2.5 bg-[#141414] border border-[#222222] text-[11px] text-[#a0a0a0] overflow-x-auto leading-relaxed">
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

      {/* Non-Negotiable Invariants Table */}
      <div className="p-3 border border-[#282828] bg-[#181818] space-y-2">
        <div className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide">
          The 12 Invariants (Section 3)
        </div>

        <div className="divide-y divide-[#222222] text-[11px]">
          {invariants.map(inv => (
            <div key={inv.id} className="py-2 flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#0078d4] font-bold shrink-0">{inv.id}</span>
                <span className="font-medium text-[#ffffff]">{inv.rule}</span>
              </div>
              <span className="text-[#666666] text-[10px] text-right shrink-0 max-w-sm">
                {inv.reason}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
