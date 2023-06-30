import { Box, Image } from "@chakra-ui/react"
import { useContext, useEffect, useRef, useState } from "react"
import { fabric } from "fabric"
import { modelInputProps } from "./helpers/Interfaces"
/* @ts-ignore */
import * as _ from "underscore"
import AppContext from "./hooks/createContext"

export const Canvas: React.FC<{ samScale: number }> = ({ samScale }) => {
  const {
    clicks: [clicks, setClicks],
    image: [image, setImage],
    maskImg: [maskImg, setMaskImg]
  } = useContext(AppContext)!

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null)
  const myImg = useRef<HTMLImageElement | null>(null)

  const getClick = (x: number, y: number): modelInputProps => {
    const clickType = 1
    return { x, y, clickType }
  }

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      selection: true,
      renderOnAddRemove: true
    })

    const handleMouseMove = _.throttle((e: fabric.IEvent<MouseEvent>) => {
      const target = e.target
      const pointer = canvas.getPointer(e.e)
      const xPos = pointer.x / samScale
      const yPos = pointer.y / samScale
      if (target) {
        const click = getClick(xPos, yPos)
        if (click) setClicks([click])
      } else {
        setMaskImg(null)
      }
    }, 500)

    canvas.on("mouse:move", handleMouseMove)
    canvas.on("mouse:down", event => {
      if (!event.target || !myImg.current) return

      // const link = document.createElement("a")
      // link.href = myImg.current.src
      // link.download = "maskImg.png"
      // link.click()
    })

    setFabricCanvas(canvas)
  }, [])

  useEffect(() => {
    if (!fabricCanvas || !image) return

    fabric.Image.fromURL("/truck.jpg", function (img) {
      img.set({
        name: "_image",
        hoverCursor: "default",
        scaleX: samScale,
        scaleY: samScale,
        selectable: false
      })

      fabricCanvas.add(img)
      fabricCanvas.requestRenderAll()
      console.log(img.getScaledWidth(), img.getScaledHeight())
    })
  }, [image, fabricCanvas, samScale])

  useEffect(() => {
    if (!maskImg) return
    myImg.current = maskImg
    //   console.log(maskImg.width * samScale, maskImg.height * samScale)
  }, [maskImg])

  // useEffect(() => {
  //     if (!maskImg) return

  //     fetch(maskImg.src)
  //       .then(response => response.blob())
  //       .then(blob => {
  //         const sizeInKB = blob.size / 1024
  //         console.log(`Size of mask image: ${sizeInKB.toFixed(2)} KB`)
  //       })
  //   }, [maskImg])

  return (
    <Box h="100vh" w="100vw" bg="blackAlpha.900" position="relative">
      <canvas ref={canvasRef} />
      {maskImg && (
        <Image
          src={maskImg.src}
          width={maskImg.width * samScale}
          height={maskImg.height * samScale}
          position="absolute"
          top="0"
          left="0"
          pointerEvents="none"
          opacity={0.9}
          bg="black"
        />
      )}
    </Box>
  )
}

