"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Cpu,
  DollarSign,
  HardDrive,
  Images,
  Loader2,
  Monitor,
  PackageCheck,
  Pencil,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  API_BASE_URL,
  deleteHardware,
  fetchHardwareById,
} from "@/services/api";
import { AddHardwareModal } from "@/components/AddHardwareModal";
import { Hardware } from "@/types/hardware";
import Swal from "sweetalert2";

const displayValue = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === "" ? "-" : String(value);

const getStatusStyle = (status: string | null | undefined) => {
  if (status === "Operational") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }

  if (status === "Under Repair") {
    return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }

  if (status === "Non-Operational") {
    return "bg-red-50 text-red-700 ring-red-600/20";
  }

  return "bg-slate-100 text-slate-600 ring-slate-500/20";
};

const getConditionStyle = (condition: string | null | undefined) => {
  if (condition === "New") {
    return "bg-purple-50 text-purple-700 ring-purple-600/20";
  }

  if (condition === "Used") {
    return "bg-slate-100 text-slate-600 ring-slate-500/20";
  }

  return "bg-blue-50 text-blue-700 ring-blue-600/20";
};

const DetailItem = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number | null | undefined;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-slate-800">
          {displayValue(value)}
        </p>
      </div>
    </div>
  </div>
);

const formatMoney = (value: number | null | undefined, currency: string) => {
  if (value === null || value === undefined) return null;
  return `${currency} ${value.toLocaleString()}`;
};

