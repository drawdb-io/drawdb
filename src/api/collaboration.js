import axios from "axios";

// Using jsonblob.com as a simple JSON store for the MVP.
// This allows testing the collaboration feature without setting up a backend.
// In a real deployment, replace API_URL with your own backend service (e.g., Supabase, Firebase functions).
const API_URL = "https://jsonblob.com/api/jsonBlob";

/**
 * Creates a new session with the initial diagram data.
 * @param {Object} data - The diagram JSON object.
 * @returns {Promise<string>} - The session ID.
 */
export async function createSession(data) {
    const response = await axios.post(API_URL, data);
    // JsonBlob returns the Location header with the full URL to the blob
    // e.g. https://jsonblob.com/api/jsonBlob/11bea...
    const location = response.headers["location"] || response.headers["Location"];
    if (!location) {
        throw new Error("Failed to retrieve session ID from server.");
    }
    const id = location.split("/").pop();
    return id;
}

/**
 * Retrieves the diagram data for a given session ID.
 * @param {string} id - The session ID.
 * @returns {Promise<Object>} - The diagram JSON object.
 */
export async function getSession(id) {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
}

/**
 * Updates an existing session with new diagram data.
 * @param {string} id - The session ID.
 * @param {Object} data - The diagram JSON object.
 * @returns {Promise<void>}
 */
export async function updateSession(id, data) {
    await axios.put(`${API_URL}/${id}`, data);
}
