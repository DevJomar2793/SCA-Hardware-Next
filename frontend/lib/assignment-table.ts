import { HardwareAssignment } from "@/types/assignment";
import { EmployeeDetails } from "@/types/employee";

export interface AssignmentCardGroup {
  employee_details_id: number;
  assignmentId: number;
  assignments: HardwareAssignment[];
}

export function isActiveAssignment(assignment: HardwareAssignment): boolean {
  return (
    !assignment.date_returned &&
    assignment.status.trim().toLowerCase() !== "returned"
  );
}

export function groupActiveAssignmentsByEmployee(
  assignments: HardwareAssignment[],
): AssignmentCardGroup[] {
  const groupsByEmployeeId = new Map<number, AssignmentCardGroup>();

  assignments.filter(isActiveAssignment).forEach((assignment) => {
    const existingGroup = groupsByEmployeeId.get(assignment.employee_details_id);

    if (!existingGroup) {
      groupsByEmployeeId.set(assignment.employee_details_id, {
        employee_details_id: assignment.employee_details_id,
        assignmentId: assignment.id,
        assignments: [assignment],
      });
      return;
    }

    existingGroup.assignments.push(assignment);
    existingGroup.assignmentId = Math.max(
      existingGroup.assignmentId,
      assignment.id,
    );
  });

  return Array.from(groupsByEmployeeId.values()).sort(
    (a, b) => b.assignmentId - a.assignmentId,
  );
}

export function getAssignedEmployeeIds(
  assignmentGroups: AssignmentCardGroup[],
): Set<number> {
  return new Set(assignmentGroups.map((group) => group.employee_details_id));
}

export function filterUnassignedEmployees(
  employees: EmployeeDetails[],
  assignedEmployeeIds: Set<number>,
  searchTerm: string,
  departmentFilter: string,
  getEmployeeName: (employee: EmployeeDetails) => string,
): EmployeeDetails[] {
  const normalizedSearchTerm = searchTerm.trim().toUpperCase();

  return employees.filter((employee) => {
    if (assignedEmployeeIds.has(employee.id)) return false;

    const employeeName = getEmployeeName(employee);
    const matchesSearch =
      normalizedSearchTerm === "" ||
      employeeName.toUpperCase().includes(normalizedSearchTerm);
    const matchesDepartment =
      departmentFilter === "All" || employee.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });
}
