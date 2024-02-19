import { cliui } from '@poppinss/cliui'

export async function printRepo (argv, repo, {
  branches = [],
  prs = [],
  tags = [],
  commitsUntilLatestTag = []
}) {
  const ui = cliui()

  const unprotectedBranches = branches.filter(b => !b.protected)
  const hasWarnings = !!unprotectedBranches.length || !!prs.length

  ui.sticker()
    .add('📚')
    .add(hasWarnings ? ui.colors.bold().yellow(`${repo.full_name}`) : repo.full_name)
    .add(ui.colors.gray(repo.url))
    .render()

  printBranches(ui, argv, repo, { branches })
  printPrs(ui, argv, repo, { prs })
  await printTags(ui, argv, repo, { tags, commitsUntilLatestTag })
  console.log('\n\n')
}

function printBranches (ui, argv, repo, { branches = [] }) {
  const unprotectedBranches = branches.filter(b => !b.protected)
  const protectedBranches = branches.filter(b => b.protected)
  const mainBranches = branches.filter(b => /main|master/i.test(b.name) && b.protected)

  console.log(ui.colors.bold('Branches'))

  if (unprotectedBranches.length) {
    ui.logger.warning(ui.colors.yellow(`🔺 there are ${ui.colors.bold(unprotectedBranches.length)} UNPROTECTED branches!`))
  }

  ui.logger.info(`there are ${ui.colors.bold(protectedBranches.length)} protected branches and ${mainBranches.length} main branch`)

  const table = ui.table()
    .head(['Branch name', 'Protected?', 'Status'])

  for (const branch of branches) {
    table.row([
    `${ui.colors.blue(branch.name)}\n${ui.colors.gray(branch.commit.url)}`,
    branch.protected ? '✅' : '❌',
    /main|master/i.test(branch.name) ? ui.colors.green('OK') : ui.colors.yellow('PENDING')
    ])
  }

  table.render()
}

function printPrs (ui, argv, repo, { prs = [] }) {
  console.log(ui.colors.bold('Pull Requests'))

  if (!prs.length) {
    ui.logger.info('there are no Pull Requests open')
  } else {
    ui.logger.info(ui.colors.yellow(`🔺 there are ${ui.colors.bold(prs.length)} Pull Requests open!`))

    const table = ui.table()
      .head(['Number', 'PR name', 'Status'])

    for (const pr of prs) {
      table.row([
        `# ${pr.number}`,
        `${ui.colors.blue(pr.title)}\n(${ui.colors.grey(pr.url)})`,
        ui.colors.yellow('OPEN')
      ])
    }

    table.render()
  }
}

async function printTags (ui, argv, repo, {
  tags = [],
  commitsUntilLatestTag = []
}) {
  console.log(ui.colors.bold('Tags'))

  if (!tags.length) {
    ui.logger.info('there are no Tags')
    return
  }

  const latestTag = tags[0]
  const { name } = latestTag

  ui.logger.info('latest tag: ' + ui.colors.green(name))
  if (commitsUntilLatestTag.length) {
    ui.logger.info(ui.colors.yellow(`🔺 main branch is ahead of ${ui.colors.bold(commitsUntilLatestTag.length)} commits from ${ui.colors.bold().green(name)}!`))
    // await checkUnalignedRepo(argv, repo, latestTag, octo)
  } else {
    ui.logger.info(ui.colors.yellow(`main branch is aligned with ${ui.colors.bold().green(name)} (latest tag)!`))
  }
}
