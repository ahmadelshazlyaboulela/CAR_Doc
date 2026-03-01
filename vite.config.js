import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // إضافة إضافة React لتمكين معالجة ملفات JSX
  plugins: [react()],
  
  // إعدادات البناء لضمان توافق المسارات
  base: '/',
  
  build: {
    // تحسين سرعة التحميل وتصغير حجم الملفات النهائية
    outDir: 'dist',
    minify: 'terser',
    sourcemap: false
  },
  
  server: {
    // إعدادات السيرفر المحلي للتطوير
    port: 3000,
    open: true
  }
})