import axios from "axios";

const filename = "share.json";
const description = "drawDB diagram";

export async function create(content) {
  const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/gists`, {
    public: false,
    filename,
    description,
    content,
  });

  return res.data.id;
}

export async function patch(gistId, content) {
  await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/gists/${gistId}`, {
    filename,
    content,
  });
}

export async function del(gistId) {
  await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/gists/${gistId}`);
}

export async function get(gistId) {
  const res = await axios.get(
    `${import.meta.env.VITE_BACKEND_URL}/gists/${gistId}`,
  );

  return res.data;
}
