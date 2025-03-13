import { HeroSection } from "./blocks/hero-section-dark"


function Hero() {
  return (
    <HeroSection
      title=" 🎉 Trusted by 10,000+ Businesses"
      subtitle={{
        regular: "  AI-Powered  ",
        gradient: " Invoice Automation ",
      }}
      description=" Synex makes invoice management effortless. Set up in seconds, automate your entire workflow, and focus on growing your business."
      ctaText="Get Started"
      ctaHref="/signup"
      bottomImage={{
        dark: "/images/dashboard.png"
      }}
    />

  )
}
export { Hero}
