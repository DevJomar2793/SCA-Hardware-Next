"use client";

import { useCallback, useEffect, useState } from "react";
import { AssignmentDirectory } from "@/components/AssignmentDirectory";
import {
  fetchEmployeeList,
  fetchHardwareAssignmentList,
} from "@/services/api";
import { HardwareAssignment } from "@/types/assignment";
import { EmployeeDetails } from "@/types/employee";

export default function AssignmentPage() {
  const [assignments, setAssignments] = useState<HardwareAssignment[]>([]);
  const [employees, setEmployees] = useState<EmployeeDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssignments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [assignmentData, employeeData] = await Promise.all([
        fetchHardwareAssignmentList(),
        fetchEmployeeList(),
      ]);

      setAssignments(assignmentData);
      setEmployees(employeeData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch hardware assignments",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAssignments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAssignments]);

  return (
    <AssignmentDirectory
      assignments={assignments}
      employees={employees}
      isLoading={isLoading}
      error={error}
      onReload={loadAssignments}
    />
  );
}
