import { Octokit } from "octokit";
import { getOctokit } from "./github";

export async function commitFile({
  owner,
  repo,
  branch,
  path,
  content,
  message,
}: {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  content: string;
  message: string;
}) {
  const octokit = getOctokit();

  let sha: string | undefined;

  try {
    const existing = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    if (!Array.isArray(existing.data) && existing.data.type === 'file' && "sha" in existing.data) {
      sha = existing.data.sha;
    }
  } catch {}

  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    branch,
    path,
    message,
    content: Buffer.from(content).toString("base64"),
    sha,
  });
}
