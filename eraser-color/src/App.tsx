import { useEffect, useRef, useState } from "react"
import { Box } from "@chakra-ui/react"
import { fabric } from "fabric"

const GRID_SIZE = 32

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || !bgCanvasRef.current)
      return

    const { width, height } = containerRef.current.getBoundingClientRect()

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: width,
      height: height,
      selection: true,
      renderOnAddRemove: true
    })

    addControlls(canvas)
    const bgCanvas = new fabric.StaticCanvas(bgCanvasRef.current, {
      width: width,
      height: height
    })

    // canvas.setZoom(1)
    canvas.requestRenderAll()

    fabric.util.loadImage("/pattern.svg", img => {
      bgCanvas.backgroundColor = new fabric.Pattern({
        source: img,
        repeat: "repeat"
      })
      bgCanvas.renderAll()
    })

    canvas.on("mouse:wheel", event => {
      canvas.discardActiveObject()
      const delta = event.e.deltaY

      let zoom = canvas.getZoom()
      zoom *= 0.999 ** delta

      canvas.setZoom(zoom)

      bgCanvas.setZoom(zoom)
      bgCanvas.requestRenderAll()

      canvas.requestRenderAll()
    })

    canvas.on("object:moving", event => {
      const target = event.target
      if (!target) return

      if (target.name === "_image" && !(event.e.shiftKey || event.e.ctrlKey)) {
        const halfWidth = target.getScaledWidth() / 2
        const halfHeight = target.getScaledHeight() / 2

        const zoom = target.scaleX

        const left =
          halfWidth +
          Math.round((target.left! - halfWidth) / GRID_SIZE) * GRID_SIZE

        const top =
          halfHeight +
          Math.round((target.top! - halfHeight) / GRID_SIZE) * GRID_SIZE

        target.set({ left, top })
      }
    })

    setTimeout(() => {
      fabric.Image.fromURL("/image.jpg", function (img) {
        const width = img.width ?? 1
        const height = img.height ?? 1

        const cols = Math.floor(canvas.getWidth() / GRID_SIZE)
        const rows = Math.floor(canvas.getHeight() / GRID_SIZE)

        const scaleWidth = (canvas.getWidth() * 0.8) / width
        const scaleHeight = (canvas.getHeight() * 0.8) / height

        // custom zoom for large image
        const z = Math.min(scaleWidth, scaleHeight)
        img.scale(z)

        // correct for centerX and centerY positioning
        const correctWidth = (width * z) / 2
        const correctHeight = (height * z) / 2

        // calc offset based on total cols and cols used by the image
        const offsetX = Math.round((cols - (width * z) / GRID_SIZE) / 2)
        const offsetY = Math.round((rows - (height * z) / GRID_SIZE) / 2)

        img.set({
          name: "_image",
          hoverCursor: "default",
          width: img.width,
          height: img.height,
          hasBorders: false,
          originX: "center",
          originY: "center",
          left: correctWidth + offsetX * GRID_SIZE,
          top: correctHeight + offsetY * GRID_SIZE
        })

        canvas.add(img).requestRenderAll()
      })
    }, 500)
  }, [containerRef, canvasRef, bgCanvasRef])

  return (
    <Box h="100vh" w="100vw" overflow="hidden">
      <Box bg="black" w="100%" h="100%" ref={containerRef}>
        <canvas
          ref={bgCanvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            userSelect: "none"
          }}
        />
        <canvas ref={canvasRef} />
      </Box>
    </Box>
  )
}

export default App

