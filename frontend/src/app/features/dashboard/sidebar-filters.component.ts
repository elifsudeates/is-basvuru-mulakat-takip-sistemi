// src/app/features/dashboard/sidebar-filters.component.ts
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

export interface FilterOptions {
  cities: string[];
  positions: string[];
  departments: string[];
}

export interface DashboardFilters {
  text: string;
  cities: string[];
  positions: string[];
  departments: string[];
  gender: string;
  hasInterview: boolean;
  noInterview: boolean; // YENİ: Mülakatı olmayanlar
  disabledOnly: boolean;
  minScore?: number;
  maxScore?: number;
}

@Component({
  selector: 'app-sidebar-filters',
  templateUrl: './sidebar-filters.component.html',
  styleUrls: ['./sidebar-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarFiltersComponent implements OnInit, OnDestroy {
  @Input() filters: DashboardFilters = {
    text: '',
    cities: [],
    positions: [],
    departments: [],
    gender: '',
    hasInterview: false,
    noInterview: false, // YENİ
    disabledOnly: false
  };

  @Input() datas: FilterOptions = {
    cities: [],
    positions: [],
    departments: []
  };

  @Input() filterOptions: FilterOptions = {
    cities: [],
    positions: [],
    departments: []
  };

  @Input() loading = false;
  @Output() filtersChange = new EventEmitter<DashboardFilters>();

  fg: FormGroup;
  private destroy$ = new Subject<void>();
  isCollapsed = false;
  activeFiltersCount = 0;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.fg = this.fb.group({
      text: [''],
      cities: [[]],
      positions: [[]],
      departments: [[]],
      gender: [''],
      hasInterview: [false],
      noInterview: [false], // YENİ
      disabledOnly: [false],
      minScore: [null],
      maxScore: [null]
    });
  }

  ngOnInit(): void {
    this.fg.patchValue(this.filters, { emitEvent: false });
    console.log(this.datas);
    
    this.fg.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        takeUntil(this.destroy$)
      )
      .subscribe(formValue => {
        const filters: DashboardFilters = {
          ...formValue,
          minScore: formValue.minScore || undefined,
          maxScore: formValue.maxScore || undefined
        };
        
        this.updateActiveFiltersCount(filters);
        this.filtersChange.emit(filters);
        this.cdr.markForCheck();
      });

    this.updateActiveFiltersCount(this.filters);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateActiveFiltersCount(filters: DashboardFilters): void {
    let count = 0;
    
    if (filters.text) count++;
    if (filters.cities.length) count++;
    if (filters.positions.length) count++;
    if (filters.departments.length) count++;
    if (filters.gender) count++;
    if (filters.hasInterview) count++;
    if (filters.noInterview) count++; // YENİ
    if (filters.disabledOnly) count++;
    if (filters.minScore) count++;
    if (filters.maxScore) count++;
    
    this.activeFiltersCount = count;
  }

  reset(): void {
    const emptyFilters: DashboardFilters = {
      text: '',
      cities: [],
      positions: [],
      departments: [],
      gender: '',
      hasInterview: false,
      noInterview: false, // YENİ
      disabledOnly: false,
      minScore: undefined,
      maxScore: undefined
    };
    
    this.fg.patchValue(emptyFilters);
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  quickFilterByCity(city: string): void {
    const currentCities = this.fg.get('cities')?.value as string[];
    if (currentCities.includes(city)) {
      this.fg.get('cities')?.patchValue(currentCities.filter(c => c !== city));
    } else {
      this.fg.get('cities')?.patchValue([...currentCities, city]);
    }
  }

  quickFilterByPosition(position: string): void {
    const currentPositions = this.fg.get('positions')?.value as string[];
    if (currentPositions.includes(position)) {
      this.fg.get('positions')?.patchValue(currentPositions.filter(p => p !== position));
    } else {
      this.fg.get('positions')?.patchValue([...currentPositions, position]);
    }
  }

  quickFilterByGender(gender: string): void {
    this.fg.patchValue({ gender });
  }

  // YENİ: Quick interview status filter
  quickFilterInterviewStatus(status: 'has' | 'none' | 'all'): void {
    if (status === 'has') {
      this.fg.patchValue({ hasInterview: true, noInterview: false });
    } else if (status === 'none') {
      this.fg.patchValue({ hasInterview: false, noInterview: true });
    } else {
      this.fg.patchValue({ hasInterview: false, noInterview: false });
    }
  }

  // Template helper methods - DÜZELTİLMİŞ
  getCitiesCount(): number {
    const cities = this.fg.get('cities')?.value as string[];
    return cities ? cities.length : 0;
  }

  getPositionsCount(): number {
    const positions = this.fg.get('positions')?.value as string[];
    return positions ? positions.length : 0;
  }

  getScoreRange(): string | null {
    const min = this.fg.get('minScore')?.value;
    const max = this.fg.get('maxScore')?.value;
    
    if (min && max) {
      return `${min}-${max}`;
    } else if (min) {
      return `${min}+`;
    } else if (max) {
      return `0-${max}`;
    }
    return null;
  }

  // Validation helpers
  get hasTextFilter(): boolean {
    return !!this.fg.get('text')?.value;
  }

  get hasLocationFilter(): boolean {
    return this.getCitiesCount() > 0;
  }

  get hasPositionFilter(): boolean {
    return this.getPositionsCount() > 0;
  }

  get hasDemographicFilters(): boolean {
    return !!(this.fg.get('gender')?.value || this.fg.get('disabledOnly')?.value);
  }

  get hasInterviewFilters(): boolean {
    return !!(this.fg.get('hasInterview')?.value || this.fg.get('noInterview')?.value);
  }

  get hasScoreFilter(): boolean {
    return !!(this.fg.get('minScore')?.value || this.fg.get('maxScore')?.value);
  }
}