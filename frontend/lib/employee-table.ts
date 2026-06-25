import { EmployeeDetails, EmployeeSortConfig } from "@/types/employee";

export function getEmployeeFullName(employee: EmployeeDetails): string {
  return [employee.first_name, employee.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function filterEmployeeItems(
  employees: EmployeeDetails[],
  searchTerm: string,
  departmentFilter: string,
  statusFilter: string,
): EmployeeDetails[] {
  const normalizedSearchTerm = searchTerm.trim().toUpperCase();

  return employees.filter((employee) => {
    const fullName = getEmployeeFullName(employee);
    const searchableValues = [
      employee.employee_digit_code,
      employee.first_name,
      employee.last_name,
      fullName,
      employee.contact_number,
      employee.position,
      employee.department,
      employee.status,
    ];

    const matchesSearch =
      normalizedSearchTerm === "" ||
      searchableValues.some((value) =>
        value?.toUpperCase().includes(normalizedSearchTerm),
      );

    const matchesDepartment =
      departmentFilter === "All" || employee.department === departmentFilter;
    const matchesStatus =
      statusFilter === "All" || employee.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });
}

export function sortEmployeeItems(
  employees: EmployeeDetails[],
  sortConfig: EmployeeSortConfig,
): EmployeeDetails[] {
  if (!sortConfig.key || !sortConfig.direction) return employees;

  return [...employees].sort((a, b) => {
    const aValue =
      sortConfig.key === "full_name"
        ? getEmployeeFullName(a)
        : (a[sortConfig.key!] ?? "");
    const bValue =
      sortConfig.key === "full_name"
        ? getEmployeeFullName(b)
        : (b[sortConfig.key!] ?? "");

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });
}

export function getNextEmployeeSortConfig(
  currentConfig: EmployeeSortConfig,
  key: EmployeeSortConfig["key"],
): EmployeeSortConfig {
  if (currentConfig.key === key && currentConfig.direction === "asc") {
    return { key, direction: "desc" };
  }

  if (currentConfig.key === key && currentConfig.direction === "desc") {
    return { key: null, direction: null };
  }

  return { key, direction: "asc" };
}

export function paginateEmployeeItems(
  employees: EmployeeDetails[],
  currentPage: number,
  itemsPerPage: number,
): EmployeeDetails[] {
  return employees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
}
