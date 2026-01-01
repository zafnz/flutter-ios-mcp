export type FlutterProcessStatus =
  | 'starting'
  | 'running'
  | 'hot-reloading'
  | 'stopped'
  | 'failed';

export interface FlutterProcess {
  pid: number;
  status: FlutterProcessStatus;
  startedAt: Date;
  stoppedAt?: Date;
  exitCode?: number;
}

export interface LogEntry {
  line: string;
  timestamp: Date;
  index: number;
}

export interface FlutterRunOptions {
  worktreePath: string;
  deviceId: string;
  flavor?: string;
  target?: string;
  additionalArgs?: string[];
}

export interface FlutterLogsQuery {
  sessionId: string;
  fromIndex?: number;
  limit?: number;
}

export interface FlutterLogsResult {
  logs: LogEntry[];
  nextIndex: number;
  totalLines: number;
}
