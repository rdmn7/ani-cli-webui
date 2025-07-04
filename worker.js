// Cloudflare Worker for Ani-CLI Web Proxy
// This worker acts as a CORS proxy and implements ani-cli's video source fetching logic

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const ALLANIME_API = 'https://api.allanime.to';
const ALLANIME_BASE = 'allanime.to';
const ALLANIME_REFR = 'https://allanime.to';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Add CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (url.pathname === '/api') {
      // Proxy AllAnime API requests
      return await proxyAllAnimeAPI(url, corsHeaders);
    } else if (url.pathname === '/provider') {
      // Handle provider video source fetching
      return await fetchProviderSources(url, corsHeaders);
    } else {
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    }
  } catch (error) {
    console.error('Worker error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function proxyAllAnimeAPI(url, corsHeaders) {
  const targetUrl = `${ALLANIME_API}/api${url.search}`;
  
  const response = await fetch(targetUrl, {
    headers: {
      'Referer': ALLANIME_REFR,
      'User-Agent': USER_AGENT,
    }
  });

  const data = await response.text();
  
  return new Response(data, {
    status: response.status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    }
  });
}

async function fetchProviderSources(url, corsHeaders) {
  const providerUrl = url.searchParams.get('url');
  if (!providerUrl) {
    return new Response(JSON.stringify({ error: 'Missing provider URL' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const links = await getVideoLinks(providerUrl);
    
    return new Response(JSON.stringify({
      success: true,
      links: links
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function getVideoLinks(providerUrl) {
  const response = await fetch(`https://${ALLANIME_BASE}${providerUrl}`, {
    headers: {
      'Referer': ALLANIME_REFR,
      'User-Agent': USER_AGENT,
    }
  });

  if (!response.ok) {
    throw new Error(`Provider request failed: ${response.status}`);
  }

  const responseText = await response.text();
  const links = [];

  try {
    // Parse JSON response to extract video links
    const jsonData = JSON.parse(responseText);
    
    // Handle different response formats
    if (jsonData.links) {
      // Direct links format
      for (const link of jsonData.links) {
        if (link.link && link.resolutionStr) {
          links.push({
            quality: link.resolutionStr,
            url: link.link,
            type: link.link.includes('.m3u8') ? 'm3u8' : 'mp4'
          });
        }
      }
    } else if (jsonData.data) {
      // Alternative data format
      for (const item of jsonData.data) {
        if (item.file) {
          links.push({
            quality: item.label || 'unknown',
            url: item.file,
            type: item.file.includes('.m3u8') ? 'm3u8' : 'mp4'
          });
        }
      }
    }
  } catch (jsonError) {
    // If not JSON, try to extract links using regex patterns
    const linkPatterns = [
      /"link":"([^"]*)".*?"resolutionStr":"([^"]*)"/g,
      /"file":"([^"]*)".*?"label":"([^"]*)"/g,
      /"url":"([^"]*)".*?"quality":"([^"]*)"/g
    ];

    for (const pattern of linkPatterns) {
      let match;
      while ((match = pattern.exec(responseText)) !== null) {
        links.push({
          quality: match[2] || 'unknown',
          url: match[1],
          type: match[1].includes('.m3u8') ? 'm3u8' : 'mp4'
        });
      }
    }
  }

  // Handle special cases like wixmp
  if (providerUrl.includes('wixmp') || responseText.includes('repackager.wixmp.com')) {
    const wixmpLinks = extractWixmpLinks(responseText);
    links.push(...wixmpLinks);
  }

  // Handle m3u8 playlists
  if (providerUrl.includes('.m3u8') || responseText.includes('master.m3u8')) {
    const m3u8Links = await extractM3u8Links(responseText, providerUrl);
    links.push(...m3u8Links);
  }

  // Extract subtitles if available
  const subtitleMatch = responseText.match(/"subtitles":\[.*?"src":"([^"]*)".*?\]/);
  if (subtitleMatch) {
    links.forEach(link => {
      link.subtitles = subtitleMatch[1];
    });
  }

  return links;
}

function extractWixmpLinks(responseText) {
  const links = [];
  
  // Extract wixmp video URLs
  const wixmpPattern = /repackager\.wixmp\.com\/[^"]*\.urlset[^"]*/g;
  const matches = responseText.match(wixmpPattern);
  
  if (matches) {
    for (const match of matches) {
      const baseUrl = match.replace('repackager.wixmp.com/', '').replace(/\.urlset.*/, '');
      const qualityPattern = /,([^,/]*),/g;
      let qualityMatch;
      
      while ((qualityMatch = qualityPattern.exec(match)) !== null) {
        const quality = qualityMatch[1];
        const videoUrl = baseUrl.replace(/,[^/]*/, quality);
        
        links.push({
          quality: quality + 'p',
          url: videoUrl,
          type: 'mp4'
        });
      }
    }
  }
  
  return links;
}

async function extractM3u8Links(responseText, baseUrl) {
  const links = [];
  
  try {
    // Extract m3u8 playlist URL
    const m3u8Match = responseText.match(/https?:\/\/[^"]*\.m3u8[^"]*/);
    if (!m3u8Match) return links;
    
    const playlistUrl = m3u8Match[0];
    const refererMatch = responseText.match(/"Referer":"([^"]*)"/);
    const referer = refererMatch ? refererMatch[1] : ALLANIME_REFR;
    
    // Fetch the m3u8 playlist
    const playlistResponse = await fetch(playlistUrl, {
      headers: {
        'Referer': referer,
        'User-Agent': USER_AGENT,
      }
    });
    
    if (!playlistResponse.ok) return links;
    
    const playlistText = await playlistResponse.text();
    
    // Parse m3u8 playlist
    const lines = playlistText.split('\n');
    const baseUrlM3u8 = playlistUrl.substring(0, playlistUrl.lastIndexOf('/') + 1);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('#EXT-X-STREAM-INF:')) {
        // Extract quality information
        const resolutionMatch = line.match(/RESOLUTION=\d+x(\d+)/);
        const quality = resolutionMatch ? resolutionMatch[1] : 'unknown';
        
        // Get the next line which should contain the stream URL
        const streamLine = lines[i + 1]?.trim();
        if (streamLine && !streamLine.startsWith('#')) {
          const streamUrl = streamLine.startsWith('http') ? streamLine : baseUrlM3u8 + streamLine;
          
          links.push({
            quality: quality + 'p',
            url: streamUrl,
            type: 'm3u8',
            subtitles: null // Will be added separately if found
          });
        }
      }
    }
  } catch (error) {
    console.error('Error extracting m3u8 links:', error);
  }
  
  return links;
}