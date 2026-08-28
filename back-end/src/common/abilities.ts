export type Role = 'citizen' | 'specialist' | 'organization' | 'admin';

export type Ability =
  | 'problemas:create'
  | 'problemas:moderate'
  | 'peticoes:create'
  | 'peticoes:moderate'
  | 'apoios:give'
  | 'mutiroes:create'
  | 'mutiroes:manage'
  | 'eventos:create'
  | 'usuarios:read'
  | 'usuarios:manage';

const matrix: Record<Role, Ability[]> = {
  citizen: ['problemas:create', 'peticoes:create', 'apoios:give', 'mutiroes:create', 'eventos:create', 'usuarios:read'],
  specialist: [
    'problemas:create', 'problemas:moderate', 'peticoes:create', 'peticoes:moderate',
    'apoios:give', 'mutiroes:create', 'eventos:create', 'usuarios:read',
  ],
  organization: [
    'problemas:create', 'peticoes:create', 'apoios:give',
    'mutiroes:create', 'mutiroes:manage', 'eventos:create', 'usuarios:read',
  ],
  admin: [
    'problemas:create', 'problemas:moderate', 'peticoes:create', 'peticoes:moderate',
    'apoios:give', 'mutiroes:create', 'mutiroes:manage', 'eventos:create',
    'usuarios:read', 'usuarios:manage',
  ],
};

export function can(role: Role, ability: Ability): boolean {
  return matrix[role]?.includes(ability) ?? false;
}
