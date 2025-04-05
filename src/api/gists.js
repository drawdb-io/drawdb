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

export async function getCommits(gistId, perPage = 20, page = 1) {
  const res = await octokit.request(
    `GET /gists/${gistId}/commits?per_page=${perPage}&page=${page}`,
    {
      gist_id: gistId,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  return res.data;
}
