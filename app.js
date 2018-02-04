const videoshow = require('videoshow');
const sharp = require('sharp');
const rimraf = require('rimraf');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));

let path = '';
let outputFilename = '';
let framerate = 24
let quality = 90;

process.argv.forEach(function (val, index, array) {
  if (val.match(/images=/)) {
    path = val.substring(7)
  }

  if (val.match(/video=/)) {
    outputFilename = val.substring(6)
  }

  if (val.match(/framerate=/)) {
    framerate = val.substring(10)
  }

  if (val.match(/quality=/)) {
    quality = val.substring(8)
  }
});

if (parseInt(framerate)) {
  framerate = parseInt(framerate);
} else {
  console.error(`
    framerate must be an integer.
    default framerate is 24.
    example: framerate='60'
  `);
  process.exit();
}

if (parseInt(quality) <= 100 && parseInt(quality) >= 1) {
  quality = parseInt(quality);
} else {
  console.error(`
    quality must be an integer between 1 and 100.
    default quality is 90.
    example: quality='50'
  `);
  process.exit();
}

if (path === '') {
  console.error(`
    images required.
    example: images='./path/to/images'
  `);
  process.exit();
}

if (outputFilename === '') {
  console.error(`
    filename required.
    example: video='filename-for-video'
  `);
  process.exit();
}

let workingDirectory = `${path}videogram-tmp/`;
if (!fs.existsSync(workingDirectory)) {
  fs.mkdirSync(workingDirectory);
}

let getImages = async((dir) => {
  let files = await(fs.readdirAsync(dir));
  return files.filter(file => file.match(/(.jpg|.jpeg|.png)/));
});

let processImage = async((image) => {
  let tempImage = `${workingDirectory}${image}`;

  return new Promise((resolve, reject) => {
    sharp(path + image)
    .metadata()
    .then(metadata => {
      if (metadata.width > metadata.height) {
        sharp(path + image)
          .resize(metadata.width, metadata.width)
          .background({ r: 0, g: 0, b: 0, alpha: 0 })
          .embed()
          .jpeg({ quality: quality })
          .toFile(tempImage)
          .then(() => resolve(tempImage));
      }

      if (metadata.height > metadata.width) {
        sharp(path + image)
          .resize(metadata.height, metadata.height)
          .background({ r: 0, g: 0, b: 0, alpha: 0 })
          .embed()
          .jpeg({ quality: quality })
          .toFile(tempImage)
          .then(() => resolve(tempImage));
      }

      sharp(path + image)
        .jpeg({ quality: quality })
        .toFile(tempImage)
        .then(() => resolve(tempImage));
    });
  });
});

let processImages = async((images) => {
  let processedImages = await(images.map(image => processImage(image)))
  return processedImages;
});

let processVideo = async((images) => {
  let videoOptions = {
    framerate: framerate,
    loop: 1, // seconds TODO: Make this an arg
    transition: false, // TODO: Make this an arg
    size: '800x?', // TODO: Make this an arg
    videoBitrate: 2048, // TODO: Make this an arg
    videoCodec: 'libx264', // TODO: Make this an arg
    format: 'mp4', // TODO: Make this an arg
    pixelFormat: 'yuv420p' // TODO: Make this an arg
  };

  return new Promise((resolve, reject) => {
    videoshow(images, videoOptions)
    .save(`${outputFilename}.mp4`)
    .on('error', function (err, stdout, stderr) {
      resolve(`Error: ${err}`);
    })
    .on('end', function (output) {
      resolve(`Video created in ${output}`);
    });
  })
});

getImages(path).then(images => {
  console.log('Processing images...');
  processImages(images).then(processedImages => {
    console.log('Processing video...');
    processVideo(processedImages).then(result => {
      rimraf.sync(workingDirectory)
      console.log(result);
    });
  });
});