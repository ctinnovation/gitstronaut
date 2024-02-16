import run from './handler.mjs';

const command = ['explore'];
const describe = 'Explore repositories with gitstronaut';
const builder = function (yargs) {
  return yargs
    .string('token')
    .alias('t', 'token')
    .describe('token', 'Token for access to GitHub')
    .string('organization')
    .alias('o', 'organization')
    .describe('organization', 'Explore repositories whitin orgaizationb')
    .string('prefix')
    .default('prefix', '')
    .alias('p', 'prefix')
    .describe('prefix', 'Explore repositories with this prefix')
    .demandOption('token');
}
const handler = run;

export default {
  command,
  describe,
  builder,
  handler
};