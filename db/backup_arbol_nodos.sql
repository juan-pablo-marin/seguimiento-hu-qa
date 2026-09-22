--
-- PostgreSQL database dump
--

\restrict HtOZQTl8wpeY1XNz9HVyE2ve4tbFSks13MRknrny38kEv3bdB9w4y9n210T3sLp

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: historias_usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historias_usuario (
    id integer NOT NULL,
    codigo character varying(50) NOT NULL,
    nombre character varying(255) NOT NULL,
    estado character varying(20) DEFAULT 'PENDIENTE'::character varying NOT NULL,
    observaciones text,
    orden integer DEFAULT 0 NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    nodo_id integer NOT NULL,
    CONSTRAINT historias_usuario_estado_check CHECK (((estado)::text = ANY (ARRAY[('PENDIENTE'::character varying)::text, ('EN_PROGRESO'::character varying)::text, ('TERMINADO'::character varying)::text])))
);


ALTER TABLE public.historias_usuario OWNER TO postgres;

--
-- Name: historias_usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.historias_usuario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historias_usuario_id_seq OWNER TO postgres;

--
-- Name: historias_usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.historias_usuario_id_seq OWNED BY public.historias_usuario.id;


--
-- Name: nodos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nodos (
    id integer NOT NULL,
    parent_id integer,
    nombre character varying(150) NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.nodos OWNER TO postgres;

--
-- Name: nodos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nodos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nodos_id_seq OWNER TO postgres;

--
-- Name: nodos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nodos_id_seq OWNED BY public.nodos.id;


--
-- Name: historias_usuario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historias_usuario ALTER COLUMN id SET DEFAULT nextval('public.historias_usuario_id_seq'::regclass);


--
-- Name: nodos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nodos ALTER COLUMN id SET DEFAULT nextval('public.nodos_id_seq'::regclass);


--
-- Data for Name: historias_usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.historias_usuario (id, codigo, nombre, estado, observaciones, orden, creado_en, actualizado_en, nodo_id) FROM stdin;
10	GTI-F-000-HU	Publicación Boletines de Microruedas	PENDIENTE	\N	1	2026-09-21 21:07:07.587688+00	2026-09-21 21:07:07.587688+00	4
11	GTI-F-000-HU	Publicación Boletines de Prensa	PENDIENTE	\N	2	2026-09-21 21:07:07.587688+00	2026-09-21 21:07:07.587688+00	4
12	GTI-F-000-HU	Publicación de Ventana Emergente	PENDIENTE	\N	3	2026-09-21 21:07:07.587688+00	2026-09-21 21:07:07.587688+00	4
13	HU-LP-EVE-001	Eventos	PENDIENTE	\N	4	2026-09-21 21:07:07.587688+00	2026-09-21 21:07:07.587688+00	4
14	GTI-F-017-HU	Crear Programar Talleres Orientación Ocupacional A	PENDIENTE	\N	1	2026-09-21 21:11:08.756657+00	2026-09-21 21:11:08.756657+00	15
15	HU-APE-ORT-OCUP-003	Orientados por Funcionario B	PENDIENTE	\N	2	2026-09-21 21:11:08.756657+00	2026-09-21 21:11:08.756657+00	15
16	HU-APE-ORI-002	Orientaciones por Funcionario B	PENDIENTE	\N	3	2026-09-21 21:11:08.756657+00	2026-09-21 21:11:08.756657+00	15
17	HU-APE-BUSC-018	Certificacion Registro	PENDIENTE	\N	1	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
18	HU-APE-BUSC-019	Dashboard	PENDIENTE	\N	2	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
19	HU-APE-BUSC-020	Actualización de Datos vr 10_06_2026	PENDIENTE	\N	3	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
20	HU-APE-BUSC-020	Actualización de Datos	PENDIENTE	\N	4	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
21	HU-APE-BUSC-021	Actualizacion de Intereses	PENDIENTE	\N	5	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
22	HU-APE-ADM-PES-001	Administracion Tablas Programas Especiales GTI-F-017	PENDIENTE	\N	6	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
23	HU-APE-BUSC-001	Registro Personal	PENDIENTE	\N	7	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
24	HU-APE-BUSC-002	Gestion Formacion Academica	PENDIENTE	\N	8	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
25	HU-APE-BUSC-002	Gestion Formacion Academica actualizada Vr 2	PENDIENTE	\N	9	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
26	HU-APE-BUSC-003	Documentos Varios	PENDIENTE	\N	10	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
27	HU-APE-BUSC-004	Registro Idiomas	PENDIENTE	\N	11	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
28	HU-APE-BUSC-005	Experiencia Laboral AJUSTADA	PENDIENTE	\N	12	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
29	HU-APE-BUSC-006	Pasantia	PENDIENTE	\N	13	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
30	HU-APE-BUSC-007	Migracion	PENDIENTE	\N	14	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
31	HU-APE-BUSC-008	Otros Datos	PENDIENTE	\N	15	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
32	HU-APE-BUSC-009	Competencias Laborales	PENDIENTE	\N	16	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
33	HU-APE-BUSC-010	Sintesis	PENDIENTE	\N	17	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
34	HU-APE-BUSC-011	Restablecer Contraseña	PENDIENTE	\N	18	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
35	HU-APE-BUSC-012	Registro Orientacion Individual APE	PENDIENTE	\N	19	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
36	HU-APE-BUSC-014	Evolucion Persona	PENDIENTE	\N	20	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
37	HU-APE-BUSC-015	Historicos Persona APE Actualizada v3	PENDIENTE	\N	21	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
38	HU-APE-BUSC-016	Consulta de Postulaciones	PENDIENTE	\N	22	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
39	HU-APE-BUSC-017	Seguimiento Individual	PENDIENTE	\N	23	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
40	SIN-CODIGO	OPCIONES DEL DAHSBOARD	PENDIENTE	\N	24	2026-09-21 21:13:18.341848+00	2026-09-21 21:13:18.341848+00	8
41	GTI-F-017-HU	Consulta Hoja de Vida v1 1_08_2026	PENDIENTE	\N	1	2026-09-21 21:14:23.377432+00	2026-09-21 21:14:23.377432+00	16
42	HU-APE-BUSC-001	Registro Personal Act1	PENDIENTE	\N	2	2026-09-21 21:14:23.377432+00	2026-09-21 21:14:23.377432+00	16
43	HU-APE-BUSC-002	Gestion Formacion Academica actualizada Vr 2	PENDIENTE	\N	3	2026-09-21 21:14:23.377432+00	2026-09-21 21:14:23.377432+00	16
44	HU-APE-BUSC-003	Documentos Varios Vr 1 1_08_2026	PENDIENTE	\N	4	2026-09-21 21:14:23.377432+00	2026-09-21 21:14:23.377432+00	16
45	HU-APE-BUSC-004	Registro Idiomas Actualizado Vr2	PENDIENTE	\N	5	2026-09-21 21:14:23.377432+00	2026-09-21 21:14:23.377432+00	16
46	HU-APE-BUSC-005	Experiencia Laboral vr1 1_08_2026	PENDIENTE	\N	6	2026-09-21 21:14:23.377432+00	2026-09-21 21:14:23.377432+00	16
47	HU-APE-BUSC-006	Pasantia vr 1 29_07_2026	PENDIENTE	\N	7	2026-09-21 21:14:23.377432+00	2026-09-21 21:14:23.377432+00	16
48	HU-APE-BUSC-008	Otros Datos vr 1 1_08_2026	PENDIENTE	\N	8	2026-09-21 21:14:23.377432+00	2026-09-21 21:14:23.377432+00	16
49	HU-APE-BUSC-009	Competencias Laborales vr 1 1_08_2026	PENDIENTE	\N	9	2026-09-21 21:14:23.377432+00	2026-09-21 21:14:23.377432+00	16
50	GTI-F-017-HU	MariaAPE	PENDIENTE	\N	1	2026-09-21 21:15:30.577712+00	2026-09-21 21:15:30.577712+00	10
51	GTI-F-017-HU	Publicacion de Convocatorias Internacionales	PENDIENTE	\N	2	2026-09-21 21:15:30.577712+00	2026-09-21 21:15:30.577712+00	10
52	GTI-F-017-HU	Publicacion de Convocatorias Nacionales	PENDIENTE	\N	3	2026-09-21 21:15:30.577712+00	2026-09-21 21:15:30.577712+00	10
53	GTI-F-017-HU	Usuario Administrador Portal Web APE	PENDIENTE	\N	4	2026-09-21 21:15:30.577712+00	2026-09-21 21:15:30.577712+00	10
54	GTI-F-017-HU	Usuario Anonimo	PENDIENTE	\N	5	2026-09-21 21:15:30.577712+00	2026-09-21 21:15:30.577712+00	10
\.


--
-- Data for Name: nodos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nodos (id, parent_id, nombre, orden, creado_en) FROM stdin;
1	\N	FUC	0	2026-09-21 19:46:33.081111+00
2	\N	APE	1	2026-09-21 18:46:50.552941+00
3	\N	RAV	2	2026-09-21 18:46:50.560455+00
5	1	FUC	0	2026-09-21 19:46:49.763478+00
7	3	General	1	2026-09-21 19:38:49.483738+00
4	2	Módulo CMS - Portal APE	0	2026-09-21 19:38:49.483738+00
8	2	Módulo de Personas	2	2026-09-21 21:02:26.934335+00
9	2	Módulo Hidrocarburos	3	2026-09-21 21:02:26.934335+00
10	2	Módulo Portal APE	4	2026-09-21 21:02:26.934335+00
11	2	Módulo Transaccional Administrador	5	2026-09-21 21:02:26.934335+00
12	2	Módulo Transaccional APE - Banco de Instructores	6	2026-09-21 21:02:26.934335+00
13	2	Módulo Transaccional APE - EMPRESAS	7	2026-09-21 21:02:26.934335+00
14	2	Módulo transaccional APE - Solicitudes	8	2026-09-21 21:02:26.934335+00
15	4	Módulo de Orientación Ocupacional	1	2026-09-21 21:07:07.587688+00
16	8	ACTUALIZACIONES	1	2026-09-21 21:13:06.722248+00
17	12	Administrador	1	2026-09-21 21:23:04.145416+00
18	12	Centro de Formación	2	2026-09-21 21:23:04.145416+00
19	12	Usuario Buscador de Empleo	3	2026-09-21 21:23:04.145416+00
\.


--
-- Name: historias_usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.historias_usuario_id_seq', 54, true);


--
-- Name: nodos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nodos_id_seq', 19, true);


--
-- Name: historias_usuario historias_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historias_usuario
    ADD CONSTRAINT historias_usuario_pkey PRIMARY KEY (id);


--
-- Name: nodos nodos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nodos
    ADD CONSTRAINT nodos_pkey PRIMARY KEY (id);


--
-- Name: idx_hu_nodo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hu_nodo ON public.historias_usuario USING btree (nodo_id);


--
-- Name: idx_nodos_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nodos_parent ON public.nodos USING btree (parent_id);


--
-- Name: historias_usuario historias_usuario_nodo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historias_usuario
    ADD CONSTRAINT historias_usuario_nodo_id_fkey FOREIGN KEY (nodo_id) REFERENCES public.nodos(id) ON DELETE CASCADE;


--
-- Name: nodos nodos_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nodos
    ADD CONSTRAINT nodos_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.nodos(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict HtOZQTl8wpeY1XNz9HVyE2ve4tbFSks13MRknrny38kEv3bdB9w4y9n210T3sLp

