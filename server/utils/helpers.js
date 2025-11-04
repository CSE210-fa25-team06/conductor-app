/*
  This file contains shared utility functions used across the backend.
  Examples include date formatting or data validation helpers.
*/

export function formatDate(date) {
  return new Date(date).toLocaleDateString();
}
