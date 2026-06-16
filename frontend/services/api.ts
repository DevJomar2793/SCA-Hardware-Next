import { AddHardwarePayload, Hardware } from "@/types/hardware";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

async function assertOk(response: Response): Promise<void> {
  if (response.ok) return;

  const errorData = await response.json().catch(() => ({}));
  throw new Error(
    errorData.detail || `API error: ${response.status} ${response.statusText}`,
  );
}

export async function fetchHardwareList(): Promise<Hardware[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/hardware-list`);
  await assertOk(response);

  return response.json();
}

export async function importExcel(
  file: File,
): Promise<{ imported: number; skipped: number }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/v1/import-excel`, {
    method: "POST",
    body: formData,
  });
  await assertOk(response);

  return response.json();
}

export async function addHardware(
  hardwareData: AddHardwarePayload,
): Promise<Hardware> {
  const response = await fetch(`${API_BASE_URL}/api/v1/add-hardware`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(hardwareData),
  });
  await assertOk(response);

  return response.json();
}

export async function deleteHardware(hardwareId: number): Promise<Hardware> {
  const response = await fetch(`${API_BASE_URL}/api/v1/hardware/${hardwareId}`, {
    method: "DELETE",
  });
  await assertOk(response);

  return response.json();
}

export async function fetchNextCktNumber(
  hardwareType: string,
): Promise<string> {
  const params = new URLSearchParams({ hardware_type: hardwareType });
  const response = await fetch(`${API_BASE_URL}/api/v1/next-ckt-number?${params}`);
  await assertOk(response);

  const data = await response.json();
  return data.ckt_item_number;
}

export async function uploadHardwareImages(
  hardwareId: number,
  files: File[],
): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch(
    `${API_BASE_URL}/api/v1/hardware/${hardwareId}/upload-image`,
    {
      method: "POST",
      body: formData,
    },
  );
  await assertOk(response);

  const data = await response.json();
  return data.uploaded_files;
}

export type { Hardware };
