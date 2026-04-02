--
-- PostgreSQL database dump
--

-- Dumped from database version 16.6
-- Dumped by pg_dump version 16.6

-- Started on 2026-04-02 15:14:49

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
-- TOC entry 215 (class 1259 OID 16567)
-- Name: actors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actors (
    staff_id text NOT NULL,
    nr_prizes integer
);


ALTER TABLE public.actors OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 16572)
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id text NOT NULL,
    text text NOT NULL,
    list_name text NOT NULL,
    list_owner text NOT NULL
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16577)
-- Name: crew_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.crew_members (
    staff_id text NOT NULL,
    job_title text NOT NULL
);


ALTER TABLE public.crew_members OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16582)
-- Name: directors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.directors (
    staff_id text NOT NULL
);


ALTER TABLE public.directors OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16587)
-- Name: favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.favorites (
    actor_id text NOT NULL,
    username text NOT NULL
);


ALTER TABLE public.favorites OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16592)
-- Name: friendships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.friendships (
    from_username text NOT NULL,
    to_username text NOT NULL
);


ALTER TABLE public.friendships OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16597)
-- Name: list_interaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.list_interaction (
    username text NOT NULL,
    list_name text NOT NULL,
    list_owner text NOT NULL,
    rating integer,
    follow boolean
);


ALTER TABLE public.list_interaction OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16602)
-- Name: lists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lists (
    name text NOT NULL,
    owner text NOT NULL,
    description text
);


ALTER TABLE public.lists OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16607)
-- Name: movie_in_list; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movie_in_list (
    movie_id text NOT NULL,
    list_name text NOT NULL,
    list_owner text NOT NULL
);


ALTER TABLE public.movie_in_list OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16617)
-- Name: premium_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.premium_users (
    username text NOT NULL
);


ALTER TABLE public.premium_users OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16622)
-- Name: staff; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff (
    id text NOT NULL,
    name text NOT NULL,
    birth_year integer
);


ALTER TABLE public.staff OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16627)
-- Name: staff_part_of_movie; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_part_of_movie (
    staff_id text NOT NULL,
    movie_id text NOT NULL
);


ALTER TABLE public.staff_part_of_movie OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16632)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    username text NOT NULL,
    email text NOT NULL,
    gender text,
    newsletter_opt_out boolean,
    newsletter_last_date date,
    avatar_image text,
    password_hash text,
    token_version integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 4919 (class 0 OID 16567)
-- Dependencies: 215
-- Data for Name: actors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.actors (staff_id, nr_prizes) FROM stdin;
s1	3
s2	21
s5	1
s6	1
\.


--
-- TOC entry 4920 (class 0 OID 16572)
-- Dependencies: 216
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, text, list_name, list_owner) FROM stdin;
c1	Amazing selection!	Best of Sci-Fi	user1
c2	I love this movie!	Oscar Winners	user2
c3	Quentin Tarantino is a genius!	Top Directors	user1
\.


--
-- TOC entry 4921 (class 0 OID 16577)
-- Dependencies: 217
-- Data for Name: crew_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.crew_members (staff_id, job_title) FROM stdin;
s3	Director
s4	Composer
s7	Director
s8	Composer
\.


--
-- TOC entry 4922 (class 0 OID 16582)
-- Dependencies: 218
-- Data for Name: directors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.directors (staff_id) FROM stdin;
s3
s7
\.


--
-- TOC entry 4923 (class 0 OID 16587)
-- Dependencies: 219
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.favorites (actor_id, username) FROM stdin;
s1	user1
s2	user1
\.


--
-- TOC entry 4924 (class 0 OID 16592)
-- Dependencies: 220
-- Data for Name: friendships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.friendships (from_username, to_username) FROM stdin;
user1	user2
\.


--
-- TOC entry 4925 (class 0 OID 16597)
-- Dependencies: 221
-- Data for Name: list_interaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.list_interaction (username, list_name, list_owner, rating, follow) FROM stdin;
user2	Best of Sci-Fi	user1	5	t
user1	Oscar Winners	user2	4	f
\.


