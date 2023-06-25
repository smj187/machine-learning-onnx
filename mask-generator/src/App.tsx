import { useEffect, useRef, useState } from "react"
import { fabric } from "fabric"
import { Box, Button, Divider, VStack } from "@chakra-ui/react"

type Mode = "point_pos" | "point_neg" | "box" | "mask" | null

type CustomImageOptions = fabric.IImageOptions & { maskUrl?: string }

class CustomImage extends fabric.Image {
  maskUrl?: string

  static fromURL(
    url: string,
    callback: (image: CustomImage) => void,
    imgOptions?: CustomImageOptions
  ) {
    fabric.util.loadImage(
      url,
      img => {
        callback(new CustomImage(img as HTMLImageElement, imgOptions))
      },
      null,
      imgOptions && imgOptions.crossOrigin
    )
  }

  initialize(element: HTMLImageElement | HTMLCanvasElement) {
    super.initialize(element)
    this.on("added", () => {
      if (this.maskUrl) {
        const mask = new Image()
        mask.src = this.maskUrl
        mask.onload = () => {
          const canvasEl = document.createElement("canvas")
          canvasEl.width = this.getScaledWidth()
          canvasEl.height = this.getScaledHeight()
          const ctx = canvasEl.getContext("2d")
          if (ctx) {
            ctx.drawImage(this._element, 0, 0, canvasEl.width, canvasEl.height)
            ctx.globalCompositeOperation = "destination-out"
            ctx.drawImage(mask, 0, 0, canvasEl.width, canvasEl.height)
            this._element.src = canvasEl.toDataURL()
            if (this.canvas) {
              this.opacity = 1
              this.canvas.renderAll() // Ensure the canvas is re-rendered once the mask is applied

              // const createEl = document.createElement("a")
              // createEl.href = this.toDataURL({ format: "png" })
              // createEl.download = `image.png`
              // createEl.click()
              // createEl.remove()
            }
          }
        }
      }
    })
  }
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pointArrayRef = useRef<fabric.Circle[]>([])
  const lineArrayRef = useRef<fabric.Line[]>([])
  const activeLineRef = useRef<fabric.Line | null>(null)
  const activeShapeRef = useRef<fabric.Polygon | null>(null)
  const modeRef = useRef<Mode>(null)
  const startPointer = useRef({ x: 0, y: 0 })
  const fabricCanvas = useRef<fabric.Canvas | null>(null)

  const addPoint = (options: fabric.IEvent, canvas: fabric.Canvas) => {
    const imgObj = canvas.getObjects().find(obj => obj.name === "_image")
    if (!imgObj) return

    const pointer = canvas.getPointer(options.e)
    const x = pointer.x
    const y = pointer.y

    // Check if the click occurred within the image boundaries
    if (
      x < imgObj.left! ||
      x > imgObj.left! + imgObj.getScaledWidth() ||
      y < imgObj.top! ||
      y > imgObj.top! + imgObj.getScaledHeight()
    ) {
      return
    }

    const random = Math.floor(Math.random() * (999999 - 99 + 1)) + 99
    const id = new Date().getTime() + random

    const circle = new fabric.Circle({
      radius: 5,
      fill: "#ffffff",
      stroke: "#333333",
      strokeWidth: 0.5,
      left: x / canvas.getZoom(),
      top: y / canvas.getZoom(),
      selectable: false,
      hasBorders: false,
      hasControls: false,
      originX: "center",
      originY: "center",
      id: id,
      name: "_polygon_point"
    })

    if (pointArrayRef.current.length === 0) {
      circle.set({ fill: "red" })
    }

    const points = [
      x / canvas.getZoom(),
      y / canvas.getZoom(),
      x / canvas.getZoom(),
      y / canvas.getZoom()
    ]

    const line = new fabric.Line(points, {
      strokeWidth: 2,
      fill: "#999999",
      stroke: "#999999",
      originX: "center",
      originY: "center",
      selectable: false,
      hasBorders: false,
      hasControls: false,
      evented: false
    })

    if (activeShapeRef.current) {
      const pos = canvas.getPointer(options.e)
      const polygonPoints = activeShapeRef.current.get("points") ?? []
      polygonPoints.push(new fabric.Point(pos.x, pos.y))

      const polygon = new fabric.Polygon(polygonPoints, {
        stroke: "#333333",
        strokeWidth: 1,
        fill: "#cccccc",
        opacity: 0.1,
        selectable: false,
        hasBorders: false,
        hasControls: false,
        evented: false
      })

      canvas.remove(activeShapeRef.current)
      canvas.add(polygon)
      activeShapeRef.current = polygon
      canvas.renderAll()
    } else {
      const polyPoint = [
        {
          x: x / canvas.getZoom(),
          y: y / canvas.getZoom()
        }
      ]
      const polygon = new fabric.Polygon(polyPoint, {
        stroke: "#333333",
        strokeWidth: 1,
        fill: "#cccccc",
        opacity: 0.1,
        selectable: false,
        hasBorders: false,
        hasControls: false,
        evented: false
      })

      activeShapeRef.current = polygon
      canvas.add(polygon)
    }

    activeLineRef.current = line
    pointArrayRef.current.push(circle)
    lineArrayRef.current.push(line)
    canvas.add(line)
    canvas.add(circle)
    canvas.selection = false
  }

