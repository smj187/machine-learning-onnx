import { Image } from "image-js"

export const imageBlur = async (data: ArrayBuffer, blurValue: number) => {
  let image = await Image.load(data)
  image = image.blurFilter({ radius: blurValue })
  return image.toDataURL()
}
