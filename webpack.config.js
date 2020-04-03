require('@babel/register'); // development.jsでES6を使えるようにする

var path = require('path');

const src  = path.resolve(__dirname, 'src')
const dist = path.resolve(__dirname, 'dist')

module.exports = {
  mode: "development",
  entry: src + "/index.ts",

  output: {
    path: dist,
    filename: 'bundle.js'
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader"
      }
    ]
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
    modules: ['node_modules', src],
  }
};
