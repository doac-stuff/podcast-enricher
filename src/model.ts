export interface PodcastEnriched {
  id: number;
  podcast_index_id: number | null;
  podcast_name: string | null;
  language: string | null;
  podcast_description: string | null;
  rss_feed_url: string | null;
  rss_categories: string | null;
  rss_total_episodes: number | null;
  rss_last_published_at: Date | null;
  host: string | null;
  author: string | null;
  owner: string | null;
  spotify_url: string | null;
  spotify_review_count: number | null;
  spotify_review_score: number | null;
  apple_podcast_url: string | null;
  apple_review_count: number | null;
  apple_review_score: number | null;
  youtube_channel_url: string | null;
  youtube_subscribers: number | null;
  youtube_average_views: number | null;
  youtube_total_episodes: number | null;
  youtube_recent_average_views: number | null;
  youtube_last_published_at: Date | null;
  stale: boolean;
}

export const emptyEnriched: PodcastEnriched = {
  id: -1, // Id of -1 will make the backend create a new entry
  podcast_index_id: null,
  podcast_name: null,
  language: null,
  podcast_description: null,
  rss_feed_url: null,
  rss_categories: null,
  rss_total_episodes: null,
  rss_last_published_at: null,
  host: null,
  author: null,
  owner: null,
  spotify_url: null,
  spotify_review_count: null,
  spotify_review_score: null,
  apple_podcast_url: null,
  apple_review_count: null,
  apple_review_score: null,
  youtube_channel_url: null,
  youtube_subscribers: null,
  youtube_average_views: null,
  youtube_total_episodes: null,
  youtube_recent_average_views: null,
  youtube_last_published_at: null,
  stale: false,
};

export interface PodcastsEnrichedPayload {
  items: PodcastEnriched[];
}
