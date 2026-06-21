import { useContext } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { ThemeContext } from '@/contexts/ThemeContext';

export function useColorScheme(): 'light' | 'dark' {
  const themeContext = useContext(ThemeContext);
  const system = useSystemColorScheme();
  if (themeContext) return themeContext.theme;
  return system === 'dark' ? 'dark' : 'light';
}