export default function HardwareDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const hardwareId = params.id;
  const [hardware, setHardware] = useState<Hardware | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadHardware = useCallback(async () => {
    if (!hardwareId || Number.isNaN(Number(hardwareId))) {
      setError("Invalid hardware id.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchHardwareById(hardwareId);
      setHardware(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch hardware details",
      );
      setHardware(null);
    } finally {
      setIsLoading(false);
    }
  }, [hardwareId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHardware();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadHardware]);

  const displayedImage = useMemo(() => {
    if (!hardware?.images?.length) return null;
    return activeImage && hardware.images.includes(activeImage)
      ? activeImage
      : hardware.images[0];
  }, [activeImage, hardware]);

  const handleEditSuccess = async () => {
    await loadHardware();
    setIsEditModalOpen(false);
  };

  const handleDeleteHardware = async () => {
    if (!hardware) return;

    const result = await Swal.fire({
      title: "Delete hardware?",
      text: `This will permanently delete ${hardware.ckt_item_number}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      setIsDeleting(true);
      await deleteHardware(hardware.id);
      window.sessionStorage.setItem(
        "hardware-delete-toast",
        `You successfully deleted "${hardware.model_number || hardware.ckt_item_number}"`,
      );
      router.push("/hardware");
    } catch (err) {
      void Swal.fire({
        title: "Delete failed",
        text:
          err instanceof Error
            ? err.message
            : "Failed to delete hardware item.",
        icon: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-sky-50 p-8">
        <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-8 text-slate-500 shadow-sm">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-purple-600" />
          <p className="font-medium">Fetching hardware details...</p>
        </div>
      </div>
    );
  }

  if (error || !hardware) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-sky-50 p-8">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="mb-2 font-semibold text-red-700">
            Unable to load hardware
          </p>
          <p className="mb-6 text-sm text-slate-600">
            {error || "Hardware item not found."}
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/hardware"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-gray-50"
            >
              Back to Hardware
            </Link>
            <button
              type="button"
              onClick={() => void loadHardware()}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusStyle(hardware.operational);
  const conditionStyle = getConditionStyle(hardware.new_or_used);

  return (
    <div className="min-h-full flex-1 bg-sky-50 p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/hardware"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back to Hardware
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-50"
            >
              <Pencil size={16} />
              Edit
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteHardware()}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/50 p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-sm">
                  <HardDrive size={30} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-600">
                    CKT# {displayValue(hardware.ckt_item_number)}
                  </p>
                  <h1 className="mt-1 text-3xl font-bold text-slate-800">
                    {displayValue(hardware.manufacturer)}{" "}
                    {displayValue(hardware.model_number)}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {displayValue(hardware.hardware_type)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ${statusStyle}`}
                >
                  {displayValue(hardware.operational)}
                </span>
                <span
                  className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ${conditionStyle}`}
                >
                  {displayValue(hardware.new_or_used)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-[0.9fr_1.4fr]">
            <aside className="space-y-6">
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600">
                  <Images size={14} />
                  Hardware Images
                  <span className="font-normal normal-case text-gray-400">
                    ({hardware.images?.length ?? 0})
                  </span>
                </h2>

                {hardware.images && hardware.images.length > 0 ? (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => displayedImage && setPreviewImage(displayedImage)}
                      className="flex h-72 w-full items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    >
                      {displayedImage && (
                        <img
                          src={`${API_BASE_URL}${displayedImage}`}
                          alt="Hardware preview"
                          className="h-full w-full object-contain"
                        />
                      )}
                    </button>

                    {hardware.images.length > 1 && (
                      <div className="flex flex-wrap gap-2">
                        {hardware.images.map((imagePath, index) => (
                          <button
                            key={imagePath}
                            type="button"
                            onClick={() => setActiveImage(imagePath)}
                            className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                              displayedImage === imagePath
                                ? "border-purple-500 shadow-md"
                                : "border-gray-200 hover:border-purple-300"
                            }`}
                          >
                            <img
                              src={`${API_BASE_URL}${imagePath}`}
                              alt={`Hardware thumbnail ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-40 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-slate-400">
                    <Images size={30} className="mb-2 opacity-40" />
                    <span className="text-xs">No images uploaded</span>
                  </div>
                )}
              </section>

              <aside className="rounded-xl border border-gray-200 bg-slate-50 p-5">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-purple-600">
                  Notes
                </h2>
                <p className="min-h-32 whitespace-pre-wrap rounded-lg border border-gray-100 bg-white p-4 text-sm leading-6 text-slate-700">
                  {hardware.notes || "No notes available."}
                </p>
              </aside>
            </aside>

            <div className="space-y-6">
              <section>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-purple-600">
                  Core Information
                </h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailItem
                    label="Hardware Type"
                    value={hardware.hardware_type}
                    icon={HardDrive}
                  />
                  <DetailItem
                    label="Manufacturer"
                    value={hardware.manufacturer}
                    icon={PackageCheck}
                  />
                  <DetailItem
                    label="Model Number"
                    value={hardware.model_number}
                    icon={Monitor}
                  />
                  <DetailItem
                    label="Serial Number"
                    value={hardware.serial_number}
                    icon={ShieldCheck}
                  />
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-purple-600">
                  Technical Specifications
                </h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailItem
                    label="Processor"
                    value={hardware.processor_type}
                    icon={Cpu}
                  />
                  <DetailItem
                    label="Processor Speed"
                    value={hardware.processor_speed}
                    icon={Cpu}
                  />
                  <DetailItem label="RAM" value={hardware.ram} icon={Cpu} />
                  <DetailItem
                    label="Storage Type"
                    value={hardware.hd_type}
                    icon={HardDrive}
                  />
                  <DetailItem
                    label="Storage Capacity"
                    value={hardware.hd_storage}
                    icon={HardDrive}
                  />
                  <DetailItem
                    label="Screen Size"
                    value={hardware.screen_size}
                    icon={Monitor}
                  />
                  <DetailItem
                    label="Operating System"
                    value={hardware.operating_system}
                    icon={Monitor}
                  />
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-purple-600">
                  Status & Logistics
                </h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailItem
                    label="Operational Status"
                    value={hardware.operational}
                    icon={CheckCircle2}
                  />
                  <DetailItem
                    label="Condition"
                    value={hardware.new_or_used}
                    icon={PackageCheck}
                  />
                  <DetailItem
                    label="Quantity"
                    value={hardware.qty}
                    icon={PackageCheck}
                  />
                  <DetailItem
                    label="Warranty"
                    value={hardware.warranty}
                    icon={ShieldCheck}
                  />
                  <DetailItem
                    label="Price USD"
                    value={formatMoney(hardware.price_dollar, "USD")}
                    icon={DollarSign}
                  />
                  <DetailItem
                    label="Price PHP"
                    value={formatMoney(hardware.price_peso, "PHP")}
                    icon={DollarSign}
                  />
                  <DetailItem
                    label="Arrival Date"
                    value={hardware.date_of_arrival}
                    icon={CalendarDays}
                  />
                  <DetailItem
                    label="Date Tested"
                    value={hardware.date_tested}
                    icon={CalendarDays}
                  />
                  <DetailItem
                    label="Created Date"
                    value={hardware.created_at}
                    icon={Clock3}
                  />
                  <DetailItem
                    label="Updated Date"
                    value={hardware.updated_at}
                    icon={Clock3}
                  />
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {isEditModalOpen && (
          <AddHardwareModal
            hardware={hardware}
            onClose={() => setIsEditModalOpen(false)}
            onImagesChanged={loadHardware}
            onSuccess={handleEditSuccess}
          />
        )}
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 p-4 sm:p-8"
            onClick={() => setPreviewImage(null)}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
              aria-label="Close image preview"
              title="Close image preview"
            >
              <X size={22} />
            </button>
            <motion.img
              key={previewImage}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              src={`${API_BASE_URL}${previewImage}`}
              alt="Hardware preview"
              className="max-h-[92vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
