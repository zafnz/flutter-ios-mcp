import { exec } from '../utils/exec.js';
import { logger } from '../utils/logger.js';
import { DeviceType, SimctlListOutput } from './types.js';

const SIMCTL_PATH = 'xcrun simctl';

export async function listDeviceTypes(): Promise<DeviceType[]> {
  logger.debug('Listing device types');

  const result = await exec(`${SIMCTL_PATH} list devicetypes -j`);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to list device types: ${result.stderr}`);
  }

  const output = JSON.parse(result.stdout) as SimctlListOutput;
  const deviceTypes = output.devicetypes || [];

  const iPhoneTypes = deviceTypes.filter((dt) =>
    dt.name.toLowerCase().includes('iphone')
  );

  logger.debug('Found device types', { count: iPhoneTypes.length });
  return iPhoneTypes;
}

export async function getDeviceTypeIdentifier(deviceName: string): Promise<string> {
  const deviceTypes = await listDeviceTypes();

  const match = deviceTypes.find((dt) =>
    dt.name.toLowerCase().includes(deviceName.toLowerCase())
  );

  if (!match) {
    const availableNames = deviceTypes.map((dt) => dt.name).join(', ');
    throw new Error(
      `Device type not found: ${deviceName}. Available: ${availableNames}`
    );
  }

  return match.identifier;
}

export async function createSimulator(deviceType: string): Promise<string> {
  logger.info('Creating simulator', { deviceType });

  const deviceTypeId = await getDeviceTypeIdentifier(deviceType);

  const simulatorName = `MCP-${String(Date.now())}`;

  const result = await exec(
    `${SIMCTL_PATH} create "${simulatorName}" "${deviceTypeId}"`
  );

  if (result.exitCode !== 0) {
    throw new Error(`Failed to create simulator: ${result.stderr}`);
  }

  const udid = result.stdout.trim();
  logger.info('Simulator created', { udid, name: simulatorName });

  return udid;
}

export async function bootSimulator(udid: string): Promise<void> {
  logger.info('Booting simulator', { udid });

  const result = await exec(`${SIMCTL_PATH} boot ${udid}`);

  if (result.exitCode !== 0 && !result.stderr.includes('Unable to boot device in current state: Booted')) {
    throw new Error(`Failed to boot simulator: ${result.stderr}`);
  }

  logger.info('Simulator booted', { udid });
}

export async function shutdownSimulator(udid: string): Promise<void> {
  logger.info('Shutting down simulator', { udid });

  const result = await exec(`${SIMCTL_PATH} shutdown ${udid}`);

  if (result.exitCode !== 0 && !result.stderr.includes('Unable to shutdown device in current state: Shutdown')) {
    logger.warn('Failed to shutdown simulator', {
      udid,
      stderr: result.stderr,
    });
  }

  logger.info('Simulator shutdown', { udid });
}

export async function deleteSimulator(udid: string): Promise<void> {
  logger.info('Deleting simulator', { udid });

  const result = await exec(`${SIMCTL_PATH} delete ${udid}`);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to delete simulator: ${result.stderr}`);
  }

  logger.info('Simulator deleted', { udid });
}

export async function getSimulatorStatus(udid: string): Promise<string> {
  const result = await exec(`${SIMCTL_PATH} list devices -j`);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to list devices: ${result.stderr}`);
  }

  const output = JSON.parse(result.stdout) as SimctlListOutput;
  const devices = output.devices || {};

  for (const runtime of Object.keys(devices)) {
    const device = devices[runtime].find((d) => d.udid === udid);
    if (device) {
      return device.state;
    }
  }

  throw new Error(`Simulator not found: ${udid}`);
}
