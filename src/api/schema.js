import axios from "axios";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export async function fetchPostgresSchema(params) {
  const res = await axios.post(`${baseUrl}/api/schema/postgres`, params);
  return res.data;
}
