import { Octokit } from '@octokit/rest'
import { listBranches, listCommitsBetween, listPRs, listRepos, listTags } from '../helpers.mjs'
import { printRepo } from '../print.mjs'
import { cliui } from '@poppinss/cliui'

export default async function run (argv) {
  const { token, organization } = argv

  const octo = new Octokit({
    auth: token
  })

  const ui = cliui()
  const spinner = ui.logger.await(`Fetching ${organization || 'your'} repos`).start()
  const repos = await listRepos(argv, octo)

  spinner.stop()
  ui.logger.info(`✅ Fetched ${repos.length} repositories!`)

  for (const repo of repos) {
    const branches = await listBranches(argv, octo, {
      owner: repo.owner.login,
      repo: repo.name
    })

    const prs = await listPRs(argv, octo, {
      owner: repo.owner.login,
      repo: repo.name,
      state: 'open'
    })

    const tags = await listTags(argv, octo, {
      owner: repo.owner.login,
      repo: repo.name
    })

    let commitsUntilLatestTag = []

    if (tags.length) {
      const latestTag = tags[0]
      const { name, commit } = latestTag
      commitsUntilLatestTag = await listCommitsBetween(argv, octo, {
        owner: repo.owner.login,
        repo: repo.name
      }, commit.sha)
    }

    await printRepo(argv, repo, {
      branches,
      prs,
      tags,
      commitsUntilLatestTag
    })
  }
}
