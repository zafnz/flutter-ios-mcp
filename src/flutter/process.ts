import { spawnStreaming, SpawnedProcess } from '../utils/exec.js';
import { logger } from '../utils/logger.js';
import { LogBuffer } from './log-buffer.js';
import { FlutterProcess, FlutterRunOptions } from './types.js';

export class FlutterProcessManager {
  private process?: SpawnedProcess;
  private flutterProcess?: FlutterProcess;
  private logBuffer: LogBuffer;
  private logSubscribers: Set<(line: string) => void> = new Set();

  constructor(maxLogLines = 1000) {
    this.logBuffer = new LogBuffer(maxLogLines);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async start(options: FlutterRunOptions): Promise<FlutterProcess> {
    if (this.process) {
      throw new Error('Flutter process already running');
    }

    logger.info('Starting Flutter process', {
      worktreePath: options.worktreePath,
      deviceId: options.deviceId,
    });

    const args = ['run', '-d', options.deviceId];

    if (options.target) {
      args.push('-t', options.target);
    }

    if (options.flavor) {
      args.push('--flavor', options.flavor);
    }

    if (options.additionalArgs) {
      args.push(...options.additionalArgs);
    }

    this.flutterProcess = {
      pid: 0,
      status: 'starting',
      startedAt: new Date(),
    };

    this.process = spawnStreaming('flutter', args, {
      cwd: options.worktreePath,
      onStdout: (data) => {
        this.handleOutput(data);
      },
      onStderr: (data) => {
        this.handleOutput(data);
      },
      onExit: (code, signal) => {
        this.handleExit(code, signal);
      },
    });

    if (this.process.pid) {
      this.flutterProcess.pid = this.process.pid;
      this.flutterProcess.status = 'running';
      logger.info('Flutter process started', { pid: this.process.pid });
    }

    return this.flutterProcess;
  }

  private handleOutput(data: string): void {
    const lines = data.split('\n');

    for (const line of lines) {
      if (line.trim()) {
        this.logBuffer.append(line);

        this.logSubscribers.forEach((subscriber) => {
          try {
            subscriber(line);
          } catch (error) {
            logger.error('Error in log subscriber', { error: String(error) });
          }
        });

        this.detectStatusChanges(line);
      }
    }
  }

  private detectStatusChanges(line: string): void {
    if (!this.flutterProcess) return;

    if (line.includes('Hot reload') || line.includes('Reloaded')) {
      this.flutterProcess.status = 'hot-reloading';
      setTimeout(() => {
        if (this.flutterProcess) {
          this.flutterProcess.status = 'running';
        }
      }, 1000);
    }
  }

  private handleExit(code: number | null, signal: string | null): void {
    logger.info('Flutter process exited', { code, signal });

    if (this.flutterProcess) {
      this.flutterProcess.status = code === 0 ? 'stopped' : 'failed';
      this.flutterProcess.stoppedAt = new Date();
      this.flutterProcess.exitCode = code ?? undefined;
    }

    this.process = undefined;
  }

  stop(): boolean {
    if (!this.process) {
      logger.warn('No Flutter process to stop');
      return false;
    }

    logger.info('Stopping Flutter process', { pid: this.process.pid });

    this.process.stdin.write('q\n');
    this.process.stdin.end();

    return true;
  }

  hotReload(): boolean {
    if (!this.process) {
      logger.warn('No Flutter process for hot reload');
      return false;
    }

    logger.info('Triggering hot reload', { pid: this.process.pid });
    this.process.stdin.write('r\n');

    return true;
  }

  hotRestart(): boolean {
    if (!this.process) {
      logger.warn('No Flutter process for hot restart');
      return false;
    }

    logger.info('Triggering hot restart', { pid: this.process.pid });
    this.process.stdin.write('R\n');

    return true;
  }

  kill(signal: NodeJS.Signals = 'SIGTERM'): boolean {
    if (!this.process) {
      return false;
    }

    logger.info('Killing Flutter process', { pid: this.process.pid, signal });
    return this.process.kill(signal);
  }

  getStatus(): FlutterProcess | undefined {
    return this.flutterProcess;
  }

  getLogs(fromIndex?: number, limit?: number): {
    logs: Array<{ line: string; timestamp: Date; index: number }>;
    nextIndex: number;
    totalLines: number;
  } {
    const logs = this.logBuffer.getLogs(fromIndex, limit);
    return {
      logs,
      nextIndex: this.logBuffer.getNextIndex(),
      totalLines: this.logBuffer.getTotalLines(),
    };
  }

  subscribeToLogs(callback: (line: string) => void): () => void {
    this.logSubscribers.add(callback);

    return () => {
      this.logSubscribers.delete(callback);
    };
  }

  clearLogs(): void {
    this.logBuffer.clear();
  }

  async cleanup(): Promise<void> {
    logger.debug('Cleaning up Flutter process manager');

    this.logSubscribers.clear();

    if (this.process) {
      this.stop();

      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          logger.warn('Flutter process did not stop gracefully, killing');
          this.kill('SIGKILL');
          resolve();
        }, 5000);

        if (this.process) {
          void this.process.wait().then(() => {
            clearTimeout(timeout);
            resolve();
          });
        } else {
          clearTimeout(timeout);
          resolve();
        }
      });
    }

    this.clearLogs();
  }
}
