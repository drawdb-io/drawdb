import axios from "axios";

export const SHARE_FILENAME = "share.json";
export const VERSION_FILENAME = "versionned.json";

const description = "drawDB diagram";
const baseUrl = import.meta.env.VITE_BACKEND_URL;

export async function create(filename, content) {
  const res = await axios.post(`${baseUrl}/gists`, {
    public: false,
    filename,
    description,
    content,
  });

  return res.data.data.id;
}

export async function patch(gistId, filename, content) {
  const { data } = await axios.patch(`${baseUrl}/gists/${gistId}`, {
    filename,
    content,
  });

  return data.deleted;
}

export async function del(gistId) {
  await axios.delete(`${baseUrl}/gists/${gistId}`);
}

export async function get(gistId) {
  const res = await axios.get(`${baseUrl}/gists/${gistId}`);

  return res.data;
}

export async function getCommits(gistId, perPage = 20, page = 1) {
  const res = await axios.get(`${baseUrl}/gists/${gistId}/commits`, {
    params: {
      per_page: perPage,
      page,
    },
  });

  return res.data;
}

export async function getVersion(gistId, sha) {
  const res = await axios.get(`${baseUrl}/gists/${gistId}/${sha}`);

  return res.data;
}

export async function getCommitsWithFile(
  gistId,
  file,
  limit = 10,
  cursor = null,
) {
  const res = await axios.get(
    `${baseUrl}/gists/${gistId}/file-versions/${file}`,
    {
      params: {
        limit,
        cursor,
      },
    },
  );

  return res.data;
}
