#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const prompts = require('prompts')
const { red, reset } = require('kolorist')
const argv = require('minimist')(process.argv.slice(2), { string: ['_'] })

async function init() {
  let targetDir = argv._[0]

  const defaultProjectName = targetDir || 'revealjs-project'

  let result = {}

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

  console.log(`Target dir: ${targetDir} / Overwrite: ${overwrite}`)
}

init().catch((e) => {
  console.error(e)
})

function isEmpty(path) {
  return fs.readdirSync(path).length === 0
}

function isExisting(path) {
  return fs.existsSync(path)
}
