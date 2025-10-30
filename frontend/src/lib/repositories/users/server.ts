import { apiGetMe } from "@/lib/api/users";
import type { UserDetail } from "@/lib/db.types";

export interface UsersRepository {
  me: () => Promise<UserDetail>;
}

export function createServerUsersRepository(): UsersRepository {
  return {
    async me(): Promise<UserDetail> {
      return apiGetMe();
    },
  };
}


