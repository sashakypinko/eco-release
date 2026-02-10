import App from "./App";
import "./index.css";

const mockAuth = {
  userId: "1",
  user: {
    id: 1,
    email: "dev@ecohost.com",
    firstName: "Dev",
    lastName: "User",
    isActive: true,
    roleId: 1,
  },
  token: "dev-token",
  isAuthenticated: true,
  permissions: [
    "release:view",
    "release:create",
    "release:edit",
    "release:delete",
    "template:view",
    "template:create",
    "template:edit",
    "template:delete",
    "history:view",
    "history:create",
    "history:edit",
    "history:delete",
  ],
};

const mockProps = {
  auth: mockAuth,
  navigate: (path: string) => console.log("Navigate to:", path),
  apiBaseUrl: "/api",
};

const container = document.getElementById("root")!;

function init() {
  container.innerHTML = "";
  const appContainer = document.createElement("div");
  appContainer.id = "app-container";
  container.appendChild(appContainer);

  App.mount(appContainer, mockProps);
}

init();
