import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProjectProvider } from './context/ProjectContext'
import { AppHeader, MobileTabBar, OfflineNotice } from './components/shell'
import HomePage from './pages/HomePage'
import CreatePage from './pages/CreatePage'
import StudioPage from './pages/StudioPage'
import ContentsPage from './pages/ContentsPage'
import BrandPage from './pages/BrandPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <ProjectProvider>
      <BrowserRouter>
        <AppHeader />
        <main className="min-h-screen bg-canvas-subtle pb-16 pt-16 md:pb-0">
          <OfflineNotice />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/create/:id" element={<CreatePage />} />
            <Route path="/projects/:id" element={<StudioPage />} />
            <Route path="/contents" element={<ContentsPage />} />
            <Route path="/brand" element={<BrandPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <MobileTabBar />
      </BrowserRouter>
    </ProjectProvider>
  )
}
