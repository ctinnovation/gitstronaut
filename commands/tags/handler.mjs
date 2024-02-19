import { Octokit } from '@octokit/rest'
import { cliui } from '@poppinss/cliui'
import { listCommitsBetween, listRepos, listTags } from '../helpers.mjs'

export default async function run (argv) {
  const ui = cliui()
  const { token } = argv

  const octo = new Octokit({
    auth: token
  })

  const spinner = ui.logger.await('Fetching repositories')
  spinner.start()

  const repos = await listRepos(argv, octo)
  spinner.update(`✅ Fetched ${repos.length} repositories! Fetching tags`)

  const table = ui.table()
    .head([
      ui.colors.bold('Repository'),
      ui.colors.bold('Latest tag'),
      ui.colors.bold('Status')
    ])

  for (const repo of repos) {
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
    }, sha)

    table.row([
      repo.full_name + (argv.showUrls ? `\n${ui.colors.gray(commitUrl)}` : ''),
      commitsBetween.length ? ui.colors.yellow(name) : ui.colors.green(name),
      (commitsBetween.length ? `${ui.colors.yellow(`{tag > +${commitsBetween.length} > main}`)}` : ui.colors.green('{tag = main}'))
    ])
  }

  spinner.stop()
  table.render()
}
