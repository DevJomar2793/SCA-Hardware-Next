"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Loader2, ImagePlus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  addHardware,
  API_BASE_URL,
  deleteHardwareImage,
  fetchNextCktNumber,
  updateHardware,
  uploadHardwareImages,
} from "@/services/api";
import { HARDWARE_TYPE_OPTIONS } from "@/constants/hardware";
import {
  AddHardwarePayload,
  Hardware,
  UpdateHardwarePayload,
} from "@/types/hardware";
import Swal from "sweetalert2";

interface AddHardwareModalProps {
  hardware?: Hardware;
  onClose: () => void;
  onImagesChanged?: () => void | Promise<void>;
  onSuccess: () => void | Promise<void>;
}

const getInitialFormData = (hardware?: Hardware) => ({
  ckt_item_number: hardware?.ckt_item_number ?? "",
  hardware_type: hardware?.hardware_type ?? "",
  manufacturer: hardware?.manufacturer ?? "",
  model_number: hardware?.model_number ?? "",
  serial_number: hardware?.serial_number ?? "",
  qty: hardware?.qty ?? 1,
  operational: hardware?.operational ?? "Operational",
  new_or_used: hardware?.new_or_used ?? "New",
  processor_type: hardware?.processor_type ?? "",
  processor_speed: hardware?.processor_speed ?? "",
  ram: hardware?.ram ?? "",
  hd_type: hardware?.hd_type ?? "",
  hd_storage: hardware?.hd_storage ?? "",
  screen_size: hardware?.screen_size ?? "",
  operating_system: hardware?.operating_system ?? "",
  price_dollar:
    hardware?.price_dollar === null || hardware?.price_dollar === undefined
      ? ""
      : String(hardware.price_dollar),
  price_peso:
    hardware?.price_peso === null || hardware?.price_peso === undefined
      ? ""
      : String(hardware.price_peso),
  date_of_arrival: hardware?.date_of_arrival ?? "",
  warranty: hardware?.warranty ?? "",
  notes: hardware?.notes ?? "",
});

