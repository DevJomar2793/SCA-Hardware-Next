import { describe, expect, it } from "vitest";

import {
  filterHardwareItems,
  getNextSortConfig,
  paginateHardwareItems,
  sortHardwareItems,
} from "@/lib/hardware-table";
import { Hardware } from "@/types/hardware";

function makeHardware(overrides: Partial<Hardware>): Hardware {
  return {
    id: 1,
    ckt_item_number: "L0001",
    hardware_type: "LAPTOP",
    notes: null,
    date_tested: null,
    qty: 1,
    manufacturer: "Dell",
    warranty: null,
    model_number: "Latitude",
    serial_number: "ABC123",
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
    new_or_used: "New",
    images: [],
    date_created: null,
    ...overrides,
  };
}

describe("hardware table helpers", () => {
  const items = [
    makeHardware({
      id: 1,
      ckt_item_number: "L0001",
      hardware_type: "LAPTOP",
      manufacturer: "Dell",
      model_number: "Latitude",
    }),
    makeHardware({
      id: 2,
      ckt_item_number: "M0001",
      hardware_type: "MONITOR",
      manufacturer: "Asus",
      model_number: "ProArt",
    }),
    makeHardware({
      id: 3,
      ckt_item_number: "P0001",
      hardware_type: "PRINTER",
      manufacturer: "Canon",
      model_number: "ImageClass",
    }),
  ];

  it("filters by searchable hardware fields", () => {
    expect(filterHardwareItems(items, "proart", "All")).toEqual([items[1]]);
    expect(filterHardwareItems(items, "canon", "All")).toEqual([items[2]]);
    expect(filterHardwareItems(items, "L0001", "All")).toEqual([items[0]]);
  });

  it("filters by hardware type", () => {
    expect(filterHardwareItems(items, "", "MONITOR")).toEqual([items[1]]);
  });

  it("sorts items according to the active sort config", () => {
    expect(
      sortHardwareItems(items, { key: "manufacturer", direction: "asc" }).map(
        (item) => item.manufacturer,
      ),
    ).toEqual(["Asus", "Canon", "Dell"]);

    expect(
      sortHardwareItems(items, { key: "manufacturer", direction: "desc" }).map(
        (item) => item.manufacturer,
      ),
    ).toEqual(["Dell", "Canon", "Asus"]);
  });

  it("cycles sort config through asc, desc, and unset", () => {
    const ascending = getNextSortConfig(
      { key: null, direction: null },
      "manufacturer",
    );
    const descending = getNextSortConfig(ascending, "manufacturer");
    const unset = getNextSortConfig(descending, "manufacturer");

    expect(ascending).toEqual({ key: "manufacturer", direction: "asc" });
    expect(descending).toEqual({ key: "manufacturer", direction: "desc" });
    expect(unset).toEqual({ key: null, direction: null });
  });

  it("returns the requested page slice", () => {
    expect(paginateHardwareItems(items, 2, 2)).toEqual([items[2]]);
  });
});
