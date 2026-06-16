"use client";

import React, { useState } from "react";
import { X, Images } from "lucide-react";
import { API_BASE_URL } from "@/services/api";
import { Hardware } from "@/types/hardware";
import { motion, AnimatePresence } from "framer-motion";

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) => (
  <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
    <span className="text-sm text-slate-500 font-medium">{label}</span>
    <span className="text-sm text-slate-800 font-semibold">
      {value || "—"}
    </span>
  </div>
);

const DetailSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="mb-6">
    <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3">
      {title}
    </h3>
    <div className="space-y-1">{children}</div>
  </div>
);

interface HardwareDetailModalProps {
  item: Hardware | null;
  onClose: () => void;
}

export const HardwareDetailModal: React.FC<HardwareDetailModalProps> = ({
  item,
  onClose,
}) => {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  if (!item) return null;

  const displayedImage =
    activeImage && item.images?.includes(activeImage)
      ? activeImage
      : item.images?.[0] ?? null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
        className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Hardware Details
            </h2>
            <p className="text-sm text-slate-500">
              CKT# {item.ckt_item_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* ── Image Gallery ── */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Images size={14} />
              Hardware Images
              <span className="text-gray-400 font-normal normal-case">
                ({item.images?.length ?? 0})
              </span>
            </h3>

            {item.images && item.images.length > 0 ? (
              <div className="space-y-3">
                {/* Main preview */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={displayedImage ?? "empty"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="w-full h-56 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center"
                  >
                    {displayedImage && (
                      <img
                        src={`${API_BASE_URL}${displayedImage}`}
                        alt="Hardware preview"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Thumbnails – only shown when more than 1 image */}
                {item.images.length > 1 && (
                  <div className="flex gap-2 flex-wrap">
                    {item.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(img)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                          displayedImage === img
                            ? "border-purple-500 shadow-md"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        <img
                          src={`${API_BASE_URL}${img}`}
                          alt={`Thumbnail ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-32 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-slate-400 bg-gray-50">
                <Images size={28} className="mb-2 opacity-40" />
                <span className="text-xs">No images uploaded</span>
              </div>
            )}
          </div>

          {/* ── Detail Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <DetailSection title="Core Information">
              <DetailRow label="Hardware Type" value={item.hardware_type} />
              <DetailRow label="Brand" value={item.manufacturer} />
              <DetailRow label="Model" value={item.model_number} />
              <DetailRow label="Serial Number" value={item.serial_number} />
            </DetailSection>

            <DetailSection title="Technical Specifications">
              <DetailRow label="Processor" value={item.processor_type} />
              <DetailRow label="Speed" value={item.processor_speed} />
              <DetailRow label="RAM" value={item.ram} />
              <DetailRow label="Storage Type" value={item.hd_type} />
              <DetailRow label="Storage Cap." value={item.hd_storage} />
              <DetailRow label="Screen Size" value={item.screen_size} />
              <DetailRow label="OS" value={item.operating_system} />
            </DetailSection>

            <DetailSection title="Status & Logistics">
              <DetailRow label="Status" value={item.operational} />
              <DetailRow label="Condition" value={item.new_or_used} />
              <DetailRow
                label="Price (USD)"
                value={item.price_dollar ? `$${item.price_dollar}` : null}
              />
              <DetailRow
                label="Price (PHP)"
                value={item.price_peso ? `₱${item.price_peso}` : null}
              />
              <DetailRow label="Arrival Date" value={item.date_of_arrival} />
              <DetailRow label="Tested Date" value={item.date_tested} />
              <DetailRow label="Created Date" value={item.date_created} />
            </DetailSection>

            <DetailSection title="Additional Info">
              <DetailRow label="Warranty" value={item.warranty} />
              <div className="mt-2">
                <span className="text-sm text-slate-500 font-medium block mb-1">
                  Notes
                </span>
                <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg italic border border-gray-100 min-h-[60px]">
                  {item.notes || "No notes available."}
                </p>
              </div>
            </DetailSection>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 text-slate-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
