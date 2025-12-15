export interface CarouselContext {
  id: string;
  title: string;
  problem: string;
  signals: string[];
  visualType: 'flow' | 'network' | 'layers';
}

export const carouselContexts: CarouselContext[] = [
  {
    id: 'production',
    title: 'Production Systems at Scale',
    problem: 'Building reliable, maintainable systems that serve thousands of users under real constraints.',
    signals: ['async workflows', 'scale', 'constraints'],
    visualType: 'flow',
  },
  {
    id: 'intelligence',
    title: 'Intelligent & Agent-based Systems',
    problem: 'Designing reasoning architectures where agents coordinate, adapt, and execute with precision.',
    signals: ['agents', 'execution graphs', 'real-time'],
    visualType: 'network',
  },
  {
    id: 'perception',
    title: 'Perception & Real-time Constraints',
    problem: 'Creating systems that perceive, process, and respond faster than conscious thought.',
    signals: ['LiDAR', 'physics', 'real-time'],
    visualType: 'layers',
  },
];

export const sectionTitle = 'Where this mindset is applied';
