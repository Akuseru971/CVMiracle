import { AppShell } from "@/components/AppShell";
import { HeroSlider } from "@/components/HeroSlider";
import { CategoryBrowseSection } from "@/components/CategoryBrowseSection";
import { FeatureSection } from "@/components/FeatureSection";
import { ProductCarousel } from "@/components/ProductCarousel";
import { FusiontecStory } from "@/components/FusiontecStory";
import { ServiceCards } from "@/components/ServiceCards";
import { RecipeSection } from "@/components/RecipeSection";
import { NewsList } from "@/components/NewsList";
import { MobileFooter } from "@/components/MobileFooter";
import { bestSellers, bestSellerFilters, newArrivals } from "@/data/content";

export default function Home() {
  return (
    <AppShell>
      <HeroSlider />
      <CategoryBrowseSection />
      <FeatureSection />
      <ProductCarousel
        id="best-sellers"
        eyebrow="RANKING"
        title="ベストセラー"
        products={bestSellers}
        showRanking
        filters={bestSellerFilters}
      />
      <FusiontecStory />
      <ProductCarousel
        eyebrow="NEW ARRIVALS"
        title="新着商品"
        products={newArrivals}
        tone="muted"
      />
      <ServiceCards />
      <RecipeSection />
      <NewsList />
      <MobileFooter />
    </AppShell>
  );
}
