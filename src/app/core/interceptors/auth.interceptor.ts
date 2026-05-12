import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  console.log('Interceptor fired. Token:', token);   
  console.log('Request URL:', req.url);              

  if (req.url.includes('/auth/login') || req.url.includes('/api/tapaxe-admin/add/admin') ||
      req.url.includes('/api/student/uid')) {
    return next(req);
  }

  if (!token) return next(req);

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
  return next(authReq);
};