import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import { ChakraProvider } from "@chakra-ui/react"
import AppContextProvider from "./hooks/context"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <>
    {/* <React.StrictMode> */}
    <ChakraProvider>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </ChakraProvider>
    {/* </React.StrictMode> */}
  </>
)