--
-- TOC entry 4926 (class 0 OID 16602)
-- Dependencies: 222
-- Data for Name: lists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lists (name, owner, description) FROM stdin;
Best of Sci-Fi	user1	A list of my favorite science fiction movies
Oscar Winners	user2	Movies that have won Oscars
Top Directors	user1	A collection of my favorite directors
Superhero	jchron	descr
Faves	jchron	descr
greek	mama	descr
new lsit	mama	descr
bruh	ok	descr
Top 10	kchronis	descr
man	kchronis	descr
okaay	jason	descr
adsasd	takisTest	descr
fsdsd	takisTest	descr
nea lista	jasonTest	Oi kalyeteres tainies tou 2020 na ksereis einai oti kalytero bla bla bla
xa	jasonTest	sax
ookokok	jasonTest	nkjnkjnkjnkjnjk\n
new	bruhh	list\n
faves	dragon	Drago's favourties\n
late night	dragon	
greek	dragon	
GOAT series	dragon	
Nig	Guy	okok\n
das	guy	dasadasda
New	okok	descr
seed_alice-favs	seed_alice	Seed list for collaborative filtering
seed_bob-favs	seed_bob	Seed list for collaborative filtering
seed_carol-favs	seed_carol	Seed list for collaborative filtering
seed_dave-favs	seed_dave	Seed list for collaborative filtering
seed_eve-favs	seed_eve	Seed list for collaborative filtering
vd	ad	
idk	ad	xgh\n\n
Horror	iasonas	Scariest movies ever
\.


--
-- TOC entry 4927 (class 0 OID 16607)
-- Dependencies: 223
-- Data for Name: movie_in_list; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.movie_in_list (movie_id, list_name, list_owner) FROM stdin;
m1	Best of Sci-Fi	user1
m2	Oscar Winners	user2
m3	Oscar Winners	user2
m4	Best of Sci-Fi	user1
m1	Top Directors	user1
m3	Top Directors	user1
tt0371746	Superhero	jchron
tt0371746	Faves	jchron
tt16311594	greek	mama
tt2582802	greek	mama
tt16311594	new lsit	mama
tt0137523	Top 10	kchronis
tt0816692	man	kchronis
tt0316654	okaay	jason
tt0816692	Top 10	kchronis
tt0393109	okaay	jason
tt27987407	okaay	jason
tt0208092	okaay	jason
tt6718170	nea lista	jasonTest
tt1985949	nea lista	jasonTest
tt1985949	xa	jasonTest
tt1375666	new	bruhh
tt0076759	faves	dragon
tt0371746	adsasd	takisTest
tt1375666	fsdsd	takisTest
tt1375666	adsasd	takisTest
tt5295990	fsdsd	takisTest
tt0080684	faves	dragon
tt0816692	faves	dragon
tt1375666	faves	dragon
tt0903747	faves	dragon
tt0903747	GOAT series	dragon
tt0397306	New	okok
tt4158110	GOAT series	dragon
tt1520211	GOAT series	dragon
tt0246578	late night	dragon
tt14230458	greek	dragon
tt10148170	greek	dragon
tt0903747	Nig	Guy
tt0903747	das	guy
tt0816692	seed_alice-favs	seed_alice
tt1375666	seed_alice-favs	seed_alice
tt0468569	seed_alice-favs	seed_alice
tt0080684	seed_alice-favs	seed_alice
tt0062622	seed_alice-favs	seed_alice
tt0083658	seed_alice-favs	seed_alice
tt0097165	seed_alice-favs	seed_alice
tt0111161	seed_bob-favs	seed_bob
tt0068646	seed_bob-favs	seed_bob
tt0110912	seed_bob-favs	seed_bob
tt0073486	seed_bob-favs	seed_bob
tt0114369	seed_bob-favs	seed_bob
tt0097165	seed_bob-favs	seed_bob
tt0108052	seed_bob-favs	seed_bob
tt0083658	seed_carol-favs	seed_carol
tt0068646	seed_carol-favs	seed_carol
tt0114369	seed_carol-favs	seed_carol
tt1457767	seed_carol-favs	seed_carol
tt0363988	seed_carol-favs	seed_carol
tt0137523	seed_carol-favs	seed_carol
tt0076759	seed_carol-favs	seed_carol
tt0816692	seed_dave-favs	seed_dave
tt1375666	seed_dave-favs	seed_dave
tt0062622	seed_dave-favs	seed_dave
tt0167260	seed_dave-favs	seed_dave
tt0120737	seed_dave-favs	seed_dave
tt0137523	seed_dave-favs	seed_dave
tt0108052	seed_dave-favs	seed_dave
tt0468569	seed_eve-favs	seed_eve
tt0076759	seed_eve-favs	seed_eve
tt0167260	seed_eve-favs	seed_eve
tt0120737	seed_eve-favs	seed_eve
tt0102926	seed_eve-favs	seed_eve
tt0080684	seed_eve-favs	seed_eve
tt0108052	seed_eve-favs	seed_eve
tt0816692	vd	ad
tt5295894	vd	ad
tt1375666	vd	ad
tt2959006	idk	ad
tt2959006	vd	ad
tt5052448	Horror	iasonas
tt0387564	Horror	iasonas
tt0072271	Horror	iasonas
tt1396484	Horror	iasonas
tt2450186	Horror	iasonas
tt2870612	Horror	iasonas
\.


