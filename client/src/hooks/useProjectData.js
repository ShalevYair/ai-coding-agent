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

  const closeMap = () => {
    setShowMap(false);
    setSelectedMapFile(null);
  };

  return {
    showReadme, setShowReadme, readmeContent, readmeLoading, fetchReadme,
    showMap, closeMap, mapData, mapLoading, selectedMapFile, setSelectedMapFile, fetchProjectMap
  };
}
