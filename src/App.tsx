import './App.css'
import { Route, Routes, Navigate } from 'react-router-dom'
// import Home from './pages/home/index'
import Badges from './pages/badges'
import About from './pages/team'
import Home from './pages/home'
import Join from './pages/join'
import JoinThanks from './pages/join/thanks'

import BlogsPage from './pages/blogs'
import BlogDetail from './pages/blogs/detail'
import BlogsAdmin from './pages/blogs/admin'
import MerchPage from './pages/merch'
import MerchAdmin from './pages/merch/admin'
import MerchOrdersAdmin from './pages/admin/merch-orders'
import AdminActivity from './pages/admin/activity'
import AdminEngagement from './pages/admin/engagement'
import AdminBadgeOrders from './pages/admin/badge-orders'
import PrivacyPolicy from './pages/privacy'
import EventBadges from './pages/event'
import EventBadgePreviewStudio from './pages/event/previews'
import VespersInitiative from './pages/vespers'
import VespersGratitudeWall from './pages/vespers/gratitude-wall'
import ExposAndChaplaincy from './pages/expos'
import AnnualRunKidsEdition from './pages/run'
import RunRegistration from './pages/run/register'
import PaymentStatus from './pages/run/payment-status'
import PromoConfirmation from './pages/run/promo-confirmation'
import DonatePage from './pages/donate'
import DonationStatus from './pages/donate/status'
import AdminRunRegistrations from './pages/admin/run-registrations'
import AdminRunIpay from './pages/admin/run-ipay'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/badges" element={<Badges />} />
      <Route path="/about" element={<About />} />
      <Route path="/blogs" element={<BlogsPage />} />
      <Route path="/blogs/:slug" element={<BlogDetail />} />
      <Route path="/blogs/admin" element={<BlogsAdmin />} />
      <Route path="/merchandise" element={<MerchPage />} />
      <Route path="/merchandise/admin" element={<MerchAdmin />} />
      <Route path="/merch" element={<Navigate to="/merchandise" replace />} />
      <Route path="/merch/admin" element={<Navigate to="/merchandise/admin" replace />} />
      <Route path="/admin/merch-orders" element={<MerchOrdersAdmin />} />
      <Route path="/admin/activity" element={<AdminActivity />} />
      <Route path="/admin/engagement" element={<AdminEngagement />} />
      <Route path="/admin/badge-orders" element={<AdminBadgeOrders />} />
      <Route path="/join" element={<Join />} />
      <Route path="/join/thanks" element={<JoinThanks />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/event" element={<EventBadges />} />
      <Route path="/event/previews" element={<EventBadgePreviewStudio />} />
      <Route path="/vespers" element={<VespersInitiative />} />
      <Route path="/vespers/gratitude" element={<VespersGratitudeWall />} />
      <Route path="/ministry" element={<ExposAndChaplaincy />} />
      <Route path="/run" element={<AnnualRunKidsEdition />} />
      <Route path="/run/register" element={<RunRegistration />} />
      <Route path="/run/promo-confirmation" element={<PromoConfirmation />} />
      <Route path="/run/payment-status" element={<PaymentStatus />} />
      <Route path="/donate" element={<DonatePage />} />
      <Route path="/donate/status" element={<DonationStatus />} />
      <Route path="/admin/run-registrations" element={<AdminRunRegistrations />} />
      <Route path="/admin/run-ipay" element={<AdminRunIpay />} />
    </Routes>
  )
}

export default App
