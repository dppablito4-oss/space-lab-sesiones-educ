import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';

// GitHub Pages serves the repository root. Ship this entry with that HTML,
// rather than relying on the development server or the ignored preview build.
export default defineConfig({
    plugins:[react()],
    define:{'process.env.NODE_ENV':JSON.stringify('production')},
    build:{
        outDir:fileURLToPath(new URL('../assets/react-ui',import.meta.url)),
        emptyOutDir:true,
        sourcemap:false,
        minify:true,
        lib:{
            entry:fileURLToPath(new URL('./src/main.tsx',import.meta.url)),
            formats:['es'],fileName:()=> 'app.js',cssFileName:'app'
        }
    }
});
