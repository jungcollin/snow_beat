const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
    console.log(`Request: ${req.url}`);

    let filePath = '.' + req.url;
    let contentType = 'text/html';

    // Router logic
    if (filePath === './') {
        filePath = './index.html';
    } else if (filePath === './snow') {
        filePath = './snow_game.html';
    } else if (filePath === './galaxy') {
        filePath = './galaxy_game.html';
    } else {
        const extname = path.extname(filePath);
        contentType = MIME_TYPES[extname] || 'application/octet-stream';
    }

    // Security check: ensure path is within current directory
    const resolvedPath = path.resolve(filePath);
    const rootPath = path.resolve('.');

    if (!resolvedPath.startsWith(rootPath)) {
        console.error(`Access denied: ${filePath}`);
        res.writeHead(403);
        res.end('403 Forbidden');
        return;
    }

    try {
        const content = await fs.promises.readFile(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`File not found: ${filePath}`);
            res.writeHead(404);
            res.end('404 Not Found');
        } else {
            console.error(`Server error: ${error.code}`);
            res.writeHead(500);
            res.end(`Server Error: ${error.code}`);
        }
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
