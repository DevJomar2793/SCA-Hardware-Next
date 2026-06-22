export interface EmployeeDetails {
  id: number;
  employee_digit_code: string | null;
  first_name: string | null;
  last_name: string | null;
  contact_number: string | null;
  position: string | null;
  department: string | null;
  date_hired: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AddEmployeePayload {
  employee_digit_code: string;
  first_name: string;
  last_name: string;
  contact_number: string;
  position?: string | null;
  department?: string | null;
  date_hired?: string | null;
  status?: string | null;
  notes?: string | null;
}

export type UpdateEmployeePayload = Partial<AddEmployeePayload>;

export type EmployeeSortDirection = "asc" | "desc" | null;

export interface EmployeeSortConfig {
  key: keyof EmployeeDetails | "full_name" | null;
  direction: EmployeeSortDirection;
}
