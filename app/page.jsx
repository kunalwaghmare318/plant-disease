import ScrollReveal from '../components/ScrollReveal';
import Classifier from '../components/Classifier';

/*
 * Text content array — change ONLY this to update copy.
 * Each section gets one pinned viewport of scroll.
 */
const SECTIONS = [
  {
    number: '01',
    lines: ['Scan a leaf.', 'Know instantly.'],
    subcopy:
      'Upload a photo and get an instant diagnosis — no lab required.',
  },
  {
    number: '02',
    lines: ['Just your phone', 'camera.'],
    subcopy: 'No special equipment. Point, shoot, done.',
  },
  {
    number: '03',
    lines: ['Treatment tips', 'in seconds.'],
    subcopy:
      'Get actionable recommendations tailored to your plant and the disease detected.',
  },
  {
    number: '04',
    lines: ['Trained on 50,000+', 'real images.'],
    subcopy:
      'Built on the PlantVillage dataset, 38 classes, 14 crop species.',
  },
  {
    number: '05',
    lines: ['Catch disease early.', 'Seed to harvest.'],
    subcopy: 'Protect yield at every growth stage.',
  },
];

export default function Home() {
  return (
    <main className="bg-[#000] text-white">
      {/* 1. Native GSAP Pinned Hero Section */}
      <ScrollReveal
        sections={SECTIONS}
        videoSrc="/assets/video/hero-bg.mp4"
      />

      {/* 2. Embedded AI Diagnostics Terminal directly below Hero */}
      <Classifier />
    </main>
  );
}

