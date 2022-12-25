
var path = require('path');

const src  = path.resolve(__dirname, 'src')
const dist = path.resolve(__dirname, 'dist')

module.exports = {
  mode: "development",

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
    modules: ['node_modules'],
  },

  externals: ['fsevents'],

  output: {
    path: dist,
    filename: 'bundle.js'
  },

  entry: src + "/index.ts",
  cache: true,
  devtool: 'inline-source-map',
  node: {
      __dirname: false
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: "ts-loader"
      },
      {
        test: /\.css$/i,
        exclude: /node_modules/,
        use: ['style-loader', 'css-loader'],
      },
    ]
  },
}
