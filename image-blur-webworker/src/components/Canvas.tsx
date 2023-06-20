import React, { useEffect, useRef, useState } from "react"
import { fabric } from "fabric"
import * as Comlink from "comlink"
import { Box, Button, HStack } from "@chakra-ui/react"

type ComlinkWorker = {
  new (url: URL, options?: WorkerOptions): Worker
  prototype: Worker
  BlurImageFunc: (data: ArrayBuffer, blurValue: number) => Promise<string>
}

const ComlinkWorker = Comlink.wrap<ComlinkWorker>(
  new Worker(new URL("../workers/worker", import.meta.url), { type: "module" })
)

export const Canvas = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const htmlCanvasElementRef = useRef<HTMLCanvasElement>(null)
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null)

  useEffect(() => {
    if (!htmlCanvasElementRef.current) return

    const canvas = new fabric.Canvas(htmlCanvasElementRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      selection: true,
      renderOnAddRemove: true,
    })

    setFabricCanvas(canvas)
  }, [])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !fabricCanvas) return

    const imageUrl = window.URL.createObjectURL(file)

    fabric.Image.fromURL(imageUrl, image => {
      const imgWidth = image.width ?? 1024
      const imgHeight = image.height ?? 1024

      const scaleFactorWidth = (fabricCanvas.getWidth() * 0.7) / imgWidth
      const scaleFactorHeight = (fabricCanvas.getHeight() * 0.7) / imgHeight
      const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight)

      image.set({
        left: (imgWidth / 2) * scaleFactor,
        top: (imgHeight / 2) * scaleFactor,
        originX: "center",
        originY: "center",
      })

      image.scale(scaleFactor)
      fabricCanvas.add(image)

      fabricCanvas.renderAll()
    })

    event.target.value = ""
  }

  async function handleBlur() {
    if (!fabricCanvas) return

    const promises = fabricCanvas.getObjects().map(async image => {
      if (image instanceof fabric.Image) {
        const dataURL = image.toDataURL({
          format: "png",
          quality: 1,
          multiplier: 1 / Math.min(image.scaleX ?? 1, image.scaleY ?? 1),
        })

        const blob = await (await fetch(dataURL)).blob()
        const arrayBuffer = await blob.arrayBuffer()

        try {
          const blurredDataURL = await ComlinkWorker.BlurImageFunc(
            arrayBuffer,
            30
          )
          const img = new Image()
          img.onload = () => {
            image.setElement(img)

            fabricCanvas.requestRenderAll()
          }
          img.src = blurredDataURL
        } catch (err) {
          console.error("Error blurring image:", err)

          // callback but blocks main thread
          image.filters?.push(
            new fabric.Image.filters.Blur({
              blur: 5,
            })
          )

          image.applyFilters()
          fabricCanvas.requestRenderAll()
        }
      }
    })

    await Promise.all(promises)
    fabricCanvas.requestRenderAll()

    ComlinkWorker[Comlink.releaseProxy]()
  }

  return (
    <Box minH="100vh" w="100%" bg="blackAlpha.900">
      <HStack
        position="absolute"
        top="2"
        left="2"
        bg="whiteAlpha.200"
        zIndex="100"
      >
        <input ref={fileInputRef} type="file" onChange={handleUpload} />
        <Button onClick={handleBlur}>blur</Button>
      </HStack>
      <canvas ref={htmlCanvasElementRef} />
    </Box>
  )
}
