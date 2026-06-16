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

export type AddHardwarePayload = Partial<
  Omit<Hardware, "id" | "images" | "date_created">
>;

export type SortDirection = "asc" | "desc" | null;

export interface HardwareSortConfig {
  key: keyof Hardware | null;
  direction: SortDirection;
}
