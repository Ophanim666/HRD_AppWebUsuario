import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Componentes
import { BodyComponent } from './body/body.component';
import { SidenavComponent } from './sidenav/sidenav.component';
import { LogInComponent } from './login/login.component';
import { ActasComponent } from './actas/actas.component';

// Interceptors
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { getSpanishPaginatorIntl } from './mat-paginator-es';


// HTTP Client
import { HttpClientModule } from '@angular/common/http';
import { MisObrasComponent } from './mis-obras/mis-obras.component';

@NgModule({
  declarations: [
    AppComponent,
    BodyComponent,
    LogInComponent,
    SidenavComponent,
    ActasComponent,
    MisObrasComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatIconModule,
    MatSelectModule,
    MatPaginatorModule,
    HttpClientModule,
    MatDatepickerModule,
    MatRadioModule
  ],
  providers: [
    { provide: MatPaginatorIntl, useValue: getSpanishPaginatorIntl() },
    
    provideAnimationsAsync(), //aqui se estan interceptando los tokens
    {
      provide: HTTP_INTERCEPTORS, // Proporciona el interceptor
      useClass: AuthInterceptor,  // Clase del interceptor
      multi: true,  // Permite múltiples interceptores
    },
  ],

  bootstrap: [AppComponent]
})
export class AppModule { }