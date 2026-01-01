export interface DeviceType {
  name: string;
  identifier: string;
}

export interface SimulatorDevice {
  udid: string;
  name: string;
  state: string;
  deviceTypeIdentifier: string;
}

export interface SimctlListOutput {
  devicetypes?: Array<{
    name: string;
    identifier: string;
  }>;
  devices?: {
    [runtime: string]: Array<{
      udid: string;
      name: string;
      state: string;
      deviceTypeIdentifier: string;
    }>;
  };
}
