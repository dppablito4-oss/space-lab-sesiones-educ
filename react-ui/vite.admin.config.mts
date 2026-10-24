import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
export default defineConfig({
 plugins:[react()],define:{'process.env.NODE_ENV':JSON.stringify('production')},
 build:{outDir:fileURLToPath(new URL('../assets/react-admin',import.meta.url)),emptyOutDir:true,sourcemap:false,minify:true,
  lib:{entry:fileURLToPath(new URL('./src/admin/main.tsx',import.meta.url)),formats:['es'],fileName:()=> 'admin.js',cssFileName:'admin'}
 }
});
