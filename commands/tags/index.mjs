import run from './handler.mjs'

const command = ['tags']
const describe = 'Get all the latest tags for repos with gitstronaut'
const builder = function (yargs) {
  return yargs
    .string('token')
    .alias('t', 'token')
    .describe('token', 'Token for access to GitHub')
    .string('organization')
    .alias('o', 'organization')
    .describe('organization', 'Explore repositories whitin orgaizationb')
    .string('filter')
    .default('filter', '')
    .alias('f', 'filter')
    .describe('filter', 'Explore repositories with this filter (RegExp accepted)')
    .boolean('showUrls')
    .describe('showUrls', 'Show URL of referred data')
    .default('showUrls', false)
}
const handler = run

export default {
  command,
  describe,
  builder,
  handler
}