--
-- TOC entry 4928 (class 0 OID 16617)
-- Dependencies: 224
-- Data for Name: premium_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.premium_users (username) FROM stdin;
user1
\.


--
-- TOC entry 4929 (class 0 OID 16622)
-- Dependencies: 225
-- Data for Name: staff; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff (id, name, birth_year) FROM stdin;
s1	Leonardo DiCaprio	1974
s2	Meryl Streep	1949
s3	Christopher Nolan	1970
s4	Hans Zimmer	1957
s5	Brad Pitt	1963
s6	Emma Stone	1988
s7	Quentin Tarantino	1963
s8	John Williams	1932
\.


--
-- TOC entry 4930 (class 0 OID 16627)
-- Dependencies: 226
-- Data for Name: staff_part_of_movie; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff_part_of_movie (staff_id, movie_id) FROM stdin;
s1	m1
s3	m1
s4	m1
s2	m2
s5	m3
s7	m3
s6	m4
s8	m4
\.


--
-- TOC entry 4931 (class 0 OID 16632)
-- Dependencies: 227
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (username, email, gender, newsletter_opt_out, newsletter_last_date, avatar_image, password_hash, token_version) FROM stdin;
user1	user1@example.com	F	f	2023-10-01	https://cdn-icons-png.flaticon.com/512/149/149071.png	\N	0
user2	user2@example.com	M	t	2023-09-15	https://cdn-icons-png.flaticon.com/512/149/149071.png	\N	0
jason	jchronis2006@gmail.com	M	f	\N	\N	\N	0
bruh	bruh@gmail.com	\N	\N	\N	\N	$2b$12$sXs/mxxKz/Umwn5bkSZzP.4BioRJkV/RUR0QFsN7jCb71HusUxMea	0
maria	maria@mail.com	\N	\N	\N	\N	$2b$12$UM8lHL/njr.xhCRH5DngLekHz4snZkv8XuItGUrPBeXScDU9/spF2	0
mariaa	maria@mail.com	\N	\N	\N	\N	$2b$12$UbmDqIk51mhf7rWuJPhgJObOAiC3nLj93CnCXzJtZhp1bfKHH0tlO	0
ichronis	ichronis@mail	\N	\N	\N	\N	$2b$12$oAW1Fq/Wnbh30Htq56hpw.t9kW7Jp6pRq8r0B9uupujfCHCJme28G	0
ichroniss	ichroniss@mail	\N	\N	\N	\N	$2b$12$Bz.hKb.qsLIfXogb7yu7.epY7GxBz3vFzvLh9zR6vHvR/vIelDJ3S	0
jasonTest	jason@example.com	\N	\N	\N	\N	$2b$12$tPTQbUNoDgIxcqZ76dZd5ePuZB.CvdO1PDtWGdnO/gWDH3TZ75pHW	1
takisTest	takis@example	\N	\N	\N	\N	$2b$12$PVcnw6cVezj/97psnQzsp.VfuCrpfuK66tnwJvWhknKJnEC/aOflq	3
okok	ok@ok	\N	\N	\N	\N	$2b$12$BcXxkmN4i1rcByQNpbu0uuUGB4NWIbgWav1MEo3VAWwUC.r07QBlu	1
niggos	geigeiniggos@gmail.com	\N	\N	\N	\N	$2b$12$wRJw2dZ62EwkkCbk31u3/ea5dTd7ibh.zmDoq6AlRnMcpxdGzkm3u	1
jchron	jchronis2006@gmail.com	\N	\N	\N	\N	$2b$12$e.c8cRiyp0KCnhiaHR6Afe.5Hbpk4Jbaj5eTyNq9TXZeq7jIt8Wjm	0
mama	mama@mail	\N	\N	\N	\N	$2b$12$q7s3LHZmYpCEVRuJktPWI.8aOf2oQqtWSxZmmBBUn7tCTTH/QCkwS	0
ok	ok@gmail	\N	\N	\N	\N	$2b$12$aDbQo.L3H7QEIMZV8k154OLajCLBoMuQ.zqs33xro6pewjWsS/7a2	2
kchronis	kchronis2003@gmail.com	\N	\N	\N	\N	$2b$12$Ti6O9G155vfW57ivbSWIj.wYZlxiCzXJJeuNOAqClfh0dE1Obln.i	1
bruhh	bruh@mail	\N	\N	\N	\N	$2b$12$YIOI1SyKLT5JAItTppipZ.YlHXIF5kgRSEugbcPMrJ5PKcBP/JHMm	0
dragon	dragon@mail	\N	\N	\N	\N	$2b$12$XU5jE5eaUCZcXlxfmLIniOMaMoDSM6hMerfmbNrrv/m/kWigrLnpy	1
Guy	guy@mailnigga	\N	\N	\N	\N	$2b$12$daDPboYASlM0SJqLTTnxjuPfhgXAxA546bXiX0CnyWMrzKjly/LRa	0
guy	guy@mail	\N	\N	\N	\N	$2b$12$TPH4JsCrd6WQHKMbgrtD9OFrP7Xbjd/g8KeA55BKQzPzAJe2giwwm	1
seed_alice	alice@seed.kinodex	\N	\N	\N	\N	$2b$10$OpQrfSpTu5LUaKOP/8VJKuQQAFukhpTg1dSWsBu5J5Z5aNA7hq.R.	0
seed_bob	bob@seed.kinodex	\N	\N	\N	\N	$2b$10$OpQrfSpTu5LUaKOP/8VJKuQQAFukhpTg1dSWsBu5J5Z5aNA7hq.R.	0
seed_carol	carol@seed.kinodex	\N	\N	\N	\N	$2b$10$OpQrfSpTu5LUaKOP/8VJKuQQAFukhpTg1dSWsBu5J5Z5aNA7hq.R.	0
seed_dave	dave@seed.kinodex	\N	\N	\N	\N	$2b$10$OpQrfSpTu5LUaKOP/8VJKuQQAFukhpTg1dSWsBu5J5Z5aNA7hq.R.	0
seed_eve	eve@seed.kinodex	\N	\N	\N	\N	$2b$10$OpQrfSpTu5LUaKOP/8VJKuQQAFukhpTg1dSWsBu5J5Z5aNA7hq.R.	0
bruhhhg	jchronis@mail	\N	\N	\N	\N	$2b$12$dmQogLrCf8v7ly2rf9zWpO17P7/COMP3T4FGui1EBigY3KIfoNl1u	1
Testing	testing@gmail	\N	\N	\N	\N	$2b$12$rmccPihJSJS5b/D0xWvckudT6HnxDc3duZr4DeiGwa2uLm8pQY3by	1
ad	fsd@afsd	\N	\N	\N	\N	$2b$12$sRHSTON2IRrzX7U5xJwjROHckB1bdxTMqeL5MxR8pgmwBS10DWKk2	1
iasonas	bla@bla	\N	\N	\N	\N	$2b$12$VelRz0nQLDHeTUbtW3IJ/u9PITvIGl8NVU0Ys.Sg3Tro2J0oGoDc2	0
\.


