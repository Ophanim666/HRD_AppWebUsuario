import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { MisObrasComponent } from './mis-obras/mis-obras.component';

//Login
import { LogInComponent } from './login/login.component';
import { ActasComponent } from './actas/actas.component';

const routes: Routes = [
    // Actas
    { path: 'actas', component: ActasComponent, canActivate: [AuthGuard] },
    //Mis Obras 
    { path: 'mis-obras', component: MisObrasComponent, canActivate: [AuthGuard]},
    //LogIn ahora es la pagina que primero se ejecuta
    { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirige a la ruta de login por defecto
    { path: 'login', component: LogInComponent }, // Ruta para el componente de inicio de sesión
    { path: '**', redirectTo: '/login' }, // Redirige rutas no encontradas a login
  ];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