  const generatePolygon = (canvas: fabric.Canvas) => {
    if (!activeShapeRef.current || !activeLineRef.current) return
    const polygonPoints = pointArrayRef.current.map(point => ({
      x: point.left ?? 0,
      y: point.top ?? 0
    }))

    lineArrayRef.current.forEach(value => {
      canvas.remove(value)
    })

    canvas.remove(activeShapeRef.current).remove(activeLineRef.current)

    const polygon = new fabric.Polygon(polygonPoints, {
      stroke: "red",
      strokeWidth: 4,
      fill: "transparent",
      opacity: 1,
      hasBorders: false,
      hasControls: false
    })

    canvas
      .getObjects()
      .filter(obj => obj.name === "_polygon_point")
      .forEach(obj => {
        canvas.remove(obj)
      })

    canvas.add(polygon)

    activeLineRef.current = null
    activeShapeRef.current = null
    canvas.selection = true
    modeRef.current = null

    pointArrayRef.current = []
    lineArrayRef.current = []

    const imgObj = canvas.getObjects().find(obj => obj.name === "_image")
    if (!imgObj) return

    // download a mask image based on the created polygon
    // the inner content of the polygon should be the empty mask content and the outer content of the
    // polygon should be black
    // make sure to respect the original image dimensions
  }

  // canvas.on("mouse:down", options => {
  //   if (modeRef.current === "mask") {
  //     onMouseDown(options, canvas)
  //   }
  //   if (modeRef.current === "box") {
  //     onMouseDownBox(options, canvas)
  //   }

  //   if (modeRef.current === "point_pos") {
  //     onMouseDownPoint(options, canvas, "positiv")
  //   }
  //   if (modeRef.current === "point_neg") {
  //     onMouseDownPoint(options, canvas, "negativ")
  //   }
  // })

  // canvas.on("mouse:move", options => {
  //   if (modeRef.current === "mask") {
  //     onMouseMove(options, canvas)
  //   }
  //   if (modeRef.current === "box") {
  //     onMouseMoveBox(options, canvas)
  //   }
  // })

  // canvas.on("mouse:up", options => {
  //   if (modeRef.current === "box") {
  //     onMouseUpBox(canvas)
  //   }
  // })

  const onMouseDown = (options: fabric.IEvent, canvas: fabric.Canvas) => {
    if (
      options.target &&
      pointArrayRef.current[0] &&
      options.target.id === pointArrayRef.current[0].id
    ) {
      generatePolygon(canvas)
    } else {
      addPoint(options, canvas)
    }
  }

  const onMouseMove = (options: fabric.IEvent, canvas: fabric.Canvas) => {
    if (!activeLineRef.current || !activeShapeRef.current) return

    const pointer = canvas.getPointer(options.e)
    activeLineRef.current.set({ x2: pointer.x, y2: pointer.y })

    const points = activeShapeRef.current.get("points") ?? []
    points[pointArrayRef.current.length] = new fabric.Point(
      pointer.x,
      pointer.y
    )

    activeShapeRef.current.set({ points: points })
    canvas.renderAll()
  }

  const onMouseDownBox = (o: fabric.IEvent, canvas: fabric.Canvas) => {
    const pointer = canvas.getPointer(o.e)
    startPointer.current = { x: pointer.x, y: pointer.y }
    const rect = new fabric.Rect({
      name: "_box",
      left: startPointer.current.x,
      top: startPointer.current.y,
      fill: "transparent",
      stroke: "green",
      strokeWidth: 4,
      hasBorders: false,
      hasRotatingPoint: false,
      lockRotation: true,
      cornerSize: 12,
      cornerStyle: "circle",
      cornerStrokeColor: "green"
    })
    rect.setControlVisible("mtr", false) // Hide top rotation control
    canvas.selection = false
    canvas.add(rect)
    canvas.setActiveObject(rect)
  }

