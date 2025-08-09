import { Pipe, PipeTransform } from '@angular/core';
import { Kisi } from '../shared/models/kisi.model';

@Pipe({ name: 'candidateFilter', pure: true })
export class CandidateFilterPipe implements PipeTransform {

  /** Türkçe harfleri de normalize eden yardımcı */
  private norm(v?: string): string {
    return (v || '')
      .trim()
      .toLocaleLowerCase('tr')
      .replaceAll('ç', 'c')
      .replaceAll('ğ', 'g')
      .replaceAll('ı', 'i')
      .replaceAll('ö', 'o')
      .replaceAll('ş', 's')
      .replaceAll('ü', 'u');
  }

  transform(list: Kisi[], f: any): Kisi[] {
    if (!list) return [];

    let res = list;

    /* Metin araması */
    const t = this.norm(f.text);
    if (t) {
      res = res.filter(x =>
        [x.adi, x.basvurdugu_pozisyon, x.sehri, x.mail]
          .some(val => this.norm(val).includes(t))
      );
    }

    /* Şehir / pozisyon / cinsiyet */
    if (f.city)     res = res.filter(x => this.norm(x.sehri)              === this.norm(f.city));
    if (f.position) res = res.filter(x => this.norm(x.basvurdugu_pozisyon)=== this.norm(f.position));
    if (f.gender)   res = res.filter(x => this.norm(x.cinsiyet)           === this.norm(f.gender));

    if (f.disabledOnly) res = res.filter(x => !!x.engellilik);
    return res;
  }
}
