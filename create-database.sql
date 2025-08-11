-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION pg_database_owner;

-- DROP SEQUENCE public.beceri_turu_id_seq;

CREATE SEQUENCE public.beceri_turu_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.beceriler_id_seq;

CREATE SEQUENCE public.beceriler_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.degerlendirme_id_seq;

CREATE SEQUENCE public.degerlendirme_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.kisi_id_seq;

CREATE SEQUENCE public.kisi_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.mulakat_katilimci_id_seq;

CREATE SEQUENCE public.mulakat_katilimci_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.mulakat_katilimci_iliskisi_id_seq;

CREATE SEQUENCE public.mulakat_katilimci_iliskisi_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.mulakatlar_id_seq;

CREATE SEQUENCE public.mulakatlar_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.notlar_id_seq;

CREATE SEQUENCE public.notlar_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.okullar_id_seq;

CREATE SEQUENCE public.okullar_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.sertifikalar_id_seq;

CREATE SEQUENCE public.sertifikalar_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.tecrubeler_id_seq;

CREATE SEQUENCE public.tecrubeler_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;-- public.beceri_turu definition

-- Drop table

-- DROP TABLE public.beceri_turu;

CREATE TABLE public.beceri_turu (
	id serial4 NOT NULL,
	"name" varchar(100) NOT NULL,
	CONSTRAINT beceri_turu_pkey PRIMARY KEY (id)
);


-- public.kisi definition

-- Drop table

-- DROP TABLE public.kisi;

CREATE TABLE public.kisi (
	id serial4 NOT NULL,
	adi varchar(200) NOT NULL,
	dogum_tarihi date NULL,
	sehri varchar(100) NULL,
	telefon_no varchar(20) NULL,
	mail varchar(150) NULL,
	okudugu_bolum varchar(200) NULL,
	basvurdugu_pozisyon varchar(200) NULL,
	description text NULL,
	cinsiyet varchar(10) NULL,
	askerlik_durumu varchar(50) NULL,
	engellilik bool DEFAULT false NULL,
	engellilik_orani int4 NULL,
	created_date timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT kisi_pkey PRIMARY KEY (id)
);


-- public.mulakat_katilimci definition

-- Drop table

-- DROP TABLE public.mulakat_katilimci;

CREATE TABLE public.mulakat_katilimci (
	id serial4 NOT NULL,
	katilimci_adi varchar(200) NOT NULL,
	sicil varchar(50) NOT NULL,
	created_date timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT mulakat_katilimci_pkey PRIMARY KEY (id)
);


-- public.beceriler definition

-- Drop table

-- DROP TABLE public.beceriler;

CREATE TABLE public.beceriler (
	id serial4 NOT NULL,
	aday_id int4 NOT NULL,
	beceri_turu_id int4 NOT NULL,
	beceri_adi varchar(200) NOT NULL,
	beceri_seviyesi varchar(50) NULL,
	created_date timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT beceriler_pkey PRIMARY KEY (id),
	CONSTRAINT beceriler_aday_id_fkey FOREIGN KEY (aday_id) REFERENCES public.kisi(id),
	CONSTRAINT beceriler_beceri_turu_id_fkey FOREIGN KEY (beceri_turu_id) REFERENCES public.beceri_turu(id)
);


-- public.mulakatlar definition

-- Drop table

-- DROP TABLE public.mulakatlar;

CREATE TABLE public.mulakatlar (
	id serial4 NOT NULL,
	aday_id int4 NOT NULL,
	mulakat_tarihi timestamp NULL,
	planlanan_toplanti_tarihi timestamp NULL,
	mulakat_tipi varchar(50) NULL,
	created_date timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT mulakatlar_pkey PRIMARY KEY (id),
	CONSTRAINT mulakatlar_aday_id_fkey FOREIGN KEY (aday_id) REFERENCES public.kisi(id)
);


-- public.notlar definition

-- Drop table

-- DROP TABLE public.notlar;

CREATE TABLE public.notlar (
	id serial4 NOT NULL,
	mulakat_id int4 NOT NULL,
	sicil varchar(50) NOT NULL,
	created_date timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	is_deleted bool DEFAULT false NULL,
	is_active bool DEFAULT true NULL,
	not_metni text NULL,
	CONSTRAINT notlar_pkey PRIMARY KEY (id),
	CONSTRAINT notlar_mulakat_id_fkey FOREIGN KEY (mulakat_id) REFERENCES public.mulakatlar(id)
);


-- public.okullar definition

-- Drop table

-- DROP TABLE public.okullar;

CREATE TABLE public.okullar (
	id serial4 NOT NULL,
	aday_id int4 NOT NULL,
	okul_ili varchar(100) NULL,
	okul_adi varchar(200) NOT NULL,
	okul_bolumu varchar(200) NULL,
	okul_tipi int4 NULL,
	not_ortalamasi numeric(5, 2) NULL,
	created_date timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT okullar_pkey PRIMARY KEY (id),
	CONSTRAINT okullar_aday_id_fkey FOREIGN KEY (aday_id) REFERENCES public.kisi(id)
);


-- public.sertifikalar definition

-- Drop table

-- DROP TABLE public.sertifikalar;

CREATE TABLE public.sertifikalar (
	id serial4 NOT NULL,
	aday_id int4 NOT NULL,
	sertifika_adi varchar(200) NOT NULL,
	gecerliligi date NULL,
	alinma_tarihi date NULL,
	created_date timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT sertifikalar_pkey PRIMARY KEY (id),
	CONSTRAINT sertifikalar_aday_id_fkey FOREIGN KEY (aday_id) REFERENCES public.kisi(id)
);


-- public.tecrubeler definition

-- Drop table

-- DROP TABLE public.tecrubeler;

CREATE TABLE public.tecrubeler (
	id serial4 NOT NULL,
	aday_id int4 NOT NULL,
	sirket_adi varchar(200) NOT NULL,
	giris_tarihi date NULL,
	cikis_tarihi date NULL,
	pozisyonu varchar(200) NULL,
	sirket_referansi varchar(500) NULL,
	created_date timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT tecrubeler_pkey PRIMARY KEY (id),
	CONSTRAINT tecrubeler_aday_id_fkey FOREIGN KEY (aday_id) REFERENCES public.kisi(id)
);


-- public.degerlendirme definition

-- Drop table

-- DROP TABLE public.degerlendirme;

CREATE TABLE public.degerlendirme (
	id serial4 NOT NULL,
	mulakat_id int4 NOT NULL,
	degerlendirme_turu varchar(20) NULL,
	sicil varchar(50) NOT NULL,
	puani int4 NULL,
	created_date timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT degerlendirme_pkey PRIMARY KEY (id),
	CONSTRAINT degerlendirme_mulakat_id_fkey FOREIGN KEY (mulakat_id) REFERENCES public.mulakatlar(id)
);


-- public.mulakat_katilimci_iliskisi definition

-- Drop table

-- DROP TABLE public.mulakat_katilimci_iliskisi;

CREATE TABLE public.mulakat_katilimci_iliskisi (
	id serial4 NOT NULL,
	mulakat_id int4 NOT NULL,
	katilimci_id int4 NOT NULL,
	CONSTRAINT mulakat_katilimci_iliskisi_pkey PRIMARY KEY (id),
	CONSTRAINT mulakat_katilimci_iliskisi_katilimci_id_fkey FOREIGN KEY (katilimci_id) REFERENCES public.mulakat_katilimci(id),
	CONSTRAINT mulakat_katilimci_iliskisi_mulakat_id_fkey FOREIGN KEY (mulakat_id) REFERENCES public.mulakatlar(id)
);