import yargs from 'yargs/yargs';
import explore from './commands/explore/index.mjs';
import tags from './commands/tags/index.mjs';

yargs(process.argv.slice(2))
  .command(explore)
  .command(tags)
  .demandCommand()
  .help()
  .parse();