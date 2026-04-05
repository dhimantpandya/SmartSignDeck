const fs = require('fs');
const http = require('http');
const path = require('path');

const MD_FILE = 'SmartSignDeck_Thesis_Final.md';
const CSS_FILE = 'thesis_style.css';
const PORT = 3030;

let lastChangeTime = Date.now();

const getHtmlTemplate = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartSignDeck Thesis Preview</title>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
        mermaid.initialize({ startOnLoad: true });
        window.mermaid = mermaid;
    </script>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <div id="status-bar">Live Preview Active</div>
    <div id="container">
        <div id="content">Loading thesis content...</div>
        <div id="last-updated"></div>
    </div>

    <script>
        console.log("Thesis Previewer Initializing...");
        
        let currentMd = "";
        let currentTimestamp = ${lastChangeTime};

        async function fetchContent() {
            try {
                const response = await fetch('/content');
                const text = await response.text();
                if (text !== currentMd) {
                    currentMd = text;
                    render();
                }
            } catch (e) {
                console.error("Fetch error:", e);
                document.getElementById('content').innerHTML = "Fetch error: " + e.message;
            }
        }

        async function render() {
            const contentDiv = document.getElementById('content');
            const lastUpdatedDiv = document.getElementById('last-updated');
            
            try {
                if (typeof marked === 'undefined') {
                    console.log("Waiting for marked...");
                    setTimeout(render, 100);
                    return;
                }
                
                // Rewrite file URLs for browser compatibility
                const processedMd = currentMd.split("file:///").join("/file/");
                
                // Split into physical pages for the preview
                const mdPages = processedMd.split(/\\r?\\n?<div class="page-break"><\\/div>\\r?\\n?/i);
                const paginatedHtml = mdPages.map(md => \`<div class="a4-page">\${marked.parse(md)}</div>\`).join('');
                
                contentDiv.innerHTML = paginatedHtml;
                
                if (window.mermaid) {
                    await window.mermaid.run();
                }
                
                lastUpdatedDiv.innerText = 'Last updated: ' + new Date().toLocaleTimeString();
                console.log("Render successful");
            } catch (e) {
                console.error("Render error:", e);
                contentDiv.innerHTML = "<p style='color:red'>Render Error: " + e.message + "</p>" + contentDiv.innerHTML;
            }
        }

        // Initial fetch
        fetchContent();

        // Live reload polling
        setInterval(async () => {
            try {
                const response = await fetch('/status');
                const data = await response.json();
                if (data.timestamp > currentTimestamp) {
                    console.log("Change detected, updating...");
                    currentTimestamp = data.timestamp;
                    await fetchContent();
                }
            } catch (e) { }
        }, 1500);
    </script>
</body>
</html>
`;

// Watch the markdown file
fs.watch(MD_FILE, (eventType, filename) => {
    if (eventType === 'change') {
        lastChangeTime = Date.now();
        console.log(`[${new Date().toLocaleTimeString()}] Update detected`);
    }
});

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(getHtmlTemplate());
    } else if (req.url === '/content') {
        fs.readFile(path.join(__dirname, MD_FILE), 'utf8', (err, content) => {
            if (err) {
                res.writeHead(500);
                return res.end(err.message);
            }
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(content);
        });
    } else if (req.url === '/style.css') {
        fs.readFile(path.join(__dirname, CSS_FILE), 'utf8', (err, content) => {
            if (err) {
                res.writeHead(404);
                return res.end();
            }
            res.writeHead(200, { 'Content-Type': 'text/css' });
            res.end(content);
        });
    } else if (req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ timestamp: lastChangeTime }));
    } else if (req.url.startsWith('/file')) {
        const filePath = req.url.replace('/file/', '').replace('file:///', '');
        const fullPath = decodeURIComponent(filePath);
        fs.readFile(fullPath, (err, data) => {
            if (err) {
                res.writeHead(404);
                return res.end();
            }
            const ext = path.extname(fullPath).toLowerCase();
            const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': mime });
            res.end(data);
        });
    } else {
        // Static file handler — serves docs/images/ and any relative asset
        const relativePath = decodeURIComponent(req.url.replace(/^\//, ''));
        const fullPath = path.join(__dirname, relativePath);
        fs.readFile(fullPath, (err, data) => {
            if (err) {
                res.writeHead(404);
                return res.end('Not found: ' + relativePath);
            }
            const ext = path.extname(fullPath).toLowerCase();
            const mimeMap = {
                '.png':  'image/png',
                '.jpg':  'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif':  'image/gif',
                '.svg':  'image/svg+xml',
                '.webp': 'image/webp',
                '.css':  'text/css',
                '.js':   'text/javascript',
            };
            const mime = mimeMap[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': mime });
            res.end(data);
        });
    }
});

server.listen(PORT, () => {
    console.log(`--------------------------------------------------`);
    console.log(`🚀 Thesis Live Previewer (V3 - API Mode) is running!`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`👀 Watching: ${MD_FILE}`);
    console.log(`--------------------------------------------------`);
});
