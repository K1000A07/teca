-- 19 · Gastos reales y documentos (solo admin)
create table if not exists public.admin_expenses (
  id uuid primary key default gen_random_uuid(),
  spent_on date not null default current_date,
  concept text not null, amount numeric not null,
  currency text not null default 'ARS' check (currency in ('ARS', 'USD')),
  note text, created_at timestamptz not null default now()
);
create table if not exists public.admin_docs (
  id uuid primary key default gen_random_uuid(),
  title text not null, number text, category text not null default 'Otros',
  doc_date date, link text, note text, created_at timestamptz not null default now()
);
do $$ declare t text; begin
  foreach t in array array['admin_expenses', 'admin_docs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "solo admin" on public.%I', t);
    execute format('create policy "solo admin" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- La marca, presentada el 20/11/2026
insert into public.admin_docs (title, number, category, doc_date, note)
select 'Solicitud de marca "teca" en el INPI (clases 9 y 45) · e-Recauda', '202600176665', 'Marca', '2026-11-20',
  'Marca denominativa "teca", a nombre de Camila Manucci (100%). Clase 9: apps y software para celulares, web y redes sociales. Clase 45: servicios de redes sociales en línea. Total pagado: $84.086 (100 UMAPI por clase, UMAPI a $420,43). Seguimiento en portaltramites.inpi.gob.ar → Mis trámites.'
where not exists (select 1 from public.admin_docs where number = '202600176665');

insert into public.admin_expenses (spent_on, concept, amount, currency, note)
select '2026-11-20', 'Marca "teca" en el INPI · clases 9 y 45', 84086, 'ARS', '2 trámites de 100 UMAPI ($420,43). e-Recauda 202600176665'
where not exists (select 1 from public.admin_expenses where concept = 'Marca "teca" en el INPI · clases 9 y 45');
insert into public.admin_expenses (spent_on, concept, amount, currency, note)
select '2026-11-20', 'Claude · noviembre', 20, 'USD', 'Suscripción mensual'
where not exists (select 1 from public.admin_expenses where concept = 'Claude · noviembre');

-- Presupuesto: valores reales de la marca y la suscripción de Claude
update public.admin_budget set amount = 42043, paid = true, note = 'Pagado el 20/11/2026: 100 UMAPI a $420,43.' where concept like 'Marca en el INPI · clase 9%';
update public.admin_budget set amount = 42043, paid = true, note = 'Pagado el 20/11/2026: 100 UMAPI a $420,43.' where concept like 'Marca en el INPI · clase 45%';
update public.admin_budget set optional = true, note = 'No se presentó: en la 42 está "Tecas" (arquitectura, con algo de software). Se puede pedir más adelante con una descripción acotada.' where concept like 'Marca en el INPI · clase 42%';
insert into public.admin_budget (category, concept, amount, currency, freq, optional, note, position)
select 'Herramientas', 'Claude', 20, 'USD', 'mensual', false, 'Suscripción mensual.', 0
where not exists (select 1 from public.admin_budget where concept = 'Claude');
