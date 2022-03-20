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
  if (typeof value === 'object') {
    const importFile = value.import
    const entryPoint = path.resolve(MODULE_PATH, importFile)
    buildFile(entryPoint, () => {
      const requireFile = path.basename(importFile).replace('.mjs', '.js')
      modulePkg.exports[key] = {
        require: "./" + requireFile,
        types: "./" + path.basename(value.types),
      };

      fs.copyFileSync(
        path.resolve(MODULE_PATH, value.types),
        path.resolve(value.types)
      )
    })
  }
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
