import axios from "axios";

const filename = "share.json";
const description = "drawDB diagram";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export async function create(content) {
  const res = await axios.post(`${baseUrl}/gists`, {
    public: false,
    filename,
    description,
    content,
  });

  return res.data.data.id;
}

export async function patch(gistId, content) {
  await axios.patch(`${baseUrl}/gists/${gistId}`, {
    filename,
    content,
  });
}

export async function del(gistId) {
  await axios.delete(`${baseUrl}/gists/${gistId}`);
}

export async function get(gistId) {
  const res = await axios.get(`${baseUrl}/gists/${gistId}`);

  return res.data;
}
