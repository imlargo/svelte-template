// PERMISSIONS — "¿Puede este rol ejecutar esta acción?"
// Controla quién tiene acceso a qué dentro de la app.
// Es por rol de usuario y se evalúa en cada request.
//
// Example:
//   export const PERMISSION_GROUPS = {
//     ManageUsers: ['admin'],
//     ViewReports:  ['admin', 'manager'],
//   } as const
export const PERMISSION_GROUPS = {} as const

export type PermissionGroup = keyof typeof PERMISSION_GROUPS
