import { ChangeEvent, useState } from "react"
import { Box, Image } from "@chakra-ui/react"

function App() {
  const [imageSrc, setImageSrc] = useState("")

  async function handleOnChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.item(0)
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("http://127.0.0.1:8000", {
      method: "POST",
      body: formData
    })

    if (!response.ok) {
      console.error("There was an error uploading the image")
      return
    }

    const blob = await response.blob()
    setImageSrc(URL.createObjectURL(blob))
  }

  return (
    <Box h="100vh" bg="gray.900" pos="relative">
      <input type="file" onChange={handleOnChange} />
      <Image src={imageSrc} />
    </Box>
  )
}

export default App

