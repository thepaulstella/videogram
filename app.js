const videoshow = require('videoshow');
const Jimp = require('jimp');
const fs = require('fs');
const rimraf = require('rimraf');

var path = '';
var outputFilename = '';
var fps = 24
var tempImages = [];

process.argv.forEach(function (val, index, array) {
  if (val.match(/images=/)) {
    path = val.substring(7)
  }

  if (val.match(/video=/)) {
    outputFilename = val.substring(6)
  }

  if (val.match(/fps=/)) {
    fps = val.substring(4)
  }
});

if (fps !== '') {
  if (parseInt(fps)) {
    fps = parseInt(fps)
  } else {
    console.error(`fps must be an integer. default fps is 24. example: fps='60'`)
    process.exit();
  }
}

if (path === '') {
  console.error(`images required. example: images='./path/to/images'`)
  process.exit();
}

if (outputFilename === '') {
  console.error(`filename required. example: video='filename-for-video'`)
  process.exit();
}

var workingDirectory = `${path}videogram-tmp/`;
if (!fs.existsSync(workingDirectory)) {
  fs.mkdirSync(workingDirectory);
}

fs.readdir(path, (err, files) => {
  // let filePaths = files.map(file => path + file);
  let images = files.filter(file => file.match(/(.jpg|.jpeg|.png)/));
  console.log('Processing images...')

  images.map(image => {
    var tempImage = `${workingDirectory}${image}`;
    tempImages.push(tempImage);

    fs.writeFileSync(tempImage, fs.readFileSync(`${path}${image}`));

    Jimp.read(tempImage, (err, img) => {
      if (img.bitmap.height !== img.bitmap.width) {
        if (img.bitmap.height > img.bitmap.width) {
          img
            .contain(img.bitmap.height, img.bitmap.height)
            .write(tempImage)
        }
        if (img.bitmap.width > img.bitmap.height) {
          img
            .contain(img.bitmap.width, img.bitmap.width)
            .write(tempImage)
        }
      }
    })
  });

  if (tempImages.length > 0) {
    let videoOptions = {
      fps: fps,
      loop: 1, // seconds TODO: Make this an arg
      transition: false, // TODO: Make this an arg
      size: '800x?', // TODO: Make this an arg
      videoBitrate: 2048, // TODO: Make this an arg
      videoCodec: 'libx264', // TODO: Make this an arg
      format: 'mp4', // TODO: Make this an arg
      pixelFormat: 'yuv420p' // TODO: Make this an arg
    }

    videoshow(tempImages, videoOptions)
      .save(`${outputFilename}.mp4`)
      .on('error', function (err, stdout, stderr) {
        console.error('Error:', err);
        console.error('ffmpeg stderr:', stderr);
      })
      .on('end', function (output) {
        rimraf.sync(workingDirectory); // TODO: Won't get here if no images found
        console.log('Video created in:', output);
      });
  }
});
