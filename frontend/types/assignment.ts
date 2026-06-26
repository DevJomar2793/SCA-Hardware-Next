export interface HardwareAssignment {
  id: number;
  employee_details_id: number;
  hardware_id: number;
  date_assigned: string;
  date_returned: string | null;
  status: string;
  history: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AssignHardwarePayload {
  employee_details_id: number;
  hardware_ids: number[];
  date_assigned: string;
  status: string;
  date_returned?: string | null;
  history?: string | null;
  notes?: string | null;
}
