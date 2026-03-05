/**
 * Script để sync files từ database ra public folder
 * Đảm bảo các file trong DB có thể truy cập được qua static URL
 * Usage: node scripts/sync-db-to-public.mjs
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const projectRoot = process.cwd();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const FILE_SIGNATURE_SECRET = process.env.FILE_SIGNATURE_SECRET;

if (!SUPABASE_URL || !SUPABASE_KEY || !FILE_SIGNATURE_SECRET) {
    console.error('❌ Thiếu cấu hình Supabase hoặc FILE_SIGNATURE_SECRET.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function verifySignature(file) {
    if (!file.content || !file.content_hash || !file.signature) return false;
    const canonical = JSON.stringify({
        content: String(file.content).replace(/\r\n/g, '\n'),
        sourcePath: file.source_path,
        fileType: file.file_type
    });
    const hash = crypto.createHash('sha256').update(canonical).digest('hex');
    if (hash !== file.content_hash) return false;
    const expected = crypto.createHmac('sha256', FILE_SIGNATURE_SECRET).update(hash).digest('base64url');
    return expected === file.signature;
}

/**
 * Sync file từ DB ra public folder
 */
async function syncFileToPublic(file) {
    if (!file.content || !file.public_path) {
        return;
    }

    const outputPath = path.join(projectRoot, 'public', file.public_path);
    const outputDirPath = path.dirname(outputPath);

    // Tạo thư mục nếu chưa tồn tại
    await mkdir(outputDirPath, { recursive: true });

    // Ghi file
    await writeFile(outputPath, file.content, 'utf8');
    console.log(`✅ Synced: ${file.source_path}`);
}

/**
 * Main sync function
 */
async function syncAllFiles() {
    console.log('🔍 Đang fetch files từ database...');

    const { data: files, error } = await supabase
        .from('files')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.error('❌ Lỗi fetch files:', error.message);
        process.exit(1);
    }

    if (!files || files.length === 0) {
        console.log('⚠️  Không tìm thấy file nào trong database');
        return;
    }

    console.log(`📦 Tìm thấy ${files.length} files`);

    console.log('🚀 Bắt đầu sync ra public folder...\n');

    for (const file of files) {
        try {
            if (!verifySignature(file)) {
                console.warn(`⚠️  Signature verify failed, skip: ${file.source_path}`);
                continue;
            }
            await syncFileToPublic(file);
        } catch (error) {
            console.error(`❌ Lỗi sync ${file.source_path}:`, error.message);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Sync hoàn tất!');
    console.log('='.repeat(50));
}

// Run sync
syncAllFiles().catch(console.error);
