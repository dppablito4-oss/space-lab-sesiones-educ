import {defineConfig, type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import {readFileSync, writeFileSync, existsSync, statSync, cpSync} from 'node:fs';
import {resolve, dirname, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const workspace = resolve(root, '..');
const output = resolve(workspace, 'artifacts/react-preview-dist');
const publicFolders = ['js', 'css', 'assets', 'data'];
const contentTypes: Record<string,string> = {'.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.html':'text/html; charset=utf-8'};
function legacyHtml() {
    return readFileSync(resolve(workspace,'index.html'),'utf8')
        .replace(/<div id="react-preview-root"><\/div>/, '')
        .replace(/<script\b[^>]*src="assets\/react-ui\/app\.js[^\"]*"[^>]*><\/script>/, '')
        .replace(/<link\b[^>]*href="assets\/react-ui\/app\.css[^\"]*"[^>]*>/, '');
}

function legacyHost(): Plugin {
    let building=false;
    return {
        name: 'spacelab-legacy-host',
        configResolved(config) { building=config.command === 'build'; },
        transformIndexHtml: {
            order: 'post',
            handler(html) {
                const modules=html.match(/<script\b[^>]*\btype=["']module["'][^>]*>[\s\S]*?<\/script>/gi) || [];
                const styles=html.match(/<link\b[^>]*\brel=["'](?:stylesheet|modulepreload)["'][^>]*>/gi) || [];
                // Derive the host from the existing fragment build, never copy a second form.
                return legacyHtml()
                    .replace(/<title>[\s\S]*?<\/title>/, '<title>Space Lab · Nuevo generador</title>')
                    .replace('<body>', '<body data-react-preview="legacy"><div id="react-preview-root"></div>')
                    .replace('</head>', styles.join('\n') + '</head>')
                    .replace('</body>', modules.join('\n') + '</body>');
            }
        },
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                let path: string;
                try { path = decodeURIComponent((req.url || '/').split('?')[0]); }
                catch { res.statusCode = 400; res.end(); return; }
                const isLegacy = path === '/legacy.html';
                const isManifest = path === '/app-version.json';
                const folder = path.split('/')[1];
                if (['backend','supabase','artifacts','tests','scripts','tools'].includes(folder) || folder.startsWith('.')) {res.statusCode=404;res.end();return;}
                if (!isLegacy && !isManifest && !publicFolders.includes(folder)) return next();
                const segments = path.replaceAll('\\', '/').split('/').filter(Boolean);
                if (segments.some(part => part.startsWith('.') || /token/i.test(part))) { res.statusCode=404; res.end(); return; }
                const file = isLegacy ? resolve(workspace, 'index.html') : isManifest ? resolve(workspace,'app-version.json') : resolve(workspace, '.' + path);
                const base = resolve(workspace, folder) + sep;
                if ((!isLegacy && !isManifest && !file.startsWith(base)) || !existsSync(file) || !statSync(file).isFile()) { res.statusCode=404; res.end(); return; }
                res.setHeader('Content-Type', contentTypes[extname(file)] || 'application/octet-stream');
                res.setHeader('Cache-Control', 'no-store');
                res.end(isLegacy ? legacyHtml() : readFileSync(file));
            });
        },
        closeBundle() {
            if (!building) return;
            if (!output.startsWith(workspace + sep)) throw new Error('Unsafe preview output');
            // Explicit public allowlist: credentials, Python, tests and artifacts stay outside the build.
            for (const directory of publicFolders) cpSync(resolve(workspace,directory), resolve(output,directory), {recursive:true});
            writeFileSync(resolve(output,'legacy.html'), legacyHtml());
            cpSync(resolve(workspace,'app-version.json'), resolve(output,'app-version.json'));
        }
    };
}

export default defineConfig({
    root,
    base:'./',
    plugins: [legacyHost(), react()],
    publicDir: false,
    server: {host:'127.0.0.1', port:5173, strictPort:true,
        fs: {strict:true, allow:[root, resolve(workspace,'node_modules')], deny:['**/.env*','**/.git/**','**/artifacts/**','**/backend/**','**/supabase/**','**/.venv/**']}},
    preview: {host:'127.0.0.1', port:5174, strictPort:true},
    build: {outDir:output, emptyOutDir:true, assetsDir:'react-assets'}
});
