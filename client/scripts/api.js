/*
  This file contains all API call functions for communicating with the Express backend.
  Each function fetches or sends data to the server’s /api routes.
*/

// JavaScript for API calls to the Express backend
export async function fetchData(endpoint) {
  const res = await fetch(`/api/${endpoint}`);

  if (!res.ok) {
    let error;
    if (res.status === 403) {
      error = new Error('Permission Denied');
    } else if (res.status === 404) {
      error = new Error('Not Found');
    } else {
      error = new Error('API Request failed');
    }
    error.status = res.status;
    throw error;
  }

  return await res.json();
}