export interface UserDTO {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roleId: number;
}

export interface Permission {
  id: number;
  name: string;
  description: string | null;
  domain: string;
}

export interface AuthContext {
  userId: string;
  user: UserDTO | null;
  permissions: string[];
  isAuthenticated: boolean;
  token?: string;
}

export interface RemoteAppProps {
  auth: AuthContext | null;
  navigate: (path: string) => void;
  apiBaseUrl: string;
}

export interface RemoteApp {
  mount: (container: HTMLElement, props: RemoteAppProps) => void;
  unmount: (container: HTMLElement) => void;
}
