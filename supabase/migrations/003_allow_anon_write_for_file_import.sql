-- Development-only compatibility policy:
-- allow import script (using publishable key / anon role) to write folders/files.

drop policy if exists "folders_write_anon_import" on folders;
create policy "folders_write_anon_import"
on folders
for all
to anon
using (true)
with check (true);

drop policy if exists "files_write_anon_import" on files;
create policy "files_write_anon_import"
on files
for all
to anon
using (true)
with check (true);
