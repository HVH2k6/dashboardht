import { Routes, Route } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import DashboardOverview from './pages/Dashboard'
import Login from './pages/LoginPage'
import LanguageList from './pages/Language'
import LanguageCreatePage from './pages/Language/CreatePage'
import LanguageEditPage from './pages/Language/EditPage'
import TypeList from './pages/Type'
import TypeCreatePage from './pages/Type/CreatePage'
import TypeEditPage from './pages/Type/EditPage'
import CategoryList from './pages/Category'
import CategoryCreatePage from './pages/Category/CreatePage'
import CategoryEditPage from './pages/Category/EditPage'
import AttractionList from './pages/Attraction'
import AttractionCreatePage from './pages/Attraction/CreatePage'
import AttractionEditPage from './pages/Attraction/EditPage'
import UnitList from './pages/Unit'
import UnitCreatePage from './pages/Unit/CreatePage'
import UnitEditPage from './pages/Unit/EditPage'
import SellerApplicationList from './pages/SellerApplication'
import MyShopPage from './pages/MyShop'
import MyProductsPage from './pages/MyProducts'
import SellerReviewPage from './pages/SellerReview'
import LocalSpecialtyList from './pages/LocalSpecialty'
import LocalSpecialtyCreatePage from './pages/LocalSpecialty/CreatePage'
import LocalSpecialtyEditPage from './pages/LocalSpecialty/EditPage'
import CulturalArtList from './pages/CulturalArt'
import CulturalArtCreatePage from './pages/CulturalArt/CreatePage'
import CulturalArtEditPage from './pages/CulturalArt/EditPage'
import AdminReviewPage from './pages/Review'
import UserPage from './pages/User'
import BlogPage from './pages/Blog'

import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AdminLayout />}>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/users" element={<UserPage />} />
        <Route path="/seller-applications" element={<SellerApplicationList />} />

        {/* Seller Routes */}
        <Route path="/my-shop" element={<MyShopPage />} />
        <Route path="/my-products" element={<MyProductsPage />} />
        <Route path="/my-reviews" element={<SellerReviewPage />} />

        {/* Languages */}
        <Route path="/languages" element={<LanguageList />} />
        <Route path="/languages/create" element={<LanguageCreatePage />} />
        <Route path="/languages/edit/:code" element={<LanguageEditPage />} />

        {/* Types */}
        <Route path="/types" element={<TypeList />} />
        <Route path="/types/create" element={<TypeCreatePage />} />
        <Route path="/types/edit/:id" element={<TypeEditPage />} />

        {/* Categories */}
        <Route path="/categories" element={<CategoryList />} />
        <Route path="/categories/create" element={<CategoryCreatePage />} />
        <Route path="/categories/edit/:id" element={<CategoryEditPage />} />

        {/* Attractions */}
        <Route path="/attractions" element={<AttractionList />} />
        <Route path="/attractions/create" element={<AttractionCreatePage />} />
        <Route path="/attractions/edit/:id" element={<AttractionEditPage />} />

        {/* Units */}
        <Route path="/units" element={<UnitList />} />
        <Route path="/units/create" element={<UnitCreatePage />} />
        <Route path="/units/edit/:id" element={<UnitEditPage />} />
        {/* Local Specialty */}
        <Route path="/local-specialties" element={<LocalSpecialtyList />} />
        <Route path="/local-specialties/create" element={<LocalSpecialtyCreatePage />} />
        <Route path="/local-specialties/edit/:id" element={<LocalSpecialtyEditPage />} />

        {/* Cultural Art */}
        <Route path="/cultural-arts" element={<CulturalArtList />} />
        <Route path="/cultural-arts/create" element={<CulturalArtCreatePage />} />
        <Route path="/cultural-arts/edit/:id" element={<CulturalArtEditPage />} />

        {/* Reviews */}
        <Route path="/reviews" element={<AdminReviewPage />} />

        {/* Blogs */}
        <Route path="/blogs" element={<BlogPage />} />

      </Route>
    </Routes>
  )
}

export default App
