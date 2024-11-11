import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { PaginaDePruebaELIMINARComponent } from './pagina-de-prueba-eliminar/pagina-de-prueba-eliminar.component';
import { LogInComponent } from './login/login.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';

// HTTPclient
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    PaginaDePruebaELIMINARComponent,
    LogInComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,

    // HTTPClient
    HttpClientModule
  ],
  providers: [
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
