import { describe, expect, it } from "vitest";

import {
  filterEmployeeItems,
  getNextEmployeeSortConfig,
  paginateEmployeeItems,
  sortEmployeeItems,
} from "@/lib/employee-table";
import { EmployeeDetails } from "@/types/employee";

function makeEmployee(overrides: Partial<EmployeeDetails>): EmployeeDetails {
  return {
    id: 1,
    employee_digit_code: "EMP001",
    first_name: "Ana",
    last_name: "Santos",
    contact_number: "09170000001",
    position: "Technician",
    department: "IT Support",
    date_hired: "2026-01-10",
    status: "Active",
    notes: null,
    date_created: null,
    ...overrides,
  };
}

describe("employee table helpers", () => {
  const employees = [
    makeEmployee({
      id: 1,
      employee_digit_code: "EMP001",
      first_name: "Ana",
      last_name: "Santos",
      department: "IT Support",
      status: "Active",
    }),
    makeEmployee({
      id: 2,
      employee_digit_code: "EMP002",
      first_name: "Ben",
      last_name: "Reyes",
      contact_number: "09170000002",
      position: "Analyst",
      department: "Finance",
      status: "On Leave",
    }),
    makeEmployee({
      id: 3,
      employee_digit_code: "EMP003",
      first_name: "Cara",
      last_name: "Dela Cruz",
      contact_number: "09170000003",
      position: "Coordinator",
      department: "Operations",
      status: "Inactive",
    }),
  ];

  it("filters by searchable employee fields", () => {
    expect(filterEmployeeItems(employees, "ben reyes", "All", "All")).toEqual([
      employees[1],
    ]);
    expect(filterEmployeeItems(employees, "09170000003", "All", "All")).toEqual([
      employees[2],
    ]);
    expect(filterEmployeeItems(employees, "operations", "All", "All")).toEqual([
      employees[2],
    ]);
  });

  it("filters by department and status", () => {
    expect(filterEmployeeItems(employees, "", "Finance", "All")).toEqual([
      employees[1],
    ]);
    expect(filterEmployeeItems(employees, "", "All", "Inactive")).toEqual([
      employees[2],
    ]);
    expect(filterEmployeeItems(employees, "", "Finance", "Active")).toEqual([]);
  });

  it("sorts by full name and normal fields", () => {
    expect(
      sortEmployeeItems(employees, { key: "full_name", direction: "desc" }).map(
        (employee) => employee.first_name,
      ),
    ).toEqual(["Cara", "Ben", "Ana"]);

    expect(
      sortEmployeeItems(employees, { key: "department", direction: "asc" }).map(
        (employee) => employee.department,
      ),
    ).toEqual(["Finance", "IT Support", "Operations"]);
  });

  it("cycles sort config through asc, desc, and unset", () => {
    const ascending = getNextEmployeeSortConfig(
      { key: null, direction: null },
      "full_name",
    );
    const descending = getNextEmployeeSortConfig(ascending, "full_name");
    const unset = getNextEmployeeSortConfig(descending, "full_name");

    expect(ascending).toEqual({ key: "full_name", direction: "asc" });
    expect(descending).toEqual({ key: "full_name", direction: "desc" });
    expect(unset).toEqual({ key: null, direction: null });
  });

  it("returns the requested page slice", () => {
    expect(paginateEmployeeItems(employees, 2, 2)).toEqual([employees[2]]);
  });
});