function addControlls(canvas: fabric.Canvas) {
  fabric.Object.prototype.controls.tl.offsetX = -1
  fabric.Object.prototype.controls.tl.offsetY = -1
  fabric.Object.prototype.controls.tr.offsetX = 1
  fabric.Object.prototype.controls.tr.offsetY = -1
  fabric.Object.prototype.controls.bl.offsetX = -1
  fabric.Object.prototype.controls.bl.offsetY = 1
  fabric.Object.prototype.controls.br.offsetX = 1
  fabric.Object.prototype.controls.br.offsetY = 1
  fabric.Object.prototype.transparentCorners = false
  fabric.Object.prototype.cornerStyle = "circle"
  fabric.Object.prototype.cornerColor = "#fff"
  fabric.Object.prototype.cornerSize = 10

  let isRotating = false

  const originalControl = fabric.Object.prototype.controls.mtr
  const actionHandler = (
    eventData: MouseEvent,
    transformData: fabric.Transform,
    x: number,
    y: number
  ) => {
    if (!isRotating) {
      // console.log("Init")
      isRotating = true
      const onMouseUp = () => {
        isRotating = false
        // console.log("reset")

        document.removeEventListener("mouseup", onMouseUp)
      }

      document.addEventListener("mouseup", onMouseUp)
    }

    return originalControl.actionHandler(eventData, transformData, x, y)
  }

  function renderIcon(icon: CanvasImageSource) {
    return function renderIcon(
      ctx: CanvasRenderingContext2D,
      left: number,
      top: number,
      styleOverride: unknown,
      fabricObject: fabric.Object
    ) {
      var size = 28
      ctx.save()
      ctx.translate(left, top)
      ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle ?? 0))
      ctx.drawImage(icon, -size / 2, -size / 2, size, size)
      ctx.restore()
    }
  }

  // canvas.on("object:rotating", fEvent => {
  //   if (!fEvent.target) return

  //   const angle = fEvent.target.angle ?? 0

  //   // bottom snap
  //   if (angle > 355 || angle < 5) {
  //     fEvent.target.angle = 0
  //   }

  //   // left snap
  //   if (angle > 85 && angle < 95) {
  //     fEvent.target.angle = 90
  //   }

  //   // top snap
  //   if (angle > 175 && angle < 185) {
  //     fEvent.target.angle = 180
  //   }

  //   // right snap
  //   if (angle > 265 && angle < 275) {
  //     fEvent.target.angle = 270
  //   }
  // })

  // create controls
  const rotateIcon =
    "data:image/svg+xml;base64,PHN2ZyBpZD0iU3ZnanNTdmcxMDAxIiB3aWR0aD0iMjg4IiBoZWlnaHQ9IjI4OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWxuczpzdmdqcz0iaHR0cDovL3N2Z2pzLmNvbS9zdmdqcyI+PGRlZnMgaWQ9IlN2Z2pzRGVmczEwMDIiPjwvZGVmcz48ZyBpZD0iU3ZnanNHMTAwOCIgdHJhbnNmb3JtPSJtYXRyaXgoMSwwLDAsMSwwLDApIj48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMjg4IiBoZWlnaHQ9IjI4OCI+PHBhdGggZD0iTTE2Ljg5LDE1LjVMMTguMzEsMTYuODlDMTkuMjEsMTUuNzMgMTkuNzYsMTQuMzkgMTkuOTMsMTNIMTcuOTFDMTcuNzcsMTMuODcgMTcuNDMsMTQuNzIgMTYuODksMTUuNU0xMywxNy45VjE5LjkyQzE0LjM5LDE5Ljc1IDE1Ljc0LDE5LjIxIDE2LjksMTguMzFMMTUuNDYsMTYuODdDMTQuNzEsMTcuNDEgMTMuODcsMTcuNzYgMTMsMTcuOU0xOS45MywxMUMxOS43Niw5LjYxIDE5LjIxLDguMjcgMTguMzEsNy4xMUwxNi44OSw4LjUzQzE3LjQzLDkuMjggMTcuNzcsMTAuMTMgMTcuOTEsMTFNMTUuNTUsNS41NUwxMSwxVjQuMDdDNy4wNiw0LjU2IDQsNy45MiA0LDEyQzQsMTYuMDggNy4wNSwxOS40NCAxMSwxOS45M1YxNy45MUM4LjE2LDE3LjQzIDYsMTQuOTcgNiwxMkM2LDkuMDMgOC4xNiw2LjU3IDExLDYuMDlWMTBMMTUuNTUsNS41NVoiIGZpbGw9IiNlMmU4ZjAiIGNsYXNzPSJjb2xvcjAwMCBzdmdTaGFwZSI+PC9wYXRoPjwvc3ZnPjwvZz48L3N2Zz4="

  const rotateImg = document.createElement("img")
  rotateImg.src = rotateIcon

  fabric.Object.prototype.controls.mtr1 = new fabric.Control({
    x: -0.5,
    y: 0.5,
    offsetY: 30,
    offsetX: -30,
    withConnection: false,
    actionName: "rotate",
    cursorStyle: "pointer",
    render: renderIcon(rotateImg),
    actionHandler: actionHandler
  })

  fabric.Object.prototype.setControlsVisibility({
    tl: true, //top-left
    mt: false, // middle-top
    tr: true, //top-right
    ml: false, //middle-left
    mr: false, //middle-right
    bl: true, // bottom-left
    mb: false, //middle-bottom
    br: true, //bottom-right
    mtr: false // rotate icon
  })
}

// const cols = Math.ceil(width / GRID_SIZE)
// const rows = Math.ceil(height / GRID_SIZE)

// for (let i = 0; i < cols + 1; i++) {
//   for (let j = 0; j < rows + 1; j++) {
//     bgCanvas.add(
//       new fabric.Circle({
//         left: i * GRID_SIZE - 1,
//         top: j * GRID_SIZE - 1,
//         radius: 1,
//         fill: "RGBA(255, 255, 255, 0.48)",
//         selectable: false
//       })
//     )
//   }
// }

// Add grid
// for (let i = 0; i < cols; i++) {
//   bgCanvas.add(
//     new fabric.Line([i * GRID_SIZE, 0, i * GRID_SIZE, bgCanvas.height!], {
//       stroke: "RGBA(255, 255, 255, 0.08)",
//       selectable: false
//     })
//   )
// }
// for (let i = 0; i < rows; i++) {
//   bgCanvas.add(
//     new fabric.Line([0, i * GRID_SIZE, bgCanvas.width!, i * GRID_SIZE], {
//       stroke: "RGBA(255, 255, 255, 0.08)",
//       selectable: false
//     })
//   )
// }

