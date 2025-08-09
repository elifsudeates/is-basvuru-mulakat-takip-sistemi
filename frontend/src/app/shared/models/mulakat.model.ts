export interface Mulakat {
  mulakat_id: number;
  aday_id: number;
  mulakat_tarihi?: string | null;
  planlanan_toplanti_tarihi?: string | null;
  mulakat_tipi?: string;
  notlar?: string;
  created_date?: string;

  katilimcilar?: Katilimci[];
  notlar_listesi?: Not[];
  degerlendirmeler?: Degerlendirme[];
}

export interface Katilimci {
  id: number;
  katilimci_adi: string;
  sicil: string;
}

export interface Not {
  id: number;
  sicil: string;
  created_date: string;
  is_deleted: boolean;
  is_active: boolean;
  not_metni: string;
}

export interface Degerlendirme {
  id: number;
  degerlendirme_turu: string;
  sicil: string;
  puani: number;
  created_date: string;
}
