const API_BASE_URL = 'http://127.0.0.1:8000';

export interface Hardware {
  id: number;
  ckt_item_number: string;
  hardware_type: string;
  notes: string | null;
  date_tested: string | null;
  qty: number;
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
  image_path: string | null;
  date_created: string | null;
}

export async function fetchHardwareList(): Promise<Hardware[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/hardware-list`);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}
