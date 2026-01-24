import { Header } from "@/app/components/Header";
import { Hero } from "@/app/components/Hero";
import { PainPoints } from "@/app/components/PainPoints";
import { Features } from "@/app/components/Features";
import { HowItWorks } from "@/app/components/HowItWorks";
import { WhoItsFor } from "@/app/components/WhoItsFor";
import { WhyChoose } from "@/app/components/WhyChoose";
import { CTA } from "@/app/components/CTA";
import { Footer } from "@/app/components/Footer";

export default function App() {
  // High-quality Asian athlete images from various sports
  const images = {
    hero: "https://images.unsplash.com/photo-1700771784449-2bdfccf808f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3V0aCUyMGJhc2ViYWxsJTIwdGVhbXxlbnwxfHx8fDE3NjkyNzgwNjh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    feature1: "https://images.unsplash.com/photo-1766287453739-c3ffc3f37d05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdGhsZXRlJTIwdHJhaW5pbmclMjBleGVyY2lzZXxlbnwxfHx8fDE3NjkyNzg5Mjl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    feature2: "https://images.unsplash.com/photo-1754941622117-97957c5d669b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBpbmp1cnklMjBwaHlzaW90aGVyYXB5fGVufDF8fHx8MTc2OTI3ODk4MHww&ixlib=rb-4.1.0&q=80&w=1080",
    feature3: "https://images.unsplash.com/photo-1769095216548-7d022bfbf0a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3V0aCUyMGF0aGxldGUlMjB0cmFpbmluZyUyMGdyb3d0aHxlbnwxfHx8fDE3NjkyODAzNTF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    sports1: "https://images.unsplash.com/photo-1607310073276-9f48dec47340?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjb2xsYWdlJTIwbXVsdGlwbGV8ZW58MXx8fHwxNzY5MjgwODA1fDA&ixlib=rb-4.1.0&q=80&w=1080"
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main>
        <Hero heroImage={images.hero} />
        <PainPoints />
        <Features 
          images={{
            feature1: images.feature1,
            feature2: images.feature2,
            feature3: images.feature3
          }} 
        />
        <HowItWorks />
        <WhoItsFor 
          images={{
            sports1: images.sports1
          }} 
        />
        <WhyChoose />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}