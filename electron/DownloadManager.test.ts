import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { Readable } from "stream";

vi.mock("axios", () => ({
  default: vi.fn(),
}));

import axios from "axios";
import DownloadManager from "./DownloadManager";

const mockedAxios = vi.mocked(axios);

function makeStream(content: string): Readable {
  return Readable.from([Buffer.from(content)]);
}

/** A stream that never emits data or ends, but responds correctly to destroy(). */
function makeHangingStream(): Readable {
  return new Readable({
    read() {
      // Intentionally never pushes data or ends, to simulate a stalled response.
    },
  });
}

describe("DownloadManager", () => {
  let tmpDir: string;
  let manager: DownloadManager;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sd-download-test-"));
    manager = new DownloadManager();
    mockedAxios.mockReset();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("downloads a file and reports progress up to 100%", async () => {
    const content = "hello world";
    mockedAxios.mockResolvedValue({
      data: makeStream(content),
      headers: { "content-length": String(content.length) },
    } as never);

    const savePath = path.join(tmpDir, "file.txt");
    const progressUpdates: number[] = [];

    await manager.downloadFile("https://example.com/file.txt", savePath, (p) => progressUpdates.push(p));

    expect(fs.readFileSync(savePath, "utf-8")).toBe(content);
    expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
  });

  it("retries on transient failure and succeeds on a later attempt", async () => {
    vi.useFakeTimers();
    try {
      const content = "retried content";
      let attempt = 0;
      mockedAxios.mockImplementation(async () => {
        attempt++;
        if (attempt < 3) {
          throw new Error("network blip");
        }
        return {
          data: makeStream(content),
          headers: { "content-length": String(content.length) },
        } as never;
      });

      const savePath = path.join(tmpDir, "retry.txt");
      const resultPromise = manager.downloadFile("https://example.com/retry.txt", savePath);

      // Exponential backoff: 2s after attempt 1, 4s after attempt 2.
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      await resultPromise;

      expect(attempt).toBe(3);
      expect(fs.readFileSync(savePath, "utf-8")).toBe(content);
    } finally {
      vi.useRealTimers();
    }
  });

  it("gives up after exhausting all retries", async () => {
    vi.useFakeTimers();
    try {
      mockedAxios.mockRejectedValue(new Error("persistent failure"));

      const savePath = path.join(tmpDir, "failure.txt");
      const resultPromise = manager.downloadFile("https://example.com/failure.txt", savePath);
      const assertion = expect(resultPromise).rejects.toThrow("persistent failure");

      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      await assertion;
      expect(mockedAxios).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it("cancels a queued task before it starts downloading", async () => {
    mockedAxios.mockImplementation(async () => ({
      data: makeHangingStream(),
      headers: {},
    } as never));

    // Occupy all 3 concurrency slots so the next download stays queued.
    const blockerUrls = ["blocker-1", "blocker-2", "blocker-3"];
    const blockers = blockerUrls.map((name) =>
      manager.downloadFile(`https://example.com/${name}`, path.join(tmpDir, `${name}.txt`)).catch(() => {})
    );

    const queuedUrl = "https://example.com/queued.txt";
    const queuedPromise = manager.downloadFile(queuedUrl, path.join(tmpDir, "queued.txt"));

    const stopped = await manager.stopDownload(queuedUrl);

    expect(stopped).toBe(true);
    await expect(queuedPromise).rejects.toThrow("Download cancelled by user");

    // Clean up the blockers so their write streams close before the test ends.
    await Promise.all(blockerUrls.map((name) => manager.stopDownload(`https://example.com/${name}`)));
    await Promise.all(blockers);
  });

  it("aborts an active download when stopped, rejecting with Paused", async () => {
    mockedAxios.mockImplementation(async () => ({
      data: makeHangingStream(),
      headers: {},
    } as never));

    const url = "https://example.com/active.txt";
    const downloadPromise = manager.downloadFile(url, path.join(tmpDir, "active.txt"));

    // Let the queue actually start processing the task before stopping it.
    await new Promise((resolve) => setTimeout(resolve, 10));

    const stopped = await manager.stopDownload(url);

    expect(stopped).toBe(true);
    await expect(downloadPromise).rejects.toThrow("Paused");
  });

  it("returns false when stopping a download that doesn't exist", async () => {
    const stopped = await manager.stopDownload("https://example.com/never-started.txt");
    expect(stopped).toBe(false);
  });
});
