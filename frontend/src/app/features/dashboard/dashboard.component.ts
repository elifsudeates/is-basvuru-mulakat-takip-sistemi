import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { Kisi } from 'src/app/shared/models/kisi.model';
import { Mulakat } from 'src/app/shared/models/mulakat.model';
import { KisiService } from 'src/app/core/services/kisi.service';
import { MulakatService, MulakatBasic } from 'src/app/core/services/mulakat.service';
import { KatilimciService } from 'src/app/core/services/katilimci.service';

export interface DashboardFilters {
  text: string;
  cities: string[];
  positions: string[];
  departments: string[];
  gender: string;
  hasInterview: boolean;
  noInterview: boolean;
  disabledOnly: boolean;
  minScore?: number;
  maxScore?: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Reactive data streams
  private candidatesSubject = new BehaviorSubject<Kisi[]>([]);
  private interviewsSubject = new BehaviorSubject<MulakatBasic[] | null>(null);
  private filtersSubject = new BehaviorSubject<DashboardFilters>({
    text: '',
    cities: [],
    positions: [],
    departments: [],
    gender: '',
    hasInterview: false,
    noInterview: false,
    disabledOnly: false
  });
  private selectedCandidateSubject = new BehaviorSubject<Kisi | null>(null);

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  paginationPages: number[] = [];

  // Step navigation
  currentStep = 1;
  totalSteps = 7; // 6'dan 7'ye çıkarıldı (mülakatlar için)

  // Public observables
  candidates$ = this.candidatesSubject.asObservable();
  interviews$ = this.interviewsSubject.asObservable();
  filters$ = this.filtersSubject.asObservable();
  selectedCandidate$ = this.selectedCandidateSubject.asObservable();

  // Loading states
  candidatesLoading = false;
  interviewsLoading = false;
  selectedCandidateLoading = false;

  // Modal states
  showCandidateModal = false;
  editingCandidateId: number | null = null;
  candidateForm: FormGroup;

  // Filter options
  filterOptions: {
    cities: string[];
    positions: string[];
    departments: string[];
  } = {
    cities: [],
    positions: [],
    departments: []
  };

  filterData: any;

  // YENİ: Katılımcılar listesi
  availableParticipants: any[] = [];

