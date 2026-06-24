--
-- PostgreSQL database dump
--

\restrict x6WvKcQwpo0wS9c3GMp0FwAdXU0dJfDjAJJnGwfKQuajPAbDCjF9L6d615L4IFG

-- Dumped from database version 15.15 (Debian 15.15-0+deb12u1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-0+deb12u1)

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

--
-- Name: ItemType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ItemType" AS ENUM (
    'PRODUCT',
    'BUNDLE'
);


ALTER TYPE public."ItemType" OWNER TO postgres;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'CANCELLED',
    'REFUNDED'
);


ALTER TYPE public."OrderStatus" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'CUSTOMER'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bundle_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bundle_items (
    id text NOT NULL,
    bundle_id text NOT NULL,
    product_id text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.bundle_items OWNER TO postgres;

--
-- Name: bundles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bundles (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    image text,
    tags text[] DEFAULT ARRAY[]::text[],
    attributes jsonb,
    custom_fields jsonb,
    is_active boolean DEFAULT true NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bundles OWNER TO postgres;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_items (
    id text NOT NULL,
    user_id text NOT NULL,
    product_id text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.cart_items OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image text,
    parent_id text,
    "order" integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: downloads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.downloads (
    id text NOT NULL,
    user_id text NOT NULL,
    product_id text NOT NULL,
    ip_address text,
    user_agent text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.downloads OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    order_id text NOT NULL,
    product_id text,
    bundle_id text,
    item_type public."ItemType" NOT NULL,
    title text NOT NULL,
    price numeric(10,2) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id text NOT NULL,
    order_number text NOT NULL,
    user_id text NOT NULL,
    amount numeric(10,2) NOT NULL,
    tax numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    payment_status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    payment_method text,
    stripe_payment_id text,
    stripe_session_id text,
    email text NOT NULL,
    customer_name text NOT NULL,
    billing_address jsonb,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text,
    category_id text NOT NULL,
    price numeric(10,2) DEFAULT 0 NOT NULL,
    is_free boolean DEFAULT true NOT NULL,
    is_premium boolean DEFAULT false NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    file_path text,
    webp_path text,
    pdf_path text,
    thumbnail_path text,
    tags text[] DEFAULT ARRAY[]::text[],
    attributes jsonb,
    custom_fields jsonb,
    downloads integer DEFAULT 0 NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    dimensions text,
    gallery text[] DEFAULT ARRAY[]::text[],
    language text,
    print_length text
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id text NOT NULL,
    product_id text NOT NULL,
    rating integer NOT NULL,
    title text,
    comment text,
    author_name text NOT NULL,
    author_email text,
    is_verified boolean DEFAULT false NOT NULL,
    is_approved boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."UserRole" DEFAULT 'CUSTOMER'::public."UserRole" NOT NULL,
    "emailVerified" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: bundle_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bundle_items (id, bundle_id, product_id, "order", created_at) FROM stdin;
\.


--
-- Data for Name: bundles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bundles (id, title, slug, description, price, image, tags, attributes, custom_fields, is_active, is_featured, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_items (id, user_id, product_id, quantity, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, slug, description, image, parent_id, "order", is_active, created_at, updated_at) FROM stdin;
5b632180-aca4-4e36-86b0-8a3da50b027b	Coloring Pages	coloring-pages	Free printable coloring pages for kids and adults	https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800	\N	1	t	2026-01-19 14:33:23.073	2026-01-19 14:33:23.073
c3df5dbf-b6a6-4e08-b061-b8cb8a17e7b7	Animals & Pets	animals-pets	Cute animals, butterflies, and pets		5b632180-aca4-4e36-86b0-8a3da50b027b	1	t	2026-01-19 14:33:23.075	2026-01-19 14:33:23.075
27115340-9b7b-4166-b73c-26de55217ef9	Disney Characters	disney-characters	Disney princesses and characters		5b632180-aca4-4e36-86b0-8a3da50b027b	2	t	2026-01-19 14:33:23.076	2026-01-19 14:33:23.076
a0612b35-2aa2-4c8e-af7d-116a5262ec17	Video Games	video-games	Minecraft, Pokemon, Sonic, Roblox		5b632180-aca4-4e36-86b0-8a3da50b027b	3	t	2026-01-19 14:33:23.078	2026-01-19 14:33:23.078
530d78cf-18cc-4164-b5e6-5bf8c16079c2	Cartoons & TV	cartoons-tv	Bluey, Paw Patrol, Peppa Pig		5b632180-aca4-4e36-86b0-8a3da50b027b	4	t	2026-01-19 14:33:23.079	2026-01-19 14:33:23.079
a20f78b9-00e1-4baf-8fdd-91dd4ca61d14	Fantasy & Magic	fantasy-magic	Unicorns, dragons, fairies		5b632180-aca4-4e36-86b0-8a3da50b027b	5	t	2026-01-19 14:33:23.08	2026-01-19 14:33:23.08
e5874136-0031-42cf-9231-5895d59e0a51	Holidays	holidays	Christmas, Halloween, Easter		5b632180-aca4-4e36-86b0-8a3da50b027b	6	t	2026-01-19 14:33:23.082	2026-01-19 14:33:23.082
3f88762b-043f-4f3b-900b-ae2f0cf184ed	Educational	educational	ABC, Numbers, Shapes		5b632180-aca4-4e36-86b0-8a3da50b027b	7	t	2026-01-19 14:33:23.083	2026-01-19 14:33:23.083
b784071c-fdb1-4e04-9157-4847f131bb3c	Mandalas	mandalas	Beautiful mandala designs		5b632180-aca4-4e36-86b0-8a3da50b027b	8	t	2026-01-19 14:33:23.085	2026-01-19 14:33:23.085
f6491e9b-2004-4cd0-844e-ef99e6a53274	Nature & Flowers	nature-flowers	Flowers, trees, gardens		5b632180-aca4-4e36-86b0-8a3da50b027b	9	t	2026-01-19 14:33:23.086	2026-01-19 14:33:23.086
e73058d7-6e13-4053-9f50-afc8a4a885f8	Vehicles	vehicles	Cars, trucks, planes, trains		5b632180-aca4-4e36-86b0-8a3da50b027b	10	t	2026-01-19 14:33:23.087	2026-01-19 14:33:23.087
33128590-baf2-438c-beac-2daae8c2055d	Sports	sports	Soccer, basketball, swimming		5b632180-aca4-4e36-86b0-8a3da50b027b	11	t	2026-01-19 14:33:23.088	2026-01-19 14:33:23.088
bc2b6cfa-0f2b-46ed-bf34-7a364f1c3ad5	Food & Treats	food-treats	Ice cream, cupcakes, fruits		5b632180-aca4-4e36-86b0-8a3da50b027b	12	t	2026-01-19 14:33:23.089	2026-01-19 14:33:23.089
6368399d-87d9-4f39-ab8f-505e3543d980	Calendars	calendars	Free printable calendars and planners	https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800	\N	2	t	2026-01-19 14:33:23.091	2026-01-19 14:33:23.091
a6807419-3fad-47e1-9013-f42d2a7f79cb	2025 Calendar	2025-calendar	Full year 2025 calendar		6368399d-87d9-4f39-ab8f-505e3543d980	1	t	2026-01-19 14:33:23.092	2026-01-19 14:33:23.092
e91de6e9-b026-4838-82eb-565c92899525	Monthly Calendars	monthly-calendars	Month by month calendars		6368399d-87d9-4f39-ab8f-505e3543d980	2	t	2026-01-19 14:33:23.093	2026-01-19 14:33:23.093
ade5a63b-ec3a-47b7-8d5c-51b1b6cab737	Weekly Planners	weekly-planners	Weekly planning templates		6368399d-87d9-4f39-ab8f-505e3543d980	3	t	2026-01-19 14:33:23.095	2026-01-19 14:33:23.095
b7aa2d04-3a84-4614-85d1-47a60eaba8fe	Daily Planners	daily-planners	Daily planning pages		6368399d-87d9-4f39-ab8f-505e3543d980	4	t	2026-01-19 14:33:23.096	2026-01-19 14:33:23.096
3ac9f94c-b43f-407f-bee8-682b07b21ce9	Academic Calendar	academic-calendar	School year calendars		6368399d-87d9-4f39-ab8f-505e3543d980	5	t	2026-01-19 14:33:23.097	2026-01-19 14:33:23.097
aa097710-d9dd-4953-8288-eac4c23da8f8	Birthday Calendar	birthday-calendar	Track birthdays and events		6368399d-87d9-4f39-ab8f-505e3543d980	6	t	2026-01-19 14:33:23.098	2026-01-19 14:33:23.098
bbd18860-61c9-4209-a2e6-1a0e0a0affec	Meal Planners	meal-planners	Weekly meal planning		6368399d-87d9-4f39-ab8f-505e3543d980	7	t	2026-01-19 14:33:23.099	2026-01-19 14:33:23.099
cbf2ff6b-3c14-4828-932b-388d3efa24ac	Habit Trackers	habit-trackers	Track your daily habits		6368399d-87d9-4f39-ab8f-505e3543d980	8	t	2026-01-19 14:33:23.1	2026-01-19 14:33:23.1
b20e49ee-e860-4a99-bb52-2f4ea45bc79c	Goal Planners	goal-planners	Set and track goals		6368399d-87d9-4f39-ab8f-505e3543d980	9	t	2026-01-19 14:33:23.101	2026-01-19 14:33:23.101
635dfa60-058c-4450-8d00-a6825a5f5f30	Fitness Trackers	fitness-trackers	Workout and fitness logs		6368399d-87d9-4f39-ab8f-505e3543d980	10	t	2026-01-19 14:33:23.102	2026-01-19 14:33:23.102
efd8081b-1df6-4430-bbc2-43c2362eedf3	Budget Planners	budget-planners	Financial planning sheets		6368399d-87d9-4f39-ab8f-505e3543d980	11	t	2026-01-19 14:33:23.103	2026-01-19 14:33:23.103
695920f7-d31c-4844-b145-8245441c9723	Blank Calendars	blank-calendars	Customizable blank templates		6368399d-87d9-4f39-ab8f-505e3543d980	12	t	2026-01-19 14:33:23.104	2026-01-19 14:33:23.104
38160b52-8662-42a2-921e-b8f5c0406677	Printables	printables	Free printable templates and worksheets	https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800	\N	3	t	2026-01-19 14:33:23.105	2026-01-19 14:33:23.105
1f49139e-1d76-4c19-9e5c-5e6e40778de5	Worksheets	worksheets	Educational worksheets for kids		38160b52-8662-42a2-921e-b8f5c0406677	1	t	2026-01-19 14:33:23.106	2026-01-19 14:33:23.106
3ab28e15-7646-4fe8-a9ec-e4b9948a3ce5	Flashcards	flashcards	Learning flashcards		38160b52-8662-42a2-921e-b8f5c0406677	2	t	2026-01-19 14:33:23.107	2026-01-19 14:33:23.107
971a1340-56c6-4aca-bce7-f45813d11b5a	Certificates	certificates	Award certificates		38160b52-8662-42a2-921e-b8f5c0406677	3	t	2026-01-19 14:33:23.109	2026-01-19 14:33:23.109
09e12883-5af3-40cb-b58a-bbd36ac69a80	Greeting Cards	greeting-cards	Birthday and occasion cards		38160b52-8662-42a2-921e-b8f5c0406677	4	t	2026-01-19 14:33:23.11	2026-01-19 14:33:23.11
80f01bad-8e21-4cfc-b681-fb6f7c6956b9	Gift Tags	gift-tags	Printable gift tags		38160b52-8662-42a2-921e-b8f5c0406677	5	t	2026-01-19 14:33:23.111	2026-01-19 14:33:23.111
e347fe1b-ba54-43ae-b167-82ad4884be71	Party Decorations	party-decorations	Banners, bunting, decorations		38160b52-8662-42a2-921e-b8f5c0406677	6	t	2026-01-19 14:33:23.112	2026-01-19 14:33:23.112
78cf6226-6135-4f6e-94f5-f2c26daa8f83	Labels & Stickers	labels-stickers	Organizational labels		38160b52-8662-42a2-921e-b8f5c0406677	7	t	2026-01-19 14:33:23.112	2026-01-19 14:33:23.112
b18b5204-65ce-4c1c-a3ab-c3ff7edc8a2c	Bookmarks	bookmarks	Printable bookmarks		38160b52-8662-42a2-921e-b8f5c0406677	8	t	2026-01-19 14:33:23.113	2026-01-19 14:33:23.113
9f736cca-d710-48b7-ba5e-c3819791331f	Wall Art	wall-art	Printable posters and art		38160b52-8662-42a2-921e-b8f5c0406677	9	t	2026-01-19 14:33:23.114	2026-01-19 14:33:23.114
648a06d0-7567-441f-a831-03cda7783c90	Checklists	checklists	To-do lists and checklists		38160b52-8662-42a2-921e-b8f5c0406677	10	t	2026-01-19 14:33:23.115	2026-01-19 14:33:23.115
c4463dc2-f966-4b0c-a0a8-8edc87d16394	Invitations	invitations	Party invitations		38160b52-8662-42a2-921e-b8f5c0406677	11	t	2026-01-19 14:33:23.116	2026-01-19 14:33:23.116
730e465a-b123-4327-98d9-e77f88152897	Games & Puzzles	games-puzzles	Printable games and activities		38160b52-8662-42a2-921e-b8f5c0406677	12	t	2026-01-19 14:33:23.117	2026-01-19 14:33:23.117
e4c768db-131b-483a-a7dd-05b53b122c16	Book Shop	bookshop	Free and premium eBooks, guides, and digital books for all ages	https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800	\N	4	t	2026-01-27 19:21:57.728	2026-01-27 19:21:57.728
a2e5fa3f-75c3-473e-a6d5-86afa13b98de	Children Books	children-books	Illustrated books for kids	\N	e4c768db-131b-483a-a7dd-05b53b122c16	1	t	2026-01-27 19:21:57.741	2026-01-27 19:21:57.741
e3bac68a-4dc9-40a3-ae87-62feadca36b2	Educational Books	educational-books	Learning materials and textbooks	\N	e4c768db-131b-483a-a7dd-05b53b122c16	2	t	2026-01-27 19:21:57.758	2026-01-27 19:21:57.758
79d6bb1d-cff4-4147-b029-784cce91b5f0	Activity Books	activity-books	Puzzles, games, and activities	\N	e4c768db-131b-483a-a7dd-05b53b122c16	3	t	2026-01-27 19:21:57.763	2026-01-27 19:21:57.763
8df65551-c807-4861-a678-b5f5313e35ad	Coloring Books	coloring-ebooks	Digital coloring book collections	\N	e4c768db-131b-483a-a7dd-05b53b122c16	4	t	2026-01-27 19:21:57.769	2026-01-27 19:21:57.769
7e6214ef-3b93-42b9-b000-ab6b569b1b70	Recipe Books	recipe-books	Cooking and baking guides	\N	e4c768db-131b-483a-a7dd-05b53b122c16	5	t	2026-01-27 19:21:57.775	2026-01-27 19:21:57.775
dd6325a9-0e9f-4398-942b-d5ce20456a7e	Fitness Guides	fitness-guides	Workout and health books	\N	e4c768db-131b-483a-a7dd-05b53b122c16	6	t	2026-01-27 19:21:57.777	2026-01-27 19:21:57.777
39beed93-b83d-4fac-ad34-f9fd8384fae3	Business Books	business-books	Entrepreneurship and productivity	\N	e4c768db-131b-483a-a7dd-05b53b122c16	7	t	2026-01-27 19:21:57.829	2026-01-27 19:21:57.829
eceed7ae-d386-4aa8-86be-33280d3cce26	Self-Help	self-help-books	Personal development guides	\N	e4c768db-131b-483a-a7dd-05b53b122c16	8	t	2026-01-27 19:21:57.833	2026-01-27 19:21:57.833
b44a0db9-db7f-4c17-a9d0-edff8bd14d57	Romance	romance-books	Love stories and romantic novels	\N	e4c768db-131b-483a-a7dd-05b53b122c16	9	t	2026-01-27 19:21:57.838	2026-01-27 19:21:57.838
548c8997-2aae-4160-94dd-3b2b88c5a7ae	Fiction	fiction-books	Novels and short stories	\N	e4c768db-131b-483a-a7dd-05b53b122c16	10	t	2026-01-27 19:21:57.844	2026-01-27 19:21:57.844
6487ff22-05ea-49d7-97f9-bee656522003	Travel Guides	travel-guides	Destination guides and tips	\N	e4c768db-131b-483a-a7dd-05b53b122c16	11	t	2026-01-27 19:21:57.847	2026-01-27 19:21:57.847
b9ea8a53-1384-4966-a292-47851bbd5438	Journals	journals	Planners and journal templates	\N	e4c768db-131b-483a-a7dd-05b53b122c16	12	t	2026-01-27 19:21:57.85	2026-01-27 19:21:57.85
\.


--
-- Data for Name: downloads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.downloads (id, user_id, product_id, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, bundle_id, item_type, title, price, quantity, created_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, order_number, user_id, amount, tax, total, status, payment_status, payment_method, stripe_payment_id, stripe_session_id, email, customer_name, billing_address, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, title, slug, description, category_id, price, is_free, is_premium, is_featured, file_path, webp_path, pdf_path, thumbnail_path, tags, attributes, custom_fields, downloads, views, is_active, created_at, updated_at, dimensions, gallery, language, print_length) FROM stdin;
7b4d86b1-9c0b-4c0a-a4a5-a1ad779af18a	Cute Cat Coloring Page	cute-cat-coloring-page	A beautiful cat coloring page perfect for kids!	c3df5dbf-b6a6-4e08-b061-b8cb8a17e7b7	0.00	t	f	t	\N	https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400	\N	\N	{cat,animals,kids}	\N	\N	0	1	t	2026-01-19 14:33:37.531	2026-01-27 19:10:49.541	\N	{}	\N	\N
e0919c45-d63f-4b54-a8d7-a7116695d588	Cute Rabbit	cute-rabbit-coloring	An adorable rabbit with long ears.	c3df5dbf-b6a6-4e08-b061-b8cb8a17e7b7	0.00	t	f	f	\N	https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400	\N	\N	{rabbit,bunny}	\N	\N	0	1	t	2026-01-19 14:33:37.538	2026-01-27 19:10:55.04	\N	{}	\N	\N
1d99e68e-c872-4776-a370-c879d2b05163	Butterfly Garden	butterfly-garden-coloring	Beautiful butterflies flying in a garden.	c3df5dbf-b6a6-4e08-b061-b8cb8a17e7b7	0.00	t	f	f	\N	https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400	\N	\N	{butterfly,nature}	\N	\N	0	1	t	2026-01-19 14:33:37.536	2026-01-27 19:11:00.045	\N	{}	\N	\N
a8f2c660-53a9-4a44-b1cb-cf2d787543fa	Happy Dog Coloring Page	happy-dog-coloring-page	A friendly dog waiting to be colored!	c3df5dbf-b6a6-4e08-b061-b8cb8a17e7b7	0.00	t	f	f	\N	https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400	\N	\N	{dog,animals}	\N	\N	0	1	t	2026-01-19 14:33:37.535	2026-01-27 19:11:04.402	\N	{}	\N	\N
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, product_id, rating, title, comment, author_name, author_email, is_verified, is_approved, created_at, updated_at) FROM stdin;
be04f969-c615-4557-8498-d31bb57c2627	1d99e68e-c872-4776-a370-c879d2b05163	5	Absolutely Love It!	My kids had so much fun with this! The quality is excellent and it printed perfectly. Will definitely download more!	Sarah M.	sarah@example.com	t	t	2026-01-31 22:04:47.796	2026-01-31 22:04:47.796
36a775dc-0d55-4785-9fac-3e25508fbc0d	1d99e68e-c872-4776-a370-c879d2b05163	4	Great Quality	Very nice design and easy to print. The kids spent hours coloring this. Would recommend to other parents!	Michael T.	michael@example.com	t	t	2026-01-31 22:04:47.798	2026-01-31 22:04:47.798
70eba464-0c27-4107-be21-3a0f76a3634f	1d99e68e-c872-4776-a370-c879d2b05163	5	Perfect for Classroom	I use these for my classroom activities. The students love them! Great educational resource.	Teacher Jenny	jenny@school.edu	f	t	2026-01-31 22:04:47.799	2026-01-31 22:04:47.799
7306b439-059e-4502-bd3c-7e2e822ad9d7	7b4d86b1-9c0b-4c0a-a4a5-a1ad779af18a	5	Absolutely Love It!	My kids had so much fun with this! The quality is excellent and it printed perfectly. Will definitely download more!	Sarah M.	sarah@example.com	t	t	2026-01-31 22:04:47.801	2026-01-31 22:04:47.801
84eb92ac-3ee3-473e-a8c7-b61f615abb55	7b4d86b1-9c0b-4c0a-a4a5-a1ad779af18a	4	Great Quality	Very nice design and easy to print. The kids spent hours coloring this. Would recommend to other parents!	Michael T.	michael@example.com	t	t	2026-01-31 22:04:47.802	2026-01-31 22:04:47.802
aa8d7307-2b9a-4fb2-a856-2e0795b96c36	7b4d86b1-9c0b-4c0a-a4a5-a1ad779af18a	5	Perfect for Classroom	I use these for my classroom activities. The students love them! Great educational resource.	Teacher Jenny	jenny@school.edu	f	t	2026-01-31 22:04:47.803	2026-01-31 22:04:47.803
b54cc79f-7943-4f2d-a889-8b184b8d3ccb	a8f2c660-53a9-4a44-b1cb-cf2d787543fa	5	Absolutely Love It!	My kids had so much fun with this! The quality is excellent and it printed perfectly. Will definitely download more!	Sarah M.	sarah@example.com	t	t	2026-01-31 22:04:47.805	2026-01-31 22:04:47.805
77d0ca8e-a065-49a4-a007-1483372136c5	a8f2c660-53a9-4a44-b1cb-cf2d787543fa	4	Great Quality	Very nice design and easy to print. The kids spent hours coloring this. Would recommend to other parents!	Michael T.	michael@example.com	t	t	2026-01-31 22:04:47.806	2026-01-31 22:04:47.806
8e029c0d-31be-4285-844d-ae1a8676cfe6	a8f2c660-53a9-4a44-b1cb-cf2d787543fa	5	Perfect for Classroom	I use these for my classroom activities. The students love them! Great educational resource.	Teacher Jenny	jenny@school.edu	f	t	2026-01-31 22:04:47.808	2026-01-31 22:04:47.808
317e6072-87ca-43c6-8c1f-2fa79bf35d0c	e0919c45-d63f-4b54-a8d7-a7116695d588	5	Absolutely Love It!	My kids had so much fun with this! The quality is excellent and it printed perfectly. Will definitely download more!	Sarah M.	sarah@example.com	t	t	2026-01-31 22:04:47.813	2026-01-31 22:04:47.813
6be28d53-19d8-4db2-a284-d44af01dca78	e0919c45-d63f-4b54-a8d7-a7116695d588	4	Great Quality	Very nice design and easy to print. The kids spent hours coloring this. Would recommend to other parents!	Michael T.	michael@example.com	t	t	2026-01-31 22:04:47.814	2026-01-31 22:04:47.814
e14e62e2-ef79-4a11-b51a-6e3a560739a3	e0919c45-d63f-4b54-a8d7-a7116695d588	5	Perfect for Classroom	I use these for my classroom activities. The students love them! Great educational resource.	Teacher Jenny	jenny@school.edu	f	t	2026-01-31 22:04:47.815	2026-01-31 22:04:47.815
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, "emailVerified", "createdAt", "updatedAt") FROM stdin;
7cd70826-04c8-4ed8-98fc-e08726ae2d55	Admin	admin@printables.com	240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9	ADMIN	t	2026-01-19 14:33:23.071	2026-01-19 14:33:23.071
\.


--
-- Name: bundle_items bundle_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bundle_items
    ADD CONSTRAINT bundle_items_pkey PRIMARY KEY (id);


--
-- Name: bundles bundles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bundles
    ADD CONSTRAINT bundles_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: downloads downloads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.downloads
    ADD CONSTRAINT downloads_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: bundle_items_bundle_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bundle_items_bundle_id_idx ON public.bundle_items USING btree (bundle_id);


--
-- Name: bundle_items_bundle_id_product_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX bundle_items_bundle_id_product_id_key ON public.bundle_items USING btree (bundle_id, product_id);


--
-- Name: bundle_items_product_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bundle_items_product_id_idx ON public.bundle_items USING btree (product_id);


--
-- Name: bundles_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX bundles_slug_key ON public.bundles USING btree (slug);


--
-- Name: cart_items_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cart_items_user_id_idx ON public.cart_items USING btree (user_id);


--
-- Name: cart_items_user_id_product_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX cart_items_user_id_product_id_key ON public.cart_items USING btree (user_id, product_id);


--
-- Name: categories_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);


--
-- Name: downloads_product_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX downloads_product_id_idx ON public.downloads USING btree (product_id);


--
-- Name: downloads_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX downloads_user_id_idx ON public.downloads USING btree (user_id);


--
-- Name: order_items_bundle_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_items_bundle_id_idx ON public.order_items USING btree (bundle_id);


--
-- Name: order_items_order_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_items_order_id_idx ON public.order_items USING btree (order_id);


--
-- Name: order_items_product_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_items_product_id_idx ON public.order_items USING btree (product_id);


--
-- Name: orders_order_number_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_order_number_idx ON public.orders USING btree (order_number);


--
-- Name: orders_order_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX orders_order_number_key ON public.orders USING btree (order_number);


--
-- Name: orders_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_status_idx ON public.orders USING btree (status);


--
-- Name: orders_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_user_id_idx ON public.orders USING btree (user_id);


--
-- Name: products_category_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX products_category_id_idx ON public.products USING btree (category_id);


--
-- Name: products_is_featured_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX products_is_featured_idx ON public.products USING btree (is_featured);


--
-- Name: products_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX products_slug_idx ON public.products USING btree (slug);


--
-- Name: products_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX products_slug_key ON public.products USING btree (slug);


--
-- Name: reviews_product_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reviews_product_id_idx ON public.reviews USING btree (product_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: bundle_items bundle_items_bundle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bundle_items
    ADD CONSTRAINT bundle_items_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES public.bundles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bundle_items bundle_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bundle_items
    ADD CONSTRAINT bundle_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: downloads downloads_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.downloads
    ADD CONSTRAINT downloads_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: downloads downloads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.downloads
    ADD CONSTRAINT downloads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_items order_items_bundle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES public.bundles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reviews reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict x6WvKcQwpo0wS9c3GMp0FwAdXU0dJfDjAJJnGwfKQuajPAbDCjF9L6d615L4IFG

