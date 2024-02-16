import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import ora from 'ora';
import { listCommitsBetween, listBranches, listCommits, listPRs, listRepos, listTags } from '../helpers.mjs';
import { sortBy } from 'lodash-es';

export default async function run(argv) {
  const { token, organization } = argv;

  const octo = new Octokit({
    auth: token
  });

  const spinner = ora(`Fetching ${organization || 'your'} repos...`).start();
  const repos = await listRepos(argv, octo);

  spinner.succeed(`Fetched ${repos.length} repositories.`);

  const longestNameLength = sortBy(repos, r => r.full_name.length).slice(-1)[0].full_name.length + 5;
  for (const repo of repos) {
    const tags = await listTags(argv, octo, {
      owner: repo.owner.login,
      repo: repo.name
    })

    if (!tags.length) {
      console.log(
        `📚 ${repo.full_name}`.padEnd(longestNameLength, ' ') + '| no tags'
      );
      continue;
    }

    const latestTag = tags[0];

    const { name, commit } = latestTag;
    const { sha, url: commitUrl } = commit;


    const commitsBetween = await listCommitsBetween(argv, octo, {
      owner: repo.owner.login,
      repo: repo.name,
    }, sha)

    console.log(chalk.white(
      `📚 ${repo.full_name}`.padEnd(longestNameLength, ' ')
      + '| ' + chalk.bold.green(name)
      + (commitsBetween.length ? ` {tag > ${chalk.red('+' + commitsBetween.length)} > main}` : ` {tag ${chalk.blue('=')} main}`)
      + (argv.showUrls ? chalk.italic(` (${commitUrl})`) : ''))
    );
  }
}
