import React, { useEffect } from 'react';
import Lenis from 'lenis';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProjectOverview } from './components/ProjectOverview';
import { ArchitectureSection } from './components/ArchitectureSection';
import { CurriculumSection } from './components/CurriculumSection';
import { SimulationEngine } from './components/SimulationEngine';
import { InstallationGuide } from './components/InstallationGuide';
import { LearningOpportunities } from './components/LearningOpportunities';
import { ContributionGuide } from './components/ContributionGuide';
import { CallToAction } from './components/CallToAction';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  useEffect(() => {
    // Respect user's motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Navbar Header */}
      <Header />

      {/* Main Content Sections */}
      <main className="flex-grow">
        {/* 1. Hero Above the Fold */}
        <Hero />

        {/* 2. Project Overview & CTF Comparison */}
        <ProjectOverview />

        {/* 3. 5-Node Cloud Range Architecture */}
        <ArchitectureSection />

        {/* 4. 14 Guided Labs & Progressive Curriculum */}
        <CurriculumSection />

        {/* 5. 1-Click Simulation Engine */}
        <SimulationEngine />

        {/* 6. Step-by-Step Installation Guide */}
        <InstallationGuide />

        {/* 7. Learning Opportunities & Job-Ready Skills */}
        <LearningOpportunities />

        {/* 8. Contribution & Community Guide */}
        <ContributionGuide />

        {/* 9. Final Call to Action */}
        <CallToAction />
      </main>

      {/* Footer with Creator Credit */}
      <Footer />
    </div>
  );
};

export default App;
