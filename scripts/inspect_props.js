import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseShp, parseDbf } from 'shpjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')

function inspect(filePath) {
    if (!fs.existsSync(filePath)) return

    console.log(`\nInspecting ${path.basename(filePath)}...`)
    try {
        const dbfPath = filePath.replace('.shp', '.dbf')
        if (!fs.existsSync(dbfPath)) return

        const dbfBuffer = fs.readFileSync(dbfPath)
        const dbf = parseDbf(dbfBuffer)

        if (dbf && dbf.length > 0) {
            console.log("Keys:", Object.keys(dbf[0]))
            // Print a row that has some data to see format
            console.log("Sample:", dbf.find(row => row.NAME || row.Name) || dbf[0])
        }
    } catch (e) {
        console.log("Error reading DBF:", e.message)
    }
}

function findAndInspect() {
    const typesToInspect = ['nuclear', 'wind', 'port', 'military', 'installation', 'cultura']
    const found = new Set()

    const walk = (dir) => {
        const files = fs.readdirSync(dir)
        for (const file of files) {
            const fp = path.join(dir, file)
            if (fs.statSync(fp).isDirectory()) {
                walk(fp)
            } else if (file.endsWith('.shp')) {
                const lower = file.toLowerCase()
                for (const t of typesToInspect) {
                    if (!found.has(t) && lower.includes(t)) {
                        inspect(fp)
                        found.add(t)
                    }
                }
            }
        }
    }
    walk(dataDir)
}

findAndInspect()
