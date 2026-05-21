/**
 * Copies .next/static and public/ into .next/standalone so the packaged
 * server can serve them without needing the rest of the project tree.
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyRecursive(s, d)
    } else {
      fs.copyFileSync(s, d)
    }
  }
}

// .next/static  →  .next/standalone/.next/static
copyRecursive(
  path.join(root, '.next', 'static'),
  path.join(root, '.next', 'standalone', '.next', 'static')
)

// public/  →  .next/standalone/public
copyRecursive(
  path.join(root, 'public'),
  path.join(root, '.next', 'standalone', 'public')
)

console.log('Build prepared for Electron packaging.')
