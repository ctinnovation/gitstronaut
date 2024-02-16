export async function listRepos(argv, octo) {
  const { organization, prefix } = argv;
  let repos = [];

  if (organization) {
    const response = await octo.rest.repos.listForOrg({
      org: organization
    })
    repos = response.data;
  } else {
    const response = await octo.rest.repos.listForAuthenticatedUser();
    repos = response.data;
  }

  return repos.filter(r => r.full_name.startsWith(prefix));
}

export async function listTags(argv, octo, params) {
  const response = await octo.rest.repos.listTags(params);
  return response.data;
}

export async function listCommits(argv, octo, params) {
  const response = await octo.rest.repos.listCommits(params);
  return response.data;
}

export async function listBranches(argv, octo, params) {
  const response = await octo.rest.repos.listBranches(params);
  return response.data;
}

export async function listPRs(argv, octo, params) {
  const response = await octo.rest.pulls.list(params);
  return response.data;
}

export async function listCommitsBetween(argv, octo, params, tagSha, branch = 'main') {
  const response = await octo.rest.repos.listCommits({
    ...params,
    sha: branch,
    per_page: 100
  })
  const commits = response.data;
  const result = [];

  for (let i = 0; i < commits.length; i++) {
    const { sha } = commits[i];
    if (sha === tagSha) {
      return result;
    }

    result.push(commits[i])
  }

  return result;
}