import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { LoginRequest, RegisterRequest, JwtResponse, User } from '../../features/auth/models/auth.model';
import { environment } from '../../../environments/environment.docker';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'auth_token';
  private userKey = 'current_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  login(credentials: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(this.handleError)
      );
  }

  register(userData: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData)
      .pipe(
        catchError(this.handleError)
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private handleAuthResponse(response: JwtResponse): void {
    localStorage.setItem(this.tokenKey, response.token);

    const user: User = {
      id: response.id,
      username: response.username,
      email: response.email,
      role: response.role
    };

    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  private loadStoredUser(): void {
    const token = this.getToken();
    const storedUser = localStorage.getItem(this.userKey);

    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch (e) {
        this.logout();
      }
    }
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }

  private handleError(error: any): Observable<never> {
    console.error('Auth error:', error);
    return throwError(() => error);
  }

  refreshUserInfo(): void {
    const token = this.getToken();
    if (token) {
      this.http.get<JwtResponse>(`${this.apiUrl}/me`).subscribe({
        next: (response) => {
          const user: User = {
            id: response.id,
            username: response.username,
            email: response.email,
            role: response.role
          };
          localStorage.setItem(this.userKey, JSON.stringify(user));
          this.currentUserSubject.next(user);
        },
        error: () => this.logout()
      });
    }
  }
}