  const onMouseMoveBox = (o: fabric.IEvent, canvas: fabric.Canvas) => {
    const pointer = canvas.getPointer(o.e)
    const activeObj = canvas.getActiveObject() as fabric.Rect
    if (!activeObj) return
    activeObj.set("width", Math.abs(pointer.x - startPointer.current.x))
    activeObj.set("height", Math.abs(pointer.y - startPointer.current.y))
    activeObj.set("left", Math.min(pointer.x, startPointer.current.x))
    activeObj.set("top", Math.min(pointer.y, startPointer.current.y))
    canvas.renderAll()
  }

  const onMouseUpBox = (canvas: fabric.Canvas) => {
    const fabricImage = canvas.getObjects().find(obj => obj.name === "_image")
    if (!fabricImage) return

    modeRef.current = null
    canvas.selection = true

    const fabricBox = canvas
      .getObjects()
      .reverse()
      .find(obj => obj.name === "_box")
    if (!fabricBox) return

    const scaleX = fabricImage.scaleX ?? 1
    const scaleY = fabricImage.scaleY ?? 1

    const imageLeft = fabricImage.left || 0
    const imageTop = fabricImage.top || 0
    const boxLeft = fabricBox.left || 0
    const boxTop = fabricBox.top || 0

    const relativeLeft = (boxLeft - imageLeft) / scaleX
    const relativeTop = (boxTop - imageTop) / scaleY
    const relativeWidth = fabricBox.width / scaleX
    const relativeHeight = fabricBox.height / scaleY

    console.log([
      relativeLeft,
      relativeTop,
      relativeLeft + relativeWidth,
      relativeTop + relativeHeight
    ])
  }

  const onMouseDownPoint = (
    o: fabric.IEvent,
    canvas: fabric.Canvas,
    type: "positiv" | "negativ"
  ) => {
    const fabricImage = canvas.getObjects().find(obj => obj.name === "_image")
    if (!fabricImage) return

    const pointer = canvas.getPointer(o.e)
    if (!fabricImage.left || !fabricImage.top) return

    const posX = (pointer.x - fabricImage.left) / fabricImage.scaleX!
    const posY = (pointer.y - fabricImage.top) / fabricImage.scaleY!

    console.log([Math.round(posX), Math.round(posY)])

    const starPoints = Array(10)
      .fill(null)
      .map((_, i) => {
        const angle = (i * Math.PI) / 5
        const radius = i % 2 === 0 ? 15 : 7.5
        return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
      })

    const star = new fabric.Polygon(starPoints, {
      name: "_star",
      left: pointer.x,
      top: pointer.y,
      fill: type === "positiv" ? "green" : "red",
      stroke: "white",
      strokeWidth: 2,
      originX: "center",
      originY: "center",
      hasControls: false,
      data: {
        type,
        x: posX,
        y: posY
      }
    })

    canvas.add(star)
    canvas.renderAll()
  }

