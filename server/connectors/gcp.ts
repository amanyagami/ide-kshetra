import { OAuth2Client } from 'google-auth-library';
import { cloudresourcemanager_v3, compute_v1, monitoring_v3, google } from 'googleapis';
import { GcpProject, GcpVmInstance } from '../../src/types/fabric';

// Real GCP project/VM discovery (Phase 3). Every call takes an
// already-authenticated per-user OAuth client — never a fixed server-side
// service credential — so this works for any Google account that connects,
// not one fixed identity (explicit product requirement).

export async function listProjects(auth: OAuth2Client): Promise<GcpProject[]> {
  const crm = google.cloudresourcemanager({ version: 'v3', auth }) as cloudresourcemanager_v3.Cloudresourcemanager;
  const { data } = await crm.projects.search();
  const projects = data.projects || [];
  return projects
    .filter(p => p.projectId)
    .map(p => ({
      id: p.projectId!,
      name: p.displayName || p.projectId!,
      projectNumber: p.name?.replace('projects/', '') || '',
      organization: p.parent || 'unknown',
      status: (p.state === 'ACTIVE' ? 'ACTIVE' : 'DELETE_REQUESTED') as GcpProject['status'],
      defaultZone: 'us-central1-a',
      vmsCount: 0, // populated by listInstances per project when the UI selects one
    }));
}

function machineTypeName(machineTypeUrl?: string | null): string {
  if (!machineTypeUrl) return 'unknown';
  return machineTypeUrl.split('/').pop() || 'unknown';
}

function parseGpu(instance: compute_v1.Schema$Instance): GcpVmInstance['gpu'] | undefined {
  const accel = instance.guestAccelerators?.[0];
  if (!accel || !accel.acceleratorCount) return undefined;
  const model = (accel.acceleratorType || '').split('/').pop() || 'unknown';
  return { model, count: accel.acceleratorCount, vramTotalGB: 0 }; // vramTotalGB: not derivable from Compute API alone
}

export async function listInstances(auth: OAuth2Client, projectId: string): Promise<GcpVmInstance[]> {
  const compute = google.compute({ version: 'v1', auth });
  const { data } = await compute.instances.aggregatedList({ project: projectId, maxResults: 200 });
  const instances: GcpVmInstance[] = [];
  for (const [, scoped] of Object.entries(data.items || {})) {
    for (const instance of scoped.instances || []) {
      const zone = (instance.zone || '').split('/').pop() || 'unknown';
      const netIface = instance.networkInterfaces?.[0];
      instances.push({
        id: String(instance.id),
        name: instance.name || 'unknown',
        projectId,
        zone,
        status: (instance.status as GcpVmInstance['status']) || 'TERMINATED',
        machineType: machineTypeName(instance.machineType),
        gpu: parseGpu(instance),
        cpuCores: 0, // requires a separate machineTypes.get call; left 0 until Phase 3 polish
        ramGB: 0,
        bootDiskGB: instance.disks?.[0]?.diskSizeGb ? Number(instance.disks[0].diskSizeGb) : 0,
        internalIp: netIface?.networkIP || '',
        externalIp: netIface?.accessConfigs?.[0]?.natIP || null,
        isPrivateOnly: !netIface?.accessConfigs?.[0]?.natIP,
        osImage: instance.disks?.[0]?.licenses?.[0]?.split('/').pop() || 'unknown',
        iapSupported: true,
        osLoginEnabled: instance.metadata?.items?.some(i => i.key === 'enable-oslogin' && i.value === 'TRUE') || false,
        agentStatus: 'NOT_INSTALLED',
        uptimeHours: 0,
        costPerHour: 0, // real pricing lookup deferred — never estimate/fabricate a $ figure
      });
    }
  }
  return instances;
}

// Real CPU utilization from Cloud Monitoring — no agent required for this metric.
// GPU utilization requires the Ops Agent + NVIDIA DCGM metrics on the guest;
// returns undefined (not fabricated) when that metric isn't reporting.
export async function getUtilization(auth: OAuth2Client, projectId: string, instanceId: string): Promise<{ cpuUtilizationPercent?: number; gpuUtilizationPercent?: number }> {
  const monitoring = google.monitoring({ version: 'v3', auth }) as monitoring_v3.Monitoring;
  const now = new Date();
  const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
  async function queryMetric(metricType: string): Promise<number | undefined> {
    try {
      const { data } = await monitoring.projects.timeSeries.list({
        name: `projects/${projectId}`,
        filter: `metric.type="${metricType}" AND resource.labels.instance_id="${instanceId}"`,
        'interval.startTime': tenMinAgo.toISOString(),
        'interval.endTime': now.toISOString(),
      });
      const points = data.timeSeries?.[0]?.points;
      if (!points || points.length === 0) return undefined;
      const value = points[0].value?.doubleValue;
      return typeof value === 'number' ? Math.round(value * 100) : undefined;
    } catch {
      return undefined; // fail closed: report "not reporting", never fabricate
    }
  }
  const [cpu, gpu] = await Promise.all([
    queryMetric('compute.googleapis.com/instance/cpu/utilization'),
    queryMetric('agent.googleapis.com/gpu/utilization'),
  ]);
  return { cpuUtilizationPercent: cpu, gpuUtilizationPercent: gpu };
}

export interface CreateInstanceOptions {
  projectId: string;
  zone: string;
  name: string;
  machineType: string; // e.g. 'a2-highgpu-1g'
  sourceImage: string; // e.g. 'projects/debian-cloud/global/images/family/debian-12'
  diskSizeGb: number;
  acceleratorType?: string; // e.g. 'nvidia-tesla-a100'
  acceleratorCount?: number;
}

export async function createInstance(auth: OAuth2Client, opts: CreateInstanceOptions): Promise<{ operationId: string }> {
  const compute = google.compute({ version: 'v1', auth });
  const { data } = await compute.instances.insert({
    project: opts.projectId,
    zone: opts.zone,
    requestBody: {
      name: opts.name,
      machineType: `zones/${opts.zone}/machineTypes/${opts.machineType}`,
      disks: [{ boot: true, autoDelete: true, initializeParams: { sourceImage: opts.sourceImage, diskSizeGb: String(opts.diskSizeGb) } }],
      networkInterfaces: [{ network: 'global/networks/default', accessConfigs: [{ type: 'ONE_TO_ONE_NAT', name: 'External NAT' }] }],
      guestAccelerators: opts.acceleratorType ? [{ acceleratorType: `zones/${opts.zone}/acceleratorTypes/${opts.acceleratorType}`, acceleratorCount: opts.acceleratorCount || 1 }] : undefined,
      scheduling: opts.acceleratorType ? { onHostMaintenance: 'TERMINATE' } : undefined,
      metadata: { items: [{ key: 'enable-oslogin', value: 'TRUE' }] },
    },
  });
  return { operationId: String(data.id) };
}
