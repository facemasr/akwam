<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

$YT_DLP = __DIR__ . DIRECTORY_SEPARATOR . 'yt-dlp.exe';
$url = $_GET['url'] ?? '';

if (!$url || !filter_var($url, FILTER_VALIDATE_URL)) {
    echo json_encode(['error' => 'رابط غير صالح']); 
    exit;
}

if (!file_exists($YT_DLP)) {
    echo json_encode(['error' => 'yt-dlp غير موجود']); 
    exit;
}

// تنفيذ yt-dlp مع إرجاع JSON
$cmd = escapeshellarg($YT_DLP) . ' -J ' . escapeshellarg($url) . ' 2>&1';
$raw = shell_exec($cmd);
if (!$raw) {
    echo json_encode(['error' => 'فشل تنفيذ yt-dlp']); 
    exit;
}

// استخراج JSON
$pos = strpos($raw, '{');
if ($pos === false) {
    echo json_encode(['error' => 'فشل العثور على JSON']); 
    exit;
}
$trimmed = substr($raw, $pos);
$decoded = json_decode($trimmed, true);
if (!$decoded) {
    echo json_encode(['error' => 'فشل تحليل JSON']); 
    exit;
}

// صورة الغلاف
$thumbnail = $decoded['thumbnail'] ?? null;

// دالة لتخمين الجودة من الرابط
function guessQualityFromUrl($url) {
    if (preg_match('/(\d{3,4})p/', $url, $matches)) {
        return $matches[1] . 'p';
    }
    return null;
}

// جلب جميع الصيغ مع وصف كامل للجودة
$items = [];
foreach ($decoded['formats'] as $f) {
    if (empty($f['url'])) continue;

    $vcodec = strtolower($f['vcodec'] ?? '');
    $acodec = strtolower($f['acodec'] ?? '');
    $height = $f['height'] ?? null;

    // تخمين اسم الجودة: أولًا format_note، ثانيًا height، ثالثًا من الرابط
    $qualityName = $f['format_note'] ?? ($height ? $height.'p' : null);
    if (!$qualityName) {
        $qualityName = guessQualityFromUrl($f['url']) ?? 'Unknown';
    }

    if ($vcodec !== 'none' && $acodec !== 'none') {
        $description = $qualityName . ' (Video+Audio)';
    } elseif ($vcodec !== 'none') {
        $description = $qualityName . ' (Video only)';
    } elseif ($acodec !== 'none') {
        $abr = $f['abr'] ?? 'Unknown';
        $description = $abr . 'kbps (Audio only)';
    } else {
        continue; // تجاهل الصيغ الفارغة
    }

    $items[] = [
        'url' => $f['url'],
        'quality_label' => $description,
        'ext' => $f['ext'] ?? '',
        'height' => $height,
        'filesize' => $f['filesize'] ?? $f['filesize_approx'] ?? null
    ];
}

// فرز: الفيديو الأعلى دقة أولاً، الصوت فقط في الأسفل
usort($items, fn($a,$b) => ($b['height'] ?? 0) <=> ($a['height'] ?? 0));

echo json_encode([
    'thumbnail' => $thumbnail,
    'items' => $items
], JSON_UNESCAPED_UNICODE);