--
-- TOC entry 4737 (class 2606 OID 16638)
-- Name: actors actors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actors
    ADD CONSTRAINT actors_pkey PRIMARY KEY (staff_id);


--
-- TOC entry 4739 (class 2606 OID 16640)
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- TOC entry 4741 (class 2606 OID 16642)
-- Name: crew_members crew_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crew_members
    ADD CONSTRAINT crew_members_pkey PRIMARY KEY (staff_id, job_title);


--
-- TOC entry 4743 (class 2606 OID 16644)
-- Name: directors directors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.directors
    ADD CONSTRAINT directors_pkey PRIMARY KEY (staff_id);


--
-- TOC entry 4745 (class 2606 OID 16646)
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (actor_id, username);


--
-- TOC entry 4747 (class 2606 OID 16648)
-- Name: friendships friendships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_pkey PRIMARY KEY (from_username, to_username);


--
-- TOC entry 4749 (class 2606 OID 16650)
-- Name: list_interaction list_interaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list_interaction
    ADD CONSTRAINT list_interaction_pkey PRIMARY KEY (username, list_name, list_owner);


--
-- TOC entry 4751 (class 2606 OID 16652)
-- Name: lists lists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT lists_pkey PRIMARY KEY (name, owner);


--
-- TOC entry 4753 (class 2606 OID 16654)
-- Name: movie_in_list movie_in_list_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movie_in_list
    ADD CONSTRAINT movie_in_list_pkey PRIMARY KEY (movie_id, list_name, list_owner);


