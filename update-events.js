/**
 * SAVING SARVAHITA FOUNDATION
 * Dynamic Events & Gallery Scanner & Generator
 * 
 * Scans `assets/events/` directory for event folders and image files.
 * Automatically generates `assets/events/events-data.js` and `assets/events/events-data.json`.
 * 
 * Usage:
 *   node update-events.js          (One-time scan and build)
 *   node update-events.js --watch  (Live watcher: auto-updates on file add/delete/rename)
 */

const fs = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname, 'assets', 'events');
const OUTPUT_JS = path.join(EVENTS_DIR, 'events-data.js');
const OUTPUT_JSON = path.join(EVENTS_DIR, 'events-data.json');

const IMAGE_EXTENSIONS = new Set(['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.avif']);

// Preset metadata for known folders (used for rich display, with automatic fallback for new folders)
const FOLDER_METADATA_PRESETS = {
  '05-09-26 Dog and Cat Feeding': {
    title: 'Street Dog & Cat Feeding & Nourishment Drive',
    subtitle: 'Providing wholesome cooked meals, fresh milk, and nutritious treats to stray dogs and cats',
    desc: 'Our dedicated volunteers covered local street corners and residential pockets, serving fresh meals, milk, biscuits, and hydration to hungry street dogs and stray cats.',
    date: '05 Sep 2026',
    dateFull: 'Saturday, 05 September 2026',
    day: '05',
    month: 'SEP',
    year: '2026',
    sortDate: '2026-09-05',
    category: 'hunger-support',
    categoryName: 'Sarva Jeev Raksha',
    categoryIcon: 'fa-paw',
    badgeColor: 'linear-gradient(135deg, #16A34A, #059669)',
    tagBg: 'rgba(22, 163, 74, 0.12)',
    tagColor: '#16A34A',
    location: 'Dahisar & Mumbai Suburbs',
    beneficiaries: '110+ Animals'
  },
  '26-08-26 Dog Feeding': {
    title: 'Mid-Week Street Dog Hunger Support & Community Care Drive',
    subtitle: 'Reaching pack dogs across suburban corners with nutritious meals and biscuits',
    desc: 'Extensive morning feeding run reaching numerous pack dogs, with comprehensive photo documentations of our volunteers in action.',
    date: '26 Aug 2026',
    dateFull: 'Wednesday, 26 August 2026',
    day: '26',
    month: 'AUG',
    year: '2026',
    sortDate: '2026-08-26',
    category: 'hunger-support',
    categoryName: 'Sarva Jeev Raksha',
    categoryIcon: 'fa-paw',
    badgeColor: 'linear-gradient(135deg, #16A34A, #059669)',
    tagBg: 'rgba(22, 163, 74, 0.12)',
    tagColor: '#16A34A',
    location: 'Borivali, Mumbai',
    beneficiaries: '100+ Dogs'
  },
  'animal-feeding-16-aug-2026': {
    title: 'Street Animal Hunger Support & Feeding Drive',
    subtitle: 'Founding community feeding initiative across suburban Mumbai street corners',
    desc: 'Our volunteer squad fed over 100+ voiceless street dogs, distributing nutritious meals, high-energy biscuits, and fresh milk across Mumbai street corners.',
    date: '16 Aug 2026',
    dateFull: 'Sunday, 16 August 2026',
    day: '16',
    month: 'AUG',
    year: '2026',
    sortDate: '2026-08-16',
    category: 'hunger-support',
    categoryName: 'Sarva Jeev Raksha',
    categoryIcon: 'fa-paw',
    badgeColor: 'linear-gradient(135deg, #16A34A, #059669)',
    tagBg: 'rgba(22, 163, 74, 0.12)',
    tagColor: '#16A34A',
    location: 'Dahisar & Mumbai Suburbs',
    beneficiaries: '100+ Animals',
    blogUrl: 'blog-animal-feeding-hunger-support.html'
  },
  'study-kits': {
    title: 'Study Kits Distribution for 22 Children',
    subtitle: 'Empowering children with school bags, notebooks, geometry boxes, and stationery',
    desc: 'Our team successfully distributed free study kits, school bags, notebooks, geometry boxes, and stationery to 22 children at Maranatha Orphanage Society.',
    date: '02 Aug 2026',
    dateFull: 'Sunday, 02 August 2026',
    day: '02',
    month: 'AUG',
    year: '2026',
    sortDate: '2026-08-02',
    category: 'study-kits',
    categoryName: 'Sarva Shiksha (Education)',
    categoryIcon: 'fa-graduation-cap',
    badgeColor: 'linear-gradient(135deg, #0284C7, #0E7490)',
    tagBg: 'rgba(2, 132, 199, 0.12)',
    tagColor: '#0284C7',
    location: 'Maranatha Orphanage, Chembur West, Mumbai',
    beneficiaries: '22 Children',
    blogUrl: 'blog-study-kits-maranatha.html'
  }
};

