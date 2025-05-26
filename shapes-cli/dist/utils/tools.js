import fs from 'fs/promises';
import path from 'path';
import os from 'os';
const TOOLS_DIR = path.join(os.homedir(), '.shapes-cli', 'tools');
export async function loadTools() {
    try {
        await fs.mkdir(TOOLS_DIR, { recursive: true });
        const files = await fs.readdir(TOOLS_DIR);
        const tools = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(path.join(TOOLS_DIR, file), 'utf-8');
                tools.push(JSON.parse(content));
            }
        }
        return tools;
    }
    catch (_error) {
        console.error('Error loading tools:', _error);
        return [];
    }
}
export async function saveTool(tool) {
    const filePath = path.join(TOOLS_DIR, `${tool.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(tool, null, 2), 'utf-8');
}
export async function removeTool(toolId) {
    const filePath = path.join(TOOLS_DIR, `${toolId}.json`);
    try {
        await fs.unlink(filePath);
    }
    catch (_error) {
        // Ignore error if file doesn't exist
    }
}
