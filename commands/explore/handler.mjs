import { iterateRepos, listBranches, listCommitsBetween, listPRs, listTags } from '../api.mjs'
import { buildOcto } from '../octokit.mjs'
import { printHome, printRepo } from '../print.mjs'
import { cliui } from '@poppinss/cliui'

export default async function run (argv) {
  printHome()

  const octo = await buildOcto(argv)
  const ui = cliui()
  const spinner = ui.logger.await(`Fetching ${argv.organization || 'your'} repos`).start()

  spinner.stop()

  for await (const response of iterateRepos(argv, octo)) {
    for (const repo of response.data) {
      const filterRegex = new RegExp(argv.filter)
      if (argv.filter && !(filterRegex.test(repo.name))) {
        continue
      }

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
        const { commit } = latestTag
        commitsUntilLatestTag = await listCommitsBetween(argv, octo, {
          owner: repo.owner.login,
          repo: repo.name
        }, commit.sha, repo.default_branch)
      }

      await printRepo(argv, octo, repo, {
        branches,
        prs,
        tags,
        commitsUntilLatestTag
      })
    }
  }
}
