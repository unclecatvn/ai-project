-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Folders table
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    path TEXT NOT NULL DEFAULT '',
    level INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    source_path TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('markdown', 'html', 'json', 'text')),
    content TEXT,
    size BIGINT NOT NULL DEFAULT 0,
    public_path TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_source_path UNIQUE(source_path)
);

-- File tags table
CREATE TABLE IF NOT EXISTS file_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#6366f1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- File-Tag relationship (many-to-many)
CREATE TABLE IF NOT EXISTS file_tag_relations (
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES file_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (file_id, tag_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_path ON folders(path);
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_source_path ON files(source_path);
CREATE INDEX IF NOT EXISTS idx_files_file_type ON files(file_type);
CREATE INDEX IF NOT EXISTS idx_files_is_active ON files(is_active);
CREATE INDEX IF NOT EXISTS idx_file_tag_relations_file_id ON file_tag_relations(file_id);
CREATE INDEX IF NOT EXISTS idx_file_tag_relations_tag_id ON file_tag_relations(tag_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_folders_updated_at
    BEFORE UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update folder path
CREATE OR REPLACE FUNCTION update_folder_path()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path := NEW.name;
        NEW.level := 0;
    ELSE
        SELECT path || '/' || NEW.name, level + 1
        INTO NEW.path, NEW.level
        FROM folders
        WHERE id = NEW.parent_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_folder_path_trigger
    BEFORE INSERT OR UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION update_folder_path();

-- Insert root folders
INSERT INTO folders (name, parent_id, path, level, sort_order) VALUES
    ('docs', NULL, 'docs', 0, 1),
    ('projects', NULL, 'projects', 0, 2)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_tag_relations ENABLE ROW LEVEL SECURITY;

-- Policies (adjust according to your security needs)
CREATE POLICY "Allow all access to folders"
    ON folders FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all access to files"
    ON files FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all access to file_tags"
    ON file_tags FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all access to file_tag_relations"
    ON file_tag_relations FOR ALL
    USING (true)
    WITH CHECK (true);
