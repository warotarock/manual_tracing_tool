const FS = require('fs-extra')
const path = require('path')
const svgtofont_utils = require('svgtofont/lib/utils')

const sourcesPath = path.join(process.cwd(), 'res/svg_font')
const outputPath = path.join(process.cwd(), 'dist/res')
const outputFileName = 'google-icon-min'

if (!FS.pathExistsSync(sourcesPath)) {
  console.error('The directory does not exist!', sourcesPath)
  process.exit()
}

if (!FS.pathExistsSync(outputPath)) {
  console.error('The directory does not exist!', outputPath)
  process.exit()
}

const options = {
  src: sourcesPath,
  dist: outputPath,
  fontName: outputFileName,
  useNameAsUnicode: true,
  svgicons2svgfont: {
    fontHeight: 1000,
    normalize: true,
  },
}

async function creatFont(options) {
  await svgtofont_utils.createSVG(options);
  const ttf = await svgtofont_utils.createTTF(options)
  await svgtofont_utils.createWOFF2(options, ttf)
  console.log('Deleting temporary files')
  FS.rmSync(path.join(outputPath, outputFileName + '.ttf'))
  FS.rmSync(path.join(outputPath, outputFileName + '.svg'))
}

creatFont(options)
.then(() => {
  console.log('Done!')
  process.exit()
}).catch((err) => {
  console.log('SvgToFont:ERR:', err)
  process.exit()
})
