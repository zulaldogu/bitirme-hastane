import { createTheme, type MantineColorsTuple } from '@mantine/core';
import type { ShiftCode } from './api';

// K19: gri zemin, beyaz kartlar, açık yeşil vurgu, koyu yeşil düğmeler.

const lime: MantineColorsTuple = [
  '#f4fce9', '#e9f8d4', '#d6f2ad', '#c2ec85', '#b4e66a',
  '#a6e05a', '#93cc47', '#79ad35', '#5f8a28', '#46681a',
];

const forest: MantineColorsTuple = [
  '#eaf3e8', '#d2e4ce', '#a7c9a0', '#7aad70', '#539546',
  '#3b7f2f', '#2d6a23', '#22561a', '#1a4413', '#12320c',
];

export const theme = createTheme({
  fontFamily: 'Urbanist, system-ui, sans-serif',
  headings: { fontFamily: 'Urbanist, system-ui, sans-serif', fontWeight: '600' },
  primaryColor: 'forest',
  primaryShade: 8,
  colors: { lime, forest },
  defaultRadius: 'xl',
  components: {
    Button: { defaultProps: { radius: 'xl' } },
    Paper: { defaultProps: { radius: 28 } },
  },
});

/** Vardiya renkleri her ekranda aynıdır. */
export const shiftColors: Record<ShiftCode, string> = {
  S: '#f2b632',
  A: '#ef7a3c',
  G: '#2f3a8f',
};

export const shiftNames: Record<ShiftCode, string> = {
  S: 'Sabah',
  A: 'Akşam',
  G: 'Gece',
};
