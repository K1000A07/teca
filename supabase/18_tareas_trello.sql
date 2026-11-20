-- 18 · Tareas tipo Trello: listas, etiquetas, fechas. Junta las tareas y el tablero anterior en un solo lugar
-- (el tablero anterior no se borra: sigue en "Versión anterior").
alter table public.admin_tasks add column if not exists list text;
alter table public.admin_tasks add column if not exists tags text[] not null default '{}';
alter table public.admin_tasks add column if not exists due date;
alter table public.admin_tasks add column if not exists remind_days int not null default 30;
alter table public.admin_tasks alter column priority drop not null;

-- Las tareas que ya estaban: a su lista y con etiquetas
update public.admin_tasks set
  list = case when done then 'done' else 'todo' end,
  tags = array_remove(array[
    case when area = 'creativo' then 'Creativo' else 'Administrativo' end,
    case when title ~* '(INPI|AAIP|marca|términos)' then 'Legal' end,
    case when title ~* '(Google Play|Apple|tiendas)' then 'Tiendas' end,
    case when title ~* '(video|publicar|grabar|redes|bio)' then 'Contenido' end,
    case when cost is not null and cost <> 'Gratis' then 'Plata' end
  ], null)
where list is null;
alter table public.admin_tasks alter column list set default 'todo';
update public.admin_tasks set list = 'todo' where list is null;
alter table public.admin_tasks alter column list set not null;
alter table public.admin_tasks drop constraint if exists admin_tasks_list_check;
alter table public.admin_tasks add constraint admin_tasks_list_check check (list in ('ideas', 'todo', 'doing', 'done'));

-- Lo del tablero anterior que no estaba repetido, como tarjetas
insert into public.admin_tasks (title, body, list, tags, due, remind_days, done, area, priority, position)
select b.title, b.body,
  case when b.done then 'done' when b.section = 'procesos' then 'todo' else 'ideas' end,
  case b.section
    when 'fechas' then array['Fecha especial']
    when 'ideas' then array['App']
    else array_remove(array[
      case when b.title ~* '(INPI|AAIP|marca|teca™|monotributo)' then 'Legal' end,
      case when b.title ~* '(Google Play|Apple|Android|iPhone|tiendas)' then 'Tiendas' end,
      case when b.title !~* '(INPI|AAIP|marca|teca™|monotributo|Google Play|Apple|Android|iPhone|tiendas)' then 'Administrativo' end
    ], null)
  end,
  b.due, b.remind_days, b.done, 'admin', case when b.section = 'procesos' then 'antes' end, 100 + b.position
from public.admin_board b
where not exists (select 1 from public.admin_tasks t where lower(t.title) = lower(b.title))
  and b.title not in ('Términos y condiciones en una URL', 'Dominio teca.com.ar y teca.ar', 'Mail de soporte', 'Ícono, capturas y textos para las tiendas');

-- Mail @teca con Google Workspace
insert into public.admin_tasks (title, body, list, tags, area, priority, cost, position)
select 'Mail @teca con Google Workspace', 'Después de comprar el dominio. Plan Business Starter: USD 8,40 por mes (o USD 7 por mes pagando el año). Con ese mail se pueden pasar las cuentas de redes y de las tiendas.', 'todo', array['Administrativo', 'Plata'], 'admin', 'antes', 'USD 8,40/mes', 50
where not exists (select 1 from public.admin_tasks where title = 'Mail @teca con Google Workspace');
insert into public.admin_budget (category, concept, amount, currency, freq, optional, note, position)
select 'Dominio y mail', 'Google Workspace (mail @teca)', 8.4, 'USD', 'mensual', false, 'Business Starter, 1 usuario. Pagando el año sale USD 7 por mes (USD 84). Necesita el dominio.', 3
where not exists (select 1 from public.admin_budget where concept = 'Google Workspace (mail @teca)');
