import axios from "axios";

interface TokenInfo {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: TokenInfo | null = null;

async function getSpotifyAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  // Get new token if expired or not cached
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      grant_type: "client_credentials",
    },
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
    },
    json: true,
  };

  const response = await axios.post(authOptions.url, authOptions.form, {
    headers: authOptions.headers,
  });

  // Cache the new token with expiration time (1 hour = 3600000 ms)
  tokenCache = {
    accessToken: response.data.access_token,
    expiresAt: Date.now() + 3540000, // Setting to 59 minutes for safety margin
  };

  return tokenCache.accessToken;
}

async function searchSpotify(query: string): Promise<SpotifySearchResult> {
  const accessToken = await getSpotifyAccessToken();

  const response = await axios.get("https://api.spotify.com/v1/search", {
    params: {
      q: query,
      type: "show",
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
}

export { searchSpotify };

export interface SpotifySearchResult {
  shows: Shows;
}

export interface Shows {
  href: string;
  limit: number;
  next: string;
  offset: number;
  previous: null;
  total: number;
  items: Item[];
}

export interface Item {
  available_markets: string[];
  copyrights: any[];
  description: string;
  html_description: string;
  explicit: boolean;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: Image[];
  is_externally_hosted: boolean;
  languages: string[];
  media_type: MediaType;
  name: string;
  publisher: string;
  type: Type;
  uri: string;
  total_episodes: number;
}

export interface ExternalUrls {
  spotify: string;
}

export interface Image {
  url: string;
  height: number;
  width: number;
}

export enum MediaType {
  Audio = "audio",
  Mixed = "mixed",
}

export enum Type {
  Show = "show",
}
