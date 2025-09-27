import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import Ajv from 'ajv'
import semver from 'semver'

const schema = {
  type: 'object',
  required: ['name', 'version', 'type', 'scripts', 'dependencies', 'devDependencies'],
  properties: {
    name: { type: 'string', pattern: '^(@[a-z0-9][a-z0-9._-]*/)?[a-z0-9][a-z0-9._-]*$' },
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+' },
    type: { type: 'string', enum: ['module', 'commonjs'] },
    private: { type: 'boolean' },
    scripts: {
      type: 'object',
      additionalProperties: { type: 'string' }
    },
    dependencies: {
      type: 'object',
      additionalProperties: { type: 'string' }
    },
    devDependencies: {
      type: 'object',
      additionalProperties: { type: 'string' }
    },
    packageManager: { type: 'string' }
  }
}

describe('package.json schema validation', () => {
  let pkg: any
  let ajv: Ajv

  beforeEach(() => {
    const raw = readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
    pkg = JSON.parse(raw)
    ajv = new Ajv({ allErrors: true })
  })

  it('conforms to expected schema', () => {
    const validate = ajv.compile(schema);
    const valid = validate(pkg);
    if (validate.errors) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true)
  })

  it('uses valid semantic version ranges for dependencies', () => {
    Object.entries({
      ...pkg.dependencies,
      ...pkg.devDependencies
    }).forEach(([name, range]) => {
      expect(typeof range).toBe('string')
      expect(range.length).toBeGreaterThan(0)
      expect(semver.validRange(range)).toBeTruthy()
    })
  })

  it('provides sensible script names and commands', () => {
    Object.entries(pkg.scripts).forEach(([name, command]) => {
      expect(/^[A-Za-z0-9:_-]+$/.test(name)).toBe(true)
      expect(typeof command).toBe('string')
      expect(command.trim().length).toBeGreaterThan(0)
    })
  })

  it('keeps blockchain-related dependencies pinned when necessary', () => {
    expect(pkg.dependencies.ethers).toBe('6.14.4')
    expect(pkg.dependencies['0xsequence']).toBe('2.1.0')
  })
})