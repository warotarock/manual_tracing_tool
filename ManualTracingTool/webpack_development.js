import path from 'path'

const src = path.resolve(__dirname, './webpack')
const dist = path.resolve(__dirname, 'dist')

export default {
    mode: 'development',
    entry: src + '/react.ts',

    output: {
        path: dist,
        filename: 'react_bundle.js'
    },

    module: {
        rules: [
            {
                test: /\.tsx/,
                exclude: /node_modules/,
                loader: 'ts-loader'
            }
        ]
    },

    resolve: {
        extensions: ['.ts', '.tsx', ".js", ".jsx"]
    },

    plugins: []
}