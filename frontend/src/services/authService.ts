import { api, setAuthToken } from "@/lib/apiClient";
import type { Role, Session, User } from "@/types";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface DemoAccount {
  username: string;
  role: Role;
  label: string;
  fullName: string;
  unit: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    username: "admin",
    role: "ADMIN",
    label: "Lead Administrator",
    fullName: "Inspector V. Sharma (Lead)",
    unit: "Sector WEST-9 HQ Directorate",
  },
  {
    username: "commander",
    role: "COMMANDER",
    label: "Sector Commander",
    fullName: "Sector Commander D. Kaur",
    unit: "BOP-04 Salt Flats Sector Command",
  },
  {
    username: "operator",
    role: "OPERATOR",
    label: "Surveillance Operator",
    fullName: "Sub-Inspector R. Verma",
    unit: "BOP-04 Tactical Control Room",
  },
  {
    username: "investigator",
    role: "INVESTIGATOR",
    label: "Forensic Investigator",
    fullName: "Special Agent S. Menon",
    unit: "Sector Intelligence & Forensic Cell",
  },
];

interface BackendTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    username: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
  };
}

interface BackendUserResponse {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

function normalizeUser(bUser: BackendUserResponse): User {
  const roleUpper = (bUser.role || "operator").toUpperCase() as Role;
  return {
    id: bUser.id,
    username: bUser.username,
    fullName: bUser.full_name || bUser.username,
    role: ["ADMIN", "COMMANDER", "OPERATOR", "INVESTIGATOR"].includes(roleUpper)
      ? roleUpper
      : "OPERATOR",
    unit: "Sector WEST-9 Defense Command",
    status: bUser.is_active ? "active" : "disabled",
    lastLogin: new Date().toISOString(),
  };
}

export const authService = {
  /** Authenticate against real FastAPI POST /api/v1/auth/login */
  login: async ({ username, password }: LoginCredentials): Promise<Session> => {
    const res = await api.post<BackendTokenResponse>("/auth/login", {
      username: username.trim(),
      password,
    });

    const user = normalizeUser(res.user);
    setAuthToken(res.access_token);

    const session: Session = {
      token: res.access_token,
      user,
      issuedAt: new Date().toISOString(),
    };

    return session;
  },

  /** Fetch active profile from real FastAPI GET /api/v1/auth/me */
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const bUser = await api.get<BackendUserResponse>("/auth/me");
      return normalizeUser(bUser);
    } catch {
      return null;
    }
  },

  getDemoAccounts: (): DemoAccount[] => {
    return DEMO_ACCOUNTS;
  },

  getDefaultRouteForRole: (role: Role): string => {
    switch (role) {
      case "ADMIN":
        return "/admin/users";
      case "COMMANDER":
        return "/dashboard";
      case "INVESTIGATOR":
        return "/investigation";
      case "OPERATOR":
      default:
        return "/dashboard";
    }
  },
};
