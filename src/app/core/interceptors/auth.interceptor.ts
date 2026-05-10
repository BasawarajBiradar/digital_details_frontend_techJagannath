import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  console.log('Interceptor fired. Token:', token);   // 👈 add this
  console.log('Request URL:', req.url);              // 👈 and this

  if (req.url.includes('/auth/login') || req.url.includes('/api/tapaxe-admin/add/admin')) {
    return next(req);
  }

  if (!token) return next(req);

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
  return next(authReq);
};