import { cliui } from '@poppinss/cliui'
import { getStaticContent } from './api.mjs'
import { Octokit } from '@octokit/rest'
import * as semver from 'semver'

const RELEASE_WEIGHT_MAP = {
  major: 2,
  minor: 1,
  patch: 0
}

const RELEASE_COLORS = {
  patch: 'green',
  minor: 'yellow',
  major: 'red'
}

export function printHome () {
  console.log(`
  #     +-+-+-+-+-+-+-+-+-+-+-+
  #  🚀 |g|i|t|s|t|r|o|n|a|u|t|
  #     +-+-+-+-+-+-+-+-+-+-+-+                                                                                                                     

  `)
}

export async function printRepo (argv, octo, repo, {
  branches = [],
  prs = [],
  tags = [],
  commitsUntilLatestTag = []
}) {
  const ui = cliui()

  const unprotectedBranches = branches.filter(b => !b.protected)
  const hasWarnings = !!unprotectedBranches.length || !!prs.length

  const sticker = ui.sticker()
    .add('📚')
    .add(hasWarnings ? ui.colors.bold().yellow(`${repo.full_name}`) : repo.full_name)

  if (argv.showUrls) {
    sticker.add(ui.colors.gray(repo.url))
  }

  sticker.render()

  printBranches(ui, argv, repo, { branches })
  printPrs(ui, argv, repo, { prs })
  await printTags(ui, argv, octo, repo, { tags, commitsUntilLatestTag })
  console.log('\n\n')
}

function printBranches (ui, argv, repo, { branches = [] }) {
  const unprotectedBranches = branches.filter(b => !b.protected)
  const protectedBranches = branches.filter(b => b.protected)
  const mainBranches = branches.filter(b => b.name === repo.default_branch && b.protected)

  console.log(ui.colors.bold('Branches'))

  if (unprotectedBranches.length) {
    ui.logger.warning(ui.colors.yellow(`🔺 there are ${ui.colors.bold(unprotectedBranches.length)} UNPROTECTED branches!`))
  }

  ui.logger.info(`there are ${ui.colors.bold(protectedBranches.length)} protected branches and ${mainBranches.length} main branch`)

  const table = ui.table()
    .head(['Branch name', 'Protected?', 'Status'])

  for (const branch of branches) {
    table.row([
    `${ui.colors.blue(branch.name)}${(argv.showUrls && ('\n' + ui.colors.gray(branch.commit.url))) || ''}`,
    branch.protected ? '✅' : '❌',
    branch.name === repo.default_branch ? ui.colors.green('OK') : ui.colors.yellow('PENDING')
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
        `${ui.colors.blue(pr.title)}(${(argv.showUrls && ('\n' + ui.colors.grey(pr.url))) || ''})`,
        ui.colors.yellow('OPEN')
      ])
    }

    table.render()
  }
}

async function printTags (ui, argv, octo, repo, {
  tags = [],
  commitsUntilLatestTag = []
}) {
  console.log(ui.colors.bold('Tags'))

  if (!tags.length) {
    ui.logger.info('there are no Tags')
    await printUnalignedRepo(ui, argv, repo, { tags })
    return
  }

  const latestTag = tags[0]
  const { name } = latestTag

  ui.logger.info('latest tag: ' + ui.colors.green(name))
  if (commitsUntilLatestTag.length) {
    ui.logger.info(ui.colors.yellow(`🔺 main branch is ahead of ${ui.colors.bold(commitsUntilLatestTag.length)} commits from ${ui.colors.bold().green(name)}!`))
    await printUnalignedRepo(ui, argv, repo, { tags })
  } else {
    ui.logger.info(ui.colors.green(`main branch is aligned with ${ui.colors.bold().green(name)} (latest tag)!`))
  }
}

async function printUnalignedRepo (ui, argv, repo, {
  tags = []
}) {
  const { token } = argv

  const octo = new Octokit({
    auth: token
  })
  let unreleasedEntries = []

  try {
    unreleasedEntries = await getStaticContent(argv, octo, {
      owner: repo.owner.login,
      repo: repo.name,
      path: 'unreleased'
    }, repo.default_branch)

    if (!unreleasedEntries.length) {
      throw new Error('unreleased/ is not a dir or is empty')
    }
  } catch (e) {
    ui.logger.debug(e)
    ui.logger.debug('unable to get any information about next release')
    return
  }

  const releaseLevels = []

  for (const entry of unreleasedEntries) {
    const { path, name } = entry
    if (!/(.*)\.md$/i.test(name)) {
      continue
    }

    const taskName = name.split('.')[0]
    const contentData = await getStaticContent(argv, octo, {
      owner: repo.owner.login,
      repo: repo.name,
      path
    }, repo.default_branch)

    if (contentData.type !== 'file') {
      continue
    }

    const { content, encoding, git_url: gitUrl } = contentData
    const decoded = Buffer.from(content, encoding).toString()
    const allHeaders = decoded.match(/#+ (\w+).*(?:\n|$)*/gi)
    const fixedHeaders = decoded.match(/#+ ((hot)?fix(ed)?).*(?:\n|$)*/gi)

    if (fixedHeaders && allHeaders.length === fixedHeaders.length) {
      // all changes are fixes
      releaseLevels.push({
        release: 'patch',
        task: taskName,
        gitUrl
      })
    } else if (decoded.match(/\[?breaking\]?/gi)) {
      releaseLevels.push({
        release: 'major',
        task: taskName,
        gitUrl
      })
    } else {
      releaseLevels.push({
        release: 'minor',
        task: taskName,
        gitUrl
      })
    }
  }

  const nextRelease = releaseLevels.reduce((prev, curr) =>
    !prev || RELEASE_WEIGHT_MAP[curr.release] > RELEASE_WEIGHT_MAP[prev.release]
      ? curr
      : prev, null
  )

  const nextTag = tags && tags.length
    ? semver.inc(tags[0].name.replace('v', ''), nextRelease.release)
    : semver.inc('0.0.0', nextRelease.release)

  ui.logger.info(
    `💡 Next release should probably be the ${nextRelease.release.toUpperCase()} version ${ui.colors[RELEASE_COLORS[nextRelease.release]](nextTag)}`
  )

  const table = ui.table()
    .head([
      'Pending tasks',
      'Required update'
    ])

  for (const level of releaseLevels) {
    const { release, task, gitUrl } = level
    table.row([
      `${task}${(argv.showUrls && ('\n' + ui.colors.gray(gitUrl))) || ''}`,
      ui.colors[RELEASE_COLORS[release]](release)
    ])
  }

  table.render()
}
