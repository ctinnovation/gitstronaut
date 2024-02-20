export function iterateRepos (argv, octo) {
  const { organization } = argv

  if (organization) {
    return octo.paginate.iterator(
      octo.rest.repos.listForOrg,
      { org: organization }
    )
  } else {
    return octo.paginate.iterator(
      octo.rest.repos.listForAuthenticatedUser,
      { org: organization }
    )
  }
}

export async function listTags (argv, octo, params) {
  return await octo.paginate(
    octo.rest.repos.listTags,
    params
  )
}

export async function listCommits (argv, octo, params) {
  return await octo.paginate(
    octo.rest.repos.listCommits,
    params
  )
}

export async function listBranches (argv, octo, params) {
  return await octo.paginate(
    octo.rest.repos.listBranches,
    params
  )
}

export async function listPRs (argv, octo, params) {
  return await octo.paginate(
    octo.rest.pulls.list,
    params
  )
}

export async function listCommitsBetween (argv, octo, params, tagSha, branch) {
  const response = await octo.rest.repos.listCommits({
    ...params,
    sha: branch,
    per_page: 30
  })
  const commits = response.data
  const result = []

  for (let i = 0; i < commits.length; i++) {
    const { sha } = commits[i]
    if (sha === tagSha) {
      return result
    }

    result.push(commits[i])
  }

  result.exceeding = true
  return result
}

export async function getStaticContent (argv, octo, params, branch) {
  const response = await octo.rest.repos.getContent({
    ...params,
    ref: branch
  })

  return response.data
}
