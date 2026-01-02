import { useEffect } from 'react'
import './App.css'
import FileParser from './FileParser'
import { trackPageView } from './tracking.js'

function App() {
  useEffect(() => {
    // Track page view after component mounts
    trackPageView();
  }, []);

  return (
    <div className="app">
      <FileParser />
    </div>
  )
}

export default App
