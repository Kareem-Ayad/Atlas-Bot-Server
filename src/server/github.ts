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
    const data = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
      visibility: "all",
      affiliation: "owner,collaborator,organization_member",
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

export async function fetchRepoContext(owner: string, repo: string, branch: string) {
  const octokit = getOctokit();
  let readme = "";
  let packageJson = "";
  let tree = "";

  try {
    const { data: readmeData } = await octokit.rest.repos.getReadme({ owner, repo, ref: branch });
    if ("content" in readmeData) readme = Buffer.from(readmeData.content, "base64").toString();
  } catch {}

  try {
    const { data: pkgData } = await octokit.rest.repos.getContent({ owner, repo, path: "package.json", ref: branch });
    if (!Array.isArray(pkgData) && pkgData.type === 'file' && "content" in pkgData) {
      packageJson = Buffer.from(pkgData.content, "base64").toString();
    }
  } catch {}

  try {
    const { data: branchData } = await octokit.rest.repos.getBranch({ owner, repo, branch });
    const { data: treeData } = await octokit.rest.git.getTree({ owner, repo, tree_sha: branchData.commit.sha, recursive: "true" });
    tree = treeData.tree.filter((t: any) => t.type === 'blob').map((t: any) => t.path).slice(0, 1000).join("\n");
  } catch {}

  return `
Repository: ${owner}/${repo}

README:
${readme.slice(0, 5000)}

package.json:
${packageJson.slice(0, 5000)}

Directory tree:
${tree}
`;
}
