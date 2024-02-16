import { Box, Button, HStack, Image as ChakraImage } from "@chakra-ui/react"
import { InferenceSession, Tensor } from "onnxruntime-web"
import { useContext, useEffect, useRef, useState } from "react"
import * as ort from "onnxruntime-web"
/* @ts-ignore */
import npyjs from "npyjs"
import { modelInputProps, modelScaleProps } from "./interfaces"
import { Canvas } from "./Canvas"
import { modelData } from "./utils/model-api"
import { onnxMaskToImage, traceOnnxMaskToSVG } from "./utils/mask-utils"
import { downloadMaskedImage } from "./utils/crop-image"

const CANVAS_SCALE = 0.5

const IMAGE_PATH = "truck.jpg"
const IMAGE_EMBEDDING = "truck_embedding.npy"
const MODEL_DIR = "sam_onnx_example.onnx"

function App() {
  const [model, setModel] = useState<InferenceSession | null>(null)
  const [tensor, setTensor] = useState<Tensor | null>(null)
  const [modelScale, setModelScale] = useState<modelScaleProps | null>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>([])

  const [imageData, setImageData] = useState({
    url: new URL(IMAGE_PATH, location.origin),
    width: 1800,
    height: 1200
  })

  async function loadImage(url: URL) {
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

  useEffect(() => {
    const initModel = async () => {
      try {
        if (MODEL_DIR === undefined) return
        const URL: string = MODEL_DIR
        const model = await InferenceSession.create(URL)
        setModel(model)
      } catch (e) {
        console.log(e)
      }
    }
    initModel()

    loadImage(imageData.url)

    // Load the Segment Anything pre-computed embedding
    Promise.resolve(loadNpyTensor(IMAGE_EMBEDDING, "float32")).then(embedding =>
      setTensor(embedding)
    )
  }, [])

  const loadNpyTensor = async (tensorFile: string, dType: string) => {
    const npLoader = new npyjs()
    const npArray = await npLoader.load(tensorFile)
    const tensor = new ort.Tensor(dType, npArray.data, npArray.shape)
    return tensor
  }

  const onProcessAsync = async (clicks: modelInputProps[]) => {
    try {
      if (
        model === null ||
        clicks === null ||
        tensor === null ||
        modelScale === null
      )
        return

      // Preapre the model input in the correct format for SAM.
      // The modelData function is from onnxModelAPI.tsx.
      const feeds = modelData({
        clicks,
        tensor,
        modelScale
      })
      if (feeds === undefined) return
      // Run the SAM ONNX model with the feeds returned from modelData()
      const results = await model.run(feeds)

      const output = results[model.outputNames[0]]

      // The predicted mask returned from the ONNX model is an array which is
      // rendered as an HTML image using onnxMaskToImage() from maskUtils.tsx.
      const m = onnxMaskToImage(output.data, output.dims[2], output.dims[3])
      console.log(m.src)
      // setMaskImg(m)
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <Box h="100vh" w="100%" bg="gray.900" pos="relative">
      <Box p="12">
        <Canvas
          imageData={imageData}
          imageScale={CANVAS_SCALE}
          onProcessAsync={onProcessAsync}
        />
      </Box>
      <HStack
        overflowX="auto"
        w="100%"
        h="96"
        border="1px solid "
        borderColor="whitesmoke"
      >
        <Button
          onClick={async () => {
            if (!modelScale) return

            const imageImage = "/truck.jpg"
            const maskImage = "/image (5).png"
            const x = await downloadMaskedImage(
              imageImage,
              maskImage,
              imageData.width,
              imageData.height
            )
            setImageUrls(prev => [x, ...prev])
          }}
        >
          crop
        </Button>
        {imageUrls.map((url, index) => (
          <ChakraImage
            key={index}
            src={url}
            alt={`Masked Image ${index + 1}`}
            objectFit="contain"
            w="100%"
            h="100%"
          />
        ))}
      </HStack>
    </Box>
  )
}

export default App

const handleImageScale = (image: HTMLImageElement) => {
  // Input images to SAM must be resized so the longest side is 1024
  const LONG_SIDE_LENGTH = 1024
  const w = image.naturalWidth
  const h = image.naturalHeight
  const samScale = LONG_SIDE_LENGTH / Math.max(h, w)
  return { height: h, width: w, samScale }
}

