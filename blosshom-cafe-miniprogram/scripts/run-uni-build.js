const path = require('path')
const { spawnSync } = require('child_process')

const projectRoot = path.resolve(__dirname, '..')
const watch = process.argv.includes('--watch')
const cli = path.join(projectRoot, 'node_modules', '@vue', 'cli-service', 'bin', 'vue-cli-service.js')
const aliases = path.join(projectRoot, 'scripts', 'register-build-aliases.js')
const inheritedNodeOptions = String(process.env.NODE_OPTIONS || '').trim()
const nodeOptions = `${inheritedNodeOptions} --require=${aliases}`.trim()

const result = spawnSync(process.execPath, [cli, 'uni-build', ...(watch ? ['--watch'] : [])], {
  cwd: projectRoot,
  env: {
    ...process.env,
    NODE_OPTIONS: nodeOptions,
    NODE_ENV: watch ? 'development' : 'production',
    UNI_PLATFORM: 'mp-weixin',
    UNI_CLI_CONTEXT: projectRoot
  },
  stdio: 'inherit'
})

if (result.error) throw result.error
process.exit(result.status == null ? 1 : result.status)
