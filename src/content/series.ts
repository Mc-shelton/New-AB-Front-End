import ab_about from "../assets/images/ab_about.jpeg";

export type SeriesItem = {
  seriesId: string;
  title: string;
  image: string;
  summary?: string;
};

export const Series: SeriesItem[] = [
  {
    seriesId: "secular-witness",
    title: "Secular Witness",
    image: ab_about,
    summary:
      "A series exploring how to live out the gospel in secular spaces, with practical insights and reflections from the Advent Band community.",
  },
];