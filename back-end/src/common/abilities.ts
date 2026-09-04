export type Role = 'citizen' | 'specialist' | 'admin';

export type Ability = 'problemas:moderate';

const matrix: Record<Role, Ability[]> = {
  citizen: [],
  specialist: [],
  admin: ['problemas:moderate'],
};

export function can(role: Role, ability: Ability): boolean {
  return matrix[role]?.includes(ability) ?? false;
}

export function ehAdmin(role: string): boolean {
  return role === 'admin';
}
