"use client";

import React, { useState } from "react";
import { Loader2, X } from "lucide-react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import { addEmployee, updateEmployee } from "@/services/api";
import {
  AddEmployeePayload,
  EmployeeDetails,
  UpdateEmployeePayload,
} from "@/types/employee";

interface AddEmployeeModalProps {
  employee?: EmployeeDetails;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

const requiredFields = [
  "employee_digit_code",
  "first_name",
  "last_name",
  "contact_number",
] as const;

const fieldLabels: Record<(typeof requiredFields)[number], string> = {
  employee_digit_code: "Employee Code",
  first_name: "First Name",
  last_name: "Last Name",
  contact_number: "Contact Number",
};

const isMissingValue = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === "string" && value.trim() === "");

const RequiredIndicator = () => (
  <span
    aria-hidden="true"
    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-base font-bold text-red-500"
  >
    *
  </span>
);

const getInitialFormData = (employee?: EmployeeDetails): AddEmployeePayload => ({
  employee_digit_code: employee?.employee_digit_code ?? "",
  first_name: employee?.first_name ?? "",
  last_name: employee?.last_name ?? "",
  contact_number: employee?.contact_number ?? "",
  position: employee?.position ?? "",
  department: employee?.department ?? "",
  date_hired: employee?.date_hired ?? "",
  status: employee?.status ?? "",
  notes: employee?.notes ?? "",
});

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  employee,
  onClose,
  onSuccess,
}) => {
  const isEditMode = Boolean(employee);
  const [formData, setFormData] =
    useState<AddEmployeePayload>(() => getInitialFormData(employee));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    const nextValue =
      name === "contact_number" ? value.replace(/\D/g, "").slice(0, 11) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const missingFields = requiredFields.filter((fieldName) =>
        isMissingValue(formData[fieldName]),
      );

      if (missingFields.length > 0) {
        throw new Error(
          `Please fill in required fields: ${missingFields
            .map((fieldName) => fieldLabels[fieldName])
            .join(", ")}.`,
        );
      }

      const payload: AddEmployeePayload = {
        employee_digit_code: formData.employee_digit_code.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        contact_number: formData.contact_number.trim(),
        position: formData.position?.trim() || null,
        department: formData.department?.trim() || null,
        date_hired: formData.date_hired || null,
        status: formData.status || null,
        notes: formData.notes?.trim() || null,
      };

      if (isEditMode && employee) {
        await updateEmployee(employee.id, payload as UpdateEmployeePayload);
      } else {
        await addEmployee(payload);
      }
      await onSuccess();
      void Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: isEditMode
          ? "Employee updated successfully"
          : "Employee added successfully",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      onClose();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : `Failed to ${isEditMode ? "update" : "add"} employee`;
      setError(message);
      void Swal.fire({
        title: isEditMode ? "Unable to save changes" : "Unable to add employee",
        text: message,
        icon: "error",
      });
    } finally {
      setIsSubmitting(false);
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
            {isEditMode ? "Edit Employee" : "Add New Employee"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            aria-label="Close add employee modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-gray-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3">
                Employee Info
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Employee Code
                  </label>
                  <div className="relative">
                    <input
                      required
                      name="employee_digit_code"
                      value={formData.employee_digit_code}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pr-8 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                    />
                    <RequiredIndicator />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    First Name
                  </label>
                  <div className="relative">
                    <input
                      required
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pr-8 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                    />
                    <RequiredIndicator />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Last Name
                  </label>
                  <div className="relative">
                    <input
                      required
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pr-8 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                    />
                    <RequiredIndicator />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3">
                Contact & Role
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Contact Number
                  </label>
                  <div className="relative">
                    <input
                      required
                      name="contact_number"
                      type="tel"
                      inputMode="numeric"
                      maxLength={11}
                      value={formData.contact_number}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pr-8 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                    />
                    <RequiredIndicator />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Position
                  </label>
                  <input
                    name="position"
                    value={formData.position ?? ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Department
                  </label>
                  <input
                    name="department"
                    value={formData.department ?? ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3">
                Employment Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Date Hired
                  </label>
                  <input
                    type="date"
                    name="date_hired"
                    value={formData.date_hired ?? ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status ?? ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 pr-9 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  >
                    <option value="">Select status</option>
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes ?? ""}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none resize-none"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-slate-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 size={18} className="animate-spin" />}
              {isSubmitting
                ? "Saving..."
                : isEditMode
                ? "Save Changes"
                : "Add Employee"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
