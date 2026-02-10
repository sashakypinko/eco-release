export const ENVIRONMENT_OPTIONS = [
  "local",
  "dev",
  "test",
  "stage",
  "prod",
  "dev-train",
  "stg-train",
] as const;

export const STATUS_OPTIONS = [
  "Created",
  "Release In Progress",
  "PO Review provided",
  "Released to Dev",
  "Approved to Release to Production",
  "Released to Production",
] as const;

export const SMOKE_TEST_OPTIONS = ["pass", "fail"] as const;

export const statusVariant: Record<string, string> = {
  Created: "bg-muted text-muted-foreground",
  "Release In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  "PO Review provided": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Released to Dev": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Approved to Release to Production": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "Released to Production": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

export const environmentVariant: Record<string, string> = {
  local: "bg-muted text-muted-foreground",
  dev: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  test: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  stage: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  prod: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  "dev-train": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  "stg-train": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
};
