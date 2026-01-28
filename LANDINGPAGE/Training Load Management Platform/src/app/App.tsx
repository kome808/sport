import { useState, useEffect } from "react";
import { Header } from "@/app/components/Header";
import { Hero } from "@/app/components/Hero";
import { PainPoints } from "@/app/components/PainPoints";
import { Features } from "@/app/components/Features";
import { HowItWorks } from "@/app/components/HowItWorks";
import { WhoItsFor } from "@/app/components/WhoItsFor";
import { WhyChoose } from "@/app/components/WhyChoose";
import { CTA } from "@/app/components/CTA";
import { Footer } from "@/app/components/Footer";
import { GuidePage } from "@/app/components/GuidePage";

export default function App() {
  const [currentPage, setCurrentPage] = useState<"home" | "guide">("home");

  // Scroll to top when switching pages
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  // High-quality athlete and sports science images
  const images = {
    hero: "https://images.unsplash.com/photo-1700771784449-2bdfccf808f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3V0aCUyMGJhc2ViYWxsJTIwdGVhbXxlbnwxfHx8fDE3NjkyNzgwNjh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    feature1: "https://images.unsplash.com/photo-1766287453739-c3ffc3f37d05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdGhsZXRlJTIwdHJhaW5pbmclMjBleGVyY2lzZXxlbnwxfHx8fDE3NjkyNzg5Mjl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    feature2: "https://images.unsplash.com/photo-1754941622117-97957c5d669b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBpbmp1cnklMjBwaHlzaW90aGVyYXB5fGVufDF8fHx8MTc2OTI3ODk4MHww&ixlib=rb-4.1.0&q=80&w=1080",
    feature3: "https://images.unsplash.com/photo-1769095216548-7d022bfbf0a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3V0aCUyMGF0aGxldGUlMjB0cmFpbmluZyUyMGdyb3d0aHxlbnwxfHx8fDE3NjkyODAzNTF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    sports1: "https://images.unsplash.com/photo-1607310073276-9f48dec47340?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjb2xsYWdlJTIwbXVsdGlwbGV8ZW58MXx8fHwxNzY5MjgwODA1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    // Guide Page Images
    acwr: "https://images.unsplash.com/photo-1666537072206-6a7a01ecb7d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdGhsZXRlJTIwdHJhaW5pbmclMjBkYXRhJTIwdmlzdWFsaXphdGlvbiUyMGNoYXJ0fGVufDF8fHx8MTc2OTU3MTEzMHww&ixlib=rb-4.1.0&q=80&w=1080",
    rhr: "https://images.unsplash.com/photo-1605512929741-47c955fcaf5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMHdhdGNoJTIwaGVhcnQlMjByYXRlJTIwcHVsc2V8ZW58MXx8fHwxNzY5NTcxMTI5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    wellness: "https://images.unsplash.com/photo-1615934679271-1810698dfdfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdGhsZXRlJTIwc2xlZXBpbmclMjByZWNvdmVyeSUyMHJlc3R8ZW58MXx8fHwxNzY5NTcxMTI5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    srpe: "https://images.unsplash.com/photo-1551904589-571260211393?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2FjaCUyMHRyYWluaW5nJTIwY2xpcGJvYXJkJTIwc2Vzc2lvbiUyMHJwZXxlbnwxfHx8fDE3Njk1NzExMjl8MA&ixlib=rb-4.1.0&q=80&w=1080"
  };

  const handleGoToGuide = () => setCurrentPage("guide");
  const handleGoToHome = () => setCurrentPage("home");

  return (
    <div className="min-h-screen bg-black">
      <Header onGuideClick={handleGoToGuide} onHomeClick={handleGoToHome} />
      
      {currentPage === "home" ? (
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
            onGuideClick={handleGoToGuide}
          />
          <WhyChoose />
          <CTA />
          <Footer />
        </main>
      ) : (
        <GuidePage 
          onBack={handleGoToHome} 
          images={{
            acwr: images.acwr,
            rhr: images.rhr,
            wellness: images.wellness,
            srpe: images.srpe
          }}
        />
      )}
    </div>
  );
}