export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export interface Hardware {
  id: number;
  ckt_item_number: string;
  hardware_type: string;
  notes: string | null;
  date_tested: string | null;
  qty: number | null;
  manufacturer: string;
  warranty: string | null;
  model_number: string;
  serial_number: string;
  screen_size: string | null;
  processor_type: string | null;
  processor_speed: string | null;
  operating_system: string | null;
  ram: string | null;
  hd_type: string | null;
  hd_storage: string | null;
  operational: string;
  price_dollar: number | null;
  price_peso: number | null;
  date_of_arrival: string | null;
  new_or_used: string;
  images: string[];
  date_created: string | null;
}

// <------------------------------------------------- API Functions ------------------------------------------------->

export async function fetchHardwareList(): Promise<Hardware[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/hardware-list`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail ||
        `API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

export async function addHardware(
  hardwareData: Partial<Hardware>,
): Promise<Hardware> {
  const response = await fetch(`${API_BASE_URL}/api/v1/add-hardware`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(hardwareData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail ||
        `API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail ||
        `API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data.uploaded_files;
}
