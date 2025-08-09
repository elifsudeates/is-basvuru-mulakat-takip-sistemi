import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Kisi } from 'src/app/shared/models/kisi.model';

@Component({
  selector: 'app-candidate-list',
  templateUrl: './candidate-list.component.html',
  styleUrls: ['./candidate-list.component.scss']
})
export class CandidateListComponent implements OnChanges {
  /* ---------- Inputs / Outputs ---------- */
  @Input() candidates: Kisi[] = [];
  @Input() loading = false;

  @Output() select = new EventEmitter<Kisi>();
  @Output() create = new EventEmitter<Partial<Kisi>>();
  @Output() edit   = new EventEmitter<{ id: number; payload: Partial<Kisi> }>();
  @Output() remove = new EventEmitter<number>();

  /* ---------- Pagination state ---------- */
  itemsPerPage = 5;
  currentPage  = 1;
  totalPages   = 1;

  /** Returns the slice of candidates for the active page */
  get pagedCandidates(): Kisi[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.candidates.slice(start, start + this.itemsPerPage);
  }

  /* ---------- Modal & form ---------- */
  showForm = false;
  editId: number | null = null;

  fg = this.fb.group({
    adi: ['', [Validators.required, Validators.minLength(2)]],
    basvurdugu_pozisyon: [''],
    sehri: [''],
    mail: [''],
    telefon_no: [''],
    description: ['']
  });

  constructor(private fb: FormBuilder) {}

  /* Re-calculate total pages whenever input list changes */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['candidates']) {
      this.totalPages = Math.max(
        1,
        Math.ceil(this.candidates.length / this.itemsPerPage)
      );
      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }
    }
  }

  /** Navigate to page if within bounds */
  goto(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  trackById = (_: number, x: Kisi) => x.id;

  /* ---------- Modal helpers ---------- */
  openCreate(): void {
    this.editId = null;
    this.fg.reset();
    this.showForm = true;
  }

  openEdit(c: Kisi): void {
    this.editId = c.id;
    this.fg.patchValue({
      adi:               c.adi ?? '',
      basvurdugu_pozisyon:c.basvurdugu_pozisyon ?? '',
      sehri:             c.sehri ?? '',
      mail:              c.mail ?? '',
      telefon_no:        c.telefon_no ?? '',
      description:       c.description ?? ''
    });
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  onSubmit(): void {
    const payload = this.fg.getRawValue() as Partial<Kisi>;
    this.editId
      ? this.edit.emit({ id: this.editId, payload })
      : this.create.emit(payload);
    this.closeForm();
  }
}
