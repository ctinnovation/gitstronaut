import { cliui } from '@poppinss/cliui'
import { iterateRepos, listCommitsBetween, listTags } from '../api.mjs'
import { buildOcto } from '../octokit.mjs'
import { printHome } from '../print.mjs'

export default async function run (argv) {
  printHome()

  const ui = cliui()

  const octo = await buildOcto(argv)
  const spinner = ui.logger.await('Fetching repositories')
  spinner.start()

  const table = ui.table()
    .head([
      ui.colors.bold('Repository'),
      ui.colors.bold('Latest tag'),
      ui.colors.bold('Status')
    ])

  for await (const response of iterateRepos(argv, octo)) {
    for (const repo of response.data) {
      const tags = await listTags(argv, octo, {
        owner: repo.owner.login,
        repo: repo.name
      })

      if (!tags.length) {
        table.row([
          ui.colors.gray(repo.full_name),
          ui.colors.gray('NO TAGS'),
          ''
        ])
        continue
      }

      const latestTag = tags[0]

      const { name, commit } = latestTag
      const { sha, url: commitUrl } = commit

      const commitsBetween = await listCommitsBetween(argv, octo, {
        owner: repo.owner.login,
        repo: repo.name
      }, sha, repo.default_branch)

      table.row([
        repo.full_name + (argv.showUrls ? `\n${ui.colors.gray(commitUrl)}` : ''),
        commitsBetween.length ? ui.colors.yellow(name) : ui.colors.green(name),
        (commitsBetween.length ? `${ui.colors.yellow(`{tag > +${commitsBetween.length} > main}`)}` : ui.colors.green('{tag = main}'))
      ])
    }
  }

  spinner.stop()
  table.render()
}
