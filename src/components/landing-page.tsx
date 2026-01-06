
"use client";

import React from 'react';
import Navbar from './landing-page/Navbar';
import Hero from './landing-page/Hero';
import FeatureSplit from './landing-page/FeatureSplit';
import Stats from './landing-page/Stats';
import Testimonials from './landing-page/Testimonials';
import FeatureTilted from './landing-page/FeatureTilted';
import FeatureGrid from './landing-page/FeatureGrid';
import Pricing from './landing-page/Pricing';
import DownloadApp from './landing-page/DownloadApp';
import Footer from './landing-page/Footer';

const SectionWrapper = ({
  children,
  className = "bg-app-bg",
  hasBorder = true
}: {
  children?: React.ReactNode;
  className?: string;
  hasBorder?: boolean;
}) => {
  return (
    <div className={`w-full ${className} ${hasBorder ? 'border-t border-gray-200' : ''}`}>
      <div className="max-w-7xl mx-auto border-x border-gray-200 bg-app-bg h-full relative">
        {children}
      </div>
    </div>
  );
};

// Adapted SectionWrapper to support NewCueme's logic of switching backgrounds
const NewCuemeSectionWrapper = ({
  children,
  className = "bg-white",
  hasBorder = true
}: {
  children?: React.ReactNode;
  className?: string;
  hasBorder?: boolean;
}) => {
  return (
    <div className={`w-full ${className} ${hasBorder ? 'border-t border-gray-200' : ''}`}>
      {/* 
         NewCueme has a "max-w-7xl mx-auto border-x border-gray-100 bg-white h-full relative" inner container.
         I will replicate that but with CueMeWeb border colors.
         Inner bg should be white to match NewCueme's clean look? Or app-bg?
         User said "NewCume as a template". NewCueme uses white inner. 
      */}
      <div className="max-w-7xl mx-auto border-x border-gray-200 bg-white h-full relative">
        {children}
      </div>
    </div>
  );
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden font-sans">
      <Navbar />
      <main className="pt-24">
        {/* Hero Section - White Sides */}
        <NewCuemeSectionWrapper className="bg-white" hasBorder={false}>
          <Hero />
        </NewCuemeSectionWrapper>

        {/* Feature Split - Diagonal Sides */}
        <NewCuemeSectionWrapper className="bg-diagonal-lines">
          <FeatureSplit />
        </NewCuemeSectionWrapper>

        {/* Feature Tilted - White Sides */}
        <NewCuemeSectionWrapper className="bg-white">
          <FeatureTilted />
        </NewCuemeSectionWrapper>

        {/* Feature Grid - Diagonal Sides */}
        <NewCuemeSectionWrapper className="bg-diagonal-lines">
          <FeatureGrid />
        </NewCuemeSectionWrapper>

        {/* Stats - White Sides */}
        <NewCuemeSectionWrapper className="bg-white">
          <Stats />
        </NewCuemeSectionWrapper>

        {/* Testimonials - Diagonal Sides */}
        <NewCuemeSectionWrapper className="bg-diagonal-lines">
          <Testimonials />
        </NewCuemeSectionWrapper>

        {/* Pricing - White Sides */}
        <NewCuemeSectionWrapper className="bg-white">
          <Pricing />
        </NewCuemeSectionWrapper>

        {/* Download App & Footer Container - Diagonal Sides */}
        <NewCuemeSectionWrapper className="bg-diagonal-lines" hasBorder={true}>
          <DownloadApp />
          {/* Footer Self-contained Card */}
          <Footer />
        </NewCuemeSectionWrapper>
      </main>
    </div>
  );
}
