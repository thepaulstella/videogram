const videoshow = require("videoshow");
const Jimp = require("jimp");
const fs = require('fs');

var path = "";
var outputFilename = "";

process.argv.forEach(function (val, index, array) {
  if (val.lastIndexOf("images=") > -1) {
    path = val.substring(7)
  }

  if (val.lastIndexOf("video=") > -1) {
    outputFilename = val.substring(6)
  }
});

if (path == "") {
    console.error(`requires images="path/to/images"`)
    process.exit();
}

if (outputFilename == "") {
  console.error(`requires video="filename-for-video"`)
  process.exit();
}

fs.readdir(path, (err, files) => {
  let filePaths = files.map(file => path + file);
  let images = filePaths.filter(file => file.match( /(.jpg|.jpeg|.png)/ ));

  images.map(image => {
    Jimp.read(image, (err, img) => {
      if (img.bitmap.height != img.bitmap.width) {
        
        if (img.bitmap.height > img.bitmap.width) {
          img
            .contain(
              img.bitmap.height, 
              img.bitmap.height, 
              Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_CENTER)
            .write(image)
        }
          
        if (img.bitmap.width > img.bitmap.height) {
          img
            .contain(img.bitmap.width, img.bitmap.width)
            .write(image)
        }
      }
    })
  })

  if (images.length > 0) {

  let videoOptions = {
    fps: 24,
    loop: 1, // seconds TODO: Arg?
    transition: false, // TODO: Arg?
    size: "800x?",
    videoBitrate: 2048,
    videoCodec: 'libx264',
    format: 'mp4',
    pixelFormat: 'yuv420p'
  }

  videoshow(images, videoOptions)
    .save(`${outputFilename}.mp4`)
    .on('start', function (command) {
      console.log('ffmpeg process started:', command)
    })
    .on('error', function (err, stdout, stderr) {
      console.error('Error:', err)
      console.error('ffmpeg stderr:', stderr)
    })
    .on('end', function (output) {
      console.error('Video created in:', output)
    });
  }
})
