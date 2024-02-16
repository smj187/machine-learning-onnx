import { Tensor } from "onnxruntime-web"
import * as ort from "onnxruntime-web"
/* @ts-ignore */
import npyjs from "npyjs"

const loadNpyTensor = async (tensorFile: string, dType: string) => {
  const npLoader = new npyjs()
  const npArray = await npLoader.load(tensorFile)
  const tensor = new Tensor(dType, npArray.data, npArray.shape)
  console.log("loadNpyTensor", tensor)
  return tensor
}

export { loadNpyTensor }
