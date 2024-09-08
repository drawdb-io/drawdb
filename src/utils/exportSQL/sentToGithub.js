import axios from 'axios';

const TOKEN = 'YOUR_GITHUB_TOKEN';
const REPO_OWNER = 'GITHUB_USERNAME';
const REPO_NAME = 'GITHUB_REPOSITORY';
const FILE_PATH = 'database.sql';

export async function pushToGitHub(content) {

    const headers = {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
    };

    try {
        // Step 1: Create a Blob
        let response = await axios.post(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/blobs`, {
            content: content,
            encoding: 'utf-8'
        }, {headers});
        const blobSha = response.data.sha;

        // Step 2: Get the latest commit SHA
        response = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/master`, {headers});
        const latestCommitSha = response.data.object.sha;

        // Step 3: Create a Tree
        response = await axios.post(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`, {
            base_tree: latestCommitSha,
            tree: [
                {
                    path: FILE_PATH,
                    mode: '100644',
                    type: 'blob',
                    sha: blobSha,
                }
            ]
        }, {headers});
        const treeSha = response.data.sha;

        // Step 4: Create a Commit
        const currentTime = new Date().toISOString();
        response = await axios.post(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/commits`, {
            message: 'new DB updated at' + currentTime,
            tree: treeSha,
            parents: [latestCommitSha]
        }, {headers});
        const commitSha = response.data.sha;

        // Step 5: Update the reference
        await axios.patch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/master`, {
            sha: commitSha,
            force: true,
        }, {headers});

        alert('Commit created successfully. ✅');
    } catch (error) {
        alert('Error creating commit. ❌');
    }

}
