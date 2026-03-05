/**
 * File Manager API - Giao tiếp với Supabase
 */

import { supabase } from './supabase';
import type {
    Folder,
    File,
    Tag,
    FileListParams,
    FileListResponse
} from './file-manager';

// ==================== FOLDER API ====================

/**
 * Lấy tất cả folders
 */
export async function getAllFolders(): Promise<Folder[]> {
    const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Lấy folder theo ID
 */
export async function getFolderById(id: string): Promise<Folder | null> {
    const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

/**
 * Lấy folder theo path
 */
export async function getFolderByPath(path: string): Promise<Folder | null> {
    const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('path', path)
        .single();

    if (error) return null;
    return data;
}

/**
 * Tạo folder mới
 */
export async function createFolder(folder: Partial<Folder>): Promise<Folder> {
    const { data, error } = await supabase
        .from('folders')
        .insert({
            name: folder.name,
            parent_id: folder.parent_id || null,
            sort_order: folder.sort_order || 0
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Cập nhật folder
 */
export async function updateFolder(id: string, updates: Partial<Folder>): Promise<Folder> {
    const { data, error } = await supabase
        .from('folders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Xóa folder
 */
export async function deleteFolder(id: string): Promise<void> {
    const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * Lấy sub-folders của một folder
 */
export async function getSubFolders(parentId: string | null = null): Promise<Folder[]> {
    const query = supabase
        .from('folders')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

    if (parentId === null) {
        query.is('parent_id', null);
    } else {
        query.eq('parent_id', parentId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
}

// ==================== FILE API ====================

/**
 * Lấy danh sách files với filter và pagination
 */
export async function getFiles(params: FileListParams = {}): Promise<FileListResponse> {
    const {
        folder_id = null,
        file_type,
        search,
        is_active = true,
        page = 1,
        page_size = 50,
        order_by = 'title',
        order_direction = 'asc'
    } = params;

    // Count query
    const countQuery = supabase
        .from('files')
        .select('*', { count: 'exact', head: true });

    if (folder_id !== undefined) {
        if (folder_id === null) {
            countQuery.is('folder_id', null);
        } else {
            countQuery.eq('folder_id', folder_id);
        }
    }

    if (file_type) {
        countQuery.eq('file_type', file_type);
    }

    if (is_active !== undefined) {
        countQuery.eq('is_active', is_active);
    }

    if (search) {
        countQuery.or(`title.ilike.%${search}%,file_name.ilike.%${search}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) throw countError;

    // Data query
    const from = (page - 1) * page_size;
    const to = from + page_size - 1;

    const dataQuery = supabase
        .from('files')
        .select(`
            *,
            folder:folders(*)
        `)
        .order(order_by, { ascending: order_direction === 'asc' })
        .range(from, to);

    if (folder_id !== undefined) {
        if (folder_id === null) {
            dataQuery.is('folder_id', null);
        } else {
            dataQuery.eq('folder_id', folder_id);
        }
    }

    if (file_type) {
        dataQuery.eq('file_type', file_type);
    }

    if (is_active !== undefined) {
        dataQuery.eq('is_active', is_active);
    }

    if (search) {
        dataQuery.or(`title.ilike.%${search}%,file_name.ilike.%${search}%`);
    }

    const { data, error } = await dataQuery;

    if (error) throw error;

    // Get folders for current level
    const folders = folder_id !== undefined
        ? await getSubFolders(folder_id)
        : await getSubFolders(null);

    return {
        files: data || [],
        folders,
        total: count || 0,
        page,
        page_size
    };
}

/**
 * Lấy file theo ID
 */
export async function getFileById(id: string): Promise<File | null> {
    const { data, error } = await supabase
        .from('files')
        .select(`
            *,
            folder:folders(*),
            tags:file_tags(*)
        `)
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

/**
 * Lấy file theo source_path
 */
export async function getFileBySourcePath(sourcePath: string): Promise<File | null> {
    const { data, error } = await supabase
        .from('files')
        .select(`
            *,
            folder:folders(*)
        `)
        .eq('source_path', sourcePath)
        .single();

    if (error) return null;
    return data;
}

/**
 * Tạo file mới
 */
export async function createFile(file: Partial<File>): Promise<File> {
    const { data, error } = await supabase
        .from('files')
        .insert({
            folder_id: file.folder_id || null,
            title: file.title || '',
            file_name: file.file_name || '',
            source_path: file.source_path || '',
            file_type: file.file_type || 'text',
            content: file.content || '',
            size: file.size || 0,
            public_path: file.public_path || null,
            is_active: file.is_active !== undefined ? file.is_active : true
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Cập nhật file
 */
export async function updateFile(id: string, updates: Partial<File>): Promise<File> {
    // Remove read-only fields
    const cleanUpdates: Partial<File> = {
        ...updates,
    };
    delete cleanUpdates.id;
    delete cleanUpdates.created_at;

    const { data, error } = await supabase
        .from('files')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Xóa file (soft delete - set is_active = false)
 */
export async function softDeleteFile(id: string): Promise<File> {
    return updateFile(id, { is_active: false });
}

/**
 * Xóa file vĩnh viễn
 */
export async function deleteFile(id: string): Promise<void> {
    const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * Tìm kiếm files
 */
export async function searchFiles(query: string, limit: number = 20): Promise<File[]> {
    const { data, error } = await supabase
        .from('files')
        .select('*')
        .or(`title.ilike.%${query}%,file_name.ilike.%${query}%,content.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(limit);

    if (error) throw error;
    return data || [];
}

/**
 * Lấy các file gần đây
 */
export async function getRecentFiles(limit: number = 10): Promise<File[]> {
    const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

// ==================== TAG API ====================

/**
 * Lấy tất cả tags
 */
export async function getAllTags(): Promise<Tag[]> {
    const { data, error } = await supabase
        .from('file_tags')
        .select('*')
        .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Lấy tag theo ID
 */
export async function getTagById(id: string): Promise<Tag | null> {
    const { data, error } = await supabase
        .from('file_tags')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

/**
 * Tạo tag mới
 */
export async function createTag(tag: Partial<Tag>): Promise<Tag> {
    const { data, error } = await supabase
        .from('file_tags')
        .insert({
            name: tag.name || '',
            color: tag.color || '#6366f1'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Cập nhật tag
 */
export async function updateTag(id: string, updates: Partial<Tag>): Promise<Tag> {
    const { data, error } = await supabase
        .from('file_tags')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Xóa tag
 */
export async function deleteTag(id: string): Promise<void> {
    const { error } = await supabase
        .from('file_tags')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * Thêm tag vào file
 */
export async function addTagToFile(fileId: string, tagId: string): Promise<void> {
    const { error } = await supabase
        .from('file_tag_relations')
        .insert({
            file_id: fileId,
            tag_id: tagId
        });

    if (error) throw error;
}

/**
 * Xóa tag khỏi file
 */
export async function removeTagFromFile(fileId: string, tagId: string): Promise<void> {
    const { error } = await supabase
        .from('file_tag_relations')
        .delete()
        .eq('file_id', fileId)
        .eq('tag_id', tagId);

    if (error) throw error;
}

/**
 * Lấy tags của một file
 */
export async function getFileTags(fileId: string): Promise<Tag[]> {
    const { data, error } = await supabase
        .from('file_tag_relations')
        .select('tag:file_tags(*)')
        .eq('file_id', fileId);

    if (error) throw error;
    return (data || [])
        .flatMap((item) => {
            const relation = item as unknown as { tag: Tag | Tag[] | null };
            if (!relation.tag) return [];
            return Array.isArray(relation.tag) ? relation.tag : [relation.tag];
        });
}

/**
 * Lấy các file theo tag
 */
export async function getFilesByTag(tagId: string): Promise<File[]> {
    const { data, error } = await supabase
        .from('file_tag_relations')
        .select('file:files(*)')
        .eq('tag_id', tagId);

    if (error) throw error;
    return (data || [])
        .flatMap((item) => {
            const relation = item as unknown as { file: File | File[] | null };
            if (!relation.file) return [];
            return Array.isArray(relation.file) ? relation.file : [relation.file];
        })
        .filter((f: File) => f.is_active);
}

// ==================== STATS API ====================

/**
 * Lấy thống kê tổng quan
 */
export async function getFileStats() {
    const [
        { count: totalFiles },
        { count: totalFolders },
        { count: markdownFiles },
        { count: htmlFiles },
        { count: totalTags }
    ] = await Promise.all([
        supabase.from('files').select('*', { count: 'exact', head: true }),
        supabase.from('folders').select('*', { count: 'exact', head: true }),
        supabase.from('files').select('*', { count: 'exact', head: true }).eq('file_type', 'markdown'),
        supabase.from('files').select('*', { count: 'exact', head: true }).eq('file_type', 'html'),
        supabase.from('file_tags').select('*', { count: 'exact', head: true })
    ]);

    return {
        totalFiles: totalFiles || 0,
        totalFolders: totalFolders || 0,
        markdownFiles: markdownFiles || 0,
        htmlFiles: htmlFiles || 0,
        totalTags: totalTags || 0
    };
}
