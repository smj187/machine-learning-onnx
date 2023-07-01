import * as ort from "onnxruntime-web"

export async function fileToTensor(file: File): Promise<ort.Tensor> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img")
    img.src = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")
      ctx?.drawImage(img, 0, 0)
      const imageData = ctx?.getImageData(
        0,
        0,
        img.naturalWidth,
        img.naturalHeight
      )
      const { data, width, height } = imageData!
      const tensorData = new Float32Array(width * height * 4)
      for (let i = 0; i < data.length; i++) {
        tensorData[i] = data[i] / 255 // Normalize to [0, 1]
      }
      resolve(new ort.Tensor("float32", tensorData, [1, 4, height, width]))
    }
    img.onerror = reject
  })
}

export async function tensorToFile(
  tensor: ort.Tensor,
  filename: string
): Promise<File> {
  return new Promise((resolve, reject) => {
    const [batch, channels, height, width] = tensor.dims
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    const imageData = ctx?.createImageData(width, height)
    for (let i = 0; i < tensor.data.length; i++) {
      imageData!.data[i] = tensor.data[i] * 255 // Denormalize from [0, 1] to [0, 255]
    }
    ctx?.putImageData(imageData!, 0, 0)
    canvas.toBlob(blob => {
      resolve(new File([blob!], filename, { type: "image/png" }))
    }, "image/png")
  })
}