export const AddHardwareModal: React.FC<AddHardwareModalProps> = ({
  hardware,
  onClose,
  onImagesChanged,
  onSuccess,
}) => {
  const isEditMode = Boolean(hardware);
  const cktRequestId = useRef(0);
  const previewsRef = useRef<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "creating" | "uploading"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [cktError, setCktError] = useState<string | null>(null);
  const [isCktLoading, setIsCktLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(
    () => hardware?.images ?? [],
  );
  const [deletingImagePath, setDeletingImagePath] = useState<string | null>(
    null,
  );
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const [formData, setFormData] = useState(() => getInitialFormData(hardware));

  const loadNextCktNumber = async (hardwareType: string) => {
    const requestId = cktRequestId.current + 1;
    cktRequestId.current = requestId;

    if (!hardwareType) {
      setIsCktLoading(false);
      setCktError(null);
      setFormData((prev) => ({ ...prev, ckt_item_number: "" }));
      return;
    }

    setIsCktLoading(true);
    setCktError(null);

    try {
      const cktItemNumber = await fetchNextCktNumber(hardwareType);
      if (cktRequestId.current !== requestId) {
        return;
      }

      setFormData((prev) =>
        prev.hardware_type === hardwareType
          ? { ...prev, ckt_item_number: cktItemNumber }
          : prev,
      );
    } catch (err) {
      if (cktRequestId.current !== requestId) {
        return;
      }

      setCktError(
        err instanceof Error ? err.message : "Failed to generate CKT number",
      );
      setFormData((prev) =>
        prev.hardware_type === hardwareType
          ? { ...prev, ckt_item_number: "" }
          : prev,
      );
    } finally {
      if (cktRequestId.current === requestId) {
        setIsCktLoading(false);
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    if (name === "hardware_type") {
      setFormData((prev) => ({
        ...prev,
        hardware_type: value,
        ckt_item_number: isEditMode ? prev.ckt_item_number : "",
      }));
      if (!isEditMode) {
        void loadNextCktNumber(value);
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "qty" ? parseInt(value) || 0 : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);

      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
    // Reset so the same file can be re-selected next time
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleDeleteExistingImage = async (imagePath: string) => {
    if (!hardware) return;

    const result = await Swal.fire({
      title: "Delete image?",
      text: "This will permanently delete this uploaded image.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingImagePath(imagePath);
      await deleteHardwareImage(hardware.id, imagePath);
      setExistingImages((prev) => prev.filter((path) => path !== imagePath));
      await onImagesChanged?.();
      void Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Image deleted",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
    } catch (err) {
      void Swal.fire({
        title: "Delete failed",
        text:
          err instanceof Error
            ? err.message
            : "Failed to delete hardware image.",
        icon: "error",
      });
    } finally {
      setDeletingImagePath(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadStatus("creating");
    setError(null);

    try {
      if (!formData.ckt_item_number || isCktLoading || cktError) {
        throw new Error("Please select a valid hardware type first.");
      }

      const payload: AddHardwarePayload = {
        ...formData,
        price_dollar: formData.price_dollar
          ? parseFloat(formData.price_dollar)
          : null,
        price_peso: formData.price_peso
          ? parseFloat(formData.price_peso)
          : null,
      };

      const savedHardware = isEditMode
        ? await updateHardware(hardware!.id, payload as UpdateHardwarePayload)
        : await addHardware(payload);

      if (selectedFiles.length > 0) {
        setUploadStatus("uploading");
        await uploadHardwareImages(savedHardware.id, selectedFiles);
      }

      await onSuccess();
      void Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: isEditMode
          ? "Hardware updated successfully"
          : "Hardware added successfully",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditMode ? "update" : "add"} hardware`,
      );
    } finally {
      setIsSubmitting(false);
      setUploadStatus("idle");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-3xl text-gray-600 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-slate-800">
            {isEditMode ? "Edit Hardware" : "Add New Hardware"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200  rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-gray-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3">
                Core Info
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    CKT Item #
                  </label>
                  <input
                    required
                    name="ckt_item_number"
                    value={formData.ckt_item_number}
                    readOnly
                    placeholder={
                      isCktLoading ? "Generating..." : "Select hardware type"
                    }
                    className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-600 rounded-lg text-sm outline-none"
                  />
                  {cktError && (
                    <p className="mt-1 text-xs text-red-600">{cktError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Hardware Type
                  </label>
                  <select
                    required
                    name="hardware_type"
                    value={formData.hardware_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  >
                    <option value="">Select hardware type</option>
                    {HARDWARE_TYPE_OPTIONS.map((hardwareType) => (
                      <option key={hardwareType} value={hardwareType}>
                        {hardwareType}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Manufacturer
                  </label>
                  <input
                    required
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Model Number
                  </label>
                  <input
                    required
                    name="model_number"
                    value={formData.model_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Serial Number
                  </label>
                  <input
                    required
                    name="serial_number"
                    value={formData.serial_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Quantity
                  </label>
                  <input
                    required
                    type="number"
                    name="qty"
                    value={formData.qty}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3">
                Technical Specs
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Processor
                  </label>
                  <input
                    name="processor_type"
                    value={formData.processor_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Speed
                  </label>
                  <input
                    name="processor_speed"
                    value={formData.processor_speed}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    RAM
                  </label>
                  <input
                    name="ram"
                    value={formData.ram}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Storage Type
                  </label>
                  <input
                    name="hd_type"
                    value={formData.hd_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Storage Capacity
                  </label>
                  <input
                    name="hd_storage"
                    value={formData.hd_storage}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Screen Size
                  </label>
                  <input
                    name="screen_size"
                    value={formData.screen_size}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    OS
                  </label>
                  <input
                    name="operating_system"
                    value={formData.operating_system}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3">
                Logistics & Status
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Operational Status
                  </label>
                  <select
                    name="operational"
                    value={formData.operational}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  >
                    <option value="Operational">Operational</option>
                    <option value="Non-Operational">Non-Operational</option>
                    <option value="Under Repair">Under Repair</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Condition
                  </label>
                  <select
                    name="new_or_used"
                    value={formData.new_or_used}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Used">Used</option>
                    <option value="Refurbished">Refurbished</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Arrival Date
                  </label>
                  <input
                    type="date"
                    name="date_of_arrival"
                    value={formData.date_of_arrival}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price_dollar"
                    value={formData.price_dollar}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Price (PHP)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price_peso"
                    value={formData.price_peso}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Warranty
                  </label>
                  <input
                    name="warranty"
                    value={formData.warranty}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Hardware Images
              </label>
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-purple-400 transition-colors cursor-pointer relative group"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center gap-2">
                  <ImagePlus
                    size={24}
                    className="text-slate-400 group-hover:text-purple-500 transition-colors"
                  />
                  <span className="text-xs text-slate-500">
                    {isEditMode
                      ? "Click to add more images"
                      : "Click to upload images"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                <AnimatePresence>
                  {existingImages.map((imagePath) => (
                    <motion.div
                      key={imagePath}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() =>
                        setPreviewImage({
                          src: `${API_BASE_URL}${imagePath}`,
                          alt: "Uploaded hardware",
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setPreviewImage({
                            src: `${API_BASE_URL}${imagePath}`,
                            alt: "Uploaded hardware",
                          });
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    >
                      <img
                        src={`${API_BASE_URL}${imagePath}`}
                        alt="Uploaded hardware"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteExistingImage(imagePath);
                        }}
                        disabled={deletingImagePath === imagePath}
                        className="absolute top-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-100"
                        aria-label="Delete uploaded image"
                        title="Delete uploaded image"
                      >
                        {deletingImagePath === imagePath ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    </motion.div>
                  ))}
                  {previews.map((url, index) => (
                    <motion.div
                      key={url}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() =>
                        setPreviewImage({
                          src: url,
                          alt: "Selected hardware preview",
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setPreviewImage({
                            src: url,
                            alt: "Selected hardware preview",
                          });
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    >
                      <img
                        src={url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                (!isEditMode && isCktLoading) ||
                (!isEditMode && Boolean(cktError))
              }
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={18} className="animate-spin" />}
              {isSubmitting
                ? uploadStatus === "creating"
                  ? isEditMode
                    ? "Saving..."
                    : "Creating..."
                  : "Uploading Images..."
                : isCktLoading
                  ? "Generating CKT..."
                  : isEditMode
                    ? "Save Changes"
                    : "Add Hardware"}
            </button>
          </div>
        </form>
      </motion.div>

      <AnimatePresence>
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
              key={previewImage.src}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              src={previewImage.src}
              alt={previewImage.alt}
              className="max-h-[92vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
