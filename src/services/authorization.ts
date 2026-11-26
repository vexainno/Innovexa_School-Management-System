import type { PermissionKey, Role } from '@/types';

/** UX-only permission map. A production backend must independently enforce every permission. */
const ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
  principal: ['gradebook.review', 'gradebook.approve', 'results.publish', 'student.register', 'guardian.verify', 'finance.approve_adjustment', 'discipline.manage', 'school.configure'],
  vice_principal: ['timetable.manage', 'attendance.record', 'discipline.manage'],
  dean: ['discipline.manage', 'attendance.record'],
  registrar: ['student.register', 'guardian.verify'],
  academic_officer: ['gradebook.review', 'results.process'],
  teacher: ['attendance.record'],
  counselor: ['counseling.manage'],
  finance: ['finance.manage'],
  librarian: ['library.manage'],
  super_admin: ['platform.manage_schools'],
  student: [],
  parent: [],
};

export function hasPermission(role: Role, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getRolePermissions(role: Role): readonly PermissionKey[] {
  return ROLE_PERMISSIONS[role];
}
