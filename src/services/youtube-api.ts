import { apiRequest } from './api-client';
export type YouTubeStatus = {connected:boolean; reauthRequired:boolean};
export type PlaylistResult = {playlistId:string;playlistUrl:string;title:string;trackCount:number};
export const youtubeStatus = () => apiRequest<YouTubeStatus>('/integrations/youtube/status');
export const authorizeYouTube = () => apiRequest<{authorizationUrl:string}>('/integrations/youtube/authorize',{method:'POST'});
export const connectYouTube = (code:string,state:string) => apiRequest<{connected:boolean}>('/integrations/youtube/connect',{method:'POST',body:{authorizationCode:code,state}});
export const createPlaylist = (id:string) => apiRequest<PlaylistResult>(`/memories/${encodeURIComponent(id)}/playlist`,{method:'POST',timeoutMs:120_000});
export const resumePlaylist = (id:string) => apiRequest<PlaylistResult>(`/memories/${encodeURIComponent(id)}/playlist/resume`,{method:'POST',timeoutMs:120_000});
