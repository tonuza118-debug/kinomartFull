import { Helmet } from 'react-helmet-async'
import Hero from '../components/home/Hero.jsx'
import CategoryGrid from '../components/home/CategoryGrid.jsx'
import ProductRail from '../components/home/ProductRail.jsx'
import PromoBanners from '../components/home/PromoBanners.jsx'
import Testimonials from '../components/home/Testimonials.jsx'
import Newsletter from '../components/home/Newsletter.jsx'

export default function Home() {
  return (
    <>
      <Helmet>
        <title>Kino Mart — Sharp. Premium. Fast.</title>
        <meta
          name="description"
          content="Shop premium electronics, wellness gear and lifestyle essentials on Kino Mart. Cash on delivery across Bangladesh."
        />
      </Helmet>

      <Hero />
      <CategoryGrid />
      <ProductRail
        eyebrow="Right now"
        title="Hot deals"
        subtitle="Limited-time prices on our most-loved gadgets."
        params={{ section_type: 'hot' }}
        viewAllTo="/shop?section=hot"
      />
      <PromoBanners />
      <ProductRail
        eyebrow="On the rise"
        title="Trending this week"
        params={{ section_type: 'trending' }}
        viewAllTo="/shop?section=trending"
      />
      <ProductRail
        eyebrow="Just landed"
        title="New arrivals"
        params={{ in_stock: true }}
        viewAllTo="/shop"
      />
      <Testimonials />
      <Newsletter />
    </>
  )
}
