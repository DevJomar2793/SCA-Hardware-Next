import {
  AddHardwarePayload,
  Hardware,
  UpdateHardwarePayload,
} from "@/types/hardware";
import {
  AddEmployeePayload,
  EmployeeDetails,
  UpdateEmployeePayload,
} from "@/types/employee";
import {
  AssignHardwarePayload,
  DeployedHardwareItem,
  HardwareAssignment,
} from "@/types/assignment";

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

export async function fetchHardwareById(
  hardwareId: number | string,
): Promise<Hardware> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/hardware-by-id/${hardwareId}`,
  );
  await assertOk(response);

  return response.json();
}

export async function fetchEmployeeList(): Promise<EmployeeDetails[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/employee-list`);
  await assertOk(response);

  return response.json();
}

export async function fetchHardwareAssignmentList(): Promise<
  HardwareAssignment[]
> {
  const response = await fetch(`${API_BASE_URL}/api/v1/assign-hardware-list`);
  await assertOk(response);

  return response.json();
}

export async function assignHardware(
  assignmentData: AssignHardwarePayload,
): Promise<HardwareAssignment[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/assign-hardware`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(assignmentData),
  });
  await assertOk(response);

  return response.json();
}

export async function fetchAssignedHardwareByAssignmentId(
  assignmentId: number | string,
): Promise<DeployedHardwareItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/assign-hardware/${assignmentId}/hardware-items`,
  );
  await assertOk(response);

  return response.json();
}

export async function returnHardwareAssignment(
  assignmentId: number | string,
): Promise<HardwareAssignment> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/assign-hardware/${assignmentId}/return`,
    {
      method: "PUT",
    },
  );
  await assertOk(response);

  return response.json();
}

export async function fetchEmployeeById(
  employeeId: number | string,
): Promise<EmployeeDetails> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/employee-by-id/${employeeId}`,
  );
  await assertOk(response);

  return response.json();
}

export async function addEmployee(
  employeeData: AddEmployeePayload,
): Promise<EmployeeDetails> {
  const response = await fetch(`${API_BASE_URL}/api/v1/add-employee`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(employeeData),
  });
  await assertOk(response);

  return response.json();
}

export async function updateEmployee(
  employeeId: number | string,
  employeeData: UpdateEmployeePayload,
): Promise<EmployeeDetails> {
  const response = await fetch(`${API_BASE_URL}/api/v1/employee/${employeeId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(employeeData),
  });
  await assertOk(response);

  return response.json();
}

export async function deleteEmployee(
  employeeId: number | string,
): Promise<EmployeeDetails> {
  const response = await fetch(`${API_BASE_URL}/api/v1/employee/${employeeId}`, {
    method: "DELETE",
  });
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

export async function updateHardware(
  hardwareId: number,
  hardwareData: UpdateHardwarePayload,
): Promise<Hardware> {
  const response = await fetch(`${API_BASE_URL}/api/v1/hardware/${hardwareId}`, {
    method: "PUT",
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

export async function deleteHardwareImage(
  hardwareId: number,
  imagePath: string,
): Promise<string> {
  const params = new URLSearchParams({ image_path: imagePath });
  const response = await fetch(
    `${API_BASE_URL}/api/v1/hardware/${hardwareId}/image?${params}`,
    {
      method: "DELETE",
    },
  );
  await assertOk(response);

  const data = await response.json();
  return data.deleted_image;
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

export type { EmployeeDetails, Hardware, HardwareAssignment };
