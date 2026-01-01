import { LogEntry } from './types.js';

export class LogBuffer {
  private logs: LogEntry[] = [];
  private currentIndex = 0;
  private readonly maxLines: number;

  constructor(maxLines = 1000) {
    this.maxLines = maxLines;
  }

  append(line: string): void {
    const entry: LogEntry = {
      line,
      timestamp: new Date(),
      index: this.currentIndex++,
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLines) {
      this.logs.shift();
    }
  }

  getLogs(fromIndex?: number, limit = 100): LogEntry[] {
    let filtered = this.logs;

    if (fromIndex !== undefined) {
      filtered = this.logs.filter((entry) => entry.index >= fromIndex);
    }

    return filtered.slice(0, limit);
  }

  getNextIndex(): number {
    return this.currentIndex;
  }

  getTotalLines(): number {
    return this.logs.length;
  }

  clear(): void {
    this.logs = [];
    this.currentIndex = 0;
  }

  getRecentLines(count: number): string[] {
    const start = Math.max(0, this.logs.length - count);
    return this.logs.slice(start).map((entry) => entry.line);
  }
}
