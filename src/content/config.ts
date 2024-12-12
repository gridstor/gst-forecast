import { defineCollection, z } from 'astro:content';

const forecastCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    region: z.string(),
    date: z.date(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
    chartData: z.string().optional(), // Path to the chart data
  }),
});

const presentationCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    slidesUrl: z.string(),
    description: z.string(),
    category: z.string(),
  }),
});

const documentationCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    lastUpdated: z.date(),
    category: z.string(),
    order: z.number(),
  }),
});

export const collections = {
  'forecasts': forecastCollection,
  'presentations': presentationCollection,
  'docs': documentationCollection,
};