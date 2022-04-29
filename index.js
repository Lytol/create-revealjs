#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const prompts = require('prompts')
const { red, reset } = require('kolorist')
const argv = require('minimist')(process.argv.slice(2), { string: ['_'] })
const cwd = process.cwd()

async function init() {
  let targetDir = argv._[0]
  let result = {}

  const defaultProjectName = targetDir || 'revealjs-project'
  const template = 'vite'

  try {
    result = await prompts([
      {
        type: targetDir ? null : 'text',
        name: 'projectName',
        message: reset('Project name:'),
        initial: defaultProjectName,
        onState: state => (targetDir = state.value.trim() || defaultProjectName)
      },
      {
        type: () => isExisting(targetDir) && !isEmpty(targetDir) ? 'confirm' : null,
        name: 'overwrite',
        message: () =>
        (targetDir === '.'
          ? 'Current directory'
          : `Target directory "${targetDir}"`) +
        ` is not empty. Remove existing files and continue?`
      },
      {
        type: (_, { overwrite } = {}) => {
          if (overwrite === false) {
            throw new Error(red('✖') + ' Operation cancelled')
          }
          return null
        },
        name: 'overwriteChecker'
      },

    ],
      {
        onCancel: () => {
          throw new Error(red('✖') + ' Operation cancelled')
        }
      }
    )
  } catch (cancelled) {
    console.log(cancelled.message)
    return
  }

  const { overwrite } = result
  const root = path.join(cwd, targetDir)

  const operations = [
    {
      title: "Removing existing directory",
      run: () => {
        fs.rmSync(root, { recursive: true, force: true })
      },
      when: () => overwrite
    },
    {
      title: `Creating directory ${root}`,
      run: () => {
        fs.mkdirSync(root)
      },
      when: () => !isExisting(root)
    },
    {
      title: `Copying template "${template}" to ${root}`,
      run: () => {
        const templateDir = path.join(__dirname, 'templates', template)
        const files = fs.readdirSync(templateDir)

        for (const file of files) {
          copy(path.join(templateDir, file), path.join(root, file))
        }
      }
    }
  ]

  for (const op of operations) {
    if (op.when && !op.when()) {
      continue
    }

    console.log(op.title)

    op.run()
  }
}

function isEmpty(path) {
  return fs.readdirSync(path).length === 0
}

function isExisting(path) {
  return fs.existsSync(path)
}

function copy(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

init().catch((e) => {
  console.error(e)
})
