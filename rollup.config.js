import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-typescript2'

const plugins = [
    typescript({
        tsconfig: 'tsconfig.json',
        removeComments: true,
        useTsconfigDeclarationDir: true,
    })
]

export default {
    input: 'src/index.ts',
    output: [
        { file: 'dist/quest.js', format: 'umd', name: 'mvvm', plugins: [terser()], sourcemap: true },
        { file: 'dist/quest.esm.js', format: 'esm', sourcemap: true }
    ],
    plugins,
}