/**
 * Natural sort for filenames (e.g. img1, img2, img10)
 */
function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Parses a folder name to deduce event metadata if preset is not present
 */
function deduceMetadata(folderName) {
  if (FOLDER_METADATA_PRESETS[folderName]) {
    return { ...FOLDER_METADATA_PRESETS[folderName] };
  }

  let day = '01', month = 'JAN', year = '2026', sortDate = '2026-01-01', date = '01 Jan 2026', dateFull = '01 January 2026';
  let category = 'general', categoryName = 'Community Drive', categoryIcon = 'fa-heart';
  let title = folderName.replace(/[-_]/g, ' ');

  // Match pattern DD-MM-YY or DD-MM-YYYY
  const dateMatch = folderName.match(/(\d{1,2})[-.](\d{1,2})[-.](\d{2,4})/);
  if (dateMatch) {
    const rawDay = dateMatch[1].padStart(2, '0');
    const rawMonthNum = parseInt(dateMatch[2], 10);
    const rawYear = dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3];
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    if (rawMonthNum >= 1 && rawMonthNum <= 12) {
      day = rawDay;
      month = monthNames[rawMonthNum - 1];
      year = rawYear;
      sortDate = `${year}-${String(rawMonthNum).padStart(2, '0')}-${day}`;
      date = `${day} ${month} ${year}`;
      dateFull = `${day} ${fullMonthNames[rawMonthNum - 1]} ${year}`;
    }
  }

  // Deduce category
  const lower = folderName.toLowerCase();
  if (lower.includes('dog') || lower.includes('cat') || lower.includes('animal') || lower.includes('feed')) {
    if (lower.includes('cat')) {
      category = 'cat-feeding';
      categoryName = 'Cat Welfare & Care';
      categoryIcon = 'fa-cat';
    } else {
      category = 'hunger-support';
      categoryName = 'Sarva Jeev Raksha';
      categoryIcon = 'fa-paw';
    }
  } else if (lower.includes('study') || lower.includes('school') || lower.includes('kit') || lower.includes('book') || lower.includes('shiksha')) {
    category = 'study-kits';
    categoryName = 'Sarva Shiksha';
    categoryIcon = 'fa-graduation-cap';
  } else if (lower.includes('health') || lower.includes('medical') || lower.includes('camp')) {
    category = 'health';
    categoryName = 'Sarva Swasthya';
    categoryIcon = 'fa-heart-pulse';
  } else if (lower.includes('tree') || lower.includes('plant') || lower.includes('green')) {
    category = 'environment';
    categoryName = 'Sarva Hariyali';
    categoryIcon = 'fa-seedling';
  }

  return {
    title: title.replace(/^[\d.-]+\s*/, ''),
    subtitle: `On-ground community initiative by Saving Sarvahita Foundation`,
    desc: `Ground drive organized by Saving Sarvahita Foundation volunteers in Mumbai.`,
    date,
    dateFull,
    day,
    month,
    year,
    sortDate,
    category,
    categoryName,
    categoryIcon,
    badgeColor: 'linear-gradient(135deg, #0E7490, #0369A1)',
    tagBg: 'rgba(14, 116, 144, 0.12)',
    tagColor: '#0E7490',
    location: 'Mumbai, Maharashtra',
    beneficiaries: 'Community'
  };
}

/**
 * Scans the assets/events folder and builds registry
 */