  constructor(
    private kisiSvc: KisiService,
    private mulakatSvc: MulakatService,
    private katilimciSvc: KatilimciService, // YENİ
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.candidateForm = this.fb.group({
      // Kişisel bilgiler
      adi: ['', [Validators.required, Validators.minLength(2)]],
      mail: ['', [Validators.email]],
      telefon_no: [''],
      dogum_tarihi: [''],
      cinsiyet: [''],
      basvurdugu_pozisyon: [''],
      sehri: [''],
      okudugu_bolum: [''],
      askerlik_durumu: [''],
      engellilik: [false],
      engellilik_orani: [null],
      description: [''],
      
      // İlişkili veriler - FormArray'ler
      okullar: this.fb.array([]),
      tecrubeler: this.fb.array([]),
      beceriler: this.fb.array([]),
      sertifikalar: this.fb.array([]),
      mulakatlar: this.fb.array([]) // YENİ: Mülakatlar form array
    });
  }
  ngOnInit(): void {
    this.loadAllData();
    this.loadParticipants(); // YENİ: Katılımcıları yükle
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // FormArray getter'ları
  get educationFormArray(): FormArray {
    return this.candidateForm.get('okullar') as FormArray;
  }

  get experienceFormArray(): FormArray {
    return this.candidateForm.get('tecrubeler') as FormArray;
  }

  get skillsFormArray(): FormArray {
    return this.candidateForm.get('beceriler') as FormArray;
  }

  get certificatesFormArray(): FormArray {
    return this.candidateForm.get('sertifikalar') as FormArray;
  }

  // YENİ: Mülakatlar FormArray getter
  get interviewsFormArray(): FormArray {
    return this.candidateForm.get('mulakatlar') as FormArray;
  }

  // YENİ: Katılımcıları yükle
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

  private loadAllData(): void {
    this.loadCandidates();
    this.loadInterviews();
  }

  private loadCandidates(): void {
    this.candidatesLoading = true;
    this.cdr.markForCheck();

    const offset = (this.currentPage - 1) * this.itemsPerPage;
    const filters = this.currentFilters;

    const params = {
      limit: this.itemsPerPage.toString(),
      offset: offset.toString(),
      ...(filters.text && { text: filters.text }),
      ...(filters.cities.length > 0 && { cities: filters.cities.join(',') }),
      ...(filters.positions.length > 0 && { positions: filters.positions.join(',') }),
      ...(filters.departments.length > 0 && { departments: filters.departments.join(',') }),
      ...(filters.gender && { gender: filters.gender }),
      ...(filters.hasInterview && { hasInterview: 'true' }),
      ...(filters.noInterview && { noInterview: 'true' }),
      ...(filters.disabledOnly && { disabledOnly: 'true' }),
      ...(filters.minScore && { minScore: filters.minScore.toString() }),
      ...(filters.maxScore && { maxScore: filters.maxScore.toString() })
    };

    this.kisiSvc.getAll(params).subscribe({
      next: (response: any) => {
        this.totalItems = response.totalCount[0].length;
        this.candidatesSubject.next(response.kisiler);
        this.updatePagination();
        this.updateFilterOptionsdatas(response.totalCount[0]);
        this.updateFilterOptions(response.kisiler);
        this.candidatesLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading candidates:', err);
        this.candidatesLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadInterviews(): void {
    this.interviewsLoading = true;
    this.mulakatSvc.getAll().subscribe({
      next: (interviews: MulakatBasic[]) => {
        this.interviewsSubject.next(interviews);
        this.interviewsLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.log('Interviews endpoint not available, using empty array:', err.status);
        this.interviewsSubject.next([]);
        this.interviewsLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private updateFilterOptions(candidates: Kisi[]): void {
    const cities = new Set<string>();
    const positions = new Set<string>();
    const departments = new Set<string>();

    candidates.forEach(candidate => {
      if (candidate.sehri) cities.add(candidate.sehri);
      if (candidate.basvurdugu_pozisyon) positions.add(candidate.basvurdugu_pozisyon);
      if (candidate.okudugu_bolum) departments.add(candidate.okudugu_bolum);
    });

    this.filterOptions = {
      cities: Array.from(cities).sort(),
      positions: Array.from(positions).sort(),
      departments: Array.from(departments).sort()
    };
  }

  private updateFilterOptionsdatas(candidates: any): void {
    const cities = new Set<string>();
    const positions = new Set<string>();
    const departments = new Set<string>();

    candidates.forEach((candidate: any) => {
      if (candidate.sehri) cities.add(candidate.sehri);
      if (candidate.basvurdugu_pozisyon) positions.add(candidate.basvurdugu_pozisyon);
      if (candidate.okudugu_bolum) departments.add(candidate.okudugu_bolum);
    });

    this.filterData = {
      cities: Array.from(cities).sort(),
      positions: Array.from(positions).sort(),
      departments: Array.from(departments).sort()
    };
  }

  private updatePagination(): void {
    const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.paginationPages = [];

    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(totalPages, this.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      this.paginationPages.push(i);
    }
  }

  // Step Navigation
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      if (this.isCurrentStepValid()) {
        this.currentStep++;
        this.cdr.markForCheck();
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.cdr.markForCheck();
    }
  }

  private isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        // Sadece ad alanının dolu olması yeterli
        const adiControl = this.candidateForm.get('adi');
        return !!(adiControl && adiControl.value && adiControl.value.trim());
      case 2:
      case 3:
      case 4:
      case 5:
      case 6: // Mülakatlar step'i
        // Diğer step'ler için zorunlu alan kontrolü yapmıyoruz
        return true;
      case 7: // Özet step'i
        // Sadece temel bilgilerin geçerli olmasını kontrol et
        const basicValid = this.candidateForm.get('adi')?.valid;
        return !!basicValid;
      default:
        return true;
    }
  }
 // Education Methods
  addEducation(): void {
    const educationGroup = this.fb.group({
      okul_adi: ['', Validators.required],
      okul_bolumu: [''],
      okul_ili: [''],
      okul_tipi: [''],
      not_ortalamasi: [null]
    });
    
    this.educationFormArray.push(educationGroup);
    this.cdr.markForCheck();
  }

  removeEducation(index: number): void {
    this.educationFormArray.removeAt(index);
    this.cdr.markForCheck();
  }

  // Experience Methods
  addExperience(): void {
    const experienceGroup = this.fb.group({
      sirket_adi: ['', Validators.required],
      pozisyonu: [''],
      giris_tarihi: [''],
      cikis_tarihi: [''],
      sirket_referansi: ['']
    });
    
    this.experienceFormArray.push(experienceGroup);
    this.cdr.markForCheck();
  }

  removeExperience(index: number): void {
    this.experienceFormArray.removeAt(index);
    this.cdr.markForCheck();
  }

  // Skills Methods
  addSkill(): void {
    const skillGroup = this.fb.group({
      beceri_adi: ['', Validators.required],
      beceri_turu_id: [''],
      beceri_seviyesi: ['']
    });
    
    this.skillsFormArray.push(skillGroup);
    this.cdr.markForCheck();
  }

  removeSkill(index: number): void {
    this.skillsFormArray.removeAt(index);
    this.cdr.markForCheck();
  }

  // Certificate Methods
  addCertificate(): void {
    const certificateGroup = this.fb.group({
      sertifika_adi: ['', Validators.required],
      alinma_tarihi: [''],
      gecerliligi: ['']
    });
    
    this.certificatesFormArray.push(certificateGroup);
    this.cdr.markForCheck();
  }

  removeCertificate(index: number): void {
    this.certificatesFormArray.removeAt(index);
    this.cdr.markForCheck();
  }

  // YENİ: Interview Methods
  addInterview(): void {
    const interviewGroup = this.fb.group({
      mulakat_tarihi: [''],
      planlanan_toplanti_tarihi: [''],
      mulakat_tipi: [''],
      katilimcilar: [[]],
      notlar: this.fb.array([]),
      degerlendirmeler: this.fb.array([])
    });
    
    this.interviewsFormArray.push(interviewGroup);
    this.cdr.markForCheck();
  }

  removeInterview(index: number): void {
    this.interviewsFormArray.removeAt(index);
    this.cdr.markForCheck();
  }

  // YENİ: Interview Notes Methods
  getNotesFormArray(interviewIndex: number): FormArray {
    return (this.interviewsFormArray.at(interviewIndex) as FormGroup).get('notlar') as FormArray;
  }

  addNote(interviewIndex: number): void {
    const noteGroup = this.fb.group({
      sicil: ['', Validators.required],
      not_metni: ['', Validators.required]
    });
    
    this.getNotesFormArray(interviewIndex).push(noteGroup);
    this.cdr.markForCheck();
  }

  removeNote(interviewIndex: number, noteIndex: number): void {
    this.getNotesFormArray(interviewIndex).removeAt(noteIndex);
    this.cdr.markForCheck();
  }

  // YENİ: Interview Evaluations Methods
  getEvaluationsFormArray(interviewIndex: number): FormArray {
    return (this.interviewsFormArray.at(interviewIndex) as FormGroup).get('degerlendirmeler') as FormArray;
  }

  addEvaluation(interviewIndex: number): void {
    const evaluationGroup = this.fb.group({
      sicil: ['', Validators.required],
      degerlendirme_turu: ['genel'],
      puani: [null, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
    
    this.getEvaluationsFormArray(interviewIndex).push(evaluationGroup);
    this.cdr.markForCheck();
  }

  removeEvaluation(interviewIndex: number, evaluationIndex: number): void {
    this.getEvaluationsFormArray(interviewIndex).removeAt(evaluationIndex);
    this.cdr.markForCheck();
  }

  // UI Events
  changePage(page: number): void {
    if (page < 1 || page > Math.ceil(this.totalItems / this.itemsPerPage)) return;
    this.currentPage = page;
    this.loadCandidates();
  }

  changeItemsPerPage(): void {
    this.currentPage = 1;
    this.loadCandidates();
  }

  onFiltersChange(filters: DashboardFilters): void {
    this.currentPage = 1;
    this.filtersSubject.next(filters);
    this.loadCandidates();
  }

  selectCandidate(candidate: Kisi): void {
    if (this.selectedCandidateSubject.value?.id === candidate.id) return;

    this.selectedCandidateLoading = true;
    this.selectedCandidateSubject.next(candidate);
    this.cdr.markForCheck();

    this.kisiSvc.getById(candidate.id).subscribe({
      next: (fullCandidate) => {
        this.selectedCandidateSubject.next(fullCandidate);
        this.selectedCandidateLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading candidate details:', err);
        this.selectedCandidateLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Modal Methods
  openCreateModal(): void {
    this.editingCandidateId = null;
    this.currentStep = 1;
    this.candidateForm.reset();
    this.clearFormArrays();
    this.showCandidateModal = true;
    this.cdr.markForCheck();
  }

  openEditModal(candidate: Kisi): void {
    this.editingCandidateId = candidate.id;
    this.currentStep = 1;
    
    this.candidateForm.patchValue({
      adi: candidate.adi || '',
      mail: candidate.mail || '',
      telefon_no: candidate.telefon_no || '',
      dogum_tarihi: candidate.dogum_tarihi ? candidate.dogum_tarihi.split('T')[0] : '',
      cinsiyet: candidate.cinsiyet || '',
      basvurdugu_pozisyon: candidate.basvurdugu_pozisyon || '',
      sehri: candidate.sehri || '',
      okudugu_bolum: candidate.okudugu_bolum || '',
      askerlik_durumu: candidate.askerlik_durumu || '',
      engellilik: !!candidate.engellilik,
      engellilik_orani: candidate.engellilik_orani || null,
      description: candidate.description || ''
    });

    this.clearFormArrays();
    this.populateFormArrays(candidate);
    
    this.showCandidateModal = true;
    this.cdr.markForCheck();
  }

  closeCandidateModal(): void {
    this.showCandidateModal = false;
    this.editingCandidateId = null;
    this.currentStep = 1;
    this.candidateForm.reset();
    this.clearFormArrays();
    this.cdr.markForCheck();
  }

  private clearFormArrays(): void {
    while (this.educationFormArray.length !== 0) {
      this.educationFormArray.removeAt(0);
    }
    while (this.experienceFormArray.length !== 0) {
      this.experienceFormArray.removeAt(0);
    }
    while (this.skillsFormArray.length !== 0) {
      this.skillsFormArray.removeAt(0);
    }
    while (this.certificatesFormArray.length !== 0) {
      this.certificatesFormArray.removeAt(0);
    }
    while (this.interviewsFormArray.length !== 0) {
      this.interviewsFormArray.removeAt(0);
    }
  }

  private populateFormArrays(candidate: Kisi): void {
    // Mevcut populasyon kodları...
    if (candidate.okullar && candidate.okullar.length > 0) {
      candidate.okullar.forEach(okul => {
        const educationGroup = this.fb.group({
          okul_adi: [okul.okul_adi || '', Validators.required],
          okul_bolumu: [okul.okul_bolumu || ''],
          okul_ili: [okul.okul_ili || ''],
          okul_tipi: [okul.okul_tipi || ''],
          not_ortalamasi: [okul.not_ortalamasi || null]
        });
        this.educationFormArray.push(educationGroup);
      });
    }

    if (candidate.tecrubeler && candidate.tecrubeler.length > 0) {
      candidate.tecrubeler.forEach(tecrube => {
        const experienceGroup = this.fb.group({
          sirket_adi: [tecrube.sirket_adi || '', Validators.required],
          pozisyonu: [tecrube.pozisyonu || ''],
          giris_tarihi: [tecrube.giris_tarihi ? tecrube.giris_tarihi.split('T')[0] : ''],
          cikis_tarihi: [tecrube.cikis_tarihi ? tecrube.cikis_tarihi.split('T')[0] : ''],
          sirket_referansi: [tecrube.sirket_referansi || '']
        });
        this.experienceFormArray.push(experienceGroup);
      });
    }

    if (candidate.beceriler && candidate.beceriler.length > 0) {
      candidate.beceriler.forEach(beceri => {
        const skillGroup = this.fb.group({
          beceri_adi: [beceri.beceri_adi || '', Validators.required],
          beceri_turu_id: [beceri.beceri_turu_id || ''],
          beceri_seviyesi: [beceri.beceri_seviyesi || '']
        });
        this.skillsFormArray.push(skillGroup);
      });
    }

    if (candidate.sertifikalar && candidate.sertifikalar.length > 0) {
      candidate.sertifikalar.forEach(sertifika => {
        const certificateGroup = this.fb.group({
          sertifika_adi: [sertifika.sertifika_adi || '', Validators.required],
          alinma_tarihi: [sertifika.alinma_tarihi ? sertifika.alinma_tarihi.split('T')[0] : ''],
          gecerliligi: [sertifika.gecerliligi ? sertifika.gecerliligi.split('T')[0] : '']
        });
        this.certificatesFormArray.push(certificateGroup);
      });
    }
  }

  // Submit Method
  onSubmitCandidate(): void {
    // Sadece temel alanları kontrol et
    const adiControl = this.candidateForm.get('adi');
    if (!adiControl || !adiControl.value || !adiControl.value.trim()) {
      alert('Ad alanı zorunludur.');
      this.markFormGroupTouched(this.candidateForm);
      return;
    }

    const formData = this.candidateForm.getRawValue();
    
    const fullPayload = {
      adi: formData.adi,
      mail: formData.mail,
      telefon_no: formData.telefon_no,
      dogum_tarihi: formData.dogum_tarihi,
      cinsiyet: formData.cinsiyet,
      basvurdugu_pozisyon: formData.basvurdugu_pozisyon,
      sehri: formData.sehri,
      okudugu_bolum: formData.okudugu_bolum,
      askerlik_durumu: formData.askerlik_durumu,
      engellilik: formData.engellilik,
      engellilik_orani: formData.engellilik ? formData.engellilik_orani : null,
      description: formData.description,
      okullar: formData.okullar || [],
      tecrubeler: formData.tecrubeler || [],
      beceriler: formData.beceriler || [],
      sertifikalar: formData.sertifikalar || [],
      mulakatlar: formData.mulakatlar || []
    };

    if (this.editingCandidateId) {
      this.updateCandidateAdvanced({ id: this.editingCandidateId, payload: fullPayload });
    } else {
      this.addCandidateAdvanced(fullPayload);
    }
  }

  private addCandidateAdvanced(payload: any): void {
    this.kisiSvc.create(payload).subscribe({
      next: (response: any) => {
        const newCandidate = response.data || response;
        const currentCandidates = this.candidatesSubject.value;
        this.candidatesSubject.next([newCandidate, ...currentCandidates]);
        this.updateFilterOptions([newCandidate, ...currentCandidates]);
        this.closeCandidateModal();
        this.selectCandidate(newCandidate);
        
        const summary = response.summary || {};
        alert(`${newCandidate.adi} başarıyla eklendi!`);
      },
      error: (err) => {
        console.error('Error creating candidate:', err);
        alert('Aday eklenirken bir hata oluştu.');
      }
    });
  }

  private updateCandidateAdvanced(event: { id: number; payload: any }): void {
    this.kisiSvc.update(event.id, event.payload).subscribe({
      next: (response: any) => {
        const updatedCandidate = response.data || response;
        const currentCandidates = this.candidatesSubject.value;
        const updatedCandidates = currentCandidates.map(c =>
          c.id === updatedCandidate.id ? updatedCandidate : c
        );
        this.candidatesSubject.next(updatedCandidates);
        this.updateFilterOptions(updatedCandidates);

        if (this.selectedCandidateSubject.value?.id === updatedCandidate.id) {
          this.selectedCandidateSubject.next(updatedCandidate);
        }

        this.closeCandidateModal();
        alert(`${updatedCandidate.adi} başarıyla güncellendi!`);
      },
      error: (err) => {
        console.error('Error updating candidate:', err);
        alert('Aday güncellenirken bir hata oluştu.');
      }
    });
  }

  deleteCandidate(id: number): void {
    const candidate = this.candidatesSubject.value.find(c => c.id === id);
    const candidateName = candidate?.adi || 'Bu aday';

    if (!confirm(`${candidateName}'ı silmek istediğinizden emin misiniz?`)) {
      return;
    }

    this.kisiSvc.delete(id).subscribe({
      next: () => {
        const currentCandidates = this.candidatesSubject.value;
        const filteredCandidates = currentCandidates.filter(c => c.id !== id);
        this.candidatesSubject.next(filteredCandidates);
        this.updateFilterOptions(filteredCandidates);

        if (this.selectedCandidateSubject.value?.id === id) {
          this.selectedCandidateSubject.next(null);
        }

        this.totalItems = Math.max(0, this.totalItems - 1);
        this.updatePagination();
      },
      error: (err) => {
        console.error('Error deleting candidate:', err);
        alert('Aday silinirken bir hata oluştu.');
      }
    });
  }

  refreshData(): void {
    this.selectedCandidateSubject.next(null);
    this.currentPage = 1;
    
    this.filtersSubject.next({
      text: '',
      cities: [],
      positions: [],
      departments: [],
      gender: '',
      hasInterview: false,
      noInterview: false,
      disabledOnly: false
    });
    
    this.loadAllData();
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

  // Getters
  get currentFilters(): DashboardFilters {
    return this.filtersSubject.value;
  }

  get currentCandidates(): Kisi[] {
    return this.candidatesSubject.value;
  }

  get selectedCandidate(): Kisi | null {
    return this.selectedCandidateSubject.value;
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  // Track by functions
  trackById = (_: number, candidate: Kisi): number => candidate.id;
  trackByPage = (_: number, page: number): number => page;
}