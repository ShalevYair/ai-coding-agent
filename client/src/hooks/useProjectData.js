import { useState } from 'react';
import axios from 'axios';
import { parseMapData } from '../utils/mapUtils';

export function useProjectData({ githubToken, owner, selectedRepo }) {
  const [showReadme, setShowReadme] = useState(false);
  const [readmeContent, setReadmeContent] = useState('');
  const [readmeLoading, setReadmeLoading] = useState(false);

  const [showMap, setShowMap] = useState(false);
  const [mapData, setMapData] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapRefreshing, setMapRefreshing] = useState(false);
  const [selectedMapFile, setSelectedMapFile] = useState(null);

  const fetchReadme = async () => {
    setShowReadme(true);
    setReadmeLoading(true);
    try {
      const res = await axios.get('/api/file', {
        params: { owner, repo: selectedRepo, path: 'README.md' },
        headers: { 'x-github-token': githubToken }
      });
      setReadmeContent(res.data.content || 'הקובץ ריק.');
    } catch (e) {
      setReadmeContent('לא נמצא קובץ README.md בפרויקט זה.');
    }
    setReadmeLoading(false);
  };

  const fetchProjectMap = async () => {
    setShowMap(true);
    setMapLoading(true);
    setSelectedMapFile(null);
    try {
      const res = await axios.get('/api/file', {
        params: { owner, repo: selectedRepo, path: 'project_map.json' },
        headers: { 'x-github-token': githubToken }
      });
      setMapData(parseMapData(res.data.content));
    } catch (e) {
      setMapData(null);
    }
    setMapLoading(false);
  };

  const refreshProjectMap = async (aiKey) => {
    setMapRefreshing(true);
    try {
      const res = await axios.post('/api/scan-project',
        { context: { owner, repo: selectedRepo } },
        { headers: { 'x-ai-key': aiKey, 'x-github-token': githubToken } }
      );
      if (res.data.mapData) {
        setMapData(res.data.mapData);
      } else {
        const fileRes = await axios.get('/api/file', {
          params: { owner, repo: selectedRepo, path: 'project_map.json' },
          headers: { 'x-github-token': githubToken }
        });
        setMapData(parseMapData(fileRes.data.content));
      }
    } catch (e) {
      console.error('Refresh map failed:', e);
    }
    setMapRefreshing(false);
  };

  const closeMap = () => {
    setShowMap(false);
    setSelectedMapFile(null);
  };

  // Load map data silently (no modal) — used by context files modal
  const ensureMapLoaded = async () => {
    if (mapData) return;
    try {
      const res = await axios.get('/api/file', {
        params: { owner, repo: selectedRepo, path: 'project_map.json' },
        headers: { 'x-github-token': githubToken }
      });
      setMapData(parseMapData(res.data.content));
    } catch (e) { /* project_map.json may not exist */ }
  };

  return {
    showReadme, setShowReadme, readmeContent, readmeLoading, fetchReadme,
    showMap, closeMap, mapData, mapLoading, mapRefreshing, selectedMapFile, setSelectedMapFile,
    fetchProjectMap, refreshProjectMap, ensureMapLoaded
  };
}
