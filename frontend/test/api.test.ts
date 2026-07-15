import { afterEach, describe, expect, it, vi } from "vitest";

import {
  deleteAcknowledgementSignature,
  fetchHardwareReturnHistory,
  fetchHardwareList,
  returnHardwareAssignment,
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

  it("requires a reason when returning hardware", async () => {
    const responseBody = {
      id: 42,
      employee_details_id: 7,
      hardware_id: 9,
      date_assigned: "2026-07-01",
      date_returned: "2026-07-15 10:00:00",
      status: "Unassigned",
      history: null,
      notes: null,
      created_at: null,
      updated_at: null,
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(responseBody), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const returned = await returnHardwareAssignment(42, "Device replaced");

    expect(returned.status).toBe("Unassigned");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/assign-hardware/42/return"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ return_reason: "Device replaced" }),
      }),
    );
  });

  it("fetches the read-only hardware return history", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchHardwareReturnHistory()).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/history/returns"),
      expect.any(Object),
    );
  });
});
