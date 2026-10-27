/** Render the maintained React surfaces for static hosting and first paint.
 * The same component tree hydrates in the browser before controllers start.
 */
import {build} from 'vite';
import react from '@vitejs/plugin-react';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const output=resolve(root,'artifacts/react-shell-renderer');
const check=process.argv.includes('--check');
await build({configFile:false,plugins:[react()],logLevel:'warn',
    build:{ssr:resolve(root,'react-ui/src/surfaces/render.tsx'),outDir:output,emptyOutDir:true,
        rollupOptions:{output:{entryFileNames:'render.mjs'}}}});
const {renderSurfaces}=await import(pathToFileURL(resolve(output,'render.mjs')).href);
const rendered=renderSurfaces();
const manifest=JSON.parse(await readFile(resolve(root,'react-ui/src/surfaces/manifest.json'),'utf8'));
manifest['ui/fragments/frontend.html']='FrontendShell';
let stale=false;
for(const [path,name] of Object.entries(manifest)) {
    const markup=name==='FrontendShell'?`<div id="frontend-root">${rendered[name]}</div>`:rendered[name];
    const text=`<!-- Generated from React: ${name}. Edit react-ui/src/, then npm run build:public. -->\n${markup}\n<!-- End React: ${name} -->\n`;
    if(check) {
        if(await readFile(resolve(root,path),'utf8')!==text) {console.error(`Stale React surface: ${path}`);stale=true;}
    } else {
        await mkdir(resolve(root,path,'..'),{recursive:true});
        await writeFile(resolve(root,path),text,'utf8');
    }
}
if(stale) process.exitCode=1;
else console.log(`${check?'Verified':'Rendered'} ${Object.keys(manifest).length} React surfaces.`);
for(const [page,name] of [['descargas_landing.html','Downloads'],['conexion.html','ConnectionPage']]) {
    const template=await readFile(resolve(root,`ui/standalone/${name}.shell.html`),'utf8');
    const expected=template.replace(`<!-- react-page:${name} -->`,
        `<div id="standalone-root" data-page="${name}">${rendered[name]}</div>`);
    if(!check) await writeFile(resolve(root,page),expected,'utf8');
    else {
        const normalize=value=>value.replace(/\r\n?/g,'\n').replace(/(\b(?:src|href)="[^"?]+)\?[^"\s]+/g,'$1')
            .replace(/(<meta name="app-build" content=")[^"]+/g,'$1BUILD_ID');
        if(normalize(await readFile(resolve(root,page),'utf8'))!==normalize(expected)) {
            console.error(`Stale React page: ${page}`);process.exitCode=1;
        }
    }
}