function scanEvents() {
  if (!fs.existsSync(EVENTS_DIR)) {
    console.error(`Events directory not found: ${EVENTS_DIR}`);
    return null;
  }

  const entries = fs.readdirSync(EVENTS_DIR, { withFileTypes: true });
  const folders = entries.filter(e => e.isDirectory());

  const events = [];
  let totalPhotos = 0;

  for (const folder of folders) {
    const folderName = folder.name;
    const folderPath = path.join(EVENTS_DIR, folderName);
    const files = fs.readdirSync(folderPath);

    const images = [];
    const sortedFiles = files.filter(f => !f.startsWith('.') && !f.startsWith('_')).sort(naturalSort);

    for (const filename of sortedFiles) {
      const ext = path.extname(filename).toLowerCase();
      const relativeSrc = `assets/events/${folderName}/${filename}`;
      const fileId = `media-${folderName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${filename.replace(/[^a-z0-9]/gi, '-')}`;

      if (IMAGE_EXTENSIONS.has(ext)) {
        const item = {
          id: fileId,
          type: 'image',
          src: relativeSrc,
          filename: filename,
          title: `Drive Moment`,
          desc: `On-ground drive photo capture`
        };
        images.push(item);
      }
    }

    if (images.length === 0) continue;

    totalPhotos += images.length;
    const meta = deduceMetadata(folderName);

    // Look for custom event.json if available
    const customJsonPath = path.join(folderPath, 'event.json');
    if (fs.existsSync(customJsonPath)) {
      try {
        const customData = JSON.parse(fs.readFileSync(customJsonPath, 'utf8'));
        Object.assign(meta, customData);
      } catch (err) {
        console.warn(`Warning: Could not parse ${customJsonPath}`, err.message);
      }
    }

    const eventId = folderName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const coverMedia = images[0] || null;

    events.push({
      id: eventId,
      folderName: folderName,
      title: meta.title,
      subtitle: meta.subtitle,
      date: meta.date,
      dateFull: meta.dateFull,
      day: meta.day,
      month: meta.month,
      year: meta.year,
      sortDate: meta.sortDate,
      category: meta.category,
      categoryName: meta.categoryName,
      categoryIcon: meta.categoryIcon,
      badgeColor: meta.badgeColor,
      tagBg: meta.tagBg,
      tagColor: meta.tagColor,
      location: meta.location,
      desc: meta.desc,
      beneficiaries: meta.beneficiaries,
      blogUrl: meta.blogUrl || null,
      imageCount: images.length,
      videoCount: 0,
      totalCount: images.length,
      coverMedia: coverMedia,
      media: images
    });
  }

  // Sort events newest first
  events.sort((a, b) => b.sortDate.localeCompare(a.sortDate));

  const registry = {
    generatedAt: new Date().toISOString(),
    stats: {
      totalDrives: events.length,
      totalPhotos: totalPhotos,
      totalVideos: 0,
      totalMedia: totalPhotos
    },
    events: events
  };

  return registry;
}

/**
 * Writes registry files
 */
function build() {
  console.log('🔍 Scanning `assets/events/` for photos...');
  const registry = scanEvents();
  if (!registry) return;

  const jsonContent = JSON.stringify(registry, null, 2);
  const jsContent = `/**
 * Saving Sarvahita Foundation - Dynamic Events & Gallery Registry
 * Automatically generated by update-events.js
 * Generated at: ${registry.generatedAt}
 */
window.SAVING_SARVAHITA_EVENTS = ${jsonContent};
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.SAVING_SARVAHITA_EVENTS;
}
`;

  fs.writeFileSync(OUTPUT_JSON, jsonContent, 'utf8');
  fs.writeFileSync(OUTPUT_JS, jsContent, 'utf8');

  console.log(`✅ Successfully updated events & gallery data:`);
  console.log(`   📂 Total Drives: ${registry.stats.totalDrives}`);
  console.log(`   📸 Total Photos: ${registry.stats.totalPhotos}`);
  console.log(`   📄 Output JS:    ${OUTPUT_JS}`);
  console.log(`   📄 Output JSON:  ${OUTPUT_JSON}`);
}

// Watch mode
if (process.argv.includes('--watch')) {
  build();
  console.log(`\n👀 Watching '${EVENTS_DIR}' for changes (add/delete/rename)...`);
  let debounceTimeout = null;
  fs.watch(EVENTS_DIR, { recursive: true }, (eventType, filename) => {
    if (filename && (filename.endsWith('events-data.js') || filename.endsWith('events-data.json'))) {
      return;
    }
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      console.log(`\n🔄 Change detected (${eventType}: ${filename}). Rebuilding registry...`);
      build();
    }, 400);
  });
} else {
  build();
}
