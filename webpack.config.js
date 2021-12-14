
var path = require('path');

const src  = path.resolve(__dirname, 'src')
const dist = path.resolve(__dirname, 'dist')

module.exports = {
  mode: "development",
  entry: src + "/index.ts",
  cache: true,
  devtool: 'eval-cheap-source-map',
  node: {
      __dirname: false
  },

  output: {
    path: dist,
    filename: 'bundle.js'
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader"
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ]
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
    modules: ['node_modules', src],
  }
};
