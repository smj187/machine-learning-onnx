import { useEffect, useRef } from "react"
import { fabric } from "fabric"
import { Button, Box } from "@chakra-ui/react"

export function Mask() {
  const imageCanvasRef = useRef(null)
  const fabricCanvas = useRef<fabric.Canvas | null>(null)

  useEffect(() => {
    if (!imageCanvasRef.current) return

    const canvas = new fabric.Canvas(imageCanvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      selection: true,
      renderOnAddRemove: true
    })

    const image = "/product.jpg"

    fabric.Image.fromURL(image, img => {
      img.name = "_image"
      img.selectable = false
      img.left = 300
      img.top = 300
      canvas.setZoom(0.5)
      canvas.add(img)
      canvas.renderAll()

      fabricCanvas.current = canvas

      // Set up brush settings
      canvas.isDrawingMode = true
      canvas.freeDrawingBrush.color = "red"
      canvas.freeDrawingBrush.width = 50 / 0.5

      const rect = new fabric.Rect({
        left: img.left,
        top: img.top,
        width: img.width,
        height: img.height,
        fill: "#000"
      })
      canvas.add(rect)
      img.bringToFront()
      canvas.renderAll()
    })
  }, [])

  function handleExport() {
    if (!fabricCanvas.current) return

    const canvasState = fabricCanvas.current.toJSON(["name"])

    const cloneCanvas = new fabric.Canvas(null, {})

    cloneCanvas.loadFromJSON(canvasState, () => {
      const img = cloneCanvas.getObjects().find(o => o instanceof fabric.Image)
      if (!img) return
      cloneCanvas.remove(img)

      cloneCanvas.renderAll()

      const dataUrl = cloneCanvas.toDataURL({
        format: "png",
        quality: 1,
        left: 300,
        top: 300,
        width: img.width,
        height: img.height
      })

      // Create a link to download the mask
      const link = document.createElement("a")
      link.download = "mask.png"
      link.href = dataUrl
      link.click()
    })
  }

  return (
    <Box minH="100vh" w="100%" bg="blackAlpha.900" position="relative">
      <Button
        onClick={handleExport}
        position="absolute"
        top="2"
        left="2"
        zIndex="2"
      >
        export mask
      </Button>

      <canvas ref={imageCanvasRef} />
    </Box>
  )
}
