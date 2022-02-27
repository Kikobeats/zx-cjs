'use strict'

const { buildSync } = require('esbuild')
const path = require('path')
const fs = require('fs')

const MODULE_PATH = path.resolve('node_modules/zx')
const OUT_DIR = path.resolve('src')

const pkg = require('../package.json')

const modulePkg = require(path.resolve(MODULE_PATH, 'package.json'))

const buildFile = (filepath, cb) => {
  buildSync({
    bundle: true,
    entryPoints: [filepath],
    format: 'cjs',
    outdir: OUT_DIR,
    platform: 'node'
  })
  cb()
}

const files = Object.entries(modulePkg.exports)

files.forEach(([key, value]) => {
  const entryPoint = path.resolve(MODULE_PATH, value)
  buildFile(entryPoint, () => {
    const filename = value.replace('.mjs', '.js')
    modulePkg.exports[key] = filename
  })
})

modulePkg.name = pkg.name
modulePkg.author = pkg.author
modulePkg.repository = pkg.repository

delete modulePkg.files
delete modulePkg.version
delete modulePkg.main
delete modulePkg.bin
delete modulePkg.dependencies
delete modulePkg.publishConfig
delete modulePkg.scripts

fs.copyFileSync(
  path.resolve(MODULE_PATH, 'index.d.ts'),
  path.resolve(OUT_DIR, 'index.d.ts')
)

fs.writeFileSync(
  path.resolve(OUT_DIR, 'package.json'),
  JSON.stringify(modulePkg, null, 2)
)
