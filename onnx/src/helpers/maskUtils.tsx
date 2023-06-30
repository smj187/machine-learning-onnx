// Convert the onnx model mask prediction to ImageData
function arrayToImageData(input: any, width: number, height: number) {
  const [r, g, b, a] = [0, 114, 189, 255] // the masks's blue color
  const arr = new Uint8ClampedArray(4 * width * height).fill(0)
  for (let i = 0; i < input.length; i++) {
    // Threshold the onnx model mask prediction at 0.0
    // This is equivalent to thresholding the mask using predictor.model.mask_threshold
    // in python
    if (input[i] > 0.0) {
      arr[4 * i + 0] = r
      arr[4 * i + 1] = g
      arr[4 * i + 2] = b
      arr[4 * i + 3] = a
    }
  }
  return new ImageData(arr, height, width)
}

// Use a Canvas element to produce an image from ImageData
function imageDataToImage(imageData: ImageData) {
  const canvas = imageDataToCanvas(imageData)
  const image = new Image()
  image.src = canvas.toDataURL()
  return image
}

// Canvas elements can be created from ImageData
function imageDataToCanvas(imageData: ImageData) {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  canvas.width = imageData.width
  canvas.height = imageData.height
  ctx?.putImageData(imageData, 0, 0)
  return canvas
}

// Convert the onnx model mask output to an HTMLImageElement
export function onnxMaskToImage(input: any, width: number, height: number) {
  return imageDataToImage(arrayToImageData(input, width, height))
}

// // Convert the onnx model mask prediction to ImageData
// function arrayToImageData(input: any, width: number, height: number) {
//   const [r, g, b, a] = [0, 114, 189, 255] // the masks's blue color
//   const arr = new Uint8ClampedArray(4 * width * height).fill(0)
//   for (let i = 0; i < input.length; i++) {
//     if (input[i] > 0.0) {
//       arr[4 * i + 0] = r
//       arr[4 * i + 1] = g
//       arr[4 * i + 2] = b
//       arr[4 * i + 3] = a
//     }
//   }
//   return new ImageData(arr, height, width)
// }

// // Use a Canvas element to produce an image from ImageData
// function imageDataToImage(imageData: ImageData) {
//   const canvas = document.createElement("canvas")
//   const ctx = canvas.getContext("2d")
//   canvas.width = imageData.width
//   canvas.height = imageData.height
//   ctx.putImageData(imageData, 0, 0)

//   const borderImageData = addBorder(imageData)
//   ctx.putImageData(borderImageData, 0, 0)

//   const image = new Image()
//   image.src = canvas.toDataURL()
//   return image
// }

// function addBorder(imageData: ImageData) {
//   const output = new ImageData(imageData.width, imageData.height);
//   const d = imageData.data;
//   const od = output.data;

//   const borderSize = 4;
//   const [borderR, borderG, borderB, borderA] = [255, 255, 255, 255]; // white border color

//   const checkPixelOpaque = (x: number, y: number) => {
//     const i = (y * imageData.width + x) * 4;
//     return d[i + 3] > 0; // check if alpha channel is not 0
//   };

//   const checkPixelInImage = (x: number, y: number) => {
//     return x >= 0 && y >= 0 && x < imageData.width && y < imageData.height;
//   };

//   for (let y = 0; y < imageData.height; y++) {
//     for (let x = 0; x < imageData.width; x++) {
//       if (checkPixelOpaque(x, y)) {
//         // add border
//         for (let dy = -borderSize; dy <= borderSize; dy++) {
//           for (let dx = -borderSize; dx <= borderSize; dx++) {
//             const nx = x + dx;
//             const ny = y + dy;
//             if (checkPixelInImage(nx, ny) && !checkPixelOpaque(nx, ny)) {
//               const ni = (ny * imageData.width + nx) * 4;
//               od[ni + 0] = borderR;
//               od[ni + 1] = borderG;
//               od[ni + 2] = borderB;
//               od[ni + 3] = borderA;
//             }
//           }
//         }
//       }
//     }
//   }
//   return output;
// }

// // Canvas elements can be created from ImageData
// function imageDataToCanvas(imageData: ImageData) {
//   const canvas = document.createElement("canvas")
//   const ctx = canvas.getContext("2d")
//   canvas.width = imageData.width
//   canvas.height = imageData.height
//   ctx.putImageData(imageData, 0, 0)
//   return canvas
// }

// // Convert the onnx model mask output to an HTMLImageElement
// export function onnxMaskToImage(input: any, width: number, height: number) {
//   return imageDataToImage(arrayToImageData(input, width, height))
// }
