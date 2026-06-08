
INSERT INTO public.profiles (id, email)
VALUES ('341b9518-d7ab-4a58-b814-ff01b94c43fe', 'guilherme.barboza@viverdeia.ai')
ON CONFLICT (id) DO NOTHING;
