// Main root module: declares components, registers services & interceptors,
// and bootstraps the Angular (NgModule-based) application.

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

/* Root routing module */
import { AppRoutingModule } from './app-routing.module';

/* Core layout */
import { AppComponent } from './app.component';
import { ShellComponent } from './layout/shell.component';

/* Feature – Dashboard */
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { SidebarFiltersComponent } from './features/dashboard/sidebar-filters.component';
import { CandidateListComponent } from './features/dashboard/candidate-list.component';
import { CandidateDetailComponent } from './features/dashboard/candidate-detail.component';

/* Pipes */
import { CandidateFilterPipe } from './pipes/candidate-filter.pipe';

/* Interceptors */
import { ErrorInterceptor } from './core/interceptors/error.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    ShellComponent,

    /* HR Dashboard feature */
    DashboardComponent,
    SidebarFiltersComponent,
    CandidateListComponent,
    CandidateDetailComponent,

    /* Utility pipes */
    CandidateFilterPipe
  ],

  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,           // Template-driven forms için
    ReactiveFormsModule,   // Reactive forms için (bu önemli!)
    RouterModule,          // needed for <router-outlet>
    AppRoutingModule
  ],

  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ],

  bootstrap: [AppComponent]
})
export class AppModule {}