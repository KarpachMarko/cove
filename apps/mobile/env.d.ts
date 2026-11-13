/// <reference types="nativewind/types" />
declare module '*.css';
declare module 'nativewind/preset' {
  const preset: import('tailwindcss').Config;
  export default preset;
}
