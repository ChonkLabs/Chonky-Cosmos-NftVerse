import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { validate } from 'package-json-validator'
import semver from 'semver'

describe('package.json structure', () => {
  let packageJson: any

  beforeEach(() => {
    const content = readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
    packageJson = JSON.parse(content)
  })

  it('should include expected metadata fields', () => {
    expect(packageJson.name).toBe('primary-drop-sale-721-boilerplate')
    expect(semver.valid(packageJson.version)).toBeTruthy()
    expect(packageJson.type).toBe('module')
    expect(packageJson.private).toBe(false)
    expect(packageJson.packageManager?.startsWith('pnpm@')).toBe(true)
  })

  it('should expose required scripts', () => {
    expect(packageJson.scripts.dev).toBe('vite')
    expect(packageJson.scripts['dev:wrangler']).toContain('wrangler dev')
    expect(packageJson.scripts.build).toContain('tsc -b')
    expect(packageJson.scripts.build).toContain('vite build')
    expect(packageJson.scripts.lint).toBe('eslint .')
    expect(packageJson.scripts['lint:fix']).toBe('eslint . --fix')
    expect(packageJson.scripts.preview).toBe('vite preview')
    expect(packageJson.scripts.postinstall).toContain('.env.example')
    expect(packageJson.scripts.postinstall).toContain('.env')
  })

  it('should include new test workflow scripts', () => {
    expect(packageJson.scripts.test).toBe('vitest')
    expect(packageJson.scripts['test:ui']).toBe('vitest --ui')
    expect(packageJson.scripts['test:run']).toBe('vitest run')
    expect(packageJson.scripts['test:coverage']).toBe('vitest run --coverage')
    expect(packageJson.scripts['validate:package']).toBe('tsx scripts/test-package-config.ts')
  })

  it('should include required production dependencies', () => {
    const requiredDeps = [
      '0xsequence',
      '@0xsequence/api',
      '@0xsequence/design-system',
      '@0xsequence/indexer',
      '@0xsequence/kit',
      '@0xsequence/kit-checkout',
      '@0xsequence/metadata',
      '@0xsequence/network',
      '@tanstack/react-query',
      'dotenv',
      'ethers',
      'react',
      'react-dom',
      'react-toastify',
      'viem',
      'wagmi'
    ]

    requiredDeps.forEach(dep => {
      expect(packageJson.dependencies[dep]).toBeDefined()
      expect(typeof packageJson.dependencies[dep]).toBe('string')
      expect(semver.validRange(packageJson.dependencies[dep])).toBeTruthy()
    })
  })

  it('should include required development dependencies', () => {
    const requiredDevDeps = [
      '@types/react',
      '@types/react-dom',
      '@vitejs/plugin-react',
      'eslint',
      'eslint-config-prettier',
      'eslint-plugin-prettier',
      'eslint-plugin-react',
      'eslint-plugin-react-hooks',
      'eslint-plugin-react-refresh',
      'globals',
      'prettier',
      'tsx',
      'typescript',
      'typescript-eslint',
      'vite',
      'wrangler'
    ]

    requiredDevDeps.forEach(dep => {
      expect(packageJson.devDependencies[dep]).toBeDefined()
      expect(typeof packageJson.devDependencies[dep]).toBe('string')
      expect(semver.validRange(packageJson.devDependencies[dep])).toBeTruthy()
    })
  })

  it('should include new testing dependencies without altering existing ones', () => {
    expect(packageJson.devDependencies.vitest).toMatch(/^\^2\./)
    expect(packageJson.devDependencies['@vitest/ui']).toMatch(/^\^2\./)
    expect(packageJson.devDependencies['package-json-validator']).toMatch(/^\^2\./)
    expect(packageJson.devDependencies.ajv).toMatch(/^\^8\./)
    expect(packageJson.devDependencies.semver).toMatch(/^\^7\./)
  })

  it('should remain valid according to package-json-validator', () => {
    const result = validate(packageJson)
    expect(result.valid).toBe(true)
  })

  it('should not contain duplicate dependencies across prod and dev', () => {
    const prodDeps = new Set(Object.keys(packageJson.dependencies || {}))
    const devDeps = new Set(Object.keys(packageJson.devDependencies || {}))
    const overlap = [...prodDeps].filter(dep => devDeps.has(dep))
    expect(overlap).toHaveLength(0)
  })

  it('should avoid obvious secrets or tokens', () => {
    const serialized = JSON.stringify(packageJson).toLowerCase()
    ;['secret', 'token', 'password', 'apikey'].forEach(word => {
      expect(serialized.includes(word)).toBe(false)
    })
  })
})