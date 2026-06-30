import { describe, expect, it } from "vitest";

import {
  buildItemDescription,
  formatEmployeeName,
  formatIssuedDate,
  formatReportDate,
} from "@/lib/acknowledgement-report";
import { Hardware } from "@/types/hardware";

const hardware: Hardware = {
  id: 1,
  ckt_item_number: "CKT-100",
  hardware_type: "Laptop",
  notes: null,
  date_tested: null,
  qty: 1,
  manufacturer: "Dell",
  warranty: null,
  model_number: "Latitude 5420",
  serial_number: "SN-123",
  screen_size: null,
  processor_type: null,
  processor_speed: null,
  operating_system: null,
  ram: null,
  hd_type: null,
  hd_storage: null,
  operational: "Operational",
  price_dollar: null,
  price_peso: null,
  date_of_arrival: null,
  new_or_used: "Used",
  images: [],
  created_at: null,
  updated_at: null,
};

describe("acknowledgement report helpers", () => {
  it("formats a complete employee name without null text", () => {
    expect(formatEmployeeName(" Ana ", "Santos")).toBe("Ana Santos");
    expect(formatEmployeeName("Ana", null)).toBe("Ana");
  });

  it("builds the issued-item description from inventory fields", () => {
    expect(buildItemDescription(hardware)).toBe(
      "CKT# CKT-100 | Laptop — Dell Latitude 5420 | S/N: SN-123",
    );
  });

  it("formats report and issued dates consistently", () => {
    expect(formatReportDate(new Date(2026, 5, 30))).toBe("June 30, 2026");
    expect(formatIssuedDate("2026-06-26")).toBe("Jun 26, 2026");
    expect(formatIssuedDate(null)).toBe("");
  });
});
