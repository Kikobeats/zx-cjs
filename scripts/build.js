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
files.forEach(([key, relativeFile]) => {
  const absoluteFile = path.resolve(MODULE_PATH, relativeFile)
  if (absoluteFile.endsWith('.json')) return

  buildFile(absoluteFile, () => {
    let exportFile = relativeFile
    if (relativeFile.endsWith('.mjs')) {
      exportFile = relativeFile.replace('.mjs', '.js')
      const typeFile = absoluteFile.replace('.mjs', '.d.ts')
      fs.copyFileSync(typeFile, path.resolve(OUT_DIR, path.basename(typeFile)))
    }
    modulePkg.exports[key] = exportFile
  })
})

modulePkg.name = pkg.name
modulePkg.author = pkg.author
modulePkg.repository = pkg.repository
modulePkg.types = modulePkg.exports['.'].types

delete modulePkg.files
delete modulePkg.version
delete modulePkg.main
delete modulePkg.bin
delete modulePkg.dependencies
delete modulePkg.publishConfig
delete modulePkg.scripts

fs.writeFileSync(
  path.resolve(OUT_DIR, 'package.json'),
  JSON.stringify(modulePkg, null, 2)
)
