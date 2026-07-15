export interface HistoryHardwareSnapshot {
  id: number;
  ckt_item_number: string | null;
  hardware_type: string | null;
  manufacturer: string | null;
  model_number: string | null;
  serial_number: string | null;
}

export interface HistoryEmployeeSnapshot {
  id: number;
  employee_digit_code: string | null;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  department: string | null;
}

export interface HardwareReturnHistory {
  id: number;
  assignment_id: number | null;
  device_id: number;
  employee_id: number;
  date_assigned: string;
  date_returned: string | null;
  status: string;
  return_reason: string | null;
  history: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  hardware: HistoryHardwareSnapshot;
  employee: HistoryEmployeeSnapshot;
}
