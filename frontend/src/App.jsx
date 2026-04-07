import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Console from './pages/Console'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<Console />} />
      </Routes>
    </BrowserRouter>
  )
}
