import { format } from "date-fns";

export function formatDate(dateString: string | null | undefined, pattern = "MMM d, yyyy"): string {
  if (!dateString) return "";
  return format(new Date(dateString), pattern);
}

export function formatDateTime(dateString: string | null | undefined): string {
  return formatDate(dateString, "MMM d, yyyy h:mm a");
}

export function toDateInputValue(dateString: string | null | undefined): string {
  if (!dateString) return "";
  return dateString.split("T")[0];
}

export function toDateTimeInputValue(dateString: string | null | undefined): string {
  if (!dateString) return "";
  return new Date(dateString).toISOString().slice(0, 16);
}
