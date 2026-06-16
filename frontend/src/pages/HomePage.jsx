import React from 'react';
import Header from '../components/Header';
import HeroResizer from '../components/HeroResizer';
import UserFavorites from '../components/UserFavorites';
import ChromeExtensionBanner from '../components/ChromeExtensionBanner';
import InfoSections from '../components/InfoSections';
import FAQSection from '../components/FAQSection';
import MobileAppSection from '../components/MobileAppSection';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafaf7]">
      <Header />
      <main>
        <HeroResizer />
        <UserFavorites />
        <ChromeExtensionBanner />
        <InfoSections />
        <FAQSection />
        <MobileAppSection />
      </main>
      <Footer />
    </div>
  );
}
