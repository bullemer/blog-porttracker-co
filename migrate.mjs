import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';
import TurndownService from 'turndown';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_HEADER = {
  Authorization: `Basic ${Buffer.from('HeTzNeR4SeCuRiTy:UGSasjiA2cyfsGuB').toString('base64')}`
};

const API_URL = 'https://blog.porttracker.co/wp-json/wp/v2/posts?_embed&per_page=100';

const ASSETS_DIR = path.join(__dirname, 'src', 'assets');
const CONTENT_DIR = path.join(__dirname, 'src', 'content', 'blog');

// Ensure directories exist
fs.mkdirSync(ASSETS_DIR, { recursive: true });
fs.mkdirSync(CONTENT_DIR, { recursive: true });

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

async function downloadImage(url) {
  try {
    const filename = path.basename(new URL(url).pathname);
    const destPath = path.join(ASSETS_DIR, filename);
    
    // Only download if it doesn't exist
    if (fs.existsSync(destPath)) {
      return `../../assets/${filename}`;
    }

    const response = await fetch(url, { headers: AUTH_HEADER });
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    fs.writeFileSync(destPath, buffer);
    console.log(`Downloaded image: ${filename}`);
    
    return `../../assets/${filename}`;
  } catch (err) {
    console.error(`Error downloading image ${url}:`, err.message);
    return null; /* fallback to original or replace with dummy */
  }
}

async function migrate() {
  console.log('Fetching posts form WP REST API...');
  const res = await fetch(API_URL, { headers: AUTH_HEADER });
  const posts = await res.json();
  
  if (!Array.isArray(posts)) {
    console.error('Expected array from WP REST API', posts);
    return;
  }
  
  console.log(`Found ${posts.length} posts.`);

  for (const post of posts) {
    const title = post.title.rendered.replace(/"/g, '\\"');
    const slug = post.slug;
    const date = new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
    let excerpt = post.excerpt.rendered.replace(/<[^>]+>/g, '').trim().replace(/"/g, '\\"');
    
    // Process HTML content
    let rawHtml = post.content.rendered;
    
    // Find all images in the HTML and download them
    // regex to match <img ... src="url" ...>
    const imgRegex = /<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
    let match;
    const imagesToDownload = [];
    while ((match = imgRegex.exec(rawHtml)) !== null) {
      imagesToDownload.push(match[1]);
    }
    
    for (const imgUrl of imagesToDownload) {
      const localPath = await downloadImage(imgUrl);
      if (localPath) {
        // Replace absolute URL in HTML with absolute path mapped to Astro components?
        // Actually, Turndown will convert to ![](localPath) if we string replace now.
        rawHtml = rawHtml.replace(imgUrl, localPath);
      }
    }
    
    // Also parse for links inside anchor tags wrapping the images and remove them to avoid markdown `[![img](src)](src)`
    rawHtml = rawHtml.replace(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, (match, href, inner) => {
      // If inner is just an img tag, we just return the inner since we don't want linked images
      if (inner.trim().startsWith('<img')) return inner;
      return match;
    });

    let markdown = turndownService.turndown(rawHtml);
    
    // Handle featured media
    let heroImage = '';
    if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'].length > 0) {
      const featuredMedia = post._embedded['wp:featuredmedia'][0];
      const featuredUrl = featuredMedia.source_url;
      const localFeatured = await downloadImage(featuredUrl);
      if (localFeatured) {
        heroImage = localFeatured;
      }
    }
    
    const fileContent = `---
title: "${title}"
description: "${excerpt}"
pubDate: '${date}'
${heroImage ? `heroImage: '${heroImage}'` : ''}
---

${markdown}
`;
    
    const mdFilePath = path.join(CONTENT_DIR, `${slug}.md`);
    fs.writeFileSync(mdFilePath, fileContent);
    console.log(`Created post: ${slug}.md`);
  }
  
  console.log('Migration complete!');
}

migrate();
