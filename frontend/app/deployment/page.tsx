"use client";

import { useCallback, useEffect, useState } from "react";
import { DeploymentDirectory } from "@/components/DeploymentDirectory";
import { fetchEmployeeList } from "@/services/api";
import { EmployeeDetails } from "@/types/employee";

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

  return (
    <DeploymentDirectory
      employees={employees}
      isLoading={isLoading}
      error={error}
      onReload={loadEmployees}
    />
  );
}
