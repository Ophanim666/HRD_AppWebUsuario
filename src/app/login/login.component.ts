import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LogInComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = ''; // Mensaje de error si ocurre uno
  showPassword: boolean = false;

  private apiUrl = 'https://localhost:7125/api/LogIn/loginUsuario';

  constructor(private http: HttpClient, private router: Router) { }

  login() {
    const loginData = { email: this.email, password: this.password };

    this.http.post<any>(this.apiUrl, loginData).subscribe({
      next: (response) => {
        const token = response.token;
        localStorage.setItem('token', token);
        this.router.navigate(['/actas']);
      },
      error: (error) => {
        console.error('Error al iniciar sesión:', error);
        this.errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
      }
    });
  }

  closeErrorModal() {
    this.errorMessage = '';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}