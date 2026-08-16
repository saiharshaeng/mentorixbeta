import Hero          from "../components/Hero";
import Recognition   from "../components/Recognition";
import LearningLoop  from "../components/LearningLoop";
import HowItWorks    from "../components/HowItWorks";
import AppScreenshots from "../components/AppScreenshots";
import Features      from "../components/Features";
import Testimonials  from "../components/Testimonials";
import Philosophy    from "../components/Philosophy";
import DonateSection from "../components/Donate";
import FAQ           from "../components/FAQ";
import FinalCTA      from "../components/FinalCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <Recognition />
      <LearningLoop />
      <HowItWorks />
      <AppScreenshots />
      <Features />
      <Testimonials />
      <Philosophy />
      <DonateSection />
      <FAQ />
      <FinalCTA />
    </>
  );
}
