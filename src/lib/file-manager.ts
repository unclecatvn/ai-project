/**
 * Types và utilities cho File Manager
 */

// Types
export interface Folder {
    id: string;
    name: string;
    parent_id: string | null;
    path: string;
    level: number;
    sort_order: number;
    created_at: string;
    updated_at: string;
    children?: Folder[];
    files?: File[];
    file_count?: number;
}

export interface File {
    id: string;
    folder_id: string | null;
    title: string;
    file_name: string;
    source_path: string;
    file_type: 'markdown' | 'html' | 'yaml' | 'json' | 'text';
    content: string | null;
    size: number;
    public_path: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    folder?: Folder;
    tags?: Tag[];
}

export interface Tag {
    id: string;
    name: string;
    color: string;
    created_at: string;
}

export interface FileWithTagRelation {
    file_id: string;
    tag_id: string;
}

export interface FolderTree extends Folder {
    children: FolderTree[];
    files: File[];
}

export interface FileNode {
    id: string;
    type: 'folder' | 'file';
    name: string;
    title?: string;
    path: string;
    source_path?: string;
    file_type?: string;
    size?: number;
    expanded?: boolean;
    children?: FileNode[];
}

// API Response Types
export interface FileManagerResponse<T> {
    data: T | null;
    error: string | null;
    count?: number;
}

export interface FileListParams {
    folder_id?: string | null;
    file_type?: string;
    search?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
    order_by?: string;
    order_direction?: 'asc' | 'desc';
}

export interface FileListResponse {
    files: File[];
    folders: Folder[];
    total: number;
    page: number;
    page_size: number;
}

// File icon mapping
export const FILE_ICONS: Record<string, string> = {
    markdown: '📝',
    html: '🌐',
    yaml: '🧩',
    json: '📋',
    text: '📄',
    default: '📄'
};

// File color mapping
export const FILE_COLORS: Record<string, string> = {
    markdown: 'text-blue-500',
    html: 'text-orange-500',
    yaml: 'text-teal-500',
    json: 'text-yellow-500',
    text: 'text-gray-500',
    default: 'text-gray-400'
};

/**
 * Convert folder list to tree structure
 */
export function buildFolderTree(folders: Folder[]): FolderTree[] {
    const map = new Map<string, FolderTree>();
    const roots: FolderTree[] = [];

    // Initialize map
    folders.forEach(folder => {
        map.set(folder.id, { ...folder, children: [], files: [] });
    });

    // Build tree
    folders.forEach(folder => {
        const node = map.get(folder.id)!;

        if (folder.parent_id) {
            const parent = map.get(folder.parent_id);
            if (parent) {
                parent.children.push(node);
            }
        } else {
            roots.push(node);
        }
    });

    return roots;
}

/**
 * Convert folders and files to file node tree
 */
export function buildFileNodeTree(folders: Folder[], files: File[]): FileNode[] {
    const nodes: FileNode[] = [];
    const folderMap = new Map<string, FileNode>();

    // Create folder nodes
    folders.forEach(folder => {
        const node: FileNode = {
            id: folder.id,
            type: 'folder',
            name: folder.name,
            path: folder.path,
            children: [],
            expanded: folder.level === 0
        };
        folderMap.set(folder.id, node);
    });

    // Build folder hierarchy
    folders.forEach(folder => {
        const node = folderMap.get(folder.id)!;

        if (folder.parent_id) {
            const parent = folderMap.get(folder.parent_id);
            if (parent) {
                parent.children!.push(node);
            }
        } else {
            nodes.push(node);
        }
    });

    // Add files to their folders
    files.forEach(file => {
        const fileNode: FileNode = {
            id: file.id,
            type: 'file',
            name: file.file_name,
            title: file.title,
            path: file.source_path,
            source_path: file.source_path,
            file_type: file.file_type,
            size: file.size
        };

        if (file.folder_id) {
            const folder = folderMap.get(file.folder_id);
            if (folder) {
                folder.children!.push(fileNode);
            }
        } else {
            nodes.push(fileNode);
        }
    });

    return nodes;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Get file icon
 */
export function getFileIcon(fileType: string): string {
    return FILE_ICONS[fileType] || FILE_ICONS.default;
}

/**
 * Get file color class
 */
export function getFileColor(fileType: string): string {
    return FILE_COLORS[fileType] || FILE_COLORS.default;
}

/**
 * Search files by title or content
 */
export function searchFiles(files: File[], query: string): File[] {
    const lowerQuery = query.toLowerCase();

    return files.filter(file =>
        file.title.toLowerCase().includes(lowerQuery) ||
        file.file_name.toLowerCase().includes(lowerQuery) ||
        (file.content && file.content.toLowerCase().includes(lowerQuery))
    );
}

/**
 * Sort files by various criteria
 */
export function sortFiles(files: File[], sortBy: string, direction: 'asc' | 'desc' = 'asc'): File[] {
    return [...files].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case 'title':
                comparison = a.title.localeCompare(b.title, 'vi');
                break;
            case 'file_name':
                comparison = a.file_name.localeCompare(b.file_name, 'vi');
                break;
            case 'size':
                comparison = a.size - b.size;
                break;
            case 'created_at':
                comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                break;
            case 'updated_at':
                comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
                break;
            case 'file_type':
                comparison = a.file_type.localeCompare(b.file_type);
                break;
            default:
                comparison = 0;
        }

        return direction === 'asc' ? comparison : -comparison;
    });
}

/**
 * Filter files by type
 */
export function filterFilesByType(files: File[], fileType: string | null): File[] {
    if (!fileType) return files;
    return files.filter(file => file.file_type === fileType);
}

/**
 * Get unique file types from files
 */
export function getFileTypes(files: File[]): string[] {
    return Array.from(new Set(files.map(f => f.file_type))).sort();
}

/**
 * Group files by folder
 */
export function groupFilesByFolder(files: File[]): Map<string | null, File[]> {
    const grouped = new Map<string | null, File[]>();

    files.forEach(file => {
        const key = file.folder_id;
        if (!grouped.has(key)) {
            grouped.set(key, []);
        }
        grouped.get(key)!.push(file);
    });

    return grouped;
}

/**
 * Create breadcrumb from folder path
 */
export function createBreadcrumb(folder: Folder | null): Array<{ id: string; name: string }> {
    if (!folder) return [];

    const crumbs: Array<{ id: string; name: string }> = [
        { id: folder.id, name: folder.name }
    ];

    // Note: This would need parent info from database for full breadcrumb
    return crumbs;
}

/**
 * Validate file type
 */
export function isValidFileType(type: string): boolean {
    return ['markdown', 'html', 'yaml', 'json', 'text'].includes(type);
}

/**
 * Get file extension from file type
 */
export function getFileExtension(fileType: string): string {
    const extensions: Record<string, string> = {
        markdown: '.md',
        html: '.html',
        yaml: '.yaml',
        json: '.json',
        text: '.txt'
    };
    return extensions[fileType] || '';
}
