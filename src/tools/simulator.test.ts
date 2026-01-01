import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { DeviceType } from '../simulator/types.js';

const mockListDeviceTypes = jest.fn<() => Promise<DeviceType[]>>();

jest.unstable_mockModule('../simulator/simctl.js', () => ({
  listDeviceTypes: mockListDeviceTypes,
}));

const { handleSimulatorList } = await import('./simulator.js');

describe('Simulator Tools', () => {
  beforeEach(() => {
    mockListDeviceTypes.mockClear();
  });

  describe('handleSimulatorList', () => {
    it('should list device types', async () => {
      mockListDeviceTypes.mockResolvedValue([
        { name: 'iPhone 16 Pro', identifier: 'com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro' },
        { name: 'iPhone 15', identifier: 'com.apple.CoreSimulator.SimDeviceType.iPhone-15' },
      ]);

      const result = await handleSimulatorList();

      expect(mockListDeviceTypes).toHaveBeenCalled();
      expect(result.deviceTypes).toHaveLength(2);
      expect(result.deviceTypes[0].name).toBe('iPhone 16 Pro');
      expect(result.deviceTypes[1].name).toBe('iPhone 15');
    });

    it('should return empty array when no device types', async () => {
      mockListDeviceTypes.mockResolvedValue([]);

      const result = await handleSimulatorList();

      expect(result.deviceTypes).toEqual([]);
    });
  });
});
