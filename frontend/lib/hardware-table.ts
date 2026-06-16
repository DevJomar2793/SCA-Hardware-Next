import { Hardware, HardwareSortConfig } from "@/types/hardware";

export function filterHardwareItems(
  items: Hardware[],
  searchTerm: string,
  filterType: string,
): Hardware[] {
  const normalizedSearchTerm = searchTerm.toUpperCase();

  return items.filter((item) => {
    const matchesSearch =
      item.ckt_item_number?.toUpperCase().includes(normalizedSearchTerm) ||
      item.model_number?.toUpperCase().includes(normalizedSearchTerm) ||
      item.hardware_type?.toUpperCase().includes(normalizedSearchTerm) ||
      item.manufacturer?.toUpperCase().includes(normalizedSearchTerm);

    const matchesType = filterType === "All" || item.hardware_type === filterType;

    return matchesSearch && matchesType;
  });
}

export function sortHardwareItems(
  items: Hardware[],
  sortConfig: HardwareSortConfig,
): Hardware[] {
  if (!sortConfig.key || !sortConfig.direction) return items;

  return [...items].sort((a, b) => {
    const aValue = a[sortConfig.key!] ?? "";
    const bValue = b[sortConfig.key!] ?? "";

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });
}

export function getNextSortConfig(
  currentConfig: HardwareSortConfig,
  key: keyof Hardware,
): HardwareSortConfig {
  if (currentConfig.key === key && currentConfig.direction === "asc") {
    return { key, direction: "desc" };
  }

  if (currentConfig.key === key && currentConfig.direction === "desc") {
    return { key: null, direction: null };
  }

  return { key, direction: "asc" };
}

export function paginateHardwareItems(
  items: Hardware[],
  currentPage: number,
  itemsPerPage: number,
): Hardware[] {
  return items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
}
