import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

describe('package.json ecosystem integration', () => {
  let pkg: any

  beforeEach(() => {
    const raw = readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
    pkg = JSON.parse(raw)
  })

  it('is aligned with React 18 toolchain', () => {
    const react = pkg.dependencies.react
    const reactDom = pkg.dependencies['react-dom']
    const typesReact = pkg.devDependencies['@types/react']
    const major = (range: string) => range.match(/\d+/)?.[0]
    expect(react).toBeDefined()
    expect(reactDom).toBeDefined()
    expect(typesReact).toBeDefined()
    expect(major(react)).toBe(major(reactDom))
    expect(typesReact.startsWith('^18')).toBe(true)
  })

  it('supports Vite + TypeScript build pipeline', () => {
    expect(pkg.devDependencies.vite).toBeDefined()
    expect(pkg.devDependencies.typescript).toBeDefined()
    expect(pkg.devDependencies['@vitejs/plugin-react']).toBeDefined()
    expect(pkg.scripts.build.includes('vite build')).toBe(true)
    expect(pkg.scripts.build.includes('tsc -b')).toBe(true)
    expect(existsSync(resolve(process.cwd(), 'vite.config.ts'))).toBe(true)
    expect(existsSync(resolve(process.cwd(), 'tsconfig.app.json'))).toBe(true)
  })

  it('includes Web3 and Sequence tooling', () => {
    expect(pkg.dependencies.ethers).toBeDefined()
    expect(pkg.dependencies.viem).toBeDefined()
    expect(pkg.dependencies.wagmi).toBeDefined()
    Object.keys(pkg.dependencies)
      .filter(dep => dep.startsWith('@0xsequence/'))
      .forEach(dep => expect(pkg.dependencies[dep]).toBeTruthy())
  })

  it('provides scripts for NFT lifecycle', () => {
    expect(pkg.scripts['create-unrevealed-tokens']).toContain('tsx')
    expect(pkg.scripts['reveal-tokens']).toContain('tsx')
    expect(pkg.devDependencies.tsx).toBeDefined()
  })

  it('ensures environment bootstrapping resilience', () => {
    const postinstall = pkg.scripts.postinstall
    expect(postinstall).toContain('cp -n .env.example .env')
    expect(postinstall).toContain('|| echo already exists')
  })

  it('exposes Vitest-based testing workflow', () => {
    expect(pkg.devDependencies.vitest).toBeDefined()
    expect(pkg.devDependencies['@vitest/ui']).toBeDefined()
    expect(pkg.scripts.test).toBe('vitest')
    expect(pkg.scripts['test:run']).toBe('vitest run')
    expect(pkg.scripts['test:coverage']).toBe('vitest run --coverage')
  })
})