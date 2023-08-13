import { useState } from 'react'
import reactLogo from './assets/react.svg'
import WebcamComponent from './components/WebcamComponent'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <WebcamComponent />
    </>
  )
}

export default App
