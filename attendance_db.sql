--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enum_Attendances_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Attendances_status" AS ENUM (
    'PRESENT',
    'ABSENT',
    'HALF_DAY',
    'LATE'
);


ALTER TYPE public."enum_Attendances_status" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Attendances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Attendances" (
    id uuid NOT NULL,
    "employeeId" uuid NOT NULL,
    date date NOT NULL,
    "checkIn" timestamp with time zone NOT NULL,
    "checkOut" timestamp with time zone,
    status public."enum_Attendances_status" DEFAULT 'PRESENT'::public."enum_Attendances_status",
    "isLate" boolean DEFAULT false,
    "isEarlyExit" boolean DEFAULT false,
    "workDuration" integer,
    notes text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."Attendances" OWNER TO postgres;

--
-- Name: Employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Employees" (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    "employeeCode" character varying(255) NOT NULL,
    department character varying(255) NOT NULL,
    "position" character varying(255) NOT NULL,
    "joinDate" date NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."Employees" OWNER TO postgres;

--
-- Data for Name: Attendances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Attendances" (id, "employeeId", date, "checkIn", "checkOut", status, "isLate", "isEarlyExit", "workDuration", notes, "createdAt", "updatedAt") FROM stdin;
3c840c5b-7508-404b-9d82-06772006fc18	12345678-1234-1234-1234-123456789012	2025-05-06	2025-05-06 15:51:13.65+05:30	2025-05-06 17:56:23.517+05:30	HALF_DAY	t	f	125	\N	2025-05-06 15:51:13.72+05:30	2025-05-06 17:56:23.668+05:30
6b3699db-760f-4d26-a50f-470183f5dad1	12345678-1234-1234-1234-123456789012	2025-05-13	2025-05-13 10:35:06.019+05:30	2025-05-13 10:35:12.09+05:30	HALF_DAY	t	t	0	\N	2025-05-13 10:35:06.535+05:30	2025-05-13 10:35:12.102+05:30
e3d27069-b41f-47d7-98ad-4dbdac866930	30a18959-aea1-4282-a60f-5856f8ef426d	2025-05-13	2025-05-13 15:46:04.932+05:30	2025-05-13 15:46:20.193+05:30	HALF_DAY	t	t	0	\N	2025-05-13 15:46:04.939+05:30	2025-05-13 15:46:20.275+05:30
\.


--
-- Data for Name: Employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Employees" (id, name, email, "employeeCode", department, "position", "joinDate", "createdAt", "updatedAt") FROM stdin;
12345678-1234-1234-1234-123456789012	John Doe	john.doe@example.com	EMP001	IT	Developer	2025-01-01	2025-05-06 15:49:38.573523+05:30	2025-05-06 15:49:38.573523+05:30
30a18959-aea1-4282-a60f-5856f8ef426d	Sarah Johnson	sarah.johnson@company.com	EMP004	Finance	Financial Analyst	2024-01-15	2025-05-13 15:24:11.695362+05:30	2025-05-13 15:24:11.695362+05:30
5821011b-d515-438b-978a-3cd766f05007	Priyanka	afgh@gmail.com	EMP006	FInance	FinancialAnalyst	2024-05-13	2025-05-13 15:43:48.192173+05:30	2025-05-13 15:43:48.192173+05:30
\.


--
-- Name: Attendances Attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendances"
    ADD CONSTRAINT "Attendances_pkey" PRIMARY KEY (id);


--
-- Name: Employees Employees_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Employees"
    ADD CONSTRAINT "Employees_email_key" UNIQUE (email);


--
-- Name: Employees Employees_employeeCode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Employees"
    ADD CONSTRAINT "Employees_employeeCode_key" UNIQUE ("employeeCode");


--
-- Name: Employees Employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Employees"
    ADD CONSTRAINT "Employees_pkey" PRIMARY KEY (id);


--
-- Name: attendances_employee_id_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX attendances_employee_id_date ON public."Attendances" USING btree ("employeeId", date);


--
-- Name: Attendances Attendances_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendances"
    ADD CONSTRAINT "Attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employees"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