  const isDrawing = useRef<boolean>(false)
  const path = useRef<fabric.Path | null>(null)
  const image = useRef<fabric.Image | null>(null)
  const points = useRef<Array<{ x: number; y: number }>>([])
  const circles = useRef<Array<fabric.Circle>>([])

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      selection: true,
      renderOnAddRemove: true
    })

    const image = "/dogs.jpg"
    const mask = "/mask.png"
    CustomImage.fromURL(image, img => {
      const w = canvas.width ?? window.innerWidth
      const h = canvas.height ?? window.innerHeight
      const maxWidth = w * 0.8
      const maxHeight = h * 0.8
      const imgWidth = img.width ?? 1
      const imgHeight = img.height ?? 1
      const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight)

      img.set({
        opacity: 0,
        maskUrl: mask,
        name: "_image",
        left: w / 2 - (imgWidth * scale) / 2,
        top: h / 2 - (imgHeight * scale) / 2
      })

      img.selectable = false
      // img.stroke = "white"
      // img.strokeWidth = 2
      img.hoverCursor = "default"

      canvas.add(img)
      canvas.renderAll()
    })
    canvas.on("mouse:down", options => {
      // if (isDrawing.current && options.pointer) {
      //   const { x, y } = options.pointer
      //   const circle = new fabric.Circle({
      //     radius: 10,
      //     fill: "white",
      //     left: x,
      //     top: y,
      //     hasBorders: false,
      //     hasControls: false,
      //     originX: "center",
      //     originY: "center"
      //   })
      //   circles.current.push(circle)
      //   canvas.add(circle)
      //   const pathString = circles.current
      //     .map(circle => {
      //       const position = circle.getCenterPoint()
      //       return `${position.x},${position.y}`
      //     })
      //     .join("L")
      //   if (path.current) {
      //     canvas.remove(path.current)
      //   }
      //   path.current = new fabric.Path(`M${pathString}Z`, {
      //     name: "_path",
      //     fill: "#000",
      //     opacity: 0.5,
      //     stroke: "red",
      //     strokeWidth: 2,
      //     selectable: false,
      //     hasBorders: false,
      //     hasControls: false,
      //     hoverCursor: "default"
      //   })
      //   path.current.sendToBack()
      //   canvas.add(path.current)
      //   circle.bringToFront()
      //   canvas.requestRenderAll()
      //   circle.on("moving", function () {
      //     const pathString = circles.current
      //       .map(circle => {
      //         const position = circle.getCenterPoint()
      //         return `${position.x},${position.y}`
      //       })
      //       .join("L")
      //     if (path.current) {
      //       canvas.remove(path.current)
      //     }
      //     path.current = new fabric.Path(`M${pathString}Z`, {
      //       name: "_path",
      //       fill: "#000",
      //       stroke: "red",
      //       strokeWidth: 2,
      //       selectable: false,
      //       hasBorders: false,
      //       hasControls: false,
      //       hoverCursor: "default",
      //       opacity: 1
      //     })
      //     path.current?.sendToBack()
      //     canvas.add(path.current)
      //     circles.current.forEach(circle => {
      //       circle.bringToFront()
      //     })
      //     canvas.requestRenderAll()
      //   })
      // }
    })

    canvas.on("mouse:move", options => {})

    canvas.on("mouse:up", options => {})

    fabricCanvas.current = canvas
  }, [])

  function exportMask() {
    if (!fabricCanvas.current || !path.current || !image.current) return

    // 1. Clone the image
    image.current.clone((imageClone: fabric.Image) => {
      if (!path.current) return

      // Adjust the points of the path to be relative to the image
      const adjustedPathPoints = path.current.path.map((point: any) => {
        const adjustedPoint = [...point] // clone the point
        if (point[1] !== undefined && point[2] !== undefined) {
          adjustedPoint[1] = (point[1] - imageClone.left) / imageClone.scaleX
          adjustedPoint[2] = (point[2] - imageClone.top) / imageClone.scaleY
        }
        return adjustedPoint
      })

      console.log(adjustedPathPoints, path.current.width)

      // Create a new path with the adjusted points
      const pathClone = new fabric.Path(adjustedPathPoints, {
        fill: "white",
        stroke: undefined,
        strokeWidth: 0,
        left: -path.current.left / 2,
        top: 0
      })

      // Apply the path as a clip path to the image
      imageClone.clipPath = pathClone

      // Create a new canvas for the mask
      const maskCanvas = new fabric.StaticCanvas(null)
      maskCanvas.setWidth(imageClone.getScaledWidth())
      maskCanvas.setHeight(imageClone.getScaledHeight())
      maskCanvas.backgroundColor = "black" // the rest of the image is black

      // Adjust the imageClone's left and top to ensure it's positioned in the mask canvas as in the original canvas
      imageClone.set({
        left: 0,
        top: 0
      })

      // Add the clipped image to the mask canvas
      maskCanvas.add(imageClone)
      maskCanvas.renderAll()

      // 4. Export the mask as a .png file
      const maskImage = maskCanvas.toDataURL({ format: "png" })
      const link = document.createElement("a")
      link.href = maskImage
      link.download = "mask.png"
      link.click()
    })
  }

  return (
    <Box minH="100vh" w="100%" bg="blackAlpha.900" position="relative">
      {/* <VStack align="start" position="absolute" top="4" left="2" zIndex="4">
        <Button
          onClick={() => {
            modeRef.current = "mask"
            isDrawing.current = true
          }}
        >
          Start Drawing
        </Button>
        <Button
          onClick={() => {
            modeRef.current = "box"
          }}
        >
          Start Box
        </Button>

        <Button
          onClick={() => {
            modeRef.current = "point_pos"
          }}
        >
          + Point
        </Button>
        <Button
          onClick={() => {
            modeRef.current = "point_neg"
          }}
        >
          - Point
        </Button>
      </VStack> */}

      <Button
        position="absolute"
        top="2"
        left="2"
        onClick={() => {
          isDrawing.current = true
        }}
        zIndex="2"
      >
        Draw Polygon
      </Button>
      <Button
        zIndex="2"
        position="absolute"
        top="2"
        left="50"
        onClick={() => {
          isDrawing.current = false
          points.current = []
        }}
      >
        Stop Drawing
      </Button>
      <Button
        zIndex="2"
        position="absolute"
        top="24"
        left="50"
        onClick={exportMask}
      >
        export mask
      </Button>

      <canvas ref={canvasRef} />
    </Box>
  )
}

export default App

