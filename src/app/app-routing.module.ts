import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

//Login
import { LogInComponent } from './login/login.component';
import { PaginaDePruebaELIMINARComponent } from './pagina-de-prueba-eliminar/pagina-de-prueba-eliminar.component';

const routes: Routes = [
    { path: 'pagina-de-prueba-eliminar', component: PaginaDePruebaELIMINARComponent },
    //LogIn ahora es la pagina que primero se ejecuta
    { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirige a la ruta de login por defecto
    { path: 'login', component: LogInComponent }, // Ruta para el componente de inicio de sesión
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
