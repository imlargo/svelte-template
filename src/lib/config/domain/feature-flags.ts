// FEATURE FLAGS — "¿Está habilitada esta feature?"
// Controla si una funcionalidad existe o no, independientemente del rol del usuario.
// Puede depender del entorno (dev/prod), de un plan de suscripción, o de un rollout gradual.
// Diferencia clave con permissions: los flags son sobre features, no sobre acciones de usuario.
//
// Example:
//   export const FEATURE_FLAGS = {
//     aiAssistant:   false,              // deshabilitado globalmente
//     betaDashboard: import.meta.env.DEV, // solo en desarrollo
//   } as const
export const FEATURE_FLAGS = {} as const
