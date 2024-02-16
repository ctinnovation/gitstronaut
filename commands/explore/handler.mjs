import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import ora from 'ora';
import { listBranches, listCommits, listCommitsBetween, listPRs, listRepos, listTags } from '../helpers.mjs';

async function checkUnalignedRepo(argv, repo, latestTag, octo) { }


export default async function run(argv) {
  const { token, organization } = argv;

  const octo = new Octokit({
    auth: token
  });

  const spinner = ora(`Fetching ${organization || 'your'} repos...`).start();
  const repos = await listRepos(argv, octo);

  spinner.succeed(`Fetched ${repos.length} repositories.`);

  for (const repo of repos) {
    console.log(chalk.bold.bgCyan.black(`\n📚 repo: ${repo.full_name} (${repo.url}) 📚`))

    const branches = await listBranches(argv, octo, {
      owner: repo.owner.login,
      repo: repo.name,
    })

    const unprotectedBranches = branches.filter(b => !b.protected);
    const mainBranches = branches.filter(b => /main|master/i.test(b.name));
    const protectedBranches = branches.filter(b => b.protected);

    if (unprotectedBranches.length) {
      console.log(chalk.bgRed(`\nbranches: 🚨 there are ${chalk.bold(unprotectedBranches.length)} UNPROTECTED branches!`));
      for (const branch of unprotectedBranches) {
        console.log(`- ${chalk.blue(branch.name)} (${branch.commit.url})`)
      }
    }

    console.log(chalk.italic(`\nbranches: ℹ️  there are ${chalk.bold(protectedBranches.length)} protected branches and ${mainBranches.length} main branch!`));

    const prs = await listPRs(argv, octo, {
      owner: repo.owner.login,
      repo: repo.name,
      state: 'open'
    })

    if (!prs.length) {
      console.log(chalk.italic(`\nprs: ℹ️  there are no Pull Requests open`));
    } else {
      console.log(chalk.bgRed(`\nprs: 🚨 there are ${chalk.bold(prs.length + ' Pull Requests')}  open!`));

      for (const pr of prs) {
        console.log(`- ${chalk.bold('#' + pr.number)} ${pr.title} (${pr.url})`)
      }
    }


    const tags = await listTags(argv, octo, {
      owner: repo.owner.login,
      repo: repo.name
    })

    if (!tags.length) {
      console.log(chalk.italic(`\ntags: ℹ️  there are no tags`));
      continue;
    }

    const latestTag = tags[0];

    const { name, commit } = latestTag;
    const { sha, url: commitUrl } = commit;

    console.log(chalk.italic('\ntags: latest is ') + chalk.bold.green(name) + ` on commit ${sha}` + chalk.italic(`(${commitUrl})`))

    const commitsBetween = await listCommitsBetween(argv, octo, {
      owner: repo.owner.login,
      repo: repo.name,
    }, sha)

    if (commitsBetween.length) {
      console.log(chalk.bgRedBright(`tags: 🚨 main branch is ahead of ${chalk.bold(commitsBetween.length)} commits from ${chalk.bold.green(name)}!`));
      await checkUnalignedRepo(argv, repo, latestTag, octo);
    } else {
      console.log(chalk.italic(`\ntags: ℹ️ main branch is aligned with latest tag!`))
    }
  }
}
