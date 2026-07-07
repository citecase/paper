const axios = require('axios');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required.' });
  }

  try {
    // Validate URL format
    const parsedUrl = new URL(url);

    // Fetch HTML from URL
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 10000 // 10s timeout
    });

    const html = response.data;
    const dom = new JSDOM(html, { url });
    const { document } = dom.window;

    // 1. Extract Hero Image
    let heroImage = null;

    // Check Open Graph tags
    const ogImage = document.querySelector('meta[property="og:image"]');
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    const imageSrc = document.querySelector('link[rel="image_src"]');

    if (ogImage && ogImage.getAttribute('content')) {
      heroImage = ogImage.getAttribute('content');
    } else if (twitterImage && twitterImage.getAttribute('content')) {
      heroImage = twitterImage.getAttribute('content');
    } else if (imageSrc && imageSrc.getAttribute('href')) {
      heroImage = imageSrc.getAttribute('href');
    }

    // 2. Extract Published Date
    let publishedTime = null;
    const pubDateMeta = document.querySelector('meta[property="article:published_time"]') ||
                        document.querySelector('meta[name="publish-date"]') ||
                        document.querySelector('meta[name="publication-date"]') ||
                        document.querySelector('meta[property="og:article:published_time"]');
    if (pubDateMeta && pubDateMeta.getAttribute('content')) {
      publishedTime = pubDateMeta.getAttribute('content');
    }

    // 3. Use @mozilla/readability to extract article content
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return res.status(422).json({ error: 'Could not extract article content from this page.' });
    }

    // If hero image wasn't in metadata, try to find the first high-quality image in the article
    if (!heroImage) {
      const articleImages = dom.window.document.querySelectorAll('article img, main img, .post-content img, .entry-content img');
      for (const img of articleImages) {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('data:') && (src.includes('http') || src.startsWith('/'))) {
          heroImage = src;
          break;
        }
      }
    }

    // Resolve relative hero image URL to absolute
    if (heroImage && !heroImage.startsWith('http')) {
      try {
        heroImage = new URL(heroImage, url).href;
      } catch (e) {
        // Keep original if it fails to resolve
      }
    }

    // Convert hero image to base64 to bypass CORS in html2canvas
    if (heroImage && heroImage.startsWith('http')) {
      try {
        const imgResponse = await axios.get(heroImage, {
          responseType: 'arraybuffer',
          timeout: 6000
        });
        const contentType = imgResponse.headers['content-type'] || 'image/jpeg';
        const base64Img = Buffer.from(imgResponse.data, 'binary').toString('base64');
        heroImage = `data:${contentType};base64,${base64Img}`;
      } catch (imgError) {
        console.error('Failed to proxy hero image to base64:', imgError.message);
      }
    }

    // Send parsed article details back
    res.json({
      title: article.title || 'Untitled Article',
      author: article.byline || 'Anonymous',
      siteName: article.siteName || parsedUrl.hostname.replace('www.', ''),
      publishedTime: publishedTime ? new Date(publishedTime).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      }) : new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      }),
      content: article.content, // HTML representation
      textContent: article.textContent, // Text representation
      excerpt: article.excerpt || '',
      image: heroImage,
      url: url
    });

  } catch (error) {
    console.error('Scraping error:', error.message);
    let errorMessage = 'Failed to fetch the article.';
    if (error.response) {
      errorMessage = `Server responded with status ${error.response.status}`;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out. The server took too long to respond.';
    } else if (error.message.includes('ENOTFOUND')) {
      errorMessage = 'Could not resolve the website address.';
    }
    res.status(500).json({ error: errorMessage });
  }
};
