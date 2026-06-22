"use client";

import { useCallback, useEffect, useState } from "react";
import { DeploymentDirectory } from "@/components/DeploymentDirectory";
import { fetchEmployeeList } from "@/services/api";
import { EmployeeDetails } from "@/types/employee";
import Swal from "sweetalert2";

export default function DeploymentPage() {
  const [employees, setEmployees] = useState<EmployeeDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchEmployeeList();
      setEmployees(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch employees",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEmployees();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadEmployees]);

  useEffect(() => {
    const message = window.sessionStorage.getItem("employee-delete-toast");
    if (!message) return;

    window.sessionStorage.removeItem("employee-delete-toast");
    void Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }, []);

  return (
    <DeploymentDirectory
      employees={employees}
      isLoading={isLoading}
      error={error}
      onReload={loadEmployees}
    />
  );
}
