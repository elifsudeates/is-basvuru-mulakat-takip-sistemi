import { Mulakat } from './mulakat.model';

/** ==============================
 *  Ana model: Aday (Kişi / Candidate)
 *  ============================== */
export interface Kisi {
  id: number;
  adi: string;
  dogum_tarihi?: string;
  sehri?: string;
  telefon_no?: string;
  mail?: string;
  okudugu_bolum?: string;
  basvurdugu_pozisyon?: string;
  description?: string;
  cinsiyet?: string;          // 'male' | 'female' vs.
  askerlik_durumu?: string;
  engellilik?: boolean;
  engellilik_orani?: number;
  created_date?: string;

  /* --- Relations (eager-load varsa) --- */
  okullar?: Okul[];
  tecrubeler?: Tecrube[];
  sertifikalar?: Sertifika[];
  beceriler?: Beceri[];
  mulakatlar?: Mulakat[];
}

/* ---------- Alt Tipler ---------- */
export interface Okul {
  id: number;
  aday_id: number;
  okul_adi: string;
  okul_bolumu?: string;
  okul_ili?: string;
  okul_tipi?: number;        // 0:Devlet 1:Vakıf vb.
  not_ortalamasi?: number;
  created_date?: string;
}

export interface Tecrube {
  id: number;
  aday_id: number;
  sirket_adi: string;
  pozisyonu?: string;
  giris_tarihi?: string;
  cikis_tarihi?: string;
  sirket_referansi?: string;
  created_date?: string;
}

export interface Sertifika {
  id: number;
  aday_id: number;
  sertifika_adi: string;
  gecerliligi?: string;      // ISO tarih veya “Süresiz”
  alinma_tarihi?: string;
  created_date?: string;
}

export interface Beceri {
  id: number;
  aday_id: number;
  beceri_turu_id: number;
  beceri_adi: string;
  beceri_seviyesi?: string;  // Beginner / Intermediate / Expert
  created_date?: string;

  tur?: { id: number; name: string };   // İsteğe bağlı join sonucu
}
