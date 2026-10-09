import ab_about from "../assets/images/ab_about.jpeg";

export type SeriesItem = {
  seriesId: string;
  title: string;
  image: string;
  summary?: string;
  createdAt?: string;
};

export const Series: SeriesItem[] = [
  {
    seriesId: "abs0001",
    title: "Christ In The Streets",
    image: ab_about,
    summary:
      "Stories and reflections about meeting people with the hope of Christ in everyday places.",
  },
];
