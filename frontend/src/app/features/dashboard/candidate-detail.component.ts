// src/app/features/dashboard/candidate-detail.component.ts - Tam Güncellenmiş Hal
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MulakatService, MulakatPayload } from 'src/app/core/services/mulakat.service';
import { KatilimciService } from 'src/app/core/services/katilimci.service';

interface Kisi {
  id: number;
  adi: string;

  dogum_tarihi?: string | null;
  mail?: string | null;
  telefon_no?: string | null;
  cinsiyet?: string | null;
  askerlik_durumu?: string | null;
  sehri?: string | null;
  basvurdugu_pozisyon?: string | null;
  engellilik?: boolean | null;
  engellilik_orani?: number | null;

  // used by template
  description?: string | null;
  sertifikalar?: any[];

  okullar?: Array<{
    okul_adi?: string;
    okul_bolumu?: string;
    okul_ili?: string;
    not_ortalamasi?: number | string | null;
    okul_tipi?: number | null; // 1=Lise, else=Üniversite
  }>;

  tecrubeler?: Array<{
    giris_tarihi?: string | null;
    cikis_tarihi?: string | null;
    pozisyonu?: string | null;
    sirket_adi?: string | null;
    sirket_referansi?: string | null;
  }>;

  beceriler?: Array<{
    beceri_adi: string;
    beceri_seviyesi?: number | string | null | undefined; // backend sometimes sends string
    beceri_tipi?: string | null;
    beceri_turu_id?: number | null;
  }>;
}

interface Mulakat {
  id: number;
  aday_id: number;
  mulakat_tarihi?: string | null;
  planlanan_toplanti_tarihi?: string | null;
  mulakat_tipi?: string | null;

  katilimcilar?: Array<{
    id: number;
    katilimci_adi: string;
    sicil: string;
  }>;

  notlar?: Array<{
    id: number;
    mulakat_id: number;
    sicil: string;
    not_metni?: string | null;
    is_deleted?: boolean | null;
    is_active?: boolean | null;
    created_date?: string | null;
  }>;

  degerlendirmeler?: Array<{
    id: number;
    mulakat_id: number;
    degerlendirme_turu?: string | null; // "genel" | "karar" | ...
    sicil: string;
    puani?: number | string | null;      // allow string; we coerce when needed
    created_date?: string | null;
  }>;
}

// Katılımcı interface
interface Katilimci {
  id: number;
  katilimci_adi: string;
  sicil: string;
  created_date?: string;
}

