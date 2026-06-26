import { describe, expect, it } from "vitest";

import {
  filterUnassignedEmployees,
  getAssignedEmployeeIds,
  groupActiveAssignmentsByEmployee,
} from "@/lib/assignment-table";
import { HardwareAssignment } from "@/types/assignment";
import { EmployeeDetails } from "@/types/employee";

function makeAssignment(
  overrides: Partial<HardwareAssignment>,
): HardwareAssignment {
  return {
    id: 1,
    employee_details_id: 1,
    hardware_id: 1,
    date_assigned: "2026-06-26",
    date_returned: null,
    status: "Assigned",
    history: null,
    notes: null,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

function makeEmployee(overrides: Partial<EmployeeDetails>): EmployeeDetails {
  return {
    id: 1,
    employee_digit_code: "EMP001",
    first_name: "Ana",
    last_name: "Santos",
    contact_number: null,
    position: "Technician",
    department: "IT Support",
    date_hired: null,
    status: "Active",
    notes: null,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

describe("assignment table helpers", () => {
  it("groups multiple active hardware assignments into one employee card", () => {
    const assignments = [
      makeAssignment({ id: 10, employee_details_id: 1, hardware_id: 100 }),
      makeAssignment({ id: 12, employee_details_id: 1, hardware_id: 101 }),
      makeAssignment({ id: 11, employee_details_id: 2, hardware_id: 102 }),
    ];

    expect(groupActiveAssignmentsByEmployee(assignments)).toEqual([
      {
        employee_details_id: 1,
        assignmentId: 12,
        assignments: [assignments[0], assignments[1]],
      },
      {
        employee_details_id: 2,
        assignmentId: 11,
        assignments: [assignments[2]],
      },
    ]);
  });

  it("excludes returned assignments from card groups", () => {
    const assignments = [
      makeAssignment({ id: 10, employee_details_id: 1, hardware_id: 100 }),
      makeAssignment({
        id: 12,
        employee_details_id: 1,
        hardware_id: 101,
        date_returned: "2026-06-26",
        status: "Returned",
      }),
      makeAssignment({
        id: 13,
        employee_details_id: 2,
        hardware_id: 102,
        status: "returned",
      }),
    ];

    expect(groupActiveAssignmentsByEmployee(assignments)).toEqual([
      {
        employee_details_id: 1,
        assignmentId: 10,
        assignments: [assignments[0]],
      },
    ]);
  });

  it("treats employees with only returned rows as unassigned", () => {
    const employees = [
      makeEmployee({ id: 1, first_name: "Ana", last_name: "Santos" }),
      makeEmployee({ id: 2, first_name: "Ben", last_name: "Reyes" }),
    ];
    const groups = groupActiveAssignmentsByEmployee([
      makeAssignment({
        id: 10,
        employee_details_id: 1,
        date_returned: "2026-06-26",
        status: "Returned",
      }),
      makeAssignment({ id: 11, employee_details_id: 2 }),
    ]);

    const unassignedEmployees = filterUnassignedEmployees(
      employees,
      getAssignedEmployeeIds(groups),
      "",
      "All",
      (employee) => `${employee.first_name} ${employee.last_name}`,
    );

    expect(unassignedEmployees).toEqual([employees[0]]);
  });
});
