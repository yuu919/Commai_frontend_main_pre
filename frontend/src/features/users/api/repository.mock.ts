import type { UserDetail } from "@/lib/db.types";

export interface UsersRepository {
  me: () => Promise<UserDetail>;
}

export function createMockUsersRepository(): UsersRepository {
  return {
    async me(): Promise<UserDetail> {
      return { id: 1, username: "demo", email: "demo@example.com", profile: { display_name: "デモユーザー" } } as UserDetail;
    },
  };
}


