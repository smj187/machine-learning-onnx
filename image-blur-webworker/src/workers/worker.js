import { expose } from "comlink"
import { imageBlur } from "./image-blur"

const api = {
  BlurImageFunc(data, blurValue) {
    return imageBlur(data, blurValue)
  },
}

expose(api)
