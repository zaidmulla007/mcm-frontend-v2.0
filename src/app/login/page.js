import { Suspense } from 'react';
import Login from '../components/auths/login';

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Login />
    </Suspense>
  );
}