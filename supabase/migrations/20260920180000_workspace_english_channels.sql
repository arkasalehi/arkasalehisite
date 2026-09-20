update public.workspace_channels
set name = case slug
  when 'general' then 'General'
  when 'meeting-space' then 'Meeting Space'
  when 'design' then 'Design'
  else name
end
where slug in ('general', 'meeting-space', 'design');
