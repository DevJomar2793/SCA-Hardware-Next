import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchHardwareList } from "@/services/api";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("API requests", () => {
  it("fails with a useful error instead of loading forever", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
      ),
    );

    const request = expect(fetchHardwareList()).rejects.toThrow(
      "The server took too long to respond",
    );
    await vi.advanceTimersByTimeAsync(10_000);

    await request;
  });
});
