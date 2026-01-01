import { listDeviceTypes } from '../simulator/simctl.js';
import { logger } from '../utils/logger.js';

export async function handleSimulatorList(): Promise<{
  deviceTypes: Array<{ name: string; identifier: string }>;
}> {
  logger.info('Tool: simulator_list');

  const deviceTypes = await listDeviceTypes();

  return { deviceTypes };
}
