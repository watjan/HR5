import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// เคลียร์ข้อมูล Local Storage ทั้งหมดเมื่อแอปพลิเคชันเริ่มต้นทำงาน เฉพาะในกรณีที่ปิดการใช้งานหรือไม่ได้ตั้งค่าไว้
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const isEnabled = window.localStorage.getItem('hr_local_storage_enabled') === 'true';
    if (!isEnabled) {
      window.localStorage.clear();
      window.localStorage.setItem('hr_local_storage_enabled', 'false');
      console.log("Cleared localStorage on startup because it is disabled by user settings.");
    } else {
      console.log("Preserved localStorage on startup because it is enabled by user settings.");
    }
  }
} catch (e) {
  console.warn("Failed to clean up localStorage:", e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
