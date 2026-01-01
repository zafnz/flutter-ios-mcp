import { describe, it, expect } from '@jest/globals';
import { exec, spawnStreaming } from './exec.js';

describe('exec', () => {
  describe('successful execution', () => {
    it('should execute command and return result', async () => {
      const result = await exec('echo "hello"');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('hello');
      expect(result.stderr).toBe('');
    });

    it('should respect cwd option', async () => {
      const result = await exec('pwd', { cwd: '/tmp' });
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toMatch(/^\/private\/tmp|\/tmp$/);
    });
  });

  describe('failed execution', () => {
    it('should return non-zero exit code on failure', async () => {
      const result = await exec('exit 1');
      expect(result.exitCode).toBe(1);
    });

    it('should capture stderr', async () => {
      const result = await exec('>&2 echo "error"');
      expect(result.stderr).toContain('error');
    });
  });
});

describe('spawnStreaming', () => {
  describe('process spawning', () => {
    it('should spawn process and capture stdout', async () => {
      const stdout: string[] = [];
      const process = spawnStreaming('echo', ['hello'], {
        onStdout: (data) => stdout.push(data),
      });

      const exitCode = await process.wait();
      expect(exitCode).toBe(0);
      expect(stdout.join('')).toContain('hello');
    });

    it('should allow writing to stdin', async () => {
      const stdout: string[] = [];
      const process = spawnStreaming('cat', [], {
        onStdout: (data) => stdout.push(data),
      });

      process.stdin.write('test input\n');
      process.stdin.end();

      const exitCode = await process.wait();
      expect(exitCode).toBe(0);
      expect(stdout.join('')).toContain('test input');
    });

    it('should support killing process', async () => {
      const process = spawnStreaming('sleep', ['10']);
      const killed = process.kill('SIGTERM');
      expect(killed).toBe(true);
      const exitCode = await process.wait();
      expect(exitCode).not.toBe(0);
    });
  });
});
