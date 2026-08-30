import type { User } from '@store/authSlice';

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  role: 'citizen' | 'specialist' | 'organization';
  vote_weight: number;
};

export function mapUser(u: ApiUser): User {
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    role: u.role,
    vote_weight: u.vote_weight,
  };
}
