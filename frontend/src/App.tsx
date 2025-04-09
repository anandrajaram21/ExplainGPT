import { useState } from 'react'
import AttentionVisualization from './components/AttentionVisualization'
import './App.css'

function App() {
  const [prompt, setPrompt] = useState('')
  const [attentionData, setAttentionData] = useState(null)
  const [currentLayer, setCurrentLayer] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/attention?prompt=${encodeURIComponent(prompt)}`)
      const data = await response.json()
      setAttentionData(data)
      setCurrentLayer(0)
    } catch (error) {
      console.error('Error fetching attention data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <h1>Attention Visualization</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter text to visualize attention"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Visualize'}
        </button>
      </form>
      
      {attentionData && (
        <AttentionVisualization
          data={attentionData}
          layer={currentLayer}
          onLayerChange={setCurrentLayer}
        />
      )}
    </div>
  )
}

export default App