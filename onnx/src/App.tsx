import { InferenceSession, Tensor } from "onnxruntime-web"
import { useContext, useEffect, useRef, useState } from "react"
import * as ort from "onnxruntime-web"
/* @ts-ignore */
import npyjs from "npyjs"
import { Box, Button } from "@chakra-ui/react"
import { fabric } from "fabric"

import AppContext from "./hooks/createContext"
import { handleImageScale } from "./helpers/scaleHelper"
import { modelInputProps, modelScaleProps } from "./helpers/Interfaces"
import { modelData } from "./helpers/onnxModelAPI"
import { onnxMaskToImage } from "./helpers/maskUtils"
import { Canvas } from "./Canvas"

const IMAGE_PATH = "/assets/data/truck.jpg"
const IMAGE_EMBEDDING = "/assets/data/truck_embedding.npy"
const MODEL_DIR = "/model/sam_onnx_quantized_example.onnx"

function App() {
  const {
    clicks: [clicks, setClicks],
    image: [image, setImage],
    maskImg: [maskImg, setMaskImg]
  } = useContext(AppContext)!

  const [model, setModel] = useState<InferenceSession | null>(null) // ONNX model
  const [tensor, setTensor] = useState<Tensor | null>(null) // Image embedding tensor

  // The ONNX model expects the input to be rescaled to 1024.
  // The modelScale state variable keeps track of the scale values.
  const [modelScale, setModelScale] = useState<modelScaleProps | null>(null)

  useEffect(() => {
    // Initialize the ONNX model
    const initModel = async () => {
      try {
        if (MODEL_DIR === undefined) return
        const URL: string = MODEL_DIR
        const model = await InferenceSession.create(URL)
        setModel(model)
        console.log(model)
      } catch (e) {
        console.log(e)
      }
    }
    initModel()

    // Load the image
    const url = new URL("/truck.jpg", location.origin)
    loadImage(url)

    // Load the Segment Anything pre-computed embedding
    Promise.resolve(loadNpyTensor(IMAGE_EMBEDDING, "float32")).then(embedding => setTensor(embedding))
  }, [])

  useEffect(() => {
    if (!clicks || clicks.length < 1) return
    runONNX()
    // console.log("run", clicks[0])
  }, [clicks])

  const runONNX = async () => {
    try {
      if (model === null || clicks === null || tensor === null || modelScale === null) return
      else {
        // Preapre the model input in the correct format for SAM.
        // The modelData function is from onnxModelAPI.tsx.
        const feeds = modelData({
          clicks,
          tensor,
          modelScale
        })
        if (feeds === undefined) return
        // console.log(feeds)
        // Run the SAM ONNX model with the feeds returned from modelData()
        const results = await model.run(feeds)
        const output = results[model.outputNames[0]]
        // The predicted mask returned from the ONNX model is an array which is
        // rendered as an HTML image using onnxMaskToImage() from maskUtils.tsx.
        setMaskImg(onnxMaskToImage(output.data, output.dims[2], output.dims[3]))
      }
    } catch (e) {
      console.log(e)
    }
  }

  const loadImage = async (url: URL) => {
    try {
      const img = new Image()
      img.src = url.href
      img.onload = () => {
        const { height, width, samScale } = handleImageScale(img)

        setModelScale({
          height: height, // original image height
          width: width, // original image width
          samScale: samScale // scaling factor for image which has been resized to longest side 1024
        })
        img.width = width
        img.height = height
        setImage(img)
      }
    } catch (error) {
      console.log(error)
    }
  }

  // Decode a Numpy file into a tensor.
  const loadNpyTensor = async (tensorFile: string, dType: string) => {
    const npLoader = new npyjs()
    const npArray = await npLoader.load("/truck_embedding.npy")
    const tensor = new ort.Tensor(dType, npArray.data, npArray.shape)
    return tensor
  }

  if (model === null || modelScale === null) return null
  return <Canvas samScale={modelScale.samScale} />
}

export default App

