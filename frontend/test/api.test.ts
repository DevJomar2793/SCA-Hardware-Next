import { afterEach, describe, expect, it, vi } from "vitest";

import {
  deleteAcknowledgementSignature,
  fetchHardwareList,
  saveAcknowledgementSignature,
} from "@/services/api";

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

  it("saves and deletes a report-specific acknowledgement signature", async () => {
    const signatureData = "data:image/png;base64,c2lnbmF0dXJl";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 1,
            assignment_id: 42,
            signatory_key: "prepared_by",
            signature_data: signatureData,
            created_at: null,
            updated_at: null,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const signature = await saveAcknowledgementSignature(
      42,
      "prepared_by",
      signatureData,
    );
    await deleteAcknowledgementSignature(42, "prepared_by");

    expect(signature.assignment_id).toBe(42);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(
        "/assign-hardware/42/acknowledgement-signatures/prepared_by",
      ),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ signature_data: signatureData }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(
        "/assign-hardware/42/acknowledgement-signatures/prepared_by",
      ),
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
