import { AppShell } from "@/components/AppShell";
import { HeroSlider } from "@/components/HeroSlider";
import { TasteMattersSection } from "@/components/TasteMattersSection";
import { CampaignSlider } from "@/components/CampaignSlider";
import { ProductCarousel } from "@/components/ProductCarousel";
import { FusiontecStory } from "@/components/FusiontecStory";
import { ServiceCards } from "@/components/ServiceCards";
import { RecipeSection } from "@/components/RecipeSection";
import { NewsList } from "@/components/NewsList";
import { MobileFooter } from "@/components/MobileFooter";
import { bestSellers, newArrivals } from "@/data/content";

export default function Home() {
  return (
    <AppShell>
      <HeroSlider />
      <TasteMattersSection />
      <CampaignSlider />
      <ProductCarousel
        eyebrow="RANKING"
        title="ベストセラー"
        products={bestSellers}
        showRanking
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
