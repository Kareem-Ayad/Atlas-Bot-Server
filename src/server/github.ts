import { Octokit } from "octokit";

export function getOctokit() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN not set in environment variables");
  }
  return new Octokit({ auth: token });
}

export async function fetchRepositoryFiles(owner: string, repo: string, path: string = "", ref?: string) {
  const octokit = getOctokit();
  try {
    const params: any = { owner, repo, path };
    if (ref) params.ref = ref;
    
    const { data } = await octokit.rest.repos.getContent(params);
    return data;
  } catch (error) {
    console.error("Error fetching repository:", error);
    throw error;
  }
}

export async function fetchUserRepositories() {
  const octokit = getOctokit();
  try {
    // Fetch repositories the authenticated user has access to
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
    });
    return data;
  } catch (error) {
    if (error instanceof Error && error.message.includes('GITHUB_TOKEN not set')) {
        return []; // Return empty if not set, handled gracefully in UI
    }
    console.error("Error fetching user repositories:", error);
    throw error;
  }
}

export async function fetchRepositoryBranches(owner: string, repo: string) {
  const octokit = getOctokit();
  try {
    const { data } = await octokit.rest.repos.listBranches({
      owner,
      repo,
      per_page: 100,
    });
    return data;
  } catch (error) {
    console.error(`Error fetching branches for ${owner}/${repo}:`, error);
    throw error;
  }
}

export async function fetchRepositoryMetadata(owner: string, repo: string) {
  const octokit = getOctokit();
  try {
    const { data } = await octokit.rest.repos.get({
      owner,
      repo,
    });
    return data;
  } catch (error) {
    console.error(`Error fetching metadata for ${owner}/${repo}:`, error);
    throw error;
  }
}

export async function validateBranch(owner: string, repo: string, branch: string) {
  const octokit = getOctokit();
  try {
    const { data } = await octokit.rest.repos.getBranch({
      owner,
      repo,
      branch,
    });
    return !!data;
  } catch (error) {
    return false;
  }
}
