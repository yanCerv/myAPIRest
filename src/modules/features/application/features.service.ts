import { Injectable } from '@nestjs/common';

export interface AppFeature {
  id: string;
  title: string;
  type: string;
  isActive: boolean;
  imageUrl: string;
}

export interface AppFeaturesResponse {
  result: AppFeature[];
}

const FEATURES: readonly AppFeature[] = [
  {
    id: 'R4MOV-12',
    title: 'Cinema Movies',
    type: 'movies',
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1502033491742-0e11fb057e16?fit=crop&w=600&h=400',
  },
  {
    id: 'R4FOOT-9',
    title: 'FootBall',
    type: 'football',
    isActive: false,
    imageUrl: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?fit=crop&w=600&h=400',
  },
  {
    id: 'R4CONCERT-182',
    title: 'Concerts',
    type: 'concert',
    isActive: false,
    imageUrl: 'https://www.rollingstone.com/wp-content/uploads/2022/10/Post-Pandemic-and-Beyond-Looking-Ahead-to-the-Future-of-Live-Concerts.jpg?w=1581&h=1054&crop=1',
  },
  {
    id: 'R4EVENTS-201',
    title: 'Events',
    type: 'event',
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1503428593586-e225b39bddfe?fit=crop&w=600&h=400',
  },
  {
    id: 'R4THEATER-145',
    title: 'Theater',
    type: 'theater',
    isActive: true,
    imageUrl: 'https://img.freepik.com/vektoren-premium/froehliche-und-traurige-theatermasken-theaterszene-mit-roten-vorhaengen-illustration_302982-43.jpg?semt=ais_hybrid&w=600&h=400',
  },
  {
    id: 'W4FLY-891',
    title: 'Sky Tickets',
    type: 'flying',
    isActive: false,
    imageUrl: 'https://img.etimg.com/thumb/width-420,height-315,imgsize-27938,resizemode-75,msid-95116275/industry/transportation/airlines-/-aviation/delhi-airport-emerges-as-worlds-10th-busiest-airport-report/aviation.jpg',
  },
  {
    id: 'YQTRAIN-887',
    title: 'Train',
    type: 'train',
    isActive: false,
    imageUrl: 'https://images.unsplash.com/photo-1518281420975-50db6e5d0a97',
  },
];

@Injectable()
export class FeaturesService {
  list(): AppFeaturesResponse {
    return { result: FEATURES.map((feature) => ({ ...feature })) };
  }
}
