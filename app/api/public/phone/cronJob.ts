import cron from 'node-cron';
import fs from 'fs';
import path from 'path';

// Klasör yolları
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const ORIGINAL_DIR = path.join(PUBLIC_DIR, 'original');
const FILTERED_DIR = path.join(PUBLIC_DIR, 'filtered');

// Dosyaları temizleyen fonksiyon
function cleanupOldFiles() {
  console.log('Otomatik dosya temizleme başladı...');
  
  [ORIGINAL_DIR, FILTERED_DIR].forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.readdir(dir, (err, files) => {
        if (err) {
          console.error(`Klasör okuma hatası: ${dir}`, err);
          return;
        }
        
        let deletedCount = 0;
        files.forEach(file => {
          const filePath = path.join(dir, file);
          
          // Dosya bilgilerini al
          fs.stat(filePath, (statErr, stats) => {
            if (statErr) {
              console.error(`Dosya bilgisi alma hatası: ${filePath}`, statErr);
              return;
            }
            
            // 15 günden eski dosyaları sil
            const fifteenDaysAgo = new Date();
            fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
            
            if (stats.mtime < fifteenDaysAgo) {
              fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                  console.error(`Dosya silme hatası: ${filePath}`, unlinkErr);
                } else {
                  deletedCount++;
                  console.log(`Eski dosya silindi: ${filePath}`);
                }
              });
            }
          });
        });
        
        console.log(`${dir} klasöründen ${deletedCount} dosya silindi.`);
      });
    }
  });
  
  console.log('Otomatik dosya temizleme tamamlandı.');
}

// Her 15 günde bir çalışacak cron job (gecenin 2'sinde)
export function startCleanupCronJob() {
  // 15 günde bir gece saat 2'de çalışır
  cron.schedule('0 2 */15 * *', () => {
    cleanupOldFiles();
  });
  
  console.log('Dosya temizleme cron job\'ı başlatıldı. Her 15 günde bir gece saat 2\'de çalışacak.');
}

// Manuel temizleme fonksiyonu
export function manualCleanup() {
  cleanupOldFiles();
}

// Eğer bu dosya doğrudan çalıştırılırsa cron job'ı başlat
if (require.main === module) {
  startCleanupCronJob();
}
