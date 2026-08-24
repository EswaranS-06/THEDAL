import React from 'react';
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
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
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
