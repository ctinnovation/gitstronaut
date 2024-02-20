import { Octokit } from '@octokit/rest'
import open from 'open'
import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device'
import { cliui } from '@poppinss/cliui'
import clipboard from 'clipboardy'

const CLIENT_ID = '8f5a81cdc1a8addf100b'
class Deferred {
  constructor () {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
}

export async function buildOcto (argv) {
  const { token } = argv

  if (token) {
    return new Octokit({
      auth: token
    })
  }

  return await buildOauthOctokit(argv)
}

async function buildOauthOctokit (argv) {
  const ui = cliui()
  const defer = new Deferred()
  let timeout = null
  let spinner = null

  const octokit = new Octokit({
    authStrategy: createOAuthDeviceAuth,
    auth: {
      clientType: 'oauth-app',
      clientId: CLIENT_ID,
      scopes: ['repo'],
      onVerification (verification) {
        const {
          expires_in: expiresInS,
          verification_uri: verificationUri,
          user_code: userCode
        } = verification

        timeout = setTimeout(
          () => {
            ui.logger.error('❌ Authorization timed out!')
            defer.reject(new Error('Authentication timed out!'))
          },
          expiresInS * 1000
        )

        open(verificationUri)
        ui.sticker()
          .add('🔐 Authorize this device on GitHub')
          .add(ui.colors.bold(verificationUri))
          .add('❯ Insert code: 🔑 ' + ui.colors.bold(userCode))
          .render()
        clipboard.writeSync(userCode)
        spinner = ui.logger.await('Waiting for you to authorize')
        spinner.start()
      }
    }
  })

  await Promise.race([
    octokit.auth({
      type: 'oauth'
    }),
    defer.promise
  ])

  clearTimeout(timeout)
  spinner?.stop()
  ui.logger.success('✅ CLI authorized!')
  return octokit
}
