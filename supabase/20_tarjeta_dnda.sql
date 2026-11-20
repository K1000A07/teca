-- 20 · Tarjeta para registrar el software y las ilustraciones en la DNDA (para más adelante)
insert into public.admin_tasks (title, body, list, tags, area, priority, position)
select 'Registrar el software y las ilustraciones en la DNDA',
  'Dirección Nacional del Derecho de Autor. El código como "software" y el brandbook, las decos y los gatos como "obra". El derecho de autor ya es tuyo desde que lo creaste: el registro sirve como prueba de fecha y autoría. Es barato y online. No es urgente.',
  'ideas', array['Legal'], 'admin', 'antes', 200
where not exists (select 1 from public.admin_tasks where title = 'Registrar el software y las ilustraciones en la DNDA');