--
-- TOC entry 4755 (class 2606 OID 16658)
-- Name: premium_users premium_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.premium_users
    ADD CONSTRAINT premium_users_pkey PRIMARY KEY (username);


--
-- TOC entry 4759 (class 2606 OID 16660)
-- Name: staff_part_of_movie staff_part_of_movie_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_part_of_movie
    ADD CONSTRAINT staff_part_of_movie_pkey PRIMARY KEY (staff_id, movie_id);


--
-- TOC entry 4757 (class 2606 OID 16662)
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- TOC entry 4761 (class 2606 OID 16664)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (username);


--
-- TOC entry 4762 (class 2606 OID 16665)
-- Name: actors actors_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actors
    ADD CONSTRAINT actors_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id);


--
-- TOC entry 4763 (class 2606 OID 16670)
-- Name: comments comments_list_name_list_owner_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_list_name_list_owner_fkey FOREIGN KEY (list_name, list_owner) REFERENCES public.lists(name, owner);


--
-- TOC entry 4764 (class 2606 OID 16675)
-- Name: crew_members crew_members_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crew_members
    ADD CONSTRAINT crew_members_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id);


--
-- TOC entry 4765 (class 2606 OID 16680)
-- Name: directors directors_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.directors
    ADD CONSTRAINT directors_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id);


--
-- TOC entry 4766 (class 2606 OID 16685)
-- Name: favorites favorites_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.actors(staff_id);


--
-- TOC entry 4767 (class 2606 OID 16690)
-- Name: favorites favorites_username_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_username_fkey FOREIGN KEY (username) REFERENCES public.premium_users(username);


--
-- TOC entry 4768 (class 2606 OID 16695)
-- Name: friendships friendships_from_username_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_from_username_fkey FOREIGN KEY (from_username) REFERENCES public.users(username);


--
-- TOC entry 4769 (class 2606 OID 16700)
-- Name: friendships friendships_to_username_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_to_username_fkey FOREIGN KEY (to_username) REFERENCES public.users(username);


--
-- TOC entry 4770 (class 2606 OID 16705)
-- Name: list_interaction list_interaction_list_name_list_owner_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list_interaction
    ADD CONSTRAINT list_interaction_list_name_list_owner_fkey FOREIGN KEY (list_name, list_owner) REFERENCES public.lists(name, owner);


--
-- TOC entry 4771 (class 2606 OID 16710)
-- Name: list_interaction list_interaction_username_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list_interaction
    ADD CONSTRAINT list_interaction_username_fkey FOREIGN KEY (username) REFERENCES public.users(username);


--
-- TOC entry 4772 (class 2606 OID 16715)
-- Name: lists lists_owner_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT lists_owner_fkey FOREIGN KEY (owner) REFERENCES public.users(username);


--
-- TOC entry 4773 (class 2606 OID 16720)
-- Name: movie_in_list movie_in_list_list_name_list_owner_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movie_in_list
    ADD CONSTRAINT movie_in_list_list_name_list_owner_fkey FOREIGN KEY (list_name, list_owner) REFERENCES public.lists(name, owner);


--
-- TOC entry 4774 (class 2606 OID 16730)
-- Name: premium_users premium_users_username_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.premium_users
    ADD CONSTRAINT premium_users_username_fkey FOREIGN KEY (username) REFERENCES public.users(username);


--
-- TOC entry 4775 (class 2606 OID 16740)
-- Name: staff_part_of_movie staff_part_of_movie_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_part_of_movie
    ADD CONSTRAINT staff_part_of_movie_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id);


-- Completed on 2026-04-02 15:14:49

--
-- PostgreSQL database dump complete
--