@Component({
  selector: 'app-candidate-detail',
  templateUrl: './candidate-detail.component.html',
  styleUrls: ['./candidate-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidateDetailComponent implements OnChanges {
  @Input() candidate?: Kisi | null;
  @Input() loading = false; // outer loading (parent)

  // local state
  innerLoading = false; // for interview panel
  interviews: Mulakat[] = []; // Non-null array olarak initialize edildi
  activeTab: 'overview' | 'education' | 'experience' | 'skills' | 'interviews' = 'overview';

  // Mülakat yönetimi için
  showInterviewModal = false;
  editingInterviewId: number | null = null;
  availableParticipants: Katilimci[] = [];
  interviewForm: FormGroup;

  constructor(
    private cdr: ChangeDetectorRef,
    private mulakatSvc: MulakatService,
    private katilimciSvc: KatilimciService,
    private fb: FormBuilder
  ) {
    // Mülakat formu
    this.interviewForm = this.fb.group({
      mulakat_tarihi: [''],
      planlanan_toplanti_tarihi: [''],
      mulakat_tipi: [''],
      katilimcilar: [[]],
      notlar: this.fb.array([]),
      degerlendirmeler: this.fb.array([])
    });

    // Katılımcıları yükle
    this.loadParticipants();
  }

  // FormArray getter'ları
  get notesFormArray(): FormArray {
    return this.interviewForm.get('notlar') as FormArray;
  }

  get evaluationsFormArray(): FormArray {
    return this.interviewForm.get('degerlendirmeler') as FormArray;
  }

  // Katılımcıları yükle
  private loadParticipants(): void {
    this.katilimciSvc.getAll().subscribe({
      next: (participants) => {
        this.availableParticipants = participants;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading participants:', err);
        this.availableParticipants = [];
        this.cdr.markForCheck();
      }
    });
  }

  // React to candidate change
  ngOnChanges(changes: SimpleChanges): void {
    if ('candidate' in changes) {
      const id = this.candidate?.id;
      if (id) {
        this.loadInterviews(id);
      } else {
        this.interviews = [];
      }
      this.cdr.markForCheck();
    }
  }

  /** Load interviews (with participants, notes, evaluations) for candidate */
  private loadInterviews(candidateId: number): void {
    this.innerLoading = true;
    this.cdr.markForCheck();

    this.mulakatSvc.getFullByCandidate(candidateId).subscribe({
      next: (rows) => {
        const list = (rows || []) as Mulakat[];
        // Sort newest first
        this.interviews = list.sort((a, b) => {
          const da = new Date(a.mulakat_tarihi || '').getTime();
          const db = new Date(b.mulakat_tarihi || '').getTime();
          return db - da;
        });
        this.innerLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('getFullByCandidate error:', err);
        this.interviews = [];
        this.innerLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  /** Switch active tab */
  setActiveTab(tab: typeof this.activeTab) {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  // Mülakat modal yönetimi
  openCreateInterviewModal(): void {
    this.editingInterviewId = null;
    this.resetInterviewForm();
    this.showInterviewModal = true;
    this.cdr.markForCheck();
  }

  openEditInterviewModal(interview: Mulakat): void {
    this.editingInterviewId = interview.id;
    this.populateInterviewForm(interview);
    this.showInterviewModal = true;
    this.cdr.markForCheck();
  }

  closeInterviewModal(): void {
    this.showInterviewModal = false;
    this.editingInterviewId = null;
    this.resetInterviewForm();
    this.cdr.markForCheck();
  }

  private resetInterviewForm(): void {
    this.interviewForm.reset();
    this.clearFormArrays();
  }

  private populateInterviewForm(interview: Mulakat): void {
    this.interviewForm.patchValue({
      mulakat_tarihi: interview.mulakat_tarihi ? new Date(interview.mulakat_tarihi).toISOString().slice(0, 16) : '',
      planlanan_toplanti_tarihi: interview.planlanan_toplanti_tarihi ? new Date(interview.planlanan_toplanti_tarihi).toISOString().slice(0, 16) : '',
      mulakat_tipi: interview.mulakat_tipi || '',
      katilimcilar: interview.katilimcilar?.map(k => k.id) || []
    });

    this.clearFormArrays();

    // Notları doldur
    if (interview.notlar && interview.notlar.length > 0) {
      interview.notlar.forEach(note => {
        this.addNote();
        const index = this.notesFormArray.length - 1;
        this.notesFormArray.at(index).patchValue({
          sicil: note.sicil,
          not_metni: note.not_metni
        });
      });
    }

    // Değerlendirmeleri doldur
    if (interview.degerlendirmeler && interview.degerlendirmeler.length > 0) {
      interview.degerlendirmeler.forEach(evaluation => {
        this.addEvaluation();
        const index = this.evaluationsFormArray.length - 1;
        this.evaluationsFormArray.at(index).patchValue({
          sicil: evaluation.sicil,
          degerlendirme_turu: evaluation.degerlendirme_turu,
          puani: evaluation.puani
        });
      });
    }
  }

  private clearFormArrays(): void {
    while (this.notesFormArray.length !== 0) {
      this.notesFormArray.removeAt(0);
    }
    while (this.evaluationsFormArray.length !== 0) {
      this.evaluationsFormArray.removeAt(0);
    }
  }

  // Form array yönetimi
  addNote(): void {
    const noteGroup = this.fb.group({
      sicil: ['', Validators.required],
      not_metni: ['', Validators.required]
    });
    this.notesFormArray.push(noteGroup);
    this.cdr.markForCheck();
  }

  removeNote(index: number): void {
    this.notesFormArray.removeAt(index);
    this.cdr.markForCheck();
  }

  addEvaluation(): void {
    const evaluationGroup = this.fb.group({
      sicil: ['', Validators.required],
      degerlendirme_turu: ['genel'],
      puani: [null, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
    this.evaluationsFormArray.push(evaluationGroup);
    this.cdr.markForCheck();
  }

  removeEvaluation(index: number): void {
    this.evaluationsFormArray.removeAt(index);
    this.cdr.markForCheck();
  }
  // Mülakat kaydet/güncelle
  onSubmitInterview(): void {
    if (this.interviewForm.invalid || !this.candidate) {
      this.markFormGroupTouched(this.interviewForm);
      return;
    }

    const formData = this.interviewForm.getRawValue();
    const payload: MulakatPayload = {
      aday_id: this.candidate.id,
      mulakat_tarihi: formData.mulakat_tarihi || null,
      planlanan_toplanti_tarihi: formData.planlanan_toplanti_tarihi || null,
      mulakat_tipi: formData.mulakat_tipi || null,
      katilimcilar: formData.katilimcilar || [],
      notlar: formData.notlar || [],
      degerlendirmeler: formData.degerlendirmeler || []
    };

    if (this.editingInterviewId) {
      this.updateInterview(this.editingInterviewId, payload);
    } else {
      this.createInterview(payload);
    }
  }

  private createInterview(payload: MulakatPayload): void {
    this.mulakatSvc.create(payload).subscribe({
      next: (response) => {
        this.closeInterviewModal();
        this.loadInterviews(this.candidate!.id);
        alert('Mülakat başarıyla oluşturuldu!');
      },
      error: (err) => {
        console.error('Error creating interview:', err);
        alert('Mülakat oluşturulurken bir hata oluştu.');
      }
    });
  }

  private updateInterview(id: number, payload: MulakatPayload): void {
    this.mulakatSvc.update(id, payload).subscribe({
      next: (response) => {
        this.closeInterviewModal();
        this.loadInterviews(this.candidate!.id);
        alert('Mülakat başarıyla güncellendi!');
      },
      error: (err) => {
        console.error('Error updating interview:', err);
        alert('Mülakat güncellenirken bir hata oluştu.');
      }
    });
  }

  // Mülakat sil
  deleteInterview(interview: Mulakat): void {
    if (!confirm(`Bu mülakatı silmek istediğinizden emin misiniz?`)) {
      return;
    }

    this.mulakatSvc.delete(interview.id).subscribe({
      next: () => {
        this.loadInterviews(this.candidate!.id);
        alert('Mülakat başarıyla silindi!');
      },
      error: (err) => {
        console.error('Error deleting interview:', err);
        alert('Mülakat silinirken bir hata oluştu.');
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  /** Format date safely */
  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  /** Age from candidate.dogum_tarihi */
  calculateAge(): number | null {
    const dob = this.candidate?.dogum_tarihi;
    if (!dob) return null;
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age >= 0 ? age : null;
  }

  /** Total years of experience from tecrubeler */
  calculateExperienceYears(): number {
    const tecrubeler = this.candidate?.tecrubeler ?? [];
    let totalMs = 0;
    const now = new Date();
    for (const t of tecrubeler) {
      const start = t.giris_tarihi ? new Date(t.giris_tarihi) : null;
      const end = t.cikis_tarihi ? new Date(t.cikis_tarihi) : now;
      if (!start || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
      totalMs += Math.max(0, end.getTime() - start.getTime());
    }
    const years = totalMs / (1000 * 60 * 60 * 24 * 365.25);
    return Math.round(years * 10) / 10;
  }

  /** Normalize score-like values to number (e.g., "85", "85,5", 85) */
  scoreNum(value?: number | string | null): number {
    if (value == null) return 0;
    const n = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
    return Number.isFinite(n as number) ? (n as number) : 0;
  }

  /** Average of all interviews */
  getInterviewScore(): number | null {
    const ivs = this.interviews ?? [];
    const scores: number[] = [];
    for (const iv of ivs) {
      const avg = this.getInterviewAverageScore(iv);
      if (typeof avg === 'number') scores.push(avg);
    }
    if (!scores.length) return null;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(mean);
  }

  /** Average score for a single interview (0..100) */
  getInterviewAverageScore(interview: Mulakat): number | null {
    const arr = interview.degerlendirmeler ?? [];
    const nums = arr
      .map((x) => this.scoreNum(x.puani))
      .filter((n) => Number.isFinite(n));
    if (!nums.length) return null;
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    return Math.round(mean);
  }

  /** Group skills by type */
  // getSkillsByType(): Record<string, any[]> {
  //   const out: Record<string, any[]> = {};
  //   const skills = this.candidate?.beceriler ?? [];
  //   for (const s of skills) {
  //     const key = (s.beceri_tipi || 'Genel').trim();
  //     (out[key] ||= []).push(s);
  //   }
  //   return out;
  // }
  getSkillsByType(): Record<string, any[]> {
  const out: Record<string, any[]> = {};
  const skills = this.candidate?.beceriler ?? [];
  for (const s of skills) {
    let key = (s.beceri_tipi || '').trim();
    if (!key && s.beceri_turu_id) {
      switch (s.beceri_turu_id) {
        case 1: key = 'Diller'; break;
        case 2: key = 'Kişisel Gelişim'; break;
        case 3: key = 'Teknik Gelişim'; break;
        case 4: key = 'Sınavlar'; break;
        case 5: key = 'TÜBİTAK Projesi'; break;
        case 6: key = 'Makaleler'; break;
        default: key = 'Genel'; break;
      }
    }
    if (!key) key = 'Genel';
    (out[key] ||= []).push(s);
  }
  return out;
}

  /** Badge class by skill level (1..5). Accepts string too. */
  getSkillLevelClass(level?: number | string | null | undefined): string {
    const v = this.scoreNum(level ?? 0);
    if (v >= 5) return 'bg-success';
    if (v >= 4) return 'bg-primary';
    if (v >= 3) return 'bg-info';
    if (v >= 2) return 'bg-warning';
    return 'bg-secondary';
  }

  /** Border color by interview avg score */
  getInterviewStatusClass(interview: Mulakat): string {
    const score = this.getInterviewAverageScore(interview);
    if (score === null) return 'border-secondary';
    if (score >= 80) return 'border-success';
    if (score >= 60) return 'border-warning';
    return 'border-danger';
  }

  /** Icon by interview type text */
  getInterviewTypeIcon(type?: string | null): string {
    const t = (type || '').toLowerCase();
    if (t.includes('teknik')) return 'fas fa-code';
    if (t.includes('ön')) return 'fas fa-comments';
    if (t.includes('sonuç') || t.includes('final')) return 'fas fa-flag-checkered';
    return 'fas fa-comments';
  }

  /** Any note by 'sicil'? */
  hasNotesBySicil(interview: Mulakat, sicil: string): boolean {
    const notes = interview.notlar ?? [];
    return notes.some((n) => !n.is_deleted && n.is_active && n.sicil === sicil);
  }

  /** Notes filtered by 'sicil' */
  notesBySicil(interview: Mulakat, sicil: string) {
    const notes = interview.notlar ?? [];
    return notes.filter((n) => !n.is_deleted && n.is_active && n.sicil === sicil);
  }

  // Katılımcı adını sicile göre getir
  getParticipantNameBySicil(sicil: string): string {
    const participant = this.availableParticipants.find(p => p.sicil === sicil);
    return participant ? participant.katilimci_adi : sicil;
  }

  // Mülakat türü badge class
  getInterviewTypeBadgeClass(type?: string | null): string {
    const t = (type || '').toLowerCase();
    if (t.includes('teknik')) return 'bg-info';
    if (t.includes('ön')) return 'bg-primary';
    if (t.includes('son') || t.includes('final')) return 'bg-success';
    if (t.includes('grup')) return 'bg-warning';
    return 'bg-secondary';
  }

  // Değerlendirme türü badge class
  getEvaluationTypeBadgeClass(type?: string | null): string {
    const t = (type || '').toLowerCase();
    if (t.includes('teknik')) return 'bg-info';
    if (t.includes('karar')) return 'bg-success';
    if (t.includes('kişisel')) return 'bg-warning';
    return 'bg-primary'; // genel
  }

  // Puan rengi
  getScoreClass(score: number): string {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-danger';
  }

  // Katılımcı isimlerini virgülle ayrılmış string olarak getir
  getParticipantNames(interview: Mulakat): string {
    if (!interview.katilimcilar || interview.katilimcilar.length === 0) {
      return 'Katılımcı yok';
    }
    return interview.katilimcilar.map(k => k.katilimci_adi).join(', ');
  }

  // Mülakat durumu (geçmiş/gelecek)
  isInterviewPast(interview: Mulakat): boolean {
    if (!interview.mulakat_tarihi) return false;
    return new Date(interview.mulakat_tarihi) < new Date();
  }

  // Mülakat tarihi formatı (sadece tarih)
  formatDateOnly(dateStr?: string | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(d);
  }

  // Mülakat saat formatı
  formatTimeOnly(dateStr?: string | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }
}