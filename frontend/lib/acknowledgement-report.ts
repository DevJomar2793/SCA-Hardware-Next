import { Hardware } from "@/types/hardware";

const clean = (value: string | null | undefined) => value?.trim() || "";

export function formatEmployeeName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
) {
  return [clean(firstName), clean(lastName)].filter(Boolean).join(" ");
}

export function formatReportDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatIssuedDate(value: string | null | undefined) {
  const normalizedValue = clean(value);
  if (!normalizedValue) return "";

  const dateOnlyMatch = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3]),
      )
    : new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) return normalizedValue;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function buildItemDescription(hardware: Hardware) {
  const identity = [
    clean(hardware.manufacturer),
    clean(hardware.model_number),
  ]
    .filter(Boolean)
    .join(" ");
  const details = [clean(hardware.hardware_type), identity]
    .filter(Boolean)
    .join(" — ");
  const cktNumber = clean(hardware.ckt_item_number);
  const serialNumber = clean(hardware.serial_number);

  return [
    cktNumber ? `CKT# ${cktNumber}` : "",
    details,
    serialNumber ? `S/N: ${serialNumber}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}
