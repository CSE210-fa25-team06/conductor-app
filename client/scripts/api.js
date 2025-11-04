/*
  This file contains all API call functions for communicating with the Express backend.
  Each function fetches or sends data to the server’s /api routes.
*/

// JavaScript for API calls to the Express backend
export async function fetchData(endpoint) {
  const res = await fetch(`/api/${endpoint}`);
  return await res.json();
}
