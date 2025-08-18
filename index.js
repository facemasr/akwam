// 📦 المتطلبات: npm install puppeteer axios xml2js fs-extra xlsx
const puppeteer = require('puppeteer');
const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs-extra');
const XLSX = require('xlsx');

const sitemapUrl = 'https://ak.sv/sitemap.xml';
const checkpointFile = 'checkpoint.json';
const BATCH_SIZE = 10; // عدد النتائج قبل الحفظ والتوقف

// --- استخراج روابط الأفلام من Sitemap ---
async function extractMovieUrlsFromSitemap(url) {
  try {
    const res = await axios.get(url);
    const parsed = await xml2js.parseStringPromise(res.data);
    let urls = [];

    if (parsed.urlset && parsed.urlset.url) {
      urls = parsed.urlset.url.map(entry => entry.loc[0]).filter(u => u.includes('/movie/'));
    } else if (parsed.sitemapindex && parsed.sitemapindex.sitemap) {
      for (const sitemap of parsed.sitemapindex.sitemap) {
        const nestedUrls = await extractMovieUrlsFromSitemap(sitemap.loc[0]);
        urls.push(...nestedUrls);
      }
    }

    return urls;
  } catch (err) {
    console.error(`❌ خطأ في استخراج Sitemap: ${err.message}`);
    return [];
  }
}

// --- تحميل نقطة التوقف ---
function loadCheckpoint() {
  return fs.existsSync(checkpointFile) ? fs.readJsonSync(checkpointFile) : { done: [] };
}

// --- حفظ نقطة التوقف ---
function saveCheckpoint(data) {
  fs.writeJsonSync(checkpointFile, data, { spaces: 2 });
}

// --- حفظ البيانات في ملف Excel ---
function saveToExcel(data, batchNumber) {
  const outputFile = `final_movie_links_batch_${batchNumber}.xlsx`;
  const minimalData = data.map(({ imdb_id, video_link }) => ({
    imdb_id,
    video_link
  }));

  let sheet = XLSX.utils.json_to_sheet(minimalData);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Links');
  XLSX.writeFile(wb, outputFile);
  console.log(`📁 تم حفظ ${minimalData.length} رابط في ${outputFile}`);
}

// --- معالجة روابط الأفلام وجلب الفيديو ---
async function processMovieLinks(urls) {
  const checkpoint = loadCheckpoint();
  const done = new Set(checkpoint.done);
  let results = [];
  let processedCount = 0;

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  for (const url of urls) {
    if (done.has(url)) continue;
    console.log(`🔍 معالجة: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      const html = await page.content();

      const imdbMatch = html.match(/tt\d{7,}/);
      const watchMatch = html.match(/\/watch\/(\d+)/);
      const movieIdMatch = url.match(/\/movie\/(\d+)\//);

      if (imdbMatch && watchMatch && movieIdMatch) {
        const imdbId = imdbMatch[0];
        const watchId = watchMatch[1];
        const movieId = movieIdMatch[1];
        const finalUrl = `https://ak.sv/watch/${watchId}/${movieId}`;

        // --- فتح finalUrl لاستخراج رابط الفيديو الأساسي ---
        try {
          await page.goto(finalUrl, { waitUntil: 'networkidle2', timeout: 0 });

          const videoLink = await page.evaluate(() => {
            // أولاً حاول استخراج أي رابط من <video source>
            let sources = Array.from(document.querySelectorAll('video source')).map(v => v.src);
            if (sources.length) return sources[0]; // أول رابط فقط

            // fallback: البحث في HTML عن أي رابط mp4 أو m3u8
            const match = document.documentElement.innerHTML.match(/https?:\/\/[^"']+\.(mp4|m3u8)/);
            return match ? match[0] : null;
          });

          if (videoLink) {
            results.push({ imdb_id: imdbId, video_link: videoLink });
            console.log(`✅ ${imdbId} => ${videoLink}`);
            processedCount++;
          } else {
            console.log(`⚠️ لم يتم العثور على فيديو في: ${finalUrl}`);
          }

        } catch (err) {
          console.error(`❌ فشل فتح finalUrl ${finalUrl}: ${err.message}`);
        }

        done.add(url);

        // --- إذا وصلنا لعدد النتائج المحدد، حفظ الملف والتوقف ---
        if (processedCount >= BATCH_SIZE) {
          saveToExcel(results, 1);
          console.log(`🛑 تم الوصول إلى ${BATCH_SIZE} نتيجة، تم الحفظ والتوقف.`);
          break;
        }

      } else {
        console.log(`⚠️ لم يتم العثور على IMDB أو رابط مشاهدة في: ${url}`);
      }

    } catch (err) {
      console.error(`❌ فشل في فتح ${url}: ${err.message}`);
    }
  }

  await browser.close();
  saveCheckpoint({ done: Array.from(done) });
}

// --- التشغيل الرئيسي ---
(async () => {
  console.log(`📥 بدء تحميل الروابط من: ${sitemapUrl}`);
  const allUrls = await extractMovieUrlsFromSitemap(sitemapUrl);
  console.log(`🔗 تم العثور على ${allUrls.length} رابط فيلم`);

  await processMovieLinks(allUrls);
})();